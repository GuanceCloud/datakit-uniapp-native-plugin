# frozen_string_literal: true

require 'fileutils'
require 'json'

module UniAppUTSPlugins
  module_function

  def prepare!(plugins_root, sdk_path:, values: {})
    plugins_root = File.expand_path(plugins_root)
    sdk_path = File.expand_path(sdk_path)
    generated_root = File.join(plugins_root, '.generated')
    support_root = File.join(sdk_path, 'SDK', 'UTS')
    return [] unless Dir.exist?(plugins_root)

    FileUtils.rm_rf(generated_root)
    FileUtils.mkdir_p(generated_root)

    Dir.children(plugins_root).sort.filter_map do |plugin_name|
      next if plugin_name.start_with?('.')

      app_ios = find_app_ios(File.join(plugins_root, plugin_name))
      next unless Dir.exist?(app_ios)

      pod_name = "unimodule#{camelize(plugin_name)}"
      pod_path = File.join(generated_root, pod_name)
      FileUtils.mkdir_p(pod_path)

      copy_support_files(support_root, pod_path)
      copy_plugin_files(app_ios, pod_path)

      config = substitute_placeholders(read_json(File.join(app_ios, 'config.json')), plugin_values(values, plugin_name), plugin_name)
      write_runtime_config(config, File.join(pod_path, 'config.json'))
      write_podspec(pod_path, pod_name, plugin_name, config)

      {
        name: plugin_name,
        pod_name: pod_name,
        pod_path: pod_path,
        app_ios: app_ios,
        config: config,
        info_plist: File.join(app_ios, 'Info.plist'),
        entitlements: File.join(app_ios, 'UTS.entitlements')
      }
    end
  end

  def camelize(name)
    name.split(/[^A-Za-z0-9]+/).reject(&:empty?).map { |part| part[0].upcase + part[1..] }.join
  end

  def find_app_ios(plugin_root)
    candidates = [
      File.join(plugin_root, 'app-ios'),
      File.join(plugin_root, 'utssdk', 'app-ios')
    ]
    candidates.find { |path| Dir.exist?(path) } || candidates.first
  end

  def copy_support_files(support_root, pod_path)
    %w[DCloudUTSConfig.h DCloudUTSConfig.m UTSCPP.h UTSCPP.mm].each do |file|
      source = File.join(support_root, file)
      FileUtils.cp(source, pod_path) if File.exist?(source)
    end
  end

  def copy_plugin_files(app_ios, pod_path)
    %w[src Frameworks Libs Resources].each do |name|
      source = File.join(app_ios, name)
      FileUtils.cp_r(source, File.join(pod_path, name)) if Dir.exist?(source)
    end

    privacy = File.join(app_ios, 'PrivacyInfo.xcprivacy')
    FileUtils.cp(privacy, pod_path) if File.exist?(privacy)
  end

  def read_json(path)
    return {} unless File.exist?(path)

    JSON.parse(File.read(path))
  rescue JSON::ParserError => e
    warn "[UniAppUTSPlugins] Failed to parse #{path}: #{e.message}"
    {}
  end

  def plugin_values(values, plugin_name)
    values[plugin_name] || values[plugin_name.to_sym] || {}
  end

  def substitute_placeholders(object, values, plugin_name)
    case object
    when Hash
      object.transform_values { |value| substitute_placeholders(value, values, plugin_name) }
    when Array
      object.map { |value| substitute_placeholders(value, values, plugin_name) }
    when String
      object.gsub(/\{\$([A-Za-z0-9_]+)\}/) do
        key = Regexp.last_match(1)
        value = values[key] || values[key.to_sym]
        if present?(value)
          value.to_s
        else
          warn "[UniAppUTSPlugins] Missing value for #{plugin_name}.#{key}; keep placeholder #{Regexp.last_match(0)}."
          Regexp.last_match(0)
        end
      end
    else
      object
    end
  end

  def write_runtime_config(config, path)
    runtime = {}
    runtime['hooksClass'] = config['hooksClass'] if present?(config['hooksClass'])
    runtime['provider'] = config['provider'] if present?(config['provider'])
    runtime['providers'] = config['providers'] if present?(config['providers'])
    runtime['components'] = config['components'] if present?(config['components'])
    File.write(path, JSON.pretty_generate(runtime))
  end

  def write_podspec(pod_path, pod_name, plugin_name, config)
    frameworks = array_config(config, 'frameworks').map { |name| name.sub(/\.framework\z/, '') }
    libraries = array_config(config, 'libraries')
    dependencies = normalize_dependencies(config['dependencies-pods'])
    deployment_target = config['deploymentTarget'].to_s.empty? ? '13.0' : config['deploymentTarget'].to_s

    lines = []
    lines << 'Pod::Spec.new do |s|'
    lines << "  s.name = '#{pod_name}'"
    lines << "  s.version = '1.0.0'"
    lines << "  s.summary = 'uni-app UTS plugin #{plugin_name}.'"
    lines << "  s.platform = :ios, '#{deployment_target}'"
    lines << "  s.source = { :path => '.' }"
    lines << "  s.source_files = ['src/**/*.{h,m,mm,swift,c,cc,cpp}', 'DCloudUTSConfig.{h,m}', 'UTSCPP.{h,mm}']"
    lines << "  s.resources = ['Resources/**/*', 'config.json', 'PrivacyInfo.xcprivacy']"
    lines << "  s.vendored_frameworks = 'Frameworks/**/*.{framework,xcframework}'"
    lines << "  s.vendored_libraries = 'Libs/**/*.a'"
    lines << "  s.frameworks = #{frameworks.inspect}" unless frameworks.empty?
    lines << "  s.libraries = #{libraries.inspect}" unless libraries.empty?
    lines << "  s.dependency 'uniapp/UTS'"
    dependencies.each { |dependency| lines << "  #{dependency}" }
    lines << 'end'
    File.write(File.join(pod_path, "#{pod_name}.podspec"), "#{lines.join("\n")}\n")
  end

  def array_config(config, key)
    value = config[key]
    case value
    when Array then value.compact.map(&:to_s).reject(&:empty?)
    when String then value.empty? ? [] : [value]
    else []
    end
  end

  def normalize_dependencies(value)
    case value
    when Array
      value.filter_map { |item| dependency_line(item) }
    when Hash
      value.filter_map { |name, version| dependency_line({ 'name' => name, 'version' => version }) }
    else
      []
    end
  end

  def dependency_line(item)
    case item
    when String
      "s.dependency '#{item}'"
    when Hash
      name = item['name'] || item[:name] || item['pod'] || item[:pod]
      version = item['version'] || item[:version]
      subspecs = item['subspecs'] || item[:subspecs]
      return nil unless present?(name)

      line = "s.dependency '#{name}'"
      line += ", '#{version}'" if present?(version)
      return subspecs.map { |subspec| "s.dependency '#{name}/#{subspec}'#{", '#{version}'" if present?(version)}" }.join("\n  ") if subspecs.is_a?(Array) && !subspecs.empty?

      line
    end
  end

  def present?(value)
    !(value.nil? || (value.respond_to?(:empty?) && value.empty?))
  end
end
