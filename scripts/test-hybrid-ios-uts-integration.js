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

const host = 'HybridHostExample-iOS/HBuilder-uniPluginDemo';
const core = `${host}/UTSFrameworks/unimoduleGCUniPlugin`;
const replay = `${host}/UTSFrameworks/unimoduleGCUniSessionReplay`;

for (const relativePath of [
  `${host}/SharedFrameworks/GuanceSDK-Dynamic.xcframework/Info.plist`,
  `${host}/SharedFrameworks/GuanceSessionReplay-Dynamic.xcframework/Info.plist`,
  `${core}/unimoduleGCUniPlugin.xcodeproj/project.pbxproj`,
  `${replay}/unimoduleGCUniSessionReplay.xcodeproj/project.pbxproj`,
  `${core}/Sources/GCUniPluginUTSConfig.m`,
  `${replay}/Sources/GCUniSessionReplayUTSConfig.m`
]) {
  assertFile(relativePath);
}

const generator = read(`${host}/scripts/generate_guance_uts_frameworks.rb`);
assert(generator.includes("ENV.fetch('GUANCE_SESSION_REPLAY', '1') != '0'"));
assert(generator.includes("'BUILD_LIBRARY_FOR_DISTRIBUTION' => 'YES'"));
assert(generator.includes("'OTHER_LDFLAGS' => ['$(inherited)', '-ObjC']"));
assert(generator.includes('DCUniBase.framework DCloudUTSFoundation.framework'));
assert(!generator.includes("'CODE_SIGNING_ALLOWED' => 'NO'"));

const coreProject = read(`${core}/unimoduleGCUniPlugin.xcodeproj/project.pbxproj`);
const replayProject = read(`${replay}/unimoduleGCUniSessionReplay.xcodeproj/project.pbxproj`);
for (const project of [coreProject, replayProject]) {
  assert(project.includes('productType = "com.apple.product-type.framework";'));
  assert(project.includes('BUILD_LIBRARY_FOR_DISTRIBUTION = YES;'));
  assert(project.includes('DCUniBase.framework'));
  assert(project.includes('DCloudUTSFoundation.framework'));
  assert(project.includes('GuanceSDK-Dynamic.xcframework'));
}
assert(replayProject.includes('GuanceSessionReplay-Dynamic.xcframework'));
assert(replayProject.includes('WebKit.framework'));

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

const hostProject = read(`${host}/HBuilder-uniPlugin.xcodeproj/project.pbxproj`);
assert(hostProject.includes('Embed Guance UTS Frameworks'));
for (const artifact of [
  'unimoduleGCUniPlugin.framework in Embed Guance UTS Frameworks',
  'unimoduleGCUniSessionReplay.framework in Embed Guance UTS Frameworks',
  'GuanceSDK-Dynamic.xcframework in Embed Guance UTS Frameworks',
  'GuanceSessionReplay-Dynamic.xcframework in Embed Guance UTS Frameworks'
]) {
  assert(hostProject.includes(artifact), `${artifact} must be embedded by the host`);
}

const workspace = read(`${host}/HBuilder-uniPlugin.xcworkspace/contents.xcworkspacedata`);
assert(workspace.includes('group:HBuilder-uniPlugin.xcodeproj'));
assert(workspace.includes('group:Pods/Pods.xcodeproj'));
assert(!workspace.includes('UTSFrameworks/unimoduleGCUni'));

const hybridWorkspace = read(`${host}/GuanceHybrid.xcworkspace/contents.xcworkspacedata`);
assert(hybridWorkspace.includes('group:HBuilder-uniPlugin.xcodeproj'));
assert(hybridWorkspace.includes('group:Pods/Pods.xcodeproj'));
assert(!hybridWorkspace.includes('UTSFrameworks/unimoduleGCUni'));

console.log('hybrid iOS UTS integration checks passed');
