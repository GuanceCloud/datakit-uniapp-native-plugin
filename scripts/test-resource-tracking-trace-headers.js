const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const trackerSpecs = [
  {
    path: 'Hbuilder_Example/uni_modules/GC-JSPlugin/js_sdk/Request/GCResourceTracking.js',
    exportName: 'gcResourceTracking',
    platform: 'android'
  },
  {
    path: 'native-projects/native-sdk-hybrid/harmony/HBuilder-uniPluginDemo/uni_modules/GC-UniPlugin/js_sdk/Request/GCResourceTracking.js',
    exportName: 'gcHarmonyNetworkTracking',
    platform: 'harmonyos'
  }
];

function loadTracker(relativePath, exportName, rum, tracer, uni) {
  const source = fs.readFileSync(path.join(root, relativePath), 'utf8')
    .replace(
      /import\s*\{[\s\S]*?\}\s*from (?:'@\/uni_modules\/GC-UniPlugin'|'\.\.\/native\.js');/,
      ''
    )
    .replace(`export const ${exportName}`, `const ${exportName}`);

  return new Function(
    'rum',
    'tracer',
    'uni',
    `${source}\nreturn ${exportName};`
  )(rum, tracer, uni);
}

for (const trackerSpec of trackerSpecs) {
  const trackerPath = trackerSpec.path;
  const interceptors = {};
  const traceCalls = [];
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
      return true;
    },
    getTraceHeader(params) {
      traceCalls.push(params);
      return {
        traceparent: `trace-${params.key}`,
        'x-header-priority': 'sdk'
      };
    }
  };
  const uni = {
    getSystemInfoSync() {
      return { platform: trackerSpec.platform };
    },
    addInterceptor(name, interceptor) {
      interceptors[name] = interceptor;
    }
  };
  const tracker = loadTracker(trackerPath, trackerSpec.exportName, rum, tracer, uni);

  assert.strictEqual(tracker.startTracking(), true, trackerPath);

  const pendingOptions = [];
  for (let index = 0; index < 10; index += 1) {
    const options = {
      url: `https://example.com/items/${index}`,
      method: 'GET',
      header: {
        'x-request-index': String(index),
        'x-header-priority': 'user'
      },
      __gcResourceKey: `resource-${index}`
    };

    interceptors.request.invoke(options);

    assert.strictEqual(options.__gcResourceKey, undefined, trackerPath);
    assert.deepStrictEqual(options.header, {
      traceparent: `trace-resource-${index}`,
      'x-header-priority': 'user',
      'x-request-index': String(index)
    }, trackerPath);

    options.header['x-request-index'] = 'mutated-after-invoke';
    pendingOptions.push(options);
  }

  for (let index = pendingOptions.length - 1; index >= 0; index -= 1) {
    pendingOptions[index].success({
      statusCode: 200 + index,
      header: { 'x-response-index': String(index) },
      data: { index }
    });
  }

  assert.deepStrictEqual(
    traceCalls,
    Array.from({ length: 10 }, (_, index) => ({
      key: `resource-${index}`,
      url: `https://example.com/items/${index}`
    })),
    trackerPath
  );
  assert.deepStrictEqual(
    resourceStarts.map(item => item.key),
    Array.from({ length: 10 }, (_, index) => `resource-${index}`),
    trackerPath
  );
  assert.deepStrictEqual(
    resourceStops.map(item => item.key),
    Array.from({ length: 10 }, (_, index) => `resource-${9 - index}`),
    trackerPath
  );

  for (const resource of resources) {
    const index = Number(resource.key.replace('resource-', ''));
    assert.deepStrictEqual(resource.content.requestHeader, {
      traceparent: `trace-resource-${index}`,
      'x-header-priority': 'user',
      'x-request-index': String(index)
    }, trackerPath);
  }
}

console.log('GCResourceTracking Trace Header concurrency checks passed');
