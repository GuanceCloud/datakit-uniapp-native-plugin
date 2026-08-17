const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function loadHarmonyTracker(rum, tracer, uni) {
  const source = read(
    'Hbuilder_Example/uni_modules/GC-UniPlugin/js_sdk/Request/GCHarmonyNetworkTracking.js'
  )
    .replace(
      /import\s*\{[\s\S]*?\}\s*from '@\/uni_modules\/GC-UniPlugin';/,
      ''
    )
    .replace(
      'export const gcHarmonyNetworkTracking',
      'const gcHarmonyNetworkTracking'
    );
  return new Function('rum', 'tracer', 'uni', `${source}\nreturn gcHarmonyNetworkTracking;`)(
    rum,
    tracer,
    uni
  );
}

const harmonyBridge = read(
  'Hbuilder_Example/uni_modules/GC-UniPlugin/utssdk/app-harmony/index.uts'
);
assert.match(harmonyBridge, /static isHarmonyUniRequestAutoTrackingEnabled\b/);
assert.match(harmonyBridge, /static isHarmonyUniRequestAutoTraceEnabled\b/);

const publicInterface = read('Hbuilder_Example/uni_modules/GC-UniPlugin/utssdk/interface.uts');
assert.match(publicInterface, /enableAutoTrace\?: boolean \| null/);

const harmonyNative = read(
  'Hbuilder_Example/uni_modules/GC-UniPlugin/utssdk/app-harmony/GCUniPluginNative.ets'
);
assert.match(harmonyNative, /config\.setEnableAutoTrace\(traceParams\.enableAutoTrace\)/);
assert.match(
  harmonyNative,
  /harmonyUniRequestAutoTraceEnabled = traceParams\.enableAutoTrace === true/
);
assert.match(
  harmonyNative,
  /config\.setDeviceMetricsMonitorType\(\s*deviceMonitorType,\s*harmonyDetectFrequency\(rumParams\.detectFrequency \|\| 'normal'\)\s*\)/s
);
assert.doesNotMatch(harmonyNative, /setDeviceMetricsDetectFrequency/);

