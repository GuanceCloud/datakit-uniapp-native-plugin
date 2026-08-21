#!/usr/bin/env ruby

require "xcodeproj"

workspace_root = File.expand_path("..", __dir__)
host_project_path = File.join(workspace_root, "ios/demo/UniMPHostExtensionDemo.xcodeproj")
extension_project_path = File.join(workspace_root, "ios/GCUniPlugin/GC-UniPlugin-App.xcodeproj")

host_project = Xcodeproj::Project.open(host_project_path)
extension_project = Xcodeproj::Project.open(extension_project_path)
app_target = host_project.targets.find { |target| target.product_type == "com.apple.product-type.application" }
extension_target = extension_project.targets.find { |target| target.name == "GC-UniPlugin-App" }
abort "UniMP demo application target was not found" unless app_target
abort "GC-UniPlugin-App target was not found" unless extension_target

unwanted = /(GuanceUniAppHostBridge|GuanceSessionReplay|unimoduleGCUni|DCloudUTS|DCUniBase|TestModule|TestMap)/i

host_project.targets.each do |target|
  target.build_phases.each do |phase|
    next unless phase.respond_to?(:files)

    phase.files.to_a.each do |build_file|
      name = build_file.display_name.to_s
      package_product = build_file.respond_to?(:product_ref) && !build_file.product_ref.nil?
      build_file.remove_from_project if package_product || name.match?(unwanted)
    end
  end
  target.package_product_dependencies.clear
end
host_project.root_object.package_references.clear

host_project.files.to_a.each do |file_reference|
  file_reference.remove_from_project if file_reference.display_name.to_s.match?(unwanted)
end

app_target.resources_build_phase.files.to_a.each do |build_file|
  name = build_file.display_name.to_s
  build_file.remove_from_project if name.end_with?(".wgt") && name != "__UNI__EDA429D.wgt in Resources"
end
host_project.files.to_a.each do |file_reference|
  name = file_reference.display_name.to_s
  file_reference.remove_from_project if name.end_with?(".wgt") && name != "__UNI__EDA429D.wgt"
end
wgt_reference = host_project.files.find do |file_reference|
  file_reference.display_name == "__UNI__EDA429D.wgt"
end
abort "__UNI__EDA429D.wgt was not found in the UniMP demo project" unless wgt_reference
unless app_target.resources_build_phase.files_references.include?(wgt_reference)
  app_target.resources_build_phase.add_file_reference(wgt_reference, true)
end

# Remove the first generated in-project framework target. The canonical
# GC-UniPlugin-App project is kept as a subproject instead.
host_project.targets.select { |target| target.product_type == "com.apple.product-type.framework" }.each do |target|
  app_target.frameworks_build_phase.files.to_a.each do |build_file|
    build_file.remove_from_project if build_file.file_ref == target.product_reference
  end
  app_target.dependencies.to_a.each do |dependency|
    dependency.remove_from_project if dependency.target == target
  end
  target.remove_from_project
end
host_project.main_group.groups.to_a.each do |group|
  group.remove_from_project if group.display_name == "GCUniPlugin"
end

# The upstream demo keeps Core and Extension as physical folders below
# HelloUniMPDemo/UniMP. In this repository the UniMP Core is synced beside the
# demo instead, so point the navigator group at that canonical location and
# remove the unused Extension placeholder.
demo_group = host_project.main_group.groups.find { |group| group.display_name == "HelloUniMPDemo" }
unimp_group = demo_group&.groups&.find { |group| group.display_name == "UniMP" }
core_group = unimp_group&.groups&.find { |group| group.display_name == "Core" }
abort "UniMP Core group was not found" unless core_group

core_group.name = "Core"
core_group.path = "../../../UniMPSDK/Core"
headers_group = core_group.groups.find { |group| group.display_name == "Headers" }
resources_group = core_group.groups.find { |group| group.display_name == "Resources" }
abort "UniMP Headers group was not found" unless headers_group
abort "UniMP Resources group was not found" unless resources_group
headers_group.path = "Headers"
resources_group.path = "Resources"

# UniMPSDK iOS 5.15 keeps WXLog.h in DCUniBase.framework, not in the synced
# Core/Headers/weexHeader directory. Drop the stale navigator-only reference
# inherited from the upstream sample project.
weex_headers_group = headers_group.groups.find { |group| group.display_name == "weexHeader" }
wx_log_reference = weex_headers_group&.files&.find { |reference| reference.display_name == "WXLog.h" }
wx_log_reference&.remove_from_project

extension_group = unimp_group.groups.find { |group| group.display_name == "Extension" }
extension_group&.remove_from_project

app_target.name = "UniMPHostExtensionDemo"
app_target.product_name = "UniMPHostExtensionDemo"
app_target.product_reference.name = "UniMPHostExtensionDemo.app"
app_target.product_reference.path = "UniMPHostExtensionDemo.app"

subproject_reference = host_project.files.find do |reference|
  reference.path.to_s.end_with?("GC-UniPlugin-App.xcodeproj")
end
subproject_reference ||= host_project.main_group.new_file(extension_project_path)

project_reference = subproject_reference.project_reference_metadata
abort "GC-UniPlugin-App project reference metadata was not created" unless project_reference

