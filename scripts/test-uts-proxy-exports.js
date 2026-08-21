const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assertStaticBridgeExports(relativePath, classes) {
  const source = read(relativePath);
  for (const [className, methods] of Object.entries(classes)) {
    assert.match(source, new RegExp(`export class ${className}\\b`));
    for (const method of methods) {
      assert.match(
        source,
        new RegExp(`static ${method}\\b`),
        `${relativePath} must expose ${className}.${method} as a UTS static method`
      );
    }
  }
}

function assertStaticConstantExports(relativePath, constants) {
  const source = read(relativePath);
  for (const [className, properties] of Object.entries(constants)) {
    assert.match(source, new RegExp(`export class ${className}\\b`));
    for (const property of properties) {
      assert.match(
        source,
        new RegExp(`static readonly ${property}\\b`),
        `${relativePath} must expose ${className}.${property} as a UTS static constant`
      );
    }
  }
}

const baseBridgeClasses = {
  mobileAgent: [
    'sdkConfig',
    'bindRUMUserData',
    'unbindRUMUserData',
    'appendGlobalContext',
    'appendRUMGlobalContext',
    'appendLogGlobalContext',
    'appendBridgeContext',
    'flushSyncData',
    'clearAllData',
    'shutDown',
    'manuallySetApplicationStart'
  ],
  rum: [
    'setConfig',
    'startAction',
    'addAction',
    'onCreateView',
    'startView',
    'stopView',
    'addError',
    'startResource',
    'stopResource',
    'addResource'
  ],
  logger: ['setConfig', 'logging'],
  tracer: ['setConfig', 'getTraceHeader']
};

const baseConstantClasses = {
  GCEnv: ['PROD', 'GRAY', 'PRE', 'COMMON', 'LOCAL'],
  GCDiscardStrategy: ['DISCARD', 'DISCARD_OLDEST'],
  GCTraceType: [
    'DDTRACE',
    'ZIPKIN_MULTI_HEADER',
    'ZIPKIN_SINGLE_HEADER',
    'TRACEPARENT',
    'SKYWALKING',
    'JAEGER'
  ],
  GCMonitorFrequency: ['NORMAL', 'FREQUENT', 'RARE'],
  GCLogStatus: ['INFO', 'DEBUG', 'WARNING', 'ERROR', 'CRITICAL', 'OK'],
  GCErrorMonitorType: ['BATTERY', 'MEMORY', 'CPU', 'ALL'],
  GCDeviceMonitorType: ['BATTERY', 'MEMORY', 'CPU', 'FPS', 'ALL']
};

for (const relativePath of [
  'Hbuilder_Example/uni_modules/GC-UniPlugin/utssdk/index.uts',
  'Hbuilder_Example/uni_modules/GC-UniPlugin/utssdk/app-ios/index.uts',
  'Hbuilder_Example/uni_modules/GC-UniPlugin/utssdk/app-android/index.uts',
  'Hbuilder_Example/uni_modules/GC-UniPlugin/utssdk/app-harmony/index.uts'
]) {
  assertStaticBridgeExports(relativePath, baseBridgeClasses);
  assertStaticConstantExports(relativePath, baseConstantClasses);
}

