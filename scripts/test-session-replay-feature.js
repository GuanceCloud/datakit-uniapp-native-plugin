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
const replayAndroidConfig = readJSON(
    'Hbuilder_Example/uni_modules/GC-UniSessionReplay/utssdk/app-android/config.json'
);
const baseAndroidConfig = readJSON(
    'Hbuilder_Example/uni_modules/GC-UniPlugin/utssdk/app-android/config.json'
);

assert.strictEqual(replayModule.version, baseModule.version);
assert(replayModule.uni_modules.dependencies.includes('GC-UniPlugin'));
assert.strictEqual(
    replayModule.uni_modules.platforms.client['uni-app'].app.ios,
    'u'
);
assert.strictEqual(
    replayModule.uni_modules.platforms.client['uni-app'].app.android,
    'u'
);
assert.strictEqual(
    replayModule.uni_modules.platforms.client['uni-app-x'].app.android,
    'u'
);

assert.strictEqual(baseIOSConfig['dependencies-pods'], undefined);
assert.strictEqual(replayIOSConfig['dependencies-pods'], undefined);
assert.strictEqual(baseIOSConfig.deploymentTarget, '12.0');
assert.strictEqual(replayIOSConfig.deploymentTarget, '12.0');
assert.strictEqual(replayAndroidConfig.minSdkVersion, 24);
assert.strictEqual(baseAndroidConfig.minSdkVersion, 24);
assert(baseAndroidConfig.dependencies.includes(
    'com.cloudcare.ft.mobile.sdk.tracker.agent:ft-sdk:1.7.4'
));
assert(baseAndroidConfig.dependencies.includes(
    'com.cloudcare.ft.mobile.sdk.tracker.agent:ft-native:1.1.3'
));
assert(replayAndroidConfig.dependencies.includes(
    'com.cloudcare.ft.mobile.sdk.tracker.agent:ft-session-replay:0.1.7'
));
assert(!replayAndroidConfig.dependencies.some((dependency) =>
    dependency.startsWith('com.cloudcare.ft.mobile.sdk.tracker.agent:ft-sdk:')
));
assert(baseAndroidConfig.project.plugins.includes('ft-plugin'));
assert(baseAndroidConfig.project.dependencies.includes(
    'com.cloudcare.ft.mobile.sdk.tracker.plugin:ft-plugin:1.3.7'
));
assert(replayAndroidConfig.project.plugins.includes('ft-plugin'));
assert(replayAndroidConfig.project.dependencies.includes(
    'com.cloudcare.ft.mobile.sdk.tracker.plugin:ft-plugin:1.3.7'
));

for (const relativePath of [
    'Hbuilder_Example/uni_modules/GC-UniPlugin/utssdk/app-android/libs/ft-sdk-1.7.4-uniapp-local.aar',
    'Hbuilder_Example/uni_modules/GC-UniPlugin/utssdk/app-android/libs/ft-native-1.1.3.aar',
    'Hbuilder_Example/uni_modules/GC-UniSessionReplay/utssdk/app-android/libs/ft-session-replay-0.1.7.aar'
]) {
    const absolutePath = path.join(root, relativePath);
    assert.strictEqual(
        fs.existsSync(absolutePath),
        false,
        `${relativePath} must not exist; Android UTS resolves this dependency from Maven`
    );
}

for (const relativePath of [
    'Hbuilder_Example/uni_modules/GC-UniPlugin/utssdk/app-ios/Frameworks/GuanceSDK-Dynamic.xcframework/Info.plist',
    'Hbuilder_Example/uni_modules/GC-UniSessionReplay/utssdk/app-ios/Frameworks/GuanceSessionReplay-Dynamic.xcframework/Info.plist'
]) {
    assert(fs.existsSync(path.join(root, relativePath)), `${relativePath} must exist`);
}
assert.strictEqual(
    fs.existsSync(path.join(
        root,
        'Hbuilder_Example/uni_modules/GC-UniSessionReplay/utssdk/app-ios/Frameworks/GuanceSDK-Dynamic.xcframework'
    )),
    false,
    'Session Replay must use the core module GuanceSDK dependency without bundling a second copy'
);

