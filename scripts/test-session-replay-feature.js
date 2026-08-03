const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
    return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function readJSON(relativePath) {
    return JSON.parse(read(relativePath));
}

function assertIncludes(source, value, label) {
    assert(
        source.includes(value),
        `${label} must include ${JSON.stringify(value)}`
    );
}

const baseModule = readJSON(
    'Hbuilder_Example/uni_modules/GC-UniPlugin/package.json'
);
const replayModule = readJSON(
    'Hbuilder_Example/uni_modules/GC-UniSessionReplay/package.json'
);
const baseIOSConfig = readJSON(
    'Hbuilder_Example/uni_modules/GC-UniPlugin/utssdk/app-ios/config.json'
);
const replayIOSConfig = readJSON(
    'Hbuilder_Example/uni_modules/GC-UniSessionReplay/utssdk/app-ios/config.json'
);

assert.strictEqual(replayModule.version, baseModule.version);
assert(replayModule.uni_modules.dependencies.includes('GC-UniPlugin'));
assert.strictEqual(
    replayModule.uni_modules.platforms.client['uni-app'].app.ios,
    'u'
);
assert.strictEqual(
    replayModule.uni_modules.platforms.client['uni-app'].app.android,
    '-'
);

assert.strictEqual(baseIOSConfig['dependencies-pods'], undefined);
assert.strictEqual(replayIOSConfig['dependencies-pods'], undefined);
assert.strictEqual(baseIOSConfig.deploymentTarget, '12.0');
assert.strictEqual(replayIOSConfig.deploymentTarget, '12.0');

for (const relativePath of [
    'Hbuilder_Example/uni_modules/GC-UniPlugin/utssdk/app-ios/Frameworks/GuanceSDK-Dynamic.xcframework/Info.plist',
    'Hbuilder_Example/uni_modules/GC-UniSessionReplay/utssdk/app-ios/Frameworks/GuanceSDK-Dynamic.xcframework/Info.plist',
    'Hbuilder_Example/uni_modules/GC-UniSessionReplay/utssdk/app-ios/Frameworks/GuanceSessionReplay-Dynamic.xcframework/Info.plist'
]) {
    assert(fs.existsSync(path.join(root, relativePath)), `${relativePath} must exist`);
}

const interfaceSource = read(
    'Hbuilder_Example/uni_modules/GC-UniSessionReplay/utssdk/interface.uts'
);
const iosIndexSource = read(
    'Hbuilder_Example/uni_modules/GC-UniSessionReplay/utssdk/app-ios/index.uts'
);
const nativeSource = read(
    'Hbuilder_Example/uni_modules/GC-UniSessionReplay/utssdk/app-ios/GCSessionReplayNative.swift'
);
const baseNativeSource = read(
    'Hbuilder_Example/uni_modules/GC-UniPlugin/utssdk/app-ios/GCUniPluginNative.swift'
);
const viewTrackingSource = read(
    'Hbuilder_Example/uni_modules/GC-UniPlugin/js_sdk/View/GCViewTracking.js'
);
const appSource = read('Hbuilder_Example/App.vue');
const bootstrapSource = read('Hbuilder_Example/sdk-bootstrap.js');
const mainSource = read('Hbuilder_Example/main.js');

