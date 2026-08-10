const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assertIncludes(source, value, label) {
  assert(source.includes(value), `${label} must include ${JSON.stringify(value)}`);
}

const settings = read('HybridHostExample-Android/settings.gradle');
const app = read('HybridHostExample-Android/simpleDemo/build.gradle');
const coreLibrary = read('HybridHostExample-Android/unimoduleGCUniPlugin/build.gradle');
const replayLibrary = read('HybridHostExample-Android/unimoduleGCUniSessionReplay/build.gradle');
const syncSources = read('HybridHostExample-Android/scripts/sync_hbuilder_android_uts_sources.sh');
const packager = read('HybridHostExample-Android/scripts/package_guance_uniapp_android.sh');

assertIncludes(settings, "include ':unimoduleGCUniPlugin'", 'Android settings');
assertIncludes(settings, "include ':unimoduleGCUniSessionReplay'", 'Android settings');
assertIncludes(app, "implementation project(':unimoduleGCUniPlugin')", 'Android Host app');
assertIncludes(app, "implementation project(':unimoduleGCUniSessionReplay')", 'Android Host app');
assertIncludes(app, 'checkReleaseBuilds false', 'Android Host app');

for (const [label, source] of [
  ['core Android Library', coreLibrary],
  ['Session Replay Android Library', replayLibrary]
]) {
  assertIncludes(source, "id 'com.android.library'", label);
  assertIncludes(source, "id 'org.jetbrains.kotlin.android'", label);
  assertIncludes(source, "compileOnly fileTree(dir: '../simpleDemo/libs'", label);
}

assertIncludes(coreLibrary, 'ft-sdk:1.7.4', 'core Android Library');
assertIncludes(replayLibrary, 'ft-session-replay:0.1.7', 'Session Replay Android Library');
assertIncludes(syncSources, 'HBUILDER_ANDROID_UTS_EXPORT_DIR', 'source synchronization script');
assertIncludes(syncSources, "sync_module 'GC-UniPlugin' 'unimoduleGCUniPlugin'", 'source synchronization script');
assertIncludes(syncSources, "sync_module 'GC-UniSessionReplay' 'unimoduleGCUniSessionReplay'", 'source synchronization script');
assertIncludes(packager, 'unimoduleGCUniPlugin-release.aar', 'Android packager');
assertIncludes(packager, 'GUANCE_BUILD_UTS_MODULES', 'Android packager');

console.log('hybrid Android UTS integration checks passed');
