#!/usr/bin/env ruby

require "xcodeproj"

workspace_root = File.expand_path("..", __dir__)
ios_root = File.join(workspace_root, "ios")
project_path = File.join(ios_root, "demo/UniMPHostExtensionDemo.xcodeproj")
project = Xcodeproj::Project.open(project_path)

failures = []

subproject_reference = project.files.find do |reference|
  reference.path.to_s.end_with?("GC-UniPlugin-App.xcodeproj")
end
if subproject_reference.nil?
  failures << "Missing GC-UniPlugin-App.xcodeproj subproject reference"
else
  project_reference = subproject_reference.project_reference_metadata
  if project_reference.nil?
    failures << "Missing GC-UniPlugin-App project reference metadata"
  else
    product_group = project_reference[:product_group]
    if product_group.nil?
      failures << "Missing GC-UniPlugin-App Products group"
    elsif product_group == project.products_group
      failures << "GC-UniPlugin-App reuses the host Products group and will crash Xcode when the project is saved"
    else
      non_proxy_products = product_group.children.reject do |child|
        child.is_a?(Xcodeproj::Project::Object::PBXReferenceProxy)
      end
      unless non_proxy_products.empty?
        failures << "GC-UniPlugin-App Products group contains non-proxy references: #{non_proxy_products.map(&:display_name).join(', ')}"
      end

      missing_proxies = subproject_reference.file_reference_proxies.reject do |proxy|
        product_group.children.include?(proxy)
      end
      unless missing_proxies.empty?
        failures << "GC-UniPlugin-App product proxies are outside its Products group: #{missing_proxies.map(&:display_name).join(', ')}"
      end
    end
  end
end

demo_group = project.main_group.groups.find { |group| group.display_name == "HelloUniMPDemo" }
unimp_group = demo_group&.groups&.find { |group| group.display_name == "UniMP" }
core_group = unimp_group&.groups&.find { |group| group.display_name == "Core" }
headers_group = core_group&.groups&.find { |group| group.display_name == "Headers" }
resources_group = core_group&.groups&.find { |group| group.display_name == "Resources" }

expected_groups = {
  "Core" => [core_group, File.join(ios_root, "UniMPSDK/Core")],
  "Headers" => [headers_group, File.join(ios_root, "UniMPSDK/Core/Headers")],
  "Resources" => [resources_group, File.join(ios_root, "UniMPSDK/Core/Resources")],
}

expected_groups.each do |name, (group, expected_path)|
  if group.nil?
    failures << "Missing #{name} group"
    next
  end

  actual_path = File.expand_path(group.real_path.to_s)
  expected_path = File.expand_path(expected_path)
  failures << "#{name} resolves to #{actual_path}, expected #{expected_path}" unless actual_path == expected_path
end

if unimp_group&.groups&.any? { |group| group.display_name == "Extension" }
  failures << "Obsolete empty Extension group is still present"
end

if File.directory?(File.join(ios_root, "UniMPSDK/Core"))
  missing_local_references = project.objects.select do |object|
    object.respond_to?(:real_path) &&
      object.respond_to?(:source_tree) &&
      object.source_tree == "<group>" &&
      !File.exist?(object.real_path.to_s)
  end
  missing_local_references.each do |reference|
    failures << "#{reference.display_name} resolves to missing path #{reference.real_path}"
  end
end

if failures.any?
  warn failures.join("\n")
  exit 1
end

puts "iOS UniMP project references resolve to the local UniMPSDK tree"