assertIncludes(interfaceSource, 'setConfig(params: GCSessionReplayConfig): void', 'UTS API');
assertIncludes(iosIndexSource, 'implements UTSiOSHookProxy', 'iOS hook');
assertIncludes(iosIndexSource, 'GCSessionReplayNative.installWebViewHook()', 'iOS hook');
assertIncludes(nativeSource, 'private static let installHookOnce', 'native hook');
assertIncludes(baseNativeSource, 'import GuanceSDK', 'base dynamic framework import');
assert(!baseNativeSource.includes('import FTMobileSDK'));
assertIncludes(nativeSource, 'import GuanceSDK', 'base dynamic framework import');
assertIncludes(nativeSource, 'import GuanceSessionReplay', 'Session Replay dynamic framework import');
assert(!nativeSource.includes('import FTMobileSDK'));
assert(!nativeSource.includes('import FTSessionReplay'));
assertIncludes(nativeSource, '#selector(WKWebView.load(_:))', 'native hook');
assertIncludes(nativeSource, '#selector(WKWebView.loadHTMLString(_:baseURL:))', 'native hook');
assertIncludes(nativeSource, '#selector(WKWebView.loadFileURL(_:allowingReadAccessTo:))', 'native hook');
assertIncludes(nativeSource, 'NSHashTable<WKWebView>.weakObjects()', 'WebView capture');
assertIncludes(nativeSource, 'webView.isInspectable = true', 'Safari Web Inspector support');
assertIncludes(nativeSource, 'path.hasSuffix("/__uniappview.html")', 'UniApp WebView filter');
assertIncludes(nativeSource, '"__UniViewStartTime__"', 'UniApp WebView filter');
assertIncludes(nativeSource, 'let activeBeforeStart = isNativeSessionReplayActive()', 'duplicate start guard');
assertIncludes(nativeSource, 'if !activeBeforeStart {', 'duplicate start guard');
assertIncludes(nativeSource, 'objc_getProtocol("FTSRWebTrackingProtocol")', 'duplicate start guard');
assertIncludes(nativeSource, 'startWithSessionReplayConfig:', 'native Session Replay start hook');
assertIncludes(nativeSource, 'FTRumSessionReplay.startWithSessionReplayConfig entered', 'native Session Replay start probe');
assertIncludes(nativeSource, 'nativeSessionReplayServiceClassName()', 'native Session Replay feature probe');
assertIncludes(nativeSource, 'dealReceiveScriptMessage:slotId:info:', 'native bridge receive hook');
assertIncludes(nativeSource, 'FTWKWebViewHandler received session_replay', 'native bridge receive probe');
assertIncludes(nativeSource, 'isBaseSDKAndRUMReady()', 'native prerequisites');
assertIncludes(nativeSource, 'NSSelectorFromString("rumConfig")', 'RUM prerequisite');
assertIncludes(nativeSource, 'replaceBridgeWithoutSessionReplayCapability', 'bridge refresh');
assertIncludes(nativeSource, 'handler.enable(webView)', 'bridge enable');
assertIncludes(nativeSource, 'webView.evaluateJavaScript(bridgeSource)', 'current document repair');
assertIncludes(nativeSource, 'bridgeSource.contains("records")', 'records capability');
assertIncludes(nativeSource, '[DEBUG-SR-BRIDGE-7f81]', 'temporary bridge diagnostics');
assertIncludes(nativeSource, 'case "show":\n            config.touchPrivacy = FTTouchPrivacyLevel(rawValue: 0)!', 'touch privacy mapping');
assertIncludes(nativeSource, 'case "hide":\n            config.touchPrivacy = FTTouchPrivacyLevel(rawValue: 1)!', 'touch privacy mapping');

assertIncludes(viewTrackingSource, 'evalSessionReplayJS(js)', 'View Tracking API');
assertIncludes(viewTrackingSource, "capabilities.indexOf('records')", 'bridge readiness gate');
assertIncludes(viewTrackingSource, '__GC_UNI_SESSION_REPLAY_BOOTSTRAP_STATE__', 'in-document deduplication');
assertIncludes(bootstrapSource, "from '@/uni_modules/GC-UniSessionReplay'", 'example integration');
assert(!bootstrapSource.includes('GC-UniSessionReplay/js_sdk'));
assertIncludes(bootstrapSource, '// #ifdef APP', 'Session Replay APP import guard');
assertIncludes(bootstrapSource, "uni.getSystemInfoSync().platform === 'ios'", 'Session Replay iOS runtime guard');
assert(!bootstrapSource.includes('// #ifdef APP-IOS'));
assert(bootstrapSource.indexOf('rum.setConfig') < bootstrapSource.indexOf('GCUniSessionReplay.setConfig'));
assertIncludes(mainSource, "from './sdk-bootstrap.js'", 'early SDK bootstrap import');
assert(mainSource.indexOf('initializeGuanceSDK()') < mainSource.indexOf('gcViewTracking.startTracking()'));
assertIncludes(appSource, 'initializeGuanceSDK()', 'idempotent application launch bootstrap');
assertIncludes(mainSource, 'gcViewTracking.evalSessionReplayJS(jsCode)', 'Browser SDK integration');
assertIncludes(mainSource, 'sessionReplaySampleRate: 100', 'deterministic Browser Session Replay sampling');
assertIncludes(mainSource, '[DEBUG-SR-WEB-EVENT-4d9a]', 'Browser-to-native Replay event probe');

console.log('session replay feature checks passed');
