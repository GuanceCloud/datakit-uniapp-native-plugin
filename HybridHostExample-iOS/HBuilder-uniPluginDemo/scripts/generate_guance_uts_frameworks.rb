#!/usr/bin/env ruby
# frozen_string_literal: true

require 'fileutils'
require 'pathname'
require 'xcodeproj'

host_root = File.expand_path('..', __dir__)
sdk_libs = File.expand_path('../SDK/Libs', host_root)
frameworks_root = File.join(host_root, 'UTSFrameworks')
shared_frameworks_root = File.join(host_root, 'SharedFrameworks')
host_project_path = File.join(host_root, 'HBuilder-uniPlugin.xcodeproj')
repository_root = File.expand_path('../..', host_root)

PLUGIN_SPECS = [
  {
    name: 'unimoduleGCUniPlugin',
    bundle_identifier: 'io.guance.unimodule.GCUniPlugin',
    frameworks: %w[GuanceSDK-Dynamic.xcframework],
    system_frameworks: [],
    generated_index: File.join(repository_root, 'Hbuilder_Example/unpackage/resources/uni_modules/GC-UniPlugin/utssdk/app-ios/src/index.swift'),
    native_source: File.join(repository_root, 'Hbuilder_Example/uni_modules/GC-UniPlugin/utssdk/app-ios/GCUniPluginNative.swift')
  },
  {
    name: 'unimoduleGCUniSessionReplay',
    bundle_identifier: 'io.guance.unimodule.GCUniSessionReplay',
    frameworks: %w[GuanceSDK-Dynamic.xcframework GuanceSessionReplay-Dynamic.xcframework],
    system_frameworks: ['WebKit.framework'],
    generated_index: File.join(repository_root, 'Hbuilder_Example/unpackage/resources/uni_modules/GC-UniSessionReplay/utssdk/app-ios/src/index.swift'),
    native_source: File.join(repository_root, 'Hbuilder_Example/uni_modules/GC-UniSessionReplay/utssdk/app-ios/GCSessionReplayNative.swift')
  }
].freeze

def relative_path(from, to)
  Pathname.new(to).relative_path_from(Pathname.new(from)).to_s
end

def add_file(group, path, type = nil, source_tree = '<group>')
  existing = group.files.find { |file| file.path == path && file.source_tree == source_tree }
  return existing if existing

  reference = group.new_file(path, source_tree)
  reference.last_known_file_type = type if type
  reference
end

def configure_target(target, project_dir, sdk_libs, shared_frameworks_root, bundle_identifier)
  target.build_configurations.each do |configuration|
    configuration.build_settings.merge!(
      'BUILD_LIBRARY_FOR_DISTRIBUTION' => 'YES',
      'CLANG_ENABLE_MODULES' => 'YES',
      'DEFINES_MODULE' => 'YES',
      'ENABLE_MODULE_VERIFIER' => 'NO',
      'FRAMEWORK_SEARCH_PATHS' => [
        '$(inherited)',
        "\"#{relative_path(project_dir, sdk_libs)}\"",
        "\"#{relative_path(project_dir, shared_frameworks_root)}\""
      ],
      'IPHONEOS_DEPLOYMENT_TARGET' => '13.0',
      'LD_RUNPATH_SEARCH_PATHS' => [
        '$(inherited)',
        '@executable_path/Frameworks',
        '@loader_path/Frameworks'
      ],
      'OTHER_LDFLAGS' => ['$(inherited)', '-ObjC'],
      'PRODUCT_BUNDLE_IDENTIFIER' => bundle_identifier,
      'SKIP_INSTALL' => 'YES',
      'SWIFT_VERSION' => '5.0'
    )
  end
end

def add_system_framework(project, target, framework_group, name)
  path = "System/Library/Frameworks/#{name}"
  reference = add_file(framework_group, path, 'wrapper.framework', 'SDKROOT')
  target.frameworks_build_phase.add_file_reference(reference, true)
end

