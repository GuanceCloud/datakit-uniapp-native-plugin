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

function assertNotIncludes(source, value, label) {
  assert(!source.includes(value), `${label} must not include ${JSON.stringify(value)}`);
}

const host = 'HybridHostExample-iOS/HBuilder-uniPluginDemo';
const core = `${host}/UTSFrameworks/unimoduleGCUniPlugin`;
const replay = `${host}/UTSFrameworks/unimoduleGCUniSessionReplay`;
const bridge = `${host}/GuanceUniAppHostBridge`;
const staticBridge = `${bridge}/StaticFramework`;

for (const relativePath of [
  `${core}/unimoduleGCUniPlugin.xcodeproj/project.pbxproj`,
  `${replay}/unimoduleGCUniSessionReplay.xcodeproj/project.pbxproj`,
  `${core}/Sources/GCUniPluginHostNative.swift`,
  `${replay}/Sources/GCSessionReplayHostNative.swift`,
  `${core}/Sources/GCUniPluginUTSConfig.m`,
  `${replay}/Sources/GCUniSessionReplayUTSConfig.m`,
  `${bridge}/GuanceUniAppHostBridge.podspec`,
  `${bridge}/Sources/Core/GCUniPluginNative.swift`,
  `${bridge}/Sources/Core/GuanceUniAppCoreHostBridge.swift`,
  `${bridge}/Sources/SessionReplay/GCSessionReplayNative.swift`,
  `${bridge}/Sources/SessionReplay/GuanceUniAppSessionReplayHostBridge.swift`,
  `${staticBridge}/GuanceUniAppHostBridge.xcodeproj/project.pbxproj`,
  `${host}/scripts/build_guance_host_bridge_xcframework.sh`,
  `${host}/scripts/package_guance_uniapp_ios.sh`
]) {
  assertFile(relativePath);
}

const generator = read(`${host}/scripts/generate_guance_uts_frameworks.rb`);
const staticBridgeProject = read(`${staticBridge}/GuanceUniAppHostBridge.xcodeproj/project.pbxproj`);
const staticBridgeBuildScript = read(`${host}/scripts/build_guance_host_bridge_xcframework.sh`);
const packageScript = read(`${host}/scripts/package_guance_uniapp_ios.sh`);
assert(generator.includes("ENV.fetch('GUANCE_SESSION_REPLAY', '1') != '0'"));
assert(generator.includes("'BUILD_LIBRARY_FOR_DISTRIBUTION' => 'YES'"));
assert(generator.includes("'OTHER_LDFLAGS' => ['$(inherited)', '-ObjC']"));
assert(generator.includes('direct_native_source'));
assert(generator.includes('host_native_source'));
assert(generator.includes('generated_index_source.gsub!'));
assert(generator.includes('sync_host_bridge_sources'));
assert(generator.includes('core_sources.merge(session_replay_sources)'));
assertNotIncludes(generator, 'selected_sources.merge!(session_replay_sources)', 'single HostBridge generator');
assertNotIncludes(generator, 'shared_framework_names', 'HostBridge generator');
assert(generator.includes('create_host_bridge_static_framework_project'));
assert(staticBridgeProject.includes('MACH_O_TYPE = staticlib;'));
assert(staticBridgeProject.includes('GuanceSDK.xcframework'));
assert(staticBridgeProject.includes('GuanceSessionReplay.xcframework'));
assert(staticBridgeBuildScript.includes('-create-xcframework'));
assert(staticBridgeBuildScript.includes('CODE_SIGNING_ALLOWED=NO'));
assert(staticBridgeBuildScript.includes('GuanceUniAppHostBridge.xcframework'));
assert(packageScript.includes('DCLOUD_SDK_LIBS_DIR'));
assert(packageScript.includes('build_uts_framework unimoduleGCUniPlugin'));
assert(packageScript.includes('build_uts_framework unimoduleGCUniSessionReplay'));
assert(packageScript.includes('GUANCE_SESSION_REPLAY'));
assert(packageScript.includes('GuanceUniAppHostBridge.xcframework'));
assert(packageScript.includes('/usr/bin/ditto -c -k --keepParent'));
assertNotIncludes(packageScript, 'GuanceUniAppHostBridge.podspec', 'release ZIP package script');
assertNotIncludes(packageScript, 'Integration.md', 'release ZIP package script');

const coreProject = read(`${core}/unimoduleGCUniPlugin.xcodeproj/project.pbxproj`);
const replayProject = read(`${replay}/unimoduleGCUniSessionReplay.xcodeproj/project.pbxproj`);
for (const project of [coreProject, replayProject]) {
  assert(project.includes('productType = "com.apple.product-type.framework";'));
  assert(project.includes('BUILD_LIBRARY_FOR_DISTRIBUTION = YES;'));
  assert(project.includes('DCUniBase.framework'));
  assert(project.includes('DCloudUTSFoundation.framework'));
  assertNotIncludes(project, 'GuanceSDK-Dynamic.xcframework', 'UTS runtime framework project');
  assertNotIncludes(project, 'GuanceSessionReplay-Dynamic.xcframework', 'UTS runtime framework project');
  assertNotIncludes(project, 'GuanceSDK.xcframework', 'UTS runtime framework project');
  assertNotIncludes(project, 'GuanceSessionReplay.xcframework', 'UTS runtime framework project');
  assertNotIncludes(project, 'SharedFrameworks', 'UTS runtime framework search path');
}
assert(replayProject.includes('WebKit.framework'));

