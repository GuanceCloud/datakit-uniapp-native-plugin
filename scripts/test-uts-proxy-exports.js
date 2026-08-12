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
assert.match(harmonyEntry, /let uniAppJSViewTrackingEnabled = true;/);
assert.match(
  harmonyEntry,
  /config\.setEnableTraceUserAction\(params\.enableNativeUserAction\)/
);
assert.match(
  harmonyEntry,
  /if \(params\.enableNativeUserView !== undefined && params\.enableNativeUserView !== null\) \{\s*config\.setEnableTraceUserView\(params\.enableNativeUserView\);\s*\}/
);
assert.doesNotMatch(harmonyEntry, /uniAppJSActionTrackingEnabled = params\.enableNativeUserAction;/);
assert.doesNotMatch(harmonyEntry, /uniAppJSViewTrackingEnabled = params\.enableNativeUserView/);
assert.doesNotMatch(harmonyEntry, /uniAppActionTrackingHandler/);
assert.match(harmonyEntry, /static isUniAppJSActionTrackingEnabled\(\): boolean/);
assert.match(harmonyEntry, /static isUniAppJSViewTrackingEnabled\(\): boolean/);
assert.match(harmonyEntry, /return null;/);

const bridgeSource = read(
  'Hbuilder_Example/uni_modules/GC-UniPlugin/utssdk/bridge.uts'
);
assert.match(bridgeSource, /export function appendBridgeContextState\b/);
assert.doesNotMatch(bridgeSource, /export function appendBridgeContext\b/);
assert.match(harmonyEntry, /import \{ GC_UTS_BRIDGE_VERSION \} from '\.\.\/bridge\.uts';/);
assert.match(
  harmonyEntry,
  /const sdkBridgeInfo: Record<string, any> = \{\};\s+sdkBridgeInfo\.uniapp = GC_UTS_BRIDGE_VERSION;\s+bridgeContext\.set\('sdk_bridge_info', sdkBridgeInfo\);/,
  'HarmonyOS must report sdk_bridge_info as a taskpool-serializable JSON object'
);
assert.doesNotMatch(harmonyEntry, /createSdkBridgeInfo\(\)/);
assert.doesNotMatch(harmonyEntry, /sdk_bridge_info', 'uniapp:/);

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
  harmonyEntry,
  /await manager\.startView\(params\.viewName, mergeRumBridgeContext\(params\.property\)\);/
);

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
assert.match(errorTracking, /const FT_JS_PLUGIN_VERSION = ['"]0\.2\.7-alpha\.1['"];/);
const jsSdkEntry = read('Hbuilder_Example/uni_modules/GC-UniPlugin/js_sdk/index.js');
assert.match(jsSdkEntry, /import\s*\{\s*gcActionTracking\s*\}/);
assert.match(jsSdkEntry, /#ifdef APP-HARMONY\s+gcActionTracking\.startTracking\(\);/);

const viewTracking = read(
  'Hbuilder_Example/uni_modules/GC-UniPlugin/js_sdk/View/GCViewTracking.js'
);
assert.match(viewTracking, /#ifdef APP-PLUS \|\| APP-HARMONY/);
assert.match(viewTracking, /isJSViewTrackingEnabled\(\)/);
assert.match(viewTracking, /isUniAppJSViewTrackingEnabled/);
assert.match(viewTracking, /this\.pendingPageLoads = new Map\(\)/);
assert.doesNotMatch(
  viewTracking,
  /(?:addLongTask|longTask|nativeFreezeDurationMs)/i,
  'The JS View lifecycle collector must never derive a Long Task from onLoad → onReady'
);
assert.doesNotMatch(viewTracking, /pendingViewLoadMap/);
assert.doesNotMatch(viewTracking, /plus\.runtime\.launchTime/);

const viewTrackingRuntime = viewTracking
  .replace(/import\s*\{[\s\S]*?\}\s*from\s*'@\/uni_modules\/GC-UniPlugin';/, '')
  .replace(/import Vue from 'vue';/, '')
  .replace('export const gcViewTracking = new PageMonitor();', 'return { PageMonitor };');
let currentPages = [];
const reportedViews = [];
const startedViews = [];
const rumMock = {
  isUniAppJSViewTrackingEnabled: () => true,
  onCreateView: (params) => reportedViews.push(params),
  startView: (params) => startedViews.push(params),
  stopView: () => {}
};
const { PageMonitor } = new Function(
  'gcRum',
  'getCurrentPages',
  'uni',
  'plus',
  `${viewTrackingRuntime}`
)(rumMock, () => currentPages, { addInterceptor: () => {} }, undefined);
const originalDateNow = Date.now;
try {
  const pageMonitor = new PageMonitor();
  const firstVm = { route: 'pages/routertest/page' };
  const secondVm = { route: 'pages/routertest/page' };
  const firstPage = { $vm: firstVm, route: firstVm.route };
  const secondPage = { $vm: secondVm, route: secondVm.route };

  // Timers belong to page instances. An older page with the same route cannot
  // consume the new page's start time.
  currentPages = [firstPage];
  Date.now = () => 1000;
  pageMonitor.handlePageLoad(firstVm);
  currentPages = [firstPage, secondPage];
  Date.now = () => 2000;
  pageMonitor.handlePageLoad(secondVm);
  Date.now = () => 5000;
  pageMonitor.handlePageReady(firstVm);
  assert.strictEqual(reportedViews.length, 0);
  pageMonitor.handlePageReady(secondVm);
  assert.deepStrictEqual(reportedViews, [{
    viewName: 'pages/routertest/page',
    loadTime: 3000000000
  }]);

  // App background time is not page loading time. A page hidden before ready
  // must never create a multi-minute or multi-hour loading duration.
  const pausedVm = { route: 'pages/routertest/paused' };
  currentPages = [{ $vm: pausedVm, route: pausedVm.route }];
  Date.now = () => 6000;
  pageMonitor.handlePageLoad(pausedVm);
  pageMonitor.handleAppHide();
  Date.now = () => 186000;
  pageMonitor.handlePageReady(pausedVm);
  assert.strictEqual(reportedViews.length, 1);

  // A page discovered after its load lifecycle has begun gets a View but never
  // manufactures load time from the process launch timestamp.
  const restoredMonitor = new PageMonitor();
  restoredMonitor.initialized = true;
  currentPages = [{ $vm: { route: 'pages/routertest/tab2' }, route: 'pages/routertest/tab2' }];
  restoredMonitor.checkInitialPage();
  assert.strictEqual(reportedViews.length, 1);
  assert.strictEqual(startedViews.at(-1).viewName, 'pages/routertest/tab2');
} finally {
  Date.now = originalDateNow;
}

const appSource = read('Hbuilder_Example/App.vue');
assert.match(appSource, /gcViewTracking\.handleAppShow\(\)/);
assert.match(appSource, /gcViewTracking\.handleAppHide\(\)/);
const indexPage = read('Hbuilder_Example/pages/index/index.vue');
assert.doesNotMatch(indexPage, /gcPageMixin/);

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
assert.doesNotMatch(actionTracking, /uni\.onAppShow\(/);
assert.doesNotMatch(actionTracking, /action_source:\s*'uniapp_js_lifecycle'/);
assert.doesNotMatch(actionTracking, /launch_(?:cold|hot)/);
assert.match(actionTracking, /getDefaultActionName\(/);
assert.match(actionTracking, /setActionTrackingHandler\(handler\)/);
assert.match(actionTracking, /resolveHandlerAction\(wrapper\)/);
assert.match(actionTracking, /#position:/);
assert.match(actionTracking, /isJSActionTrackingEnabled\(\)/);
assert.match(actionTracking, /isUniAppJSActionTrackingEnabled/);
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
gcActionTracking.rum.isUniAppJSActionTrackingEnabled = () => false;
gcActionTracking.handleVdSync([[20, 7, { type: 'onClick' }]], 42);
assert.strictEqual(
  capturedActions.length,
  5,
  'enableNativeUserAction: false must disable the UniApp JS Action collector'
);

const replayInterface = read(
  'Hbuilder_Example/uni_modules/GC-UniSessionReplay/utssdk/interface.uts'
);
assert.doesNotMatch(replayInterface, /export const GCSessionReplay/);

assert.doesNotMatch(appEntry, /GC-UniSessionReplay\/js_sdk/);
assert.match(appEntry, /GCUniSessionReplay/);

console.log('UTS proxy export checks passed');