def create_plugin_project(spec, frameworks_root, sdk_libs, shared_frameworks_root)
  plugin_root = File.join(frameworks_root, spec[:name])
  project_path = File.join(plugin_root, "#{spec[:name]}.xcodeproj")
  source_root = File.join(plugin_root, 'Sources')

  required_paths = [
    File.join(plugin_root, 'Info.plist'),
    File.join(plugin_root, 'config.json'),
    File.join(source_root, 'index.swift')
  ]
  required_paths.concat(spec[:frameworks].map { |name| File.join(shared_frameworks_root, name) })
  missing = required_paths.reject { |path| File.exist?(path) }
  abort "Missing hybrid UTS plugin inputs:\n#{missing.join("\n")}" unless missing.empty?

  FileUtils.rm_rf(project_path)
  project = Xcodeproj::Project.new(project_path)
  target = project.new_target(:framework, spec[:name], :ios, '13.0')
  target.product_reference.path = "#{spec[:name]}.framework"
  target.product_reference.explicit_file_type = 'wrapper.framework'
  configure_target(target, plugin_root, sdk_libs, shared_frameworks_root, spec[:bundle_identifier])

  sources_group = project.main_group.new_group('Sources', 'Sources')
  Dir.glob(File.join(source_root, '*.{swift,m,mm}')).sort.each do |source|
    reference = add_file(sources_group, File.basename(source))
    target.source_build_phase.add_file_reference(reference, true)
  end

  resources_group = project.main_group.new_group('Resources')
  config_reference = add_file(resources_group, 'config.json')
  target.resources_build_phase.add_file_reference(config_reference, true)

  target.build_configurations.each do |configuration|
    configuration.build_settings['INFOPLIST_FILE'] = 'Info.plist'
  end

  frameworks_group = project.main_group.new_group('Frameworks')
  %w[DCUniBase.framework DCloudUTSFoundation.framework].each do |framework|
    dcloud_path = relative_path(plugin_root, File.join(sdk_libs, framework))
    dcloud_reference = add_file(frameworks_group, dcloud_path, 'wrapper.framework')
    target.frameworks_build_phase.add_file_reference(dcloud_reference, true)
  end

  spec[:frameworks].each do |framework|
    framework_path = relative_path(plugin_root, File.join(shared_frameworks_root, framework))
    reference = add_file(frameworks_group, framework_path, 'wrapper.xcframework')
    target.frameworks_build_phase.add_file_reference(reference, true)
  end
  spec[:system_frameworks].each do |framework|
    add_system_framework(project, target, frameworks_group, framework)
  end

  project.recreate_user_schemes
  project.save
  project_path
end

def sync_uts_sources(spec, frameworks_root)
  plugin_root = File.join(frameworks_root, spec[:name])
  sources_root = File.join(plugin_root, 'Sources')
  inputs = [spec[:generated_index], spec[:native_source]]
  missing = inputs.reject { |path| File.file?(path) }
  abort "Generate the iOS UTS source with HBuilderX before running this script:\n#{missing.join("\n")}" unless missing.empty?

  FileUtils.mkdir_p(sources_root)
  FileUtils.cp(spec[:generated_index], File.join(sources_root, 'index.swift'))
  FileUtils.cp(spec[:native_source], File.join(sources_root, File.basename(spec[:native_source])))
end

def find_or_create_group(project, name)
  project.main_group.groups.find { |group| group.display_name == name } || project.main_group.new_group(name)
end

def find_or_create_embed_phase(target)
  target.copy_files_build_phases.find { |phase| phase.name == 'Embed Guance UTS Frameworks' } || begin
    phase = target.new_copy_files_build_phase('Embed Guance UTS Frameworks')
    phase.dst_subfolder_spec = '10'
    phase
  end
end

def embed_file(target, phase, reference)
  build_file = phase.add_file_reference(reference, true)
  build_file.settings = { 'ATTRIBUTES' => %w[CodeSignOnCopy RemoveHeadersOnCopy] }
  target.frameworks_build_phase.add_file_reference(reference, true)
end

