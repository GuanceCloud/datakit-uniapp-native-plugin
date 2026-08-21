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
assert.strictEqual(
    baseAndroidConfig.dependencies.filter((dependency) =>
        /^com\.cloudcare\.ft\.mobile\.sdk\.tracker\.agent:ft-sdk:[0-9A-Za-z.-]+$/.test(dependency)
    ).length,
    1,
    'The core Android module must declare exactly one ft-sdk Maven dependency'
);
assert.strictEqual(
    baseAndroidConfig.dependencies.filter((dependency) =>
        /^com\.cloudcare\.ft\.mobile\.sdk\.tracker\.agent:ft-native:[0-9A-Za-z.-]+$/.test(dependency)
    ).length,
    1,
    'The core Android module must declare exactly one ft-native Maven dependency'
);
assert.strictEqual(
    replayAndroidConfig.dependencies.filter((dependency) =>
        /^com\.cloudcare\.ft\.mobile\.sdk\.tracker\.agent:ft-session-replay:[0-9A-Za-z.-]+$/.test(dependency)
    ).length,
    1,
    'The Session Replay Android module must declare exactly one Maven dependency'
);
assert(!replayAndroidConfig.dependencies.some((dependency) =>
    dependency.startsWith('com.cloudcare.ft.mobile.sdk.tracker.agent:ft-sdk:')
));
assert(baseAndroidConfig.project.plugins.includes('ft-plugin'));
assert.strictEqual(
    baseAndroidConfig.project.dependencies.filter((dependency) =>
        /(?:ft-plugin|tracker\.plugin|plugin\.gradle\.plugin)/.test(dependency)
    ).length,
    1,
    'The core Android module must declare exactly one FT Gradle plugin dependency'
);
assert.deepStrictEqual(
    replayAndroidConfig.project.plugins,
    [],
    'Session Replay must reuse the core module Gradle plugin instead of applying it twice'
);
assert.deepStrictEqual(
    replayAndroidConfig.project.dependencies,
    [],
    'Session Replay must not declare a duplicate FT Gradle plugin dependency'
);

for (const relativePath of [
    'Hbuilder_Example/uni_modules/GC-UniPlugin/utssdk/app-android/libs',
    'Hbuilder_Example/uni_modules/GC-UniSessionReplay/utssdk/app-android/libs'
]) {
    const absolutePath = path.join(root, relativePath);
    const localSDKArtifacts = fs.existsSync(absolutePath)
        ? fs.readdirSync(absolutePath).filter((name) => /^ft-(?:sdk|native|session-replay)-.*\.aar$/.test(name))
        : [];
    assert.deepStrictEqual(
        localSDKArtifacts,
        [],
        `${relativePath} must not bundle Android SDK AARs; dependencies resolve from Maven`
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
    'Hbuilder_Example/uni_modules/GC-JSPlugin/js_sdk/View/GCViewTracking.js'
);
const appSource = read('Hbuilder_Example/App.vue');
const bootstrapSource = read('Hbuilder_Example/sdk-bootstrap.js');
const uniappBuildEntrySource = read('Hbuilder_Example/gc-build-entry.uniapp.js');
const wgtBuildEntrySource = read('Hbuilder_Example/gc-build-entry.wgt.js');
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
assertIncludes(viewTrackingSource, 'evalSessionReplayJS(js)', 'View Tracking API');
assertIncludes(viewTrackingSource, 'webView.evalJS(this.sessionReplayJS)', 'page WebView Browser SDK injection');
assertIncludes(viewTrackingSource, 'sessionReplayInjectedWebViews', 'per-WebView Browser SDK injection guard');
assert(!viewTrackingSource.includes('buildSessionReplayInjectionJS'));
assert(!viewTrackingSource.includes('hasRecordsBridge'));
assert(!viewTrackingSource.includes('Native records bridge is unavailable'));
assertIncludes(bootstrapSource, "from '@/uni_modules/GC-UniSessionReplay'", 'example integration');
assert(!bootstrapSource.includes('GC-UniSessionReplay/js_sdk'));
assert.match(
    bootstrapSource,
    /\/\/ #ifdef APP-PLUS\s+import \{[\s\S]*?from '@\/uni_modules\/GC-UniSessionReplay'\s+\/\/ #endif/,
    'Session Replay import must use the traditional uni-app App condition'
);
assert.match(
    bootstrapSource,
    /\/\/ #ifdef APP-PLUS\s+GCUniSessionReplay\.setConfig\([\s\S]*?\/\/ #endif/,
    'Session Replay configuration must use the traditional uni-app App condition'
);
assertIncludes(
    bootstrapSource,
    'allowWebViewHost: null',
    'UniApp file WebViews must not be excluded from the native RUM bridge'
);
assert(!bootstrapSource.includes("uni.getSystemInfoSync().platform === 'ios'"));
assert.doesNotMatch(
    bootstrapSource,
    /\/\/ #ifn?def APP-(?:IOS|ANDROID)/,
    'traditional uni-app JavaScript must not use UTS-only APP-IOS/APP-ANDROID conditions'
);
assert.match(
    mainSource,
    /\/\/ #ifdef APP-PLUS[\s\S]*?const jsCode = `[\s\S]*?gcViewTracking\.evalSessionReplayJS\(jsCode\);\s*\/\/ #endif/,
    'Browser Session Replay must support Android and iOS while excluding Harmony'
);
assert(!mainSource.includes("import * as SDKConst from '@/utils.js'"));
assert(!mainSource.includes('browserRumApplicationId'));
assert(!mainSource.includes('applicationId:'));
assert.doesNotMatch(
    mainSource,
    /\/\/ #ifn?def APP-(?:IOS|ANDROID)/,
    'traditional uni-app JavaScript must not use UTS-only APP-IOS/APP-ANDROID conditions'
);
assert(bootstrapSource.indexOf('rum.setConfig') < bootstrapSource.indexOf('GCUniSessionReplay.setConfig'));
assertIncludes(mainSource, "from './gc-build-entry.js'", 'selected SDK build entry import');
assertIncludes(uniappBuildEntrySource, "from './sdk-bootstrap.js'", 'normal UniApp SDK bootstrap import');
assert(!wgtBuildEntrySource.includes('sdk-bootstrap'), 'WGT must not import the SDK bootstrap');
assert(!wgtBuildEntrySource.includes('GC-UniSessionReplay'), 'WGT must not import Session Replay UTS');
assert(mainSource.indexOf('initializeGuanceSDK()') < mainSource.indexOf('gcViewTracking.startTracking()'));
assertIncludes(mainSource, 'gcErrorTracking.startTracking()', 'shared JS Error tracking startup');
assert(!appSource.includes('initializeGuanceSDK()'), 'SDK bootstrap must run only from the app entry point');
assertIncludes(mainSource, 'gcViewTracking.evalSessionReplayJS(jsCode)', 'Browser SDK integration');
assert(!mainSource.includes('[DEBUG-SR-WEB-EVENT-4d9a]'));

console.log('session replay feature checks passed');