const interceptors = {};
const resourceStarts = [];
const resourceStops = [];
const resources = [];
const rum = {
  isHarmonyUniRequestAutoTrackingEnabled() {
    return true;
  },
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
const tracer = {
  isHarmonyUniRequestAutoTraceEnabled() {
    return false;
  },
  getTraceHeader() {
    throw new Error('disabled Harmony auto trace must not inject trace headers');
  }
};
const uni = {
  getSystemInfoSync() {
    return { platform: 'harmonyos' };
  },
  addInterceptor(name, interceptor) {
    interceptors[name] = interceptor;
  }
};

const tracker = loadHarmonyTracker(rum, tracer, uni);
assert.strictEqual(tracker.startTracking(), true);
assert.strictEqual(tracker.startTracking(), false);
assert.strictEqual(tracker.isTracking(), true);
assert.ok(interceptors.request);

const successOptions = {
  url: 'https://example.com/success',
  method: 'post',
  header: {
    authorization: 'Bearer demo',
    'x-datadog-trace-id': '123'
  },
  __gcResourceKey: 'trace-resource-key',
  data: { request: 'body' }
};
interceptors.request.invoke(successOptions);
assert.strictEqual(successOptions.header.authorization, 'Bearer demo');
assert.strictEqual(successOptions.header['x-datadog-trace-id'], '123');
assert.strictEqual(successOptions.__gcResourceKey, undefined);
const successResponse = { statusCode: 201, header: { location: '/new' }, data: { ok: true } };
assert.strictEqual(successOptions.success(successResponse), successResponse);
assert.strictEqual(resourceStarts.length, 1);
assert.deepStrictEqual(resourceStarts[0], { key: 'trace-resource-key' });
assert.strictEqual(resourceStops.length, 1);
assert.deepStrictEqual(resources[0].content, {
  url: 'https://example.com/success',
  httpMethod: 'post',
  requestHeader: {
    authorization: 'Bearer demo',
    'x-datadog-trace-id': '123'
  },
  responseHeader: { location: '/new' },
  responseBody: '{"ok":true}',
  resourceStatus: 201
});

const failOptions = { url: 'https://example.com/fail', header: {} };
interceptors.request.invoke(failOptions);
const failure = { errMsg: 'request:fail timeout' };
assert.strictEqual(failOptions.fail(failure), failure);
assert.strictEqual(resourceStarts.length, 2);
assert.strictEqual(resourceStops.length, 2);
assert.deepStrictEqual(resources[1].content, {
  url: 'https://example.com/fail',
  httpMethod: 'GET',
  requestHeader: {},
  responseBody: '',
  resourceStatus: 0,
  errorMessage: 'request:fail timeout',
  errorStack: 'request:fail timeout'
});
assert.doesNotMatch(
  read('Hbuilder_Example/uni_modules/GC-UniPlugin/js_sdk/Request/GCHarmonyNetworkTracking.js'),
  /rum\.addError\(/
);

const gcRequestSource = read(
  'Hbuilder_Example/uni_modules/GC-UniPlugin/js_sdk/Request/GCRequest.js'
);
assert.doesNotMatch(gcRequestSource, /['"]harmony['"]/);
assert.match(
  gcRequestSource,
  /const shouldCollectResource = !filter && !gcHarmonyNetworkTracking\.isTracking\(\);/
);
assert.match(gcRequestSource, /if \(shouldCollectResource\) \{\s*rum\.startResource/s);
assert.match(gcRequestSource, /rum\.addResource\(\{\s*'key': key,\s*'property': \{\s*'resource_id': key,/s);

const autoTraceInterceptors = {};
const autoTraceCalls = [];
const autoTraceResources = [];
const autoTraceRum = {
  isHarmonyUniRequestAutoTrackingEnabled() {
    return true;
  },
  startResource() {},
  stopResource() {},
  addResource(params) {
    autoTraceResources.push(params);
  }
};
const autoTraceTracker = loadHarmonyTracker(
  autoTraceRum,
  {
    isHarmonyUniRequestAutoTraceEnabled() {
      return true;
    },
    getTraceHeader(params) {
      autoTraceCalls.push(params);
      return {
        traceparent: 'sdk-traceparent',
        tracestate: 'sdk-tracestate'
      };
    }
  },
  {
    getSystemInfoSync() {
      return { platform: 'harmonyos' };
    },
    addInterceptor(name, interceptor) {
      autoTraceInterceptors[name] = interceptor;
    }
  }
);
assert.strictEqual(autoTraceTracker.startTracking(), true);
const autoTraceOptions = {
  url: 'https://example.com/auto-trace',
  method: 'GET',
  header: {
    authorization: 'Bearer demo',
    traceparent: 'caller-traceparent'
  }
};
autoTraceInterceptors.request.invoke(autoTraceOptions);
assert.strictEqual(autoTraceCalls.length, 1);
assert.strictEqual(autoTraceCalls[0].url, 'https://example.com/auto-trace');
assert.ok(autoTraceCalls[0].key);
assert.deepStrictEqual(autoTraceOptions.header, {
  authorization: 'Bearer demo',
  traceparent: 'caller-traceparent',
  tracestate: 'sdk-tracestate'
});
autoTraceOptions.success({ statusCode: 200, header: {}, data: {} });
assert.deepStrictEqual(autoTraceResources[0].content.requestHeader, autoTraceOptions.header);

const indexPageSource = read('Hbuilder_Example/pages/index/index.vue');
assert.match(
  indexPageSource,
  /tracer\.setConfig\(\{[\s\S]*?enableLinkRUMData: true,[\s\S]*?enableAutoTrace: true[\s\S]*?\}\)/
);

let manualStartCount = 0;
let capturedManualOptions = null;
const gcRequest = new Function(
  'rum',
  'tracer',
  'uni',
  'gcHarmonyNetworkTracking',
  gcRequestSource
    .replace(
      /import\s*\{[\s\S]*?\}\s*from '@\/uni_modules\/GC-UniPlugin';/,
      ''
    )
    .replace(
      /import\s*\{[\s\S]*?\}\s*from '\.\/GCHarmonyNetworkTracking\.js';/,
      ''
    )
    .replace('export const gcRequest', 'const gcRequest') +
    '\nreturn gcRequest;'
)(
  {
    startResource() {
      manualStartCount += 1;
    },
    stopResource() {},
    addResource() {}
  },
  {
    getTraceHeader() {
      throw new Error('automatic Harmony tracking must own trace header injection');
    }
  },
  {
    getSystemInfoSync() {
      return { platform: 'harmonyos' };
    },
    request(options) {
      capturedManualOptions = options;
      return { abort() {} };
    }
  },
  {
    isTracking() {
      return true;
    }
  }
);
gcRequest.request({
  url: 'https://example.com/manual',
  method: 'GET',
  header: { accept: 'application/json' }
});
assert.strictEqual(manualStartCount, 0);
assert.deepStrictEqual(capturedManualOptions.header, { accept: 'application/json' });

console.log('Harmony uni.request SDK tracking checks passed');
