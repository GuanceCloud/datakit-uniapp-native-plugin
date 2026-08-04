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
assert.doesNotMatch(
  harmonyEntry,
  /^export function\b/m,
  'HarmonyOS must expose the SDK only through the shared class-based API'
);
assert.match(harmonyEntry, /let uniAppJSActionTrackingEnabled = true;/);
assert.match(
  harmonyEntry,
  /uniAppJSActionTrackingEnabled = params\.enableNativeUserAction;/
);
assert.match(harmonyEntry, /config\.setEnableTraceUserAction\(false\)/);
assert.doesNotMatch(
  harmonyEntry,
  /config\.setEnableTraceUserAction\(params\.enableNativeUserAction\)/
);
assert.doesNotMatch(harmonyEntry, /uniAppActionTrackingHandler/);
assert.match(harmonyEntry, /static isUniAppJSActionTrackingEnabled\(\): boolean/);
assert.match(harmonyEntry, /let uniAppJSViewTrackingEnabled = false;/);
assert.match(
  harmonyEntry,
  /uniAppJSViewTrackingEnabled = params\.enableNativeUserView === true;/
);
assert.match(harmonyEntry, /config\.setEnableTraceUserView\(false\)/);
assert.doesNotMatch(
  harmonyEntry,
  /config\.setEnableTraceUserView\(params\.enableNativeUserView\)/
);
assert.match(harmonyEntry, /static isUniAppJSViewTrackingEnabled\(\): boolean/);
assert.match(harmonyEntry, /return null;/);

const bridgeSource = read(
  'Hbuilder_Example/uni_modules/GC-UniPlugin/utssdk/bridge.uts'
);
assert.match(bridgeSource, /export function appendBridgeContextState\b/);
assert.doesNotMatch(bridgeSource, /export function appendBridgeContext\b/);

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
  'Hbuilder_Example/uni_modules/GC-UniSessionReplay/utssdk/app-ios/index.uts'
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
  'Hbuilder_Example/uni_modules/GC-UniPlugin/js_sdk/native.js'
);
assert.match(baseFacade, /mobileAgent,/);
assert.match(baseFacade, /GCDeviceMonitorType/);
assert.match(baseFacade, /from '@\/uni_modules\/GC-UniPlugin'/);
assert.doesNotMatch(baseFacade, /export const GCEnv/);

const appEntry = read('Hbuilder_Example/sdk-bootstrap.js');
assert.match(appEntry, /from '@\/uni_modules\/GC-UniPlugin'/);
for (const name of ['mobileAgent', 'rum', 'logger', 'tracer']) {
  assert.match(
    appEntry,
    new RegExp(`\\b${name}\\b`),
    `sdk-bootstrap.js must retain the root ${name} import pattern`
  );
}

const requestHelper = read(
  'Hbuilder_Example/uni_modules/GC-UniPlugin/js_sdk/Request/GCRequest.js'
);
assert.match(requestHelper, /from '@\/uni_modules\/GC-UniPlugin'/);
for (const name of ['rum', 'tracer']) {
  assert.match(
    requestHelper,
    new RegExp(`\\b${name}\\b`),
    `GCRequest.js must retain the root ${name} import pattern`
  );
}

const errorTracking = read(
  'Hbuilder_Example/uni_modules/GC-UniPlugin/js_sdk/Error/GCErrorTracking.js'
);
assert.match(errorTracking, /captureAppError\(error\)/);
assert.match(errorTracking, /type:\s*'uniapp_error'/);

const appLifecycleEntry = read('Hbuilder_Example/App.vue');
assert.match(appLifecycleEntry, /onError:\s*function\(error\)/);
assert.match(appLifecycleEntry, /gcErrorTracking\.captureAppError\(error\)/);

const jsSdkEntry = read('Hbuilder_Example/uni_modules/GC-UniPlugin/js_sdk/index.js');
assert.match(jsSdkEntry, /import\s*\{\s*gcActionTracking\s*\}/);
assert.match(jsSdkEntry, /#ifdef APP-HARMONY\s+gcActionTracking\.startTracking\(\);/);

const viewTracking = read(
  'Hbuilder_Example/uni_modules/GC-UniPlugin/js_sdk/View/GCViewTracking.js'
);
assert.match(viewTracking, /#ifdef APP-PLUS \|\| APP-HARMONY/);
assert.match(viewTracking, /isJSViewTrackingEnabled\(\)/);
assert.match(viewTracking, /isUniAppJSViewTrackingEnabled/);

const actionTracking = read(
  'Hbuilder_Example/uni_modules/GC-UniPlugin/js_sdk/Action/GCActionTracking.js'
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
assert.match(actionTracking, /isJSActionTrackingEnabled\(\)/);
assert.match(actionTracking, /isUniAppJSActionTrackingEnabled/);

const actionTrackingRuntime = actionTracking
  .replace(/import\s*\{[\s\S]*?\}\s*from\s*'@\/uni_modules\/GC-UniPlugin';/, '')
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
    listeners: { onClick: [{ value: eventHandler }] },
    childNodes: []
  }, {
    nodeId: 8,
    nodeName: 'NAVIGATOR',
    attributes: { url: '../tracing/tracing' },
    childNodes: [{ nodeValue: 'Network Link Tracing', childNodes: [] }]
  }, {
    nodeId: 9,
    listeners: { onClick: [{ value: internalHandler }] },
    childNodes: [{ nodeValue: 'TAB2', childNodes: [] }]
  }]
};
const { normalizeUniAppEventType, gcActionTracking } = new Function(
  'gcRum',
  'getCurrentPages',
  '__uniConfig',
  'uni',
  `${actionTrackingRuntime}\nreturn { normalizeUniAppEventType, gcActionTracking };`
)(
  { addAction: (action) => capturedActions.push(action) },
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
  actionName: 'bindUser',
  actionType: 'click',
  property: {
    action_source: 'uniapp_js_event',
    action_event_type: 'click',
    action_page_path: 'pages/index/index',
    action_node_id: '7',
    action_page_id: '42'
  }
}]);
gcActionTracking.handleServiceAPI({
  name: 'navigateTo',
  args: { url: '../tracing/tracing' }
}, 42);
assert.deepStrictEqual(capturedActions[1], {
  actionName: 'Network Link Tracing',
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
assert.deepStrictEqual(capturedActions[2], {
  actionName: 'TAB2',
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
gcActionTracking.handleServiceAPI({
  name: 'switchTab',
  args: { url: '/pages/routertest/tab2' }
}, 42);
assert.strictEqual(capturedActions.length, 3, 'A TabBar switch must only create one Action');
gcActionTracking.handleVdSync([[20, 9, { type: 'onClick' }]], 42);
assert.strictEqual(
  capturedActions.length,
  3,
  'Harmony internal __Common__ listeners must not be reported as Actions'
);
gcActionTracking.rum.isUniAppJSActionTrackingEnabled = () => false;
gcActionTracking.handleVdSync([[20, 7, { type: 'onClick' }]], 42);
assert.strictEqual(
  capturedActions.length,
  3,
  'enableNativeUserAction: false must disable the UniApp JS Action collector'
);

const replayInterface = read(
  'Hbuilder_Example/uni_modules/GC-UniSessionReplay/utssdk/interface.uts'
);
assert.doesNotMatch(replayInterface, /export const GCSessionReplay/);

assert.doesNotMatch(appEntry, /GC-UniSessionReplay\/js_sdk/);
assert.match(appEntry, /GCUniSessionReplay/);

console.log('UTS proxy export checks passed');