# xcodeproj 1.27 adds subproject product proxies to the host project's Products
# group. Xcode 26 expects a project reference to own a separate Products group;
# otherwise saving the project sends `realReference` to ordinary file references
# in the host group and crashes with NSInvalidArgumentException.
extension_products_group = project_reference[:product_group]
if extension_products_group.nil? || extension_products_group == host_project.products_group
  extension_products_group = host_project.new(Xcodeproj::Project::Object::PBXGroup)
  extension_products_group.name = "Products"
  extension_products_group.source_tree = "<group>"
  project_reference[:product_group] = extension_products_group
end

extension_proxies = subproject_reference.file_reference_proxies
host_project.objects.grep(Xcodeproj::Project::Object::PBXGroup).each do |group|
  next if group == extension_products_group

  extension_proxies.each { |proxy| group.children.delete(proxy) }
end
extension_proxies.each do |proxy|
  extension_products_group.children << proxy unless extension_products_group.children.include?(proxy)
end

extension_product = extension_proxies.find do |proxy|
  proxy.path == extension_target.product_reference.path
end
abort "GC-UniPlugin-App framework product proxy was not created" unless extension_product

app_target.frameworks_build_phase.files.to_a.each do |build_file|
  name = build_file.display_name.to_s
  build_file.remove_from_project if name.match?(/GC[-_]UniPlugin[-_]App|GCUniPlugin/i)
end
app_target.dependencies.to_a.each do |dependency|
  name = dependency.name.to_s
  dependency.remove_from_project if name.match?(/GC[-_]UniPlugin[-_]App|GCUniPlugin/i)
end
has_extension_dependency = app_target.dependencies.any? do |dependency|
  dependency.target_proxy&.remote_global_id_string == extension_target.uuid
end
unless has_extension_dependency
  container_proxy = host_project.new(Xcodeproj::Project::PBXContainerItemProxy)
  container_proxy.container_portal = subproject_reference.uuid
  container_proxy.proxy_type = Xcodeproj::Constants::PROXY_TYPES[:native_target]
  container_proxy.remote_global_id_string = extension_target.uuid
  container_proxy.remote_info = extension_target.name

  dependency = host_project.new(Xcodeproj::Project::PBXTargetDependency)
  dependency.name = extension_target.name
  dependency.target_proxy = container_proxy
  app_target.dependencies << dependency
end
app_target.frameworks_build_phase.add_file_reference(extension_product, true)

dependencies_group = host_project.main_group.groups.find { |group| group.display_name == "Dependencies" }
dependencies_group ||= host_project.main_group.new_group("Dependencies", "../Dependencies")
guance_reference = dependencies_group.files.find { |reference| reference.path == "GuanceSDK.xcframework" }
guance_reference ||= dependencies_group.new_file("GuanceSDK.xcframework")
unless app_target.frameworks_build_phase.files_references.include?(guance_reference)
  app_target.frameworks_build_phase.add_file_reference(guance_reference, true)
end

embed_phase = app_target.copy_files_build_phases.find { |phase| phase.name == "Embed Frameworks" }
embed_phase ||= app_target.new_copy_files_build_phase("Embed Frameworks")
embed_phase.dst_subfolder_spec = "10"
unless embed_phase.files_references.include?(guance_reference)
  build_file = embed_phase.add_file_reference(guance_reference)
  build_file.settings = { "ATTRIBUTES" => ["CodeSignOnCopy", "RemoveHeadersOnCopy"] }
end

host_project.build_configurations.each do |configuration|
  configuration.build_settings["IPHONEOS_DEPLOYMENT_TARGET"] = "12.0"
end

app_target.build_configurations.each do |configuration|
  settings = configuration.build_settings
  settings.delete("DEVELOPMENT_TEAM")
  settings["FRAMEWORK_SEARCH_PATHS"] = ["$(inherited)", "$(SRCROOT)/../UniMPSDK/**", "$(SRCROOT)/../Dependencies"]
  settings["HEADER_SEARCH_PATHS"] = ["$(inherited)", "$(SRCROOT)/../UniMPSDK/Core/Headers", "$(SRCROOT)/../UniMPSDK/Core/Headers/weexHeader", "$(SRCROOT)/../Dependencies/DCloudHeaders/DCUni"]
  settings["IPHONEOS_DEPLOYMENT_TARGET"] = "12.0"
  settings["LIBRARY_SEARCH_PATHS"] = ["$(inherited)", "$(SRCROOT)/../UniMPSDK/**"]
  settings["PRODUCT_BUNDLE_IDENTIFIER"] = "com.guance.unimp.hostextension.demo"
  settings["PRODUCT_NAME"] = "UniMPHostExtensionDemo"
end

host_project.save

scheme_directory = File.join(host_project_path, "xcshareddata/xcschemes")
legacy_scheme_path = File.join(scheme_directory, "HelloUniMPDemo.xcscheme")
host_scheme_path = File.join(scheme_directory, "UniMPHostExtensionDemo.xcscheme")
scheme_source_path = File.exist?(host_scheme_path) ? host_scheme_path : legacy_scheme_path
if File.exist?(scheme_source_path)
  scheme = File.read(scheme_source_path)
  scheme.gsub!("HelloUniMPDemo.app", "UniMPHostExtensionDemo.app")
  scheme.gsub!("BlueprintName = \"HelloUniMPDemo\"", "BlueprintName = \"UniMPHostExtensionDemo\"")
  scheme.gsub!("container:HelloUniMPDemo.xcodeproj", "container:UniMPHostExtensionDemo.xcodeproj")
  File.write(host_scheme_path, scheme)
  File.delete(legacy_scheme_path) if File.exist?(legacy_scheme_path)
end

puts "Configured #{host_project_path} with GC-UniPlugin-App as a subproject"