const coreAdapter = read(`${core}/Sources/GCUniPluginHostNative.swift`);
const replayAdapter = read(`${replay}/Sources/GCSessionReplayHostNative.swift`);
assert(coreAdapter.includes('GuanceUniAppCoreHostBridge'));
assert(coreAdapter.includes('handleCommand:payload:'));
assert(coreAdapter.includes('tracer.getTraceHeader'));
assert(replayAdapter.includes('GuanceUniAppSessionReplayHostBridge'));
assert(replayAdapter.includes('sessionReplay.installWebViewHook'));
assert(replayAdapter.includes('GuanceSDK/SessionReplay'));

const coreIndex = read(`${core}/Sources/index.swift`);
const replayIndex = read(`${replay}/Sources/index.swift`);
assert(coreIndex.includes('GCUniPluginHostNative.sdkConfig'));
assertNotIncludes(coreIndex, 'GCUniPluginNative.sdkConfig', 'generated core UTS source');
assert(replayIndex.includes('GCSessionReplayHostNative.setConfig'));
assertNotIncludes(replayIndex, 'GCSessionReplayNative.setConfig', 'generated Session Replay UTS source');

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
const podspec = read(`${bridge}/GuanceUniAppHostBridge.podspec`);
const coreBridge = read(`${bridge}/Sources/Core/GuanceUniAppCoreHostBridge.swift`);
const replayBridge = read(`${bridge}/Sources/SessionReplay/GuanceUniAppSessionReplayHostBridge.swift`);
const sharedReplayImplementation = read(`${bridge}/Sources/SessionReplay/GCSessionReplayNative.swift`);
assert(podfile.includes("pod 'GuanceUniAppHostBridge', :path => 'GuanceUniAppHostBridge'"));
assertNotIncludes(podfile, "pod 'GuanceUniAppHostBridge/Core'", 'single HostBridge Podfile');
assertNotIncludes(podfile, "pod 'GuanceUniAppHostBridge/SessionReplay'", 'single HostBridge Podfile');
assert(podspec.includes('s.static_framework = true'));
assert(podspec.includes("s.source_files = 'Sources/**/*.{h,m,mm,swift}'"));
const agentDependency = podspec.match(/s\.dependency 'GuanceSDK\/Agent', '= ([^']+)'/);
const replayDependency = podspec.match(/s\.dependency 'GuanceSDK\/SessionReplay', '= ([^']+)'/);
assert(agentDependency, 'HostBridge Podspec must pin GuanceSDK/Agent');
assert(replayDependency, 'HostBridge Podspec must pin GuanceSDK/SessionReplay');
assert.strictEqual(
  agentDependency[1],
  replayDependency[1],
  'HostBridge Podspec must pin Agent and Session Replay to the same Guance SDK version'
);
assert(podspec.includes('-DGUANCE_UNI_COCOAPODS_SESSION_REPLAY'));
assert(podspec.includes("'OTHER_LDFLAGS' => '$(inherited) -ObjC'"));
assert(coreBridge.includes('@objc(GuanceUniAppCoreHostBridge)'));
for (const command of [
  'mobile.sdkConfig',
  'mobile.bindRUMUser',
  'rum.setConfig',
  'rum.startView',
  'logger.setConfig',
  'tracer.getTraceHeader'
]) {
  assert(coreBridge.includes(command), `core HostBridge must handle ${command}`);
}
assert(replayBridge.includes('@objc(GuanceUniAppSessionReplayHostBridge)'));
assert(replayBridge.includes('sessionReplayIsAvailable()'));
assert(replayBridge.includes('GuanceSDK/SessionReplay'));
assert(replayBridge.includes('GuanceSessionReplay'));
assert(sharedReplayImplementation.includes('#if canImport(GuanceSessionReplay)'));
assert(sharedReplayImplementation.includes('#elseif GUANCE_UNI_COCOAPODS_SESSION_REPLAY'));
assert(sharedReplayImplementation.includes('GC-UniSessionReplay requires GuanceSessionReplay'));
assert(replayAdapter.includes('Link the static GuanceUniAppHostBridge'));

const hostProject = read(`${host}/HBuilder-uniPlugin.xcodeproj/project.pbxproj`);
assert(hostProject.includes('Embed Guance UTS Frameworks'));
for (const artifact of [
  'unimoduleGCUniPlugin.framework in Embed Guance UTS Frameworks',
  'unimoduleGCUniSessionReplay.framework in Embed Guance UTS Frameworks'
]) {
  assert(hostProject.includes(artifact), `${artifact} must be embedded by the host`);
}
assertNotIncludes(hostProject, 'GuanceSDK-Dynamic.xcframework', 'HostBridge host project');
assertNotIncludes(hostProject, 'GuanceSessionReplay-Dynamic.xcframework', 'HostBridge host project');

const hybridWorkspace = read(`${host}/GuanceHybrid.xcworkspace/contents.xcworkspacedata`);
assert(hybridWorkspace.includes('group:HBuilder-uniPlugin.xcodeproj'));
assert(hybridWorkspace.includes('group:Pods/Pods.xcodeproj'));
assert(!hybridWorkspace.includes('UTSFrameworks/unimoduleGCUni'));

console.log('hybrid iOS UTS HostBridge integration checks passed');
