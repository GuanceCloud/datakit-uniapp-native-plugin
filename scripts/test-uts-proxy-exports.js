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

const replayInterface = read(
  'Hbuilder_Example/uni_modules/GC-UniSessionReplay/utssdk/interface.uts'
);
assert.doesNotMatch(replayInterface, /export const GCSessionReplay/);

assert.doesNotMatch(appEntry, /GC-UniSessionReplay\/js_sdk/);
assert.match(appEntry, /GCUniSessionReplay/);

console.log('UTS proxy export checks passed');