const harmonyEntry = read(
  'Hbuilder_Example/uni_modules/GC-UniPlugin/utssdk/app-harmony/index.uts'
);
const harmonyNativeEntry = read(
  'Hbuilder_Example/uni_modules/GC-UniPlugin/utssdk/app-harmony/GCUniPluginNative.ets'
);
assert.doesNotMatch(
  harmonyEntry,
  /^export function\b/m,
  'HarmonyOS must expose the SDK only through the shared class-based API'
);
assert.match(harmonyEntry, /from '\.\/GCUniPluginNative\.ets';/);
assert.match(harmonyNativeEntry, /export class GCUniPluginNative\b/);
assert.doesNotMatch(
  harmonyNativeEntry,
  /from ['"]\.\.\/(?:interface|bridge)\.uts['"]/,
  'ArkTS native code must not depend on UTS modules'
);
assert.match(harmonyEntry, /GCUniPluginNative\.setRumConfig\(params\)/);
assert.match(harmonyEntry, /GCUniPluginNative\.setLoggerConfig\(params\)/);
assert.match(harmonyEntry, /GCUniPluginNative\.setTraceConfig\(params\)/);
assert.match(harmonyEntry, /import \{ prepareAddResourceParams \} from '\.\/utils\/FTUniPluginUtils\.uts';/);
assert.match(harmonyEntry, /GCUniPluginNative\.addResource\(prepareAddResourceParams\(params\)\)/);
assert.match(harmonyNativeEntry, /let uniAppJSViewTrackingEnabled = true;/);
assert.doesNotMatch(harmonyNativeEntry, /uniAppJSActionTrackingEnabled/);
assert.match(
  harmonyNativeEntry,
  /config\.setEnableTraceUserAction\(rumParams\.enableNativeUserAction\)/
);
assert.match(
  harmonyNativeEntry,
  /if \(rumParams\.enableNativeUserView !== undefined && rumParams\.enableNativeUserView !== null\) \{\s*config\.setEnableTraceUserView\(rumParams\.enableNativeUserView\);\s*\}/
);
assert.doesNotMatch(harmonyEntry, /uniAppJSViewTrackingEnabled = params\.enableNativeUserView/);
assert.doesNotMatch(harmonyEntry, /uniAppActionTrackingHandler/);
assert.doesNotMatch(harmonyEntry, /isUniAppJSActionTrackingEnabled/);
assert.match(harmonyEntry, /static isUniAppJSViewTrackingEnabled\(\): boolean/);
assert.match(harmonyNativeEntry, /return null;/);

const bridgeSource = read(
  'Hbuilder_Example/uni_modules/GC-UniPlugin/utssdk/bridge.uts'
);
assert.match(bridgeSource, /export function appendBridgeContextState\b/);
assert.doesNotMatch(bridgeSource, /export function appendBridgeContext\b/);
assert.match(harmonyEntry, /import \{ GC_UTS_BRIDGE_VERSION \} from '\.\.\/bridge\.uts';/);
assert.match(
  harmonyEntry,
  /GCUniPluginNative\.setBridgeVersion\(GC_UTS_BRIDGE_VERSION\);/,
  'The UTS facade must supply its bridge version to the ArkTS proxy'
);
assert.match(
  harmonyNativeEntry,
  /static setBridgeVersion\(version: string\) \{\s+const sdkBridgeInfo: Record<string, string> = \{\};\s+sdkBridgeInfo\.uniapp = version;\s+bridgeContext\.set\('sdk_bridge_info', sdkBridgeInfo\);/,
  'The ArkTS proxy must retain taskpool-serializable sdk_bridge_info'
);
assert.match(
  harmonyNativeEntry,
  /const datawayUrl = firstHarmonyString\(configParams\.datawayUrl\);\s+const clientToken = firstHarmonyString\(configParams\.clientToken\);\s+const datakitUrl = firstHarmonyString\(configParams\.datakitUrl, configParams\.serverUrl, configParams\.metricsUrl\);/
);
assert.match(
  harmonyNativeEntry,
  /if \(datawayUrl != null && clientToken != null\) \{\s+config = FTSDKConfig\.builder\(datawayUrl, clientToken\);\s+\} else if \(datakitUrl != null\) \{\s+config = FTSDKConfig\.builder\(datakitUrl\);/
);
assert.match(harmonyNativeEntry, /firstHarmonyBoolean\(configParams\.debug, configParams\.enableSDKDebugLog\)/);
assert.match(harmonyNativeEntry, /firstHarmonyString\(configParams\.service, configParams\.serviceName\)/);
assert.doesNotMatch(
  harmonyNativeEntry,
  /\b(any|unknown)\b/,
  'ArkTS native code must not use banned any/unknown types'
);
assert.match(
  harmonyNativeEntry,
  /if \(context === undefined\) \{\s+console\.error\('\[GC-UniPlugin\] sdkConfig failed: Harmony application context is unavailable'\);\s+return;\s+\}\s+FTSDK\.install\(config, context\);/
);

for (const relativePath of [
  'Hbuilder_Example/uni_modules/GC-UniPlugin/utssdk/app-ios/index.uts',
  'Hbuilder_Example/uni_modules/GC-UniPlugin/utssdk/app-android/index.uts'
]) {
  const source = read(relativePath);
  assert.match(source, /appendBridgeContextState,/);
  assert.doesNotMatch(
    source,
    /appendBridgeContext\s+as\s+appendBridgeContextState/
  );
}

for (const relativePath of [
  'Hbuilder_Example/uni_modules/GC-UniSessionReplay/utssdk/index.uts',
  'Hbuilder_Example/uni_modules/GC-UniSessionReplay/utssdk/app-ios/index.uts',
  'Hbuilder_Example/uni_modules/GC-UniSessionReplay/utssdk/app-android/index.uts'
]) {
  assertStaticBridgeExports(relativePath, {
    GCUniSessionReplay: ['setConfig']
  });
  assertStaticConstantExports(relativePath, {
    GCSessionReplayTouchPrivacy: ['SHOW', 'HIDE'],
    GCSessionReplayTextAndInputPrivacy: [
      'MASK_SENSITIVE_INPUTS',
      'MASK_ALL_INPUTS',
      'MASK_ALL'
    ],
    GCSessionReplayImagePrivacy: [
      'MASK_NON_BUNDLED_ONLY',
      'MASK_ALL',
      'MASK_NONE'
    ]
  });
}

const replayFallbackSource = read(
  'Hbuilder_Example/uni_modules/GC-UniSessionReplay/utssdk/index.uts'
);
assert.doesNotMatch(
  replayFallbackSource,
  /\([^)]*\b_+\s*:/,
  'Session Replay UTS parameters must not use Kotlin-reserved underscore-only names'
);

const baseIOSNativeSource = read(
  'Hbuilder_Example/uni_modules/GC-UniPlugin/utssdk/app-ios/GCUniPluginNative.swift'
);
assert.match(
  baseIOSNativeSource,
  /registerSDKInternalLogCache\(\)\s*\n\s*let config: FTMobileConfig\?/
);
assert.match(
  baseIOSNativeSource,
  /registerInnerLogCache\(toLogsDirectory: nil, fileNamePrefix: nil\)/
);

const baseFacade = read(
  'Hbuilder_Example/uni_modules/GC-JSPlugin/js_sdk/native.js'
);
assert.match(baseFacade, /export const mobileAgent/);
assert.match(baseFacade, /GCDeviceMonitorType/);
assert.match(baseFacade, /installNativeBridge/);
assert.match(baseFacade, /GCUniPlugin-MobileAgent/);
assert.doesNotMatch(baseFacade, /from '@\/uni_modules\/GC-UniPlugin'/);
assert.match(baseFacade, /export const GCEnv/);

const appEntry = read('Hbuilder_Example/sdk-bootstrap.js');
const uniappBuildEntry = read('Hbuilder_Example/gc-build-entry.uniapp.js');
const wgtBuildEntry = read('Hbuilder_Example/gc-build-entry.wgt.js');
assert.doesNotMatch(appEntry, /GC-UniPlugin\/bridge\/install\.js/);
assert.match(
  uniappBuildEntry,
  /^import '@\/uni_modules\/GC-UniPlugin\/setup\.js'/
);
assert.match(wgtBuildEntry, /from '@\/uni_modules\/GC-JSPlugin'/);
assert.doesNotMatch(wgtBuildEntry, /GC-UniPlugin|sdk-bootstrap/);
assert.match(
  appEntry,
  /import\s*\{\s*logger,\s*mobileAgent,\s*rum,\s*tracer\s*\}\s*from '@\/uni_modules\/GC-UniPlugin'/
);
for (const name of ['mobileAgent', 'rum', 'logger', 'tracer']) {
  assert.match(
    appEntry,
    new RegExp(`\\b${name}\\b`),
    `sdk-bootstrap.js must retain the typed UTS ${name} import pattern`
  );
}

const tab3Page = read('Hbuilder_Example/pages/routertest/tab3.vue');
assert.match(tab3Page, /<!-- #ifdef APP-HARMONY -->/);
assert.match(tab3Page, /Trigger Harmony Native Crash/);
assert.match(tab3Page, /uni\.__createAppCrash\(\)/);
assert.match(tab3Page, /Trigger Harmony Long Task \(3s\)/);
assert.match(tab3Page, /Trigger Harmony Native ANR \(10s\)/);
assert.match(tab3Page, /blockHarmonyMainThread\(3000\)/);
assert.match(tab3Page, /blockHarmonyMainThread\(10000\)/);

const harmonyAnrTestHelper = read(
  'Hbuilder_Example/uni_modules/gc-test/utssdk/app-harmony/index.uts'
);
assert.match(harmonyAnrTestHelper, /export const blockHarmonyMainThread\b/);
assert.match(harmonyAnrTestHelper, /while \(Date\.now\(\) < endTime\)/);

assert.match(
  harmonyNativeEntry,
  /await manager\.startView\(params\.viewName, mergeRumBridgeContext\(params\.property\)\);/
);

const requestHelper = read(
  'Hbuilder_Example/uni_modules/GC-JSPlugin/js_sdk/Request/GCRequest.js'
);
assert.match(requestHelper, /from '\.\.\/native\.js'/);
assert.doesNotMatch(requestHelper, /@\/uni_modules\/GC-UniPlugin/);
for (const name of ['rum', 'tracer']) {
  assert.match(
    requestHelper,
    new RegExp(`\\b${name}\\b`),
    `GCRequest.js must retain the root ${name} import pattern`
  );
}

const errorTracking = read(
  'Hbuilder_Example/uni_modules/GC-JSPlugin/js_sdk/Error/GCErrorTracking.js'
);
assert.doesNotMatch(errorTracking, /FT_JS_PLUGIN_VERSION/);
const jsSdkEntry = read('Hbuilder_Example/uni_modules/GC-JSPlugin/js_sdk/index.js');
assert.match(jsSdkEntry, /export\s*\{\s*gcActionTracking\s*\}/);
assert.doesNotMatch(
  jsSdkEntry,
  /gcActionTracking\.startTracking\(/,
  'Importing the JS SDK entry must not start Action Tracking automatically'
);
const mainEntry = read('Hbuilder_Example/main.js');
assert.match(
  mainEntry,
  /#ifdef APP-HARMONY\s+gcActionTracking\.startTracking\(\);/,
  'The example app must opt in to Harmony Action Tracking explicitly'
);

const viewTracking = read(
  'Hbuilder_Example/uni_modules/GC-JSPlugin/js_sdk/View/GCViewTracking.js'
);
assert.doesNotMatch(viewTracking, /FT_JS_PLUGIN_VERSION/);
assert.match(viewTracking, /#ifdef APP-PLUS \|\| APP-HARMONY/);
assert.match(viewTracking, /isJSViewTrackingEnabled\(\)/);
assert.match(viewTracking, /isUniAppJSViewTrackingEnabled/);
assert.doesNotMatch(
  viewTracking,
  /(?:addLongTask|longTask|nativeFreezeDurationMs)/i,
  'The JS View lifecycle collector must never derive a Long Task from onLoad → onReady'
);
assert.doesNotMatch(viewTracking, /pendingViewLoadMap/);
assert.doesNotMatch(viewTracking, /plus\.runtime\.launchTime/);

const appSource = read('Hbuilder_Example/App.vue');
assert.doesNotMatch(appSource, /gcViewTracking\.handleApp(?:Show|Hide)\(\)/);
assert.match(viewTracking, /this\.watchAppLifecycle\(\)/);
const indexPage = read('Hbuilder_Example/pages/index/index.vue');
assert.doesNotMatch(indexPage, /gcPageMixin/);

const actionTracking = read(
  'Hbuilder_Example/uni_modules/GC-JSPlugin/js_sdk/Action/GCActionTracking.js'
);
assert.match(actionTracking, /const VD_SYNC_EVENT = 'vdSync'/);
assert.match(actionTracking, /const VDOM_EVENT_ACTION = 20/);
assert.match(actionTracking, /return globalThis\.UniServiceJSBridge \|\| null/);
assert.match(actionTracking, /bridge\.subscribe\(VD_SYNC_EVENT, this\.handleVdSync\)/);
assert.match(actionTracking, /bridge\.subscribe\(INVOKE_SERVICE_API_EVENT, this\.handleServiceAPI\)/);
assert.match(actionTracking, /scheduleStartTracking\(\)/);
assert.match(actionTracking, /action_source:\s*'uniapp_js_event'/);
assert.match(actionTracking, /isValidOperationName\(name\)/);
assert.match(actionTracking, /isInternalOperationName\(name\)/);
assert.match(actionTracking, /name\.includes\('__Common__'\)/);
assert.match(actionTracking, /hasInternalEventHandler\(node, eventType\)/);
assert.match(actionTracking, /installTabSwitchInterceptor\(\)/);
assert.match(actionTracking, /options\.from === 'tabBar'/);
assert.match(actionTracking, /trackTabSwitch\(url, pageId\)/);
assert.match(actionTracking, /getTabBarItem\(url\)/);
assert.match(actionTracking, /action_target_page_path/);
assert.doesNotMatch(actionTracking, /uni\.onAppShow\(/);
assert.doesNotMatch(actionTracking, /action_source:\s*'uniapp_js_lifecycle'/);
assert.doesNotMatch(actionTracking, /launch_(?:cold|hot)/);
assert.match(actionTracking, /getDefaultActionName\(/);
assert.match(actionTracking, /setActionTrackingHandler\(handler\)/);
assert.match(actionTracking, /resolveHandlerAction\(wrapper\)/);
assert.match(actionTracking, /#position:/);
assert.doesNotMatch(actionTracking, /isJSActionTrackingEnabled|isUniAppJSActionTrackingEnabled/);
assert.match(
  actionTracking,
  /this\.rum\.startAction\(\{\s*actionName,\s*actionType: eventType,/,
  'Harmony automatic Actions must use startAction so related Errors, Resources, and Long Tasks receive action_id'
);
assert.doesNotMatch(
  actionTracking,
  /this\.rum\.addAction\(/,
  'Harmony automatic Actions must not use immediate addAction records'
);

const actionTrackingRuntime = actionTracking
  .replace(/import\s*\{[\s\S]*?\}\s*from\s*'\.\.\/native\.js';/, '')
  .replace('export function normalizeUniAppEventType', 'function normalizeUniAppEventType')
  .replace('export const gcActionTracking', 'const gcActionTracking');
const capturedActions = [];
const interceptors = {};
const eventHandler = new Function('return ($event) => $options.bindUser()')();
const internalHandler = function () {};
Object.defineProperty(internalHandler, 'name', { value: '__Common__/' });
const pageNode = {
  nodeId: 0,
  childNodes: [{
    nodeId: 7,
    nodeName: 'BUTTON',
    attributes: { id: 'btn_login' },
    listeners: { onClick: [{ value: eventHandler }] },
    childNodes: [{ nodeValue: '登录', childNodes: [] }]
  }, {
    nodeId: 8,
    nodeName: 'NAVIGATOR',
    attributes: { url: '../tracing/tracing' },
    childNodes: [{ nodeValue: 'Network Link Tracing', childNodes: [] }]
  }, {
    nodeId: 9,
    listeners: { onClick: [{ value: internalHandler }] },
    childNodes: [{ nodeValue: 'TAB2', childNodes: [] }]
  }, {
    nodeId: 10,
    nodeName: 'SCROLL-VIEW',
    childNodes: [{
      nodeId: 11,
      nodeName: 'BUTTON',
      attributes: { id: 'btn_list_login' },
      listeners: { onClick: [{ value: eventHandler }] },
      childNodes: [{ nodeValue: '列表登录', childNodes: [] }]
    }]
  }]
};
const { normalizeUniAppEventType, gcActionTracking } = new Function(
  'gcRum',
  'getCurrentPages',
  '__uniConfig',
  'uni',
  `${actionTrackingRuntime}\nreturn { normalizeUniAppEventType, gcActionTracking };`
)(
  { startAction: (action) => capturedActions.push(action) },
  () => [{
    $page: { id: 42, fullPath: '1' },
    route: 'pages/index/index',
    __page_container__: pageNode
  }],
  {
    tabBar: {
      list: [{ pagePath: 'pages/routertest/tab2', text: 'TAB2' }]
    }
  },
  {
    addInterceptor: (name, interceptor) => {
      interceptors[name] = interceptor;
    }
  }
);
assert.strictEqual(normalizeUniAppEventType('onClick'), 'click');
assert.strictEqual(normalizeUniAppEventType('onTap'), 'tap');
assert.strictEqual(normalizeUniAppEventType('onLongpress'), 'longpress');
assert.strictEqual(normalizeUniAppEventType('onClickOnce'), 'click');
gcActionTracking.handleVdSync([[20, 7, { type: 'onClick' }]], 42);
assert.deepStrictEqual(capturedActions, [{
  actionName: 'Button/登录#btn_login',
  actionType: 'click',
  property: {
    action_source: 'uniapp_js_event',
    action_event_type: 'click',
    action_page_path: 'pages/index/index',
    action_node_id: '7',
    action_page_id: '42'
  }
}]);
gcActionTracking.handleVdSync([[20, 11, { type: 'onClick' }]], 42);
assert.deepStrictEqual(capturedActions[1], {
  actionName: 'Button/列表登录#btn_list_login#position:0',
  actionType: 'click',
  property: {
    action_source: 'uniapp_js_event',
    action_event_type: 'click',
    action_page_path: 'pages/index/index',
    action_position: '0',
    action_node_id: '11',
    action_page_id: '42'
  }
});
gcActionTracking.handleServiceAPI({
  name: 'navigateTo',
  args: { url: '../tracing/tracing' }
}, 42);
assert.deepStrictEqual(capturedActions[2], {
  actionName: 'Navigator/Network Link Tracing',
  actionType: 'click',
  property: {
    action_source: 'uniapp_js_navigator',
    action_event_type: 'click',
    action_page_path: 'pages/index/index',
    action_page_id: '42',
    action_route_api: 'navigateTo',
    action_route_url: '../tracing/tracing',
    action_node_id: '8'
  }
});
gcActionTracking.installTabSwitchInterceptor();
interceptors.switchTab.invoke({
  from: 'tabBar',
  url: '/pages/routertest/tab2'
});
assert.deepStrictEqual(capturedActions[3], {
  actionName: 'Tab/TAB2#position:0',
  actionType: 'click',
  property: {
    action_source: 'uniapp_js_tabbar',
    action_event_type: 'click',
    action_page_path: 'pages/routertest/tab2',
    action_page_id: '42',
    action_route_api: 'switchTab',
    action_route_url: '/pages/routertest/tab2',
    action_target_page_path: 'pages/routertest/tab2',
    action_source_page_path: 'pages/index/index',
    action_tab_text: 'TAB2',
    action_tab_index: '0'
  }
});
let actionHandlerWrapper = null;
gcActionTracking.setActionTrackingHandler({
  resolveHandlerAction: (wrapper) => {
    actionHandlerWrapper = wrapper;
    return {
      getActionName: () => 'custom_login_action',
      getProperty: () => ({ action_name_source: 'handler' })
    };
  }
});
gcActionTracking.handleVdSync([[20, 7, { type: 'onClick' }]], 42);
assert.strictEqual(actionHandlerWrapper.getSource().nodeName, 'BUTTON');
assert.deepStrictEqual(actionHandlerWrapper.getExtra(), {
  pageId: '42',
  pagePath: 'pages/index/index',
  event: { type: 'onClick' },
  property: null
});
assert.deepStrictEqual(capturedActions[4], {
  actionName: 'custom_login_action',
  actionType: 'click',
  property: {
    action_source: 'uniapp_js_event',
    action_event_type: 'click',
    action_page_path: 'pages/index/index',
    action_name_source: 'handler',
    action_node_id: '7',
    action_page_id: '42'
  }
});
gcActionTracking.setActionTrackingHandler(null);
gcActionTracking.handleServiceAPI({
  name: 'switchTab',
  args: { url: '/pages/routertest/tab2' }
}, 42);
assert.strictEqual(capturedActions.length, 5, 'A TabBar switch must only create one Action');
gcActionTracking.handleVdSync([[20, 9, { type: 'onClick' }]], 42);
assert.strictEqual(
  capturedActions.length,
  5,
  'Harmony internal __Common__ listeners must not be reported as Actions'
);
const replayInterface = read(
  'Hbuilder_Example/uni_modules/GC-UniSessionReplay/utssdk/interface.uts'
);
assert.doesNotMatch(replayInterface, /export const GCSessionReplay/);

assert.doesNotMatch(appEntry, /GC-UniSessionReplay\/js_sdk/);
assert.match(appEntry, /GCUniSessionReplay/);

console.log('UTS proxy export checks passed');
