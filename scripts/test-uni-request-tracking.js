const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const trackerPath = 'Hbuilder_Example/uni_modules/GC-UniPlugin/js_sdk/Request/GCResourceTracking.js';

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function loadNetworkTracker(rum, uni) {
  const source = read(trackerPath)
    .replace(
      /import\s*\{[\s\S]*?\}\s*from '@\/uni_modules\/GC-UniPlugin';/,
      ''
    )
    .replace(
      'export const gcResourceTracking',
      'const gcResourceTracking'
    );
  return new Function('rum', 'uni', `${source}\nreturn gcResourceTracking;`)(rum, uni);
}

function createRuntime(platform) {
  const interceptors = {};
  const resourceStarts = [];
  const resourceStops = [];
  const resources = [];
  const rum = {
    startResource(params) {
      resourceStarts.push(params);
    },
    stopResource(params) {
      resourceStops.push(params);
    },
    addResource(params) {
      resources.push(params);
    }
  };
  const uni = {
    getSystemInfoSync() {
      return { platform };
    },
    addInterceptor(name, interceptor) {
      interceptors[name] = interceptor;
    }
  };
  return {
    interceptors,
    resourceStarts,
    resourceStops,
    resources,
    rum,
    uni
  };
}

function loadGCRequest(rum, tracer, uni, gcResourceTracking) {
  const source = read('Hbuilder_Example/uni_modules/GC-UniPlugin/js_sdk/Request/GCRequest.js')
    .replace(
      /import\s*\{[\s\S]*?\}\s*from '@\/uni_modules\/GC-UniPlugin';/,
      ''
    )
    .replace(
      /import\s*\{[\s\S]*?\}\s*from '\.\/GCResourceTracking\.js';/,
      ''
    )
    .replace('export const gcRequest', 'const gcRequest');
  return new Function(
    'rum',
    'tracer',
    'uni',
    'gcResourceTracking',
    `${source}\nreturn gcRequest;`
  )(rum, tracer, uni, gcResourceTracking);
}

const harmonyBridge = read(
  'Hbuilder_Example/uni_modules/GC-UniPlugin/utssdk/app-harmony/index.uts'
);
assert.doesNotMatch(harmonyBridge, /isHarmonyUniRequestAutoTrackingEnabled/);

const android = createRuntime('android');
const androidTracker = loadNetworkTracker(android.rum, android.uni);
assert.strictEqual(androidTracker.startTracking(), true);
assert.strictEqual(androidTracker.startTracking(), false);
assert.strictEqual(androidTracker.isTracking(), true);
assert.strictEqual(androidTracker.shouldUseManualTracking(), false);
assert.ok(android.interceptors.request);

const iosDisabled = createRuntime('ios');
const iosDisabledTracker = loadNetworkTracker(iosDisabled.rum, iosDisabled.uni);
assert.strictEqual(iosDisabledTracker.startTracking({ enableIOS: false }), false);
assert.strictEqual(iosDisabledTracker.startTracking({ enableIOS: true }), false);
assert.strictEqual(iosDisabledTracker.isTracking(), false);
assert.strictEqual(iosDisabledTracker.shouldUseManualTracking(), false);
assert.strictEqual(iosDisabled.interceptors.request, undefined);

const unavailable = createRuntime('android');
delete unavailable.uni.addInterceptor;
const unavailableTracker = loadNetworkTracker(unavailable.rum, unavailable.uni);
assert.strictEqual(unavailableTracker.startTracking(), false);
unavailable.uni.addInterceptor = (name, interceptor) => {
  unavailable.interceptors[name] = interceptor;
};
assert.strictEqual(unavailableTracker.startTracking(), false);
assert.strictEqual(unavailable.interceptors.request, undefined);

const iosEnabled = createRuntime('ios');
const iosEnabledTracker = loadNetworkTracker(iosEnabled.rum, iosEnabled.uni);
assert.strictEqual(iosEnabledTracker.startTracking(), true);
assert.strictEqual(iosEnabledTracker.isTracking(), true);
assert.strictEqual(iosEnabledTracker.shouldUseManualTracking(), false);
assert.ok(iosEnabled.interceptors.request);

const harmony = createRuntime('harmonyos');
const harmonyTracker = loadNetworkTracker(harmony.rum, harmony.uni);
assert.strictEqual(harmonyTracker.startTracking(), true);
assert.strictEqual(harmonyTracker.shouldUseManualTracking(), false);
assert.ok(harmony.interceptors.request);

