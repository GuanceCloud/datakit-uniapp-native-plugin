const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function relative(relativePath) {
  return path.join(root, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(relative(relativePath), 'utf8');
}

function assertFile(relativePath) {
  assert(fs.existsSync(relative(relativePath)), `${relativePath} must exist`);
}

function assertNoFile(relativePath) {
  assert(!fs.existsSync(relative(relativePath)), `${relativePath} must not exist`);
}

function assertNotIncludes(source, value, label) {
  assert(!source.includes(value), `${label} must not include ${JSON.stringify(value)}`);
}

const host = 'native-projects/native-sdk-hybrid/ios/HBuilder-uniPluginDemo';
const core = `${host}/UTSFrameworks/unimoduleGCUniPlugin`;
const replay = `${host}/UTSFrameworks/unimoduleGCUniSessionReplay`;

for (const relativePath of [
  `${core}/unimoduleGCUniPlugin.xcodeproj/project.pbxproj`,
  `${replay}/unimoduleGCUniSessionReplay.xcodeproj/project.pbxproj`,
  `${core}/Sources/GCUniPluginNative.swift`,
  `${replay}/Sources/GCSessionReplayNative.swift`,
  `${core}/Sources/GCUniPluginUTSConfig.m`,
  `${replay}/Sources/GCUniSessionReplayUTSConfig.m`,
  `${host}/scripts/package_guance_uniapp_ios.sh`
]) {
  assertFile(relativePath);
}

for (const relativePath of [
  `${core}/Sources/GCUniPluginHostNative.swift`,
  `${replay}/Sources/GCSessionReplayHostNative.swift`,
  `${host}/GuanceUniAppHostBridge`,
  `${host}/scripts/build_guance_host_bridge_xcframework.sh`,
  'Hbuilder_Example/uni_modules/GC-UniPlugin/integration/ios-host-bridge',
  'Hbuilder_Example/uni_modules/GC-UniSessionReplay/integration/ios-host-bridge'
]) {
  assertNoFile(relativePath);
}

const generator = read(`${host}/scripts/generate_guance_uts_frameworks.rb`);
const packageScript = read(`${host}/scripts/package_guance_uniapp_ios.sh`);
const coreInterface = read('Hbuilder_Example/uni_modules/GC-UniPlugin/utssdk/interface.uts');
assert(packageScript.includes('repository_root="$(cd "$host_root/../../../.." && pwd)"'));
assert(packageScript.includes('dcloud_sdk_libs="${DCLOUD_SDK_LIBS_DIR:-$host_root/../SDK/Libs}"'));
assert(generator.includes("repository_root = File.expand_path('../../../..', host_root)"));
assert(generator.includes("ENV.fetch('GUANCE_SESSION_REPLAY', '1') != '0'"));
assert(generator.includes("'BUILD_LIBRARY_FOR_DISTRIBUTION' => 'YES'"));
assert(generator.includes("'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'arm64'"));
assert(generator.includes("'OTHER_LDFLAGS' => ['$(inherited)', '-ObjC']"));
assert(generator.includes('native_source'));
assert(generator.includes('GuanceSDK.xcframework'));
assert(generator.includes('GuanceSessionReplay.xcframework'));
assert(generator.includes('FileUtils.cp(spec[:native_source]'));
assert(coreInterface.includes('// #ifdef APP-ANDROID\n\tofflinePackage?: boolean | null\n\t// #endif'));
assert(generator.includes("find_or_create_group(project, 'Guance Local Frameworks')"));
for (const bridgeToken of [
  'host_native_source',
  'generated_index_source.gsub!',
  'sync_host_bridge_sources',
  'create_host_bridge_static_framework_project',
  'GuanceUniAppHostBridge'
]) {
  assertNotIncludes(generator, bridgeToken, 'direct local framework generator');
}

assert(packageScript.includes('DCLOUD_SDK_LIBS_DIR'));
assert(packageScript.includes('package_name="GuanceUniApp-$version"'));
assert(packageScript.includes('dist/native-sdk-hybrid/ios'));
assertNotIncludes(packageScript, 'GuanceUniApp-iOS-$version', 'iOS release ZIP name');
assert(packageScript.includes('build_uts_framework unimoduleGCUniPlugin'));
assert(packageScript.includes('build_uts_framework unimoduleGCUniSessionReplay'));
assert(packageScript.includes('GUANCE_SESSION_REPLAY'));
assert(packageScript.includes('GuanceSDK.xcframework'));
assert(packageScript.includes('GuanceSessionReplay.xcframework'));
assert(packageScript.includes('/usr/bin/ditto -c -k --keepParent'));
assert(packageScript.includes("find \"$package_root\" -name '.DS_Store' -delete"));
assert(packageScript.includes('COPYFILE_DISABLE=1'));
assert(packageScript.includes('--norsrc'));
assert(packageScript.includes('rm -f "$archive_path"'));
assertNotIncludes(packageScript, 'GuanceUniAppHostBridge', 'release ZIP package script');

const coreProject = read(`${core}/unimoduleGCUniPlugin.xcodeproj/project.pbxproj`);
const replayProject = read(`${replay}/unimoduleGCUniSessionReplay.xcodeproj/project.pbxproj`);
for (const project of [coreProject, replayProject]) {
  assert(project.includes('productType = "com.apple.product-type.framework";'));
  assert(project.includes('BUILD_LIBRARY_FOR_DISTRIBUTION = YES;'));
  assert(project.includes('"EXCLUDED_ARCHS[sdk=iphonesimulator*]" = arm64;'));
  assert(project.includes('DCUniBase.framework'));
  assert(project.includes('DCloudUTSFoundation.framework'));
  assert(project.includes('GuanceSDK.xcframework'));
  assertNotIncludes(project, 'HostBridge', 'UTS runtime framework project');
}
assertNotIncludes(coreProject, 'GuanceSessionReplay.xcframework', 'core UTS framework project');
assert(replayProject.includes('GuanceSessionReplay.xcframework'));
assert(replayProject.includes('WebKit.framework'));

const coreNative = read(`${core}/Sources/GCUniPluginNative.swift`);
const replayNative = read(`${replay}/Sources/GCSessionReplayNative.swift`);
assert(coreNative.includes('import GuanceSDK'));
assert(coreNative.includes('@objc public static func sdkConfig(_ json: String?) -> Bool'));
assert(coreNative.includes('@objc public static func setDatakitURL(_ json: String?)'));
assert(coreNative.includes('@objc public static func setDatawayURL(_ json: String?)'));
assert(coreNative.includes('public static func updateRemoteConfigWithMiniUpdateInterval'));
assert(replayNative.includes('import GuanceSessionReplay'));
assert(replayNative.includes('@objc public static func setConfig(_ json: String?) -> Bool'));
assertNotIncludes(coreNative, 'HostBridge', 'core native implementation');
assertNotIncludes(replayNative, 'HostBridge', 'Session Replay native implementation');

const coreIndex = read(`${core}/Sources/index.swift`);
const replayIndex = read(`${replay}/Sources/index.swift`);
assert(coreIndex.includes('GCUniPluginNative.sdkConfig'));
assert(coreIndex.includes('GCUniPluginNative.setDatakitURL'));
assert(coreIndex.includes('GCUniPluginNative.setDatawayURL'));
assert(coreIndex.includes('GCUniPluginNative.updateRemoteConfigWithMiniUpdateInterval'));
assertNotIncludes(coreIndex, 'offlinePackage', 'generated iOS core UTS source');
assert(replayIndex.includes('GCSessionReplayNative.setConfig'));
assertNotIncludes(coreIndex, 'GCUniPluginHostNative', 'generated core UTS source');
assertNotIncludes(replayIndex, 'GCSessionReplayHostNative', 'generated Session Replay UTS source');

const coreConfigLoader = read(`${core}/Sources/GCUniPluginUTSConfig.m`);
const replayConfigLoader = read(`${replay}/Sources/GCUniSessionReplayUTSConfig.m`);
assert(coreConfigLoader.includes('@implementation GCUniPluginUTSConfig'));
assert(replayConfigLoader.includes('@implementation GCUniSessionReplayUTSConfig'));
assert(!coreConfigLoader.includes('@implementation DCloudUTSConfig'));
assert(!replayConfigLoader.includes('@implementation DCloudUTSConfig'));
assert(replayConfigLoader.includes('[DCUniBridge registerHookClass:hookClass]'));

const replayConfig = JSON.parse(read(`${replay}/config.json`));
assert.strictEqual(
  replayConfig.hooksClass,
  'UTSSDKModulesGCUniSessionReplayGCSessionReplayIOSHook'
);

const podfile = read(`${host}/Podfile`);
assertNotIncludes(podfile, "pod 'GuanceSDK'", 'direct local framework Podfile');
assertNotIncludes(podfile, 'GuanceUniAppHostBridge', 'direct local framework Podfile');

const hostProject = read(`${host}/HBuilder-uniPlugin.xcodeproj/project.pbxproj`);
assert(hostProject.includes('Embed Guance UTS Frameworks'));
for (const artifact of [
  'unimoduleGCUniPlugin.framework in Embed Guance UTS Frameworks',
  'unimoduleGCUniSessionReplay.framework in Embed Guance UTS Frameworks',
  'GuanceSDK.xcframework in Embed Guance UTS Frameworks',
  'GuanceSessionReplay.xcframework in Embed Guance UTS Frameworks'
]) {
  assert(hostProject.includes(artifact), `${artifact} must be embedded by the host`);
}
assertNotIncludes(hostProject, 'GuanceUniAppHostBridge', 'direct local framework host project');

const hybridWorkspace = read(`${host}/GuanceHybrid.xcworkspace/contents.xcworkspacedata`);
assert(hybridWorkspace.includes('group:HBuilder-uniPlugin.xcodeproj'));
assert(hybridWorkspace.includes('group:Pods/Pods.xcodeproj'));
assert(!hybridWorkspace.includes('UTSFrameworks/unimoduleGCUni'));

console.log('hybrid iOS direct local UTS framework integration checks passed');
