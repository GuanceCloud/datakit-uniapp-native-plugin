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
    'Hbuilder_Example/uni_modules/GC-UniPlugin/utssdk/app-ios/Frameworks/GuanceSDK.xcframework/Info.plist',
    'Hbuilder_Example/uni_modules/GC-UniSessionReplay/utssdk/app-ios/Frameworks/GuanceSessionReplay.xcframework/Info.plist'
]) {
    assert(fs.existsSync(path.join(root, relativePath)), `${relativePath} must exist`);
}
assert.strictEqual(
    fs.existsSync(path.join(
        root,
        'Hbuilder_Example/uni_modules/GC-UniSessionReplay/utssdk/app-ios/Frameworks/GuanceSDK.xcframework'
    )),
    false,
    'Session Replay must use the core module GuanceSDK dependency without bundling a second copy'
);
assert.strictEqual(
    fs.existsSync(path.join(
        root,
        'Hbuilder_Example/uni_modules/GC-UniSessionReplay/utssdk/app-ios/Frameworks/GuanceSDK-Dynamic.xcframework'
    )),
    false,
    'Session Replay must not bundle the legacy-named Core XCFramework either'
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
const hostReplayNativeSource = read(
    'HybridHostExample-iOS/HBuilder-uniPluginDemo/GuanceUniAppHostBridge/Sources/SessionReplay/GCSessionReplayNative.swift'
);
const baseNativeSource = read(
    'Hbuilder_Example/uni_modules/GC-UniPlugin/utssdk/app-ios/GCUniPluginNative.swift'
);
const baseIOSIndexSource = read(
    'Hbuilder_Example/uni_modules/GC-UniPlugin/utssdk/app-ios/index.uts'
);
const baseAndroidIndexSource = read(
    'Hbuilder_Example/uni_modules/GC-UniPlugin/utssdk/app-android/index.uts'
);
const viewTrackingSource = read(
    'Hbuilder_Example/uni_modules/GC-UniPlugin/js_sdk/View/GCViewTracking.js'
);
const appSource = read('Hbuilder_Example/App.vue');
const bootstrapSource = read('Hbuilder_Example/sdk-bootstrap.js');
const mainSource = read('Hbuilder_Example/main.js');

assertIncludes(interfaceSource, 'setConfig(params: GCSessionReplayConfig): void', 'UTS API contract');
assertIncludes(iosIndexSource, 'GCSessionReplayNative.setConfig', 'iOS UTS native call');
assert(!iosIndexSource.includes('return GCSessionReplayNative.setConfig'));
assert(!androidIndexSource.includes('\t\treturn initialized'));
assertIncludes(iosIndexSource, 'implements UTSiOSHookProxy', 'iOS hook');
assertIncludes(iosIndexSource, 'GCSessionReplayNative.installWebViewHook()', 'iOS hook');
assertIncludes(androidIndexSource, "from 'gc.unisessionreplay.android'", 'Android native import');
assertIncludes(androidIndexSource, '[FTLog] GC-UniSessionReplay initialization requested', 'Android UTS initialization log');
assertIncludes(androidIndexSource, '[FTLog] GC-UniSessionReplay initialized successfully', 'Android UTS success log');
assertIncludes(androidIndexSource, '[FTLog] GC-UniSessionReplay initialization failed', 'Android UTS failure log');
assertIncludes(androidIndexSource, 'application: android.app.Application', 'Android Hook Application type');
assertIncludes(androidIndexSource, 'GCSessionReplayNative.setConfig', 'Android Session Replay API');
assertIncludes(androidIndexSource, 'implements UTSAndroidHookProxy', 'Android early hook');
assertIncludes(androidIndexSource, 'GCSessionReplayNative.enableFirstViewBridge()', 'Android early hook');
assertIncludes(androidNativeSource, '"com.ft.sdk.FTUniAppWebViewBridge"', 'Android Native SDK lazy bridge activation');
assertIncludes(androidNativeSource, 'fun setConfig(json: String?): Boolean', 'Android native initialization result');
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
    'val initialized = invokeSafely("initialize Session Replay") {\n            Class.forName(SDK_CLASS)\n                .getMethod("initSessionReplayConfig", Any::class.java)\n                .invoke(null, config)\n        }\n        if (initialized) {\n            disableFirstViewBridge()\n        }\n        return initialized',
    'Android lazy bridge shutdown ordering'
);
assertIncludes(nativeSource, 'private static let installHookOnce', 'native hook');
assertIncludes(baseNativeSource, 'import GuanceSDK', 'base dynamic framework import');
assert(!baseNativeSource.includes('import FTMobileSDK'));
assertIncludes(baseNativeSource, '@objc public static func sdkConfig(_ json: String?) -> Bool', 'Mobile SDK initialization result');
assertIncludes(baseNativeSource, '@objc public static func setRumConfig(_ json: String?) -> Bool', 'RUM initialization result');
assertIncludes(baseNativeSource, 'console.log(message)', 'iOS native console log');
assertIncludes(baseNativeSource, 'console.error(message)', 'iOS native console error');
assertIncludes(baseNativeSource, '[FTLog] GC-UniPlugin Mobile SDK initialized successfully', 'iOS Mobile SDK success log');
assertIncludes(baseNativeSource, '[FTLog] GC-UniPlugin RUM initialized successfully', 'iOS RUM success log');
for (const source of [baseAndroidIndexSource]) {
    assertIncludes(source, '[FTLog] GC-UniPlugin Mobile SDK initialization requested', 'UTS Mobile SDK initialization log');
    assertIncludes(source, '[FTLog] GC-UniPlugin Mobile SDK initialized successfully', 'UTS Mobile SDK success log');
    assertIncludes(source, '[FTLog] GC-UniPlugin Mobile SDK initialization failed', 'UTS Mobile SDK failure log');
    assertIncludes(source, '[FTLog] GC-UniPlugin RUM initialization requested', 'UTS RUM initialization log');
    assertIncludes(source, '[FTLog] GC-UniPlugin RUM initialized successfully', 'UTS RUM success log');
    assertIncludes(source, '[FTLog] GC-UniPlugin RUM initialization failed', 'UTS RUM failure log');
}
assertIncludes(nativeSource, '#if canImport(GuanceSDK)\nimport GuanceSDK\n#endif', 'UTS Core SDK compatibility import');
assertIncludes(nativeSource, '#if canImport(GuanceSessionReplay)\nimport GuanceSessionReplay\n#endif', 'UTS Session Replay framework import');
assertIncludes(nativeSource, 'import GuanceSessionReplay', 'Session Replay dynamic framework import');
assert(!nativeSource.includes('import FTMobileSDK'));
assert(!nativeSource.includes('import FTSessionReplay'));
assertIncludes(nativeSource, '#selector(WKWebView.load(_:))', 'native hook');
assertIncludes(nativeSource, '#selector(WKWebView.loadHTMLString(_:baseURL:))', 'native hook');
assertIncludes(nativeSource, '#selector(WKWebView.loadFileURL(_:allowingReadAccessTo:))', 'native hook');
assertIncludes(nativeSource, 'WebView hook installation requested', 'native hook diagnostics');
assertIncludes(nativeSource, 'WebView hooks installed successfully', 'native hook diagnostics');
assertIncludes(nativeSource, 'WebView load captured:', 'native hook diagnostics');
assertIncludes(nativeSource, 'preparing WebView bridge:', 'native hook diagnostics');
assertIncludes(nativeSource, 'records bridge injected into current WebView document', 'native hook diagnostics');
assertIncludes(nativeSource, 'NSHashTable<WKWebView>.weakObjects()', 'WebView capture');
assertIncludes(nativeSource, 'webView.isInspectable = true', 'Safari Web Inspector support');
assertIncludes(nativeSource, 'path.hasSuffix("/__uniappview.html")', 'UniApp WebView filter');
assertIncludes(nativeSource, '"__UniViewStartTime__"', 'UniApp WebView filter');
assertIncludes(nativeSource, 'let activeBeforeStart = isNativeSessionReplayActive()', 'duplicate start guard');
assertIncludes(nativeSource, '@objc public static func setConfig(_ json: String?) -> Bool', 'iOS native initialization result');
assertIncludes(nativeSource, 'var initialized = false', 'iOS native initialization result');
assertIncludes(nativeSource, 'return initialized', 'iOS native initialization result');
assertIncludes(nativeSource, 'console.log(message)', 'iOS native console log');
assertIncludes(nativeSource, 'console.error(message)', 'iOS native console error');
assertIncludes(
    nativeSource,
    'private static func logInfo(_ message: String) {\n#if DEBUG',
    'iOS info diagnostics debug guard'
);
assertIncludes(nativeSource, '[FTLog] GC-UniSessionReplay initialized successfully', 'iOS native success log');
assertIncludes(nativeSource, 'initialization failed: Mobile SDK or RUM is not ready', 'iOS native prerequisite error log');
assertIncludes(nativeSource, 'initialization failed: native service was not registered', 'iOS native service error log');
assertIncludes(nativeSource, 'if !activeBeforeStart {', 'duplicate start guard');
assertIncludes(nativeSource, 'objc_getProtocol("FTSRWebTrackingProtocol")', 'duplicate start guard');
assertIncludes(nativeSource, 'isBaseSDKAndRUMReady()', 'native prerequisites');
assertIncludes(nativeSource, 'NSClassFromString("FTMobileAgent")', 'native prerequisite state owner');
assert(!nativeSource.includes('NSClassFromString("FTSDKAgent")'));
assertIncludes(nativeSource, 'NSSelectorFromString("rumConfig")', 'RUM prerequisite');
assertIncludes(nativeSource, 'replaceBridgeWithoutSessionReplayCapability', 'bridge refresh');
assertIncludes(nativeSource, 'NSClassFromString("FTWKWebViewHandler")', 'runtime Core WebView handler lookup');
assertIncludes(nativeSource, 'NSSelectorFromString("enableWebView:")', 'runtime Core WebView bridge enable');
assert(!nativeSource.includes('FTWKWebViewHandler.sharedInstance()'));
assert(!nativeSource.includes('handler: FTWKWebViewHandler'));
assertIncludes(nativeSource, 'webView.evaluateJavaScript(bridgeSource)', 'current document repair');
assertIncludes(nativeSource, 'bridgeSource.contains("records")', 'records capability');
assert(!nativeSource.includes('[DEBUG-SR-BRIDGE-7f81]'));
assert(!nativeSource.includes('FTRumSessionReplay.startWithSessionReplayConfig entered'));
assert(!nativeSource.includes('FTWKWebViewHandler received session_replay'));
assertIncludes(nativeSource, 'case "show":\n            config.touchPrivacy = FTTouchPrivacyLevel(rawValue: 0)!', 'touch privacy mapping');
assertIncludes(nativeSource, 'case "hide":\n            config.touchPrivacy = FTTouchPrivacyLevel(rawValue: 1)!', 'touch privacy mapping');
assertIncludes(hostReplayNativeSource, '#if GUANCE_UNI_COCOAPODS_SESSION_REPLAY\nimport GuanceSDK', 'HostBridge CocoaPods umbrella module import');
assertIncludes(hostReplayNativeSource, 'GC-UniSessionReplay requires GuanceSessionReplay', 'HostBridge dependency guard');
assertIncludes(hostReplayNativeSource, 'NSClassFromString("FTWKWebViewHandler")', 'HostBridge runtime Core WebView handler lookup');
assertIncludes(hostReplayNativeSource, '@objc public static func setConfig(_ json: String?) -> Bool', 'HostBridge initialization result');
assertIncludes(hostReplayNativeSource, 'WebView load captured:', 'HostBridge hook diagnostics');
assertIncludes(
    hostReplayNativeSource,
    'private static func logInfo(_ message: String) {\n#if DEBUG',
    'HostBridge info diagnostics debug guard'
);

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