const interfaceSource = read(
    'Hbuilder_Example/uni_modules/GC-UniSessionReplay/utssdk/interface.uts'
);
const iosIndexSource = read(
    'Hbuilder_Example/uni_modules/GC-UniSessionReplay/utssdk/app-ios/index.uts'
);
const androidIndexSource = read(
    'Hbuilder_Example/uni_modules/GC-UniSessionReplay/utssdk/app-android/index.uts'
);
const androidNativeSource = read(
    'Hbuilder_Example/uni_modules/GC-UniSessionReplay/utssdk/app-android/GCSessionReplayNative.kt'
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
assertIncludes(androidIndexSource, "from 'gc.unisessionreplay.android'", 'Android native import');
assertIncludes(androidIndexSource, 'application: android.app.Application', 'Android Hook Application type');
assertIncludes(androidIndexSource, 'GCSessionReplayNative.setConfig', 'Android Session Replay API');
assertIncludes(androidIndexSource, 'implements UTSAndroidHookProxy', 'Android early hook');
assertIncludes(androidIndexSource, 'GCSessionReplayNative.enableFirstViewBridge()', 'Android early hook');
assertIncludes(androidNativeSource, '"com.ft.sdk.FTUniAppWebViewBridge"', 'Android Native SDK lazy bridge activation');
assertIncludes(androidNativeSource, 'Class.forName(CORE_BRIDGE_CLASS)', 'Android bridge reflection');
assertIncludes(androidNativeSource, 'getMethod(DISABLE_FIRST_VIEW_BRIDGE_METHOD)', 'Android lazy bridge shutdown API');
assertIncludes(androidNativeSource, 'disableFirstViewBridge()', 'Android lazy bridge shutdown');
assertIncludes(androidNativeSource, 'Class.forName(SDK_CLASS)', 'Android Native SDK invocation');
assertIncludes(androidNativeSource, 'getMethod("initSessionReplayConfig", Any::class.java)', 'Android Native SDK invocation');
assertIncludes(androidNativeSource, 'Class.forName(CONFIG_CLASS).getConstructor().newInstance()', 'Android Session Replay configuration');
assertIncludes(androidNativeSource, 'percentage.coerceIn(0f, 100f) / 100f', 'Android percentage conversion');
assertIncludes(androidNativeSource, '"masknonbundledonly" -> "MASK_LARGE_ONLY"', 'Android image privacy mapping');
assertIncludes(androidNativeSource, '"masksensitiveinputs" -> "MASK_SENSITIVE_INPUTS"', 'Android text privacy mapping');
assertIncludes(androidNativeSource, '"show" -> "SHOW"', 'Android touch privacy mapping');
assert(!androidNativeSource.includes('import com.ft.sdk.'));
assert(!androidNativeSource.includes('enableSwiftUI'));
assertIncludes(
    androidNativeSource,
    'initialize Session Replay") {\n            Class.forName(SDK_CLASS)\n                .getMethod("initSessionReplayConfig", Any::class.java)\n                .invoke(null, config)\n        }) {\n            disableFirstViewBridge()',
    'Android lazy bridge shutdown ordering'
);
assertIncludes(nativeSource, 'private static let installHookOnce', 'native hook');
assertIncludes(baseNativeSource, 'import GuanceSDK', 'base dynamic framework import');
assert(!baseNativeSource.includes('import FTMobileSDK'));
assertIncludes(nativeSource, 'import GuanceSDK', 'base dynamic framework import');
assertIncludes(nativeSource, 'import GuanceSessionReplay', 'Session Replay dynamic framework import');
assertIncludes(nativeSource, '#elseif GUANCE_UNI_COCOAPODS_SESSION_REPLAY', 'CocoaPods Session Replay module compatibility');
assertIncludes(nativeSource, 'GC-UniSessionReplay requires GuanceSessionReplay', 'Session Replay dependency guard');
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
assertIncludes(nativeSource, 'isBaseSDKAndRUMReady()', 'native prerequisites');
assertIncludes(nativeSource, 'NSClassFromString("FTSDKAgent")', 'native prerequisite state owner');
assert(!nativeSource.includes('NSClassFromString("FTMobileAgent")'));
assertIncludes(nativeSource, 'NSSelectorFromString("rumConfig")', 'RUM prerequisite');
assertIncludes(nativeSource, 'replaceBridgeWithoutSessionReplayCapability', 'bridge refresh');
assertIncludes(nativeSource, 'handler.enable(webView)', 'bridge enable');
assertIncludes(nativeSource, 'webView.evaluateJavaScript(bridgeSource)', 'current document repair');
assertIncludes(nativeSource, 'bridgeSource.contains("records")', 'records capability');
assert(!nativeSource.includes('[DEBUG-SR-BRIDGE-7f81]'));
assert(!nativeSource.includes('FTRumSessionReplay.startWithSessionReplayConfig entered'));
assert(!nativeSource.includes('FTWKWebViewHandler received session_replay'));
assertIncludes(nativeSource, 'case "show":\n            config.touchPrivacy = FTTouchPrivacyLevel(rawValue: 0)!', 'touch privacy mapping');
assertIncludes(nativeSource, 'case "hide":\n            config.touchPrivacy = FTTouchPrivacyLevel(rawValue: 1)!', 'touch privacy mapping');

assertIncludes(viewTrackingSource, 'evalSessionReplayJS(js)', 'View Tracking API');
assertIncludes(viewTrackingSource, 'webView.evalJS(this.sessionReplayJS)', 'page WebView Browser SDK injection');
assertIncludes(viewTrackingSource, 'sessionReplayInjectedWebViews', 'per-WebView Browser SDK injection guard');
assert(!viewTrackingSource.includes('buildSessionReplayInjectionJS'));
assert(!viewTrackingSource.includes('hasRecordsBridge'));
assert(!viewTrackingSource.includes('Native records bridge is unavailable'));
assertIncludes(bootstrapSource, "from '@/uni_modules/GC-UniSessionReplay'", 'example integration');
assert(!bootstrapSource.includes('GC-UniSessionReplay/js_sdk'));
assertIncludes(bootstrapSource, 'GCUniSessionReplay.setConfig', 'Session Replay cross-platform configuration');
assert(!bootstrapSource.includes('// #ifdef APP'));
assert(!bootstrapSource.includes("uni.getSystemInfoSync().platform === 'ios'"));
assert(!bootstrapSource.includes('// #ifdef APP-IOS'));
assert(bootstrapSource.indexOf('rum.setConfig') < bootstrapSource.indexOf('GCUniSessionReplay.setConfig'));
assertIncludes(mainSource, "from './sdk-bootstrap.js'", 'early SDK bootstrap import');
assert(mainSource.indexOf('initializeGuanceSDK()') < mainSource.indexOf('gcViewTracking.startTracking()'));
assertIncludes(appSource, 'initializeGuanceSDK()', 'idempotent application launch bootstrap');
assertIncludes(mainSource, 'gcViewTracking.evalSessionReplayJS(jsCode)', 'Browser SDK integration');
assertIncludes(mainSource, 'sessionReplaySampleRate: 100', 'deterministic Browser Session Replay sampling');
assert(!mainSource.includes('[DEBUG-SR-WEB-EVENT-4d9a]'));

console.log('session replay feature checks passed');