const pendingOptions = [];
const callbackOrder = [];
for (let index = 0; index < 10; index += 1) {
  const options = {
    url: `https://example.com/items/${index}`,
    method: 'GET',
    header: { 'x-request-index': String(index) },
    __gcResourceKey: `resource-${index}`,
    success(response) {
      callbackOrder.push(index);
      return response;
    }
  };
  android.interceptors.request.invoke(options);
  options.header['x-request-index'] = 'mutated-after-invoke';
  pendingOptions.push(options);
}

for (let index = pendingOptions.length - 1; index >= 0; index -= 1) {
  const response = {
    statusCode: 200 + index,
    header: { 'x-response-index': String(index) },
    data: { index }
  };
  assert.strictEqual(pendingOptions[index].success(response), response);
}

assert.deepStrictEqual(
  android.resourceStarts.map(item => item.key),
  Array.from({ length: 10 }, (_, index) => `resource-${index}`)
);
assert.deepStrictEqual(
  android.resourceStops.map(item => item.key),
  Array.from({ length: 10 }, (_, index) => `resource-${9 - index}`)
);
assert.deepStrictEqual(callbackOrder, [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]);
for (const resource of android.resources) {
  const index = Number(resource.key.replace('resource-', ''));
  assert.strictEqual(resource.content.url, `https://example.com/items/${index}`);
  assert.strictEqual(resource.content.resourceStatus, 200 + index);
  assert.strictEqual(resource.content.responseBody, JSON.stringify({ index }));
  assert.deepStrictEqual(resource.content.requestHeader, { 'x-request-index': String(index) });
}

const failureOptions = {
  url: 'https://example.com/fail',
  header: {},
  __gcResourceKey: 'failed-resource'
};
android.interceptors.request.invoke(failureOptions);
const failure = { errMsg: 'request:fail timeout' };
assert.strictEqual(failureOptions.fail(failure), failure);
assert.deepStrictEqual(android.resources[10].content, {
  url: 'https://example.com/fail',
  httpMethod: 'GET',
  requestHeader: {},
  responseBody: '',
  resourceStatus: 0,
  errorMessage: 'request:fail timeout',
  errorStack: 'request:fail timeout'
});

const gcRequestSource = read(
  'Hbuilder_Example/uni_modules/GC-UniPlugin/js_sdk/Request/GCRequest.js'
);
assert.match(gcRequestSource, /@deprecated[\s\S]*gcResourceTracking/);
assert.match(
  gcRequestSource,
  /const shouldCollectResource = !filter && gcResourceTracking\.shouldUseManualTracking\(\);/
);

let manualStartCount = 0;
let traceHeaderCount = 0;
let capturedRequestOptions = null;
const gcRequest = loadGCRequest(
  {
    startResource() {
      manualStartCount += 1;
    },
    stopResource() {},
    addResource() {}
  },
  {
    getTraceHeader() {
      traceHeaderCount += 1;
      return { 'x-datadog-trace-id': '123' };
    }
  },
  {
    getSystemInfoSync() {
      return { platform: 'ios' };
    },
    request(options) {
      capturedRequestOptions = options;
      return { abort() {} };
    }
  },
  {
    shouldUseManualTracking() {
      return false;
    }
  }
);
gcRequest.request({
  url: 'https://example.com/native-ios',
  method: 'GET',
  header: { accept: 'application/json' }
});
assert.strictEqual(manualStartCount, 0);
assert.strictEqual(traceHeaderCount, 0);
assert.deepStrictEqual(capturedRequestOptions.header, { accept: 'application/json' });

assert.doesNotMatch(read(trackerPath), /gcHarmonyNetworkTracking|GCHarmonyNetworkTracking/);
assert.match(read(trackerPath), /if \(startTrackingInvoked\)[\s\S]*startTrackingInvoked = true;/);
assert.match(
  read('Hbuilder_Example/uni_modules/GC-UniPlugin/js_sdk/index.js'),
  /gcResourceTracking[\s\S]*Request\/GCResourceTracking\.js/
);
assert.match(
  read('Hbuilder_Example/main.js'),
  /gcResourceTracking\.startTracking\(\{[\s\S]*enableIOS:\s*false/
);
assert.strictEqual(
  read(trackerPath),
  read('HybridHostExample-Harmony/HBuilder-uniPluginDemo/uni_modules/GC-UniPlugin/js_sdk/Request/GCResourceTracking.js')
);

console.log('Cross-platform uni.request SDK tracking checks passed');