def add_remote_framework(project, host_target, modules_group, project_path, remote_project)
  relative_project_path = relative_path(File.dirname(project.path), project_path)
  project_reference = project.new(Xcodeproj::Project::Object::PBXFileReference)
  project_reference.path = relative_project_path
  project_reference.source_tree = 'SOURCE_ROOT'
  project_reference.last_known_file_type = 'wrapper.pb-project'
  modules_group << project_reference

  products_group = modules_group.groups.find { |group| group.display_name == "#{remote_project.root_object.product_ref_group.display_name} Products" } || modules_group.new_group("#{remote_project.root_object.product_ref_group.display_name} Products")
  remote_target = remote_project.targets.first

  product_proxy = project.new(Xcodeproj::Project::Object::PBXContainerItemProxy)
  product_proxy.container_portal = project_reference.uuid
  product_proxy.proxy_type = '2'
  product_proxy.remote_global_id_string = remote_target.product_reference.uuid
  product_proxy.remote_info = remote_target.product_reference.display_name

  framework_reference = project.new(Xcodeproj::Project::Object::PBXReferenceProxy)
  framework_reference.file_type = 'wrapper.framework'
  framework_reference.path = remote_target.product_reference.path
  framework_reference.remote_ref = product_proxy
  products_group << framework_reference

  target_proxy = project.new(Xcodeproj::Project::Object::PBXContainerItemProxy)
  target_proxy.container_portal = project_reference.uuid
  target_proxy.proxy_type = '1'
  target_proxy.remote_global_id_string = remote_target.uuid
  target_proxy.remote_info = remote_target.name

  dependency = project.new(Xcodeproj::Project::Object::PBXTargetDependency)
  dependency.target_proxy = target_proxy
  host_target.dependencies << dependency

  framework_reference
end

def generated_reference?(reference)
  return false if reference.nil?

  value = [reference.path, reference.display_name].compact.join(' ')
  value.include?('GuanceSDK-Dynamic.xcframework') ||
    value.include?('GuanceSessionReplay-Dynamic.xcframework') ||
    value.include?('unimoduleGCUniPlugin') ||
    value.include?('unimoduleGCUniSessionReplay')
end

def remove_generated_host_integration(project, host_target)
  host_target.copy_files_build_phases
    .select { |phase| phase.name == 'Embed Guance UTS Frameworks' }
    .each(&:remove_from_project)

  host_target.frameworks_build_phase.files
    .select { |build_file| generated_reference?(build_file.file_ref) }
    .each(&:remove_from_project)

  host_target.dependencies
    .select { |dependency| dependency.target_proxy&.remote_info.to_s.start_with?('unimoduleGCUni') }
    .each(&:remove_from_project)

  project.objects
    .grep(Xcodeproj::Project::Object::PBXReferenceProxy)
    .select { |reference| generated_reference?(reference) }
    .each(&:remove_from_project)

  project.objects
    .grep(Xcodeproj::Project::Object::PBXContainerItemProxy)
    .select { |proxy| proxy.remote_info.to_s.start_with?('unimoduleGCUni') }
    .each(&:remove_from_project)

  project.main_group.groups
    .select { |group| %w[Guance\ UTS\ Modules Guance\ Shared\ Frameworks].include?(group.display_name) }
    .each(&:remove_from_project)
end

def update_host_project(host_project_path, plugin_projects, shared_frameworks_root, shared_framework_names)
  project = Xcodeproj::Project.open(host_project_path)
  host_target = project.native_targets.find { |target| target.name == 'HBuilder' }
  abort "Unable to find the HBuilder target in #{host_project_path}" unless host_target

  remove_generated_host_integration(project, host_target)

  host_target.build_configurations.each do |configuration|
    configuration.build_settings['ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES'] = 'YES'
    configuration.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '13.0'
  end

  modules_group = find_or_create_group(project, 'Guance UTS Modules')
  framework_group = find_or_create_group(project, 'Guance Shared Frameworks')
  embed_phase = find_or_create_embed_phase(host_target)

  shared_framework_names.each do |framework|
    path = relative_path(File.dirname(host_project_path), File.join(shared_frameworks_root, framework))
    reference = add_file(framework_group, path, 'wrapper.xcframework')
    embed_file(host_target, embed_phase, reference)
  end

  plugin_projects.each do |plugin_project_path|
    remote_project = Xcodeproj::Project.open(plugin_project_path)
    framework_reference = add_remote_framework(project, host_target, modules_group, plugin_project_path, remote_project)
    embed_file(host_target, embed_phase, framework_reference)
  end

  project.save
end

include_session_replay = ENV.fetch('GUANCE_SESSION_REPLAY', '1') != '0'
selected_specs = include_session_replay ? PLUGIN_SPECS : PLUGIN_SPECS.first(1)

selected_specs.each { |spec| sync_uts_sources(spec, frameworks_root) }

plugin_projects = selected_specs.map do |spec|
  create_plugin_project(spec, frameworks_root, sdk_libs, shared_frameworks_root)
end
shared_framework_names = selected_specs.flat_map { |spec| spec[:frameworks] }.uniq
update_host_project(host_project_path, plugin_projects, shared_frameworks_root, shared_framework_names)

puts "Generated and linked #{plugin_projects.length} dynamic Guance UTS framework project(s)."
