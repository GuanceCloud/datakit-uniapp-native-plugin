const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const jsPluginRoot = path.join(
  root,
  'Hbuilder_Example/uni_modules/GC-JSPlugin'
);
const nativePath = path.join(jsPluginRoot, 'js_sdk/native.js');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

async function loadNativeBridgeModule(label) {
  const source = fs.readFileSync(nativePath, 'utf8');
  const dataUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}#${label}`;
  return import(dataUrl);
}

function createModule(callLog, moduleName) {
  return new Proxy({}, {
    get(_, methodName) {
      return (...args) => {
        callLog.push({ moduleName, methodName, args });
        if (methodName === 'getTraceHeader') {
          return { 'x-test-trace': moduleName };
        }
        return undefined;
      };
    }
  });
}

async function testLegacyBridgeIsLazyAndCached() {
  const requiredModuleIds = [];
  const calls = [];
  const modules = {
    'GCUniPlugin-MobileAgent': createModule(calls, 'legacy-mobileAgent'),
    'GCUniPlugin-RUM': createModule(calls, 'legacy-rum'),
    'GCUniPlugin-Logger': createModule(calls, 'legacy-logger'),
    'GCUniPlugin-Tracer': createModule(calls, 'legacy-tracer')
  };
  global.uni = {
    requireNativePlugin(moduleId) {
      requiredModuleIds.push(moduleId);
      return modules[moduleId];
    }
  };

  const bridge = await loadNativeBridgeModule('legacy');
  assert.deepStrictEqual(requiredModuleIds, []);

  bridge.mobileAgent.bindRUMUserData({ userId: 'legacy-user' });
  bridge.rum.startView({ viewName: 'legacy-view' });
  bridge.logger.logging({ content: 'legacy-log' });
  assert.deepStrictEqual(
    bridge.tracer.getTraceHeader({ key: 'legacy-resource', url: 'https://example.com' }),
    { 'x-test-trace': 'legacy-tracer' }
  );
  bridge.rum.stopView(null);

  assert.deepStrictEqual(requiredModuleIds, [
    'GCUniPlugin-MobileAgent',
    'GCUniPlugin-RUM',
    'GCUniPlugin-Logger',
    'GCUniPlugin-Tracer'
  ]);
  assert.strictEqual(bridge.getNativeBridgeSource(), 'legacy');
  assert.strictEqual(calls.length, 5);

  return bridge;
}

function testInstalledUTSBridgeKeepsFacadeIdentity(bridge) {
  const mobileAgentFacade = bridge.mobileAgent;
  const rumFacade = bridge.rum;
  const loggerFacade = bridge.logger;
  const tracerFacade = bridge.tracer;
  const calls = [];
  const utsBridge = {
    mobileAgent: createModule(calls, 'uts-mobileAgent'),
    rum: createModule(calls, 'uts-rum'),
    logger: createModule(calls, 'uts-logger'),
    tracer: createModule(calls, 'uts-tracer')
  };

  const restore = bridge.installNativeBridge(utsBridge, { source: 'uts' });
  assert.strictEqual(bridge.mobileAgent, mobileAgentFacade);
  assert.strictEqual(bridge.rum, rumFacade);
  assert.strictEqual(bridge.logger, loggerFacade);
  assert.strictEqual(bridge.tracer, tracerFacade);
  assert.strictEqual(bridge.getNativeBridgeSource(), 'uts');

  mobileAgentFacade.appendGlobalContext({ region: 'cn' });
  mobileAgentFacade.setDatakitURL({ datakitUrl: 'https://datakit.example.com' });
  mobileAgentFacade.setDatawayURL({
    datawayUrl: 'https://dataway.example.com',
    clientToken: 'test-token'
  });
  mobileAgentFacade.updateRemoteConfigWithMiniUpdateInterval(
    { miniUpdateInterval: 60 },
    () => {}
  );
  rumFacade.addAction({ actionName: 'tap' });
  loggerFacade.logging({ content: 'uts-log' });
  assert.deepStrictEqual(
    tracerFacade.getTraceHeader({ key: 'uts-resource', url: 'https://example.com' }),
    { 'x-test-trace': 'uts-tracer' }
  );
  assert.deepStrictEqual(
    calls.map(call => `${call.moduleName}.${String(call.methodName)}`),
    [
      'uts-mobileAgent.appendGlobalContext',
      'uts-mobileAgent.setDatakitURL',
      'uts-mobileAgent.setDatawayURL',
      'uts-mobileAgent.updateRemoteConfigWithMiniUpdateInterval',
      'uts-rum.addAction',
      'uts-logger.logging',
      'uts-tracer.getTraceHeader'
    ]
  );

  assert.throws(
    () => bridge.installNativeBridge({ rum: {} }),
    /missing mobileAgent, logger, tracer/
  );
  restore();
  assert.strictEqual(bridge.getNativeBridgeSource(), 'legacy');
}

async function testMissingNativeRuntimeUsesSafeFallbacks() {
  delete global.uni;
  const bridge = await loadNativeBridgeModule('missing-native');
  assert.doesNotThrow(() => bridge.mobileAgent.sdkConfig({}));
  assert.doesNotThrow(() => bridge.mobileAgent.setDatakitURL({ datakitUrl: '' }));
  assert.doesNotThrow(() => bridge.mobileAgent.setDatawayURL({ datawayUrl: '', clientToken: '' }));
  assert.doesNotThrow(() => bridge.mobileAgent.updateRemoteConfigWithMiniUpdateInterval({}, () => {}));
  assert.doesNotThrow(() => bridge.rum.startView({ viewName: 'debug' }));
  assert.doesNotThrow(() => bridge.logger.logging({ content: 'debug' }));
  assert.strictEqual(bridge.tracer.getTraceHeader({}), null);
  assert.strictEqual(bridge.rum.isUniAppJSViewTrackingEnabled(), true);
  assert.strictEqual(bridge.rum.isHarmonyUniRequestAutoTrackingEnabled(), false);
  assert.strictEqual(bridge.tracer.isHarmonyUniRequestAutoTraceEnabled(), false);
}

function testPackageBoundaries() {
  const jsFiles = [];
  function collectJavaScriptFiles(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        collectJavaScriptFiles(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        jsFiles.push(fullPath);
      }
    }
  }
  collectJavaScriptFiles(jsPluginRoot);

  for (const filePath of jsFiles) {
    const source = fs.readFileSync(filePath, 'utf8');
    assert.doesNotMatch(
      source,
      /from\s+['"]@\/uni_modules\/GC-UniPlugin(?:\/|['"])/,
      `${path.relative(root, filePath)} must not statically import the optional UTS package`
    );
    if (filePath !== nativePath) {
      assert.doesNotMatch(
        source,
        /requireNativePlugin/,
        `${path.relative(root, filePath)} must route through js_sdk/native.js`
      );
    }
  }

  const setupEntry = read('Hbuilder_Example/uni_modules/GC-UniPlugin/setup.js');
  assert.strictEqual(
    fs.existsSync(path.join(
      root,
      'Hbuilder_Example/uni_modules/GC-UniPlugin/bridge/install.js'
    )),
    false
  );
  assert.match(setupEntry, /from '@\/uni_modules\/GC-UniPlugin'/);
  assert.match(setupEntry, /installNativeBridge\(\{/);
  assert.match(setupEntry, /source: 'uts'/);
  assert.doesNotMatch(setupEntry, /gcErrorTracking|gcResourceTracking|gcViewTracking/);

  const packageJson = JSON.parse(
    read('Hbuilder_Example/uni_modules/GC-UniPlugin/package.json')
  );
  assert.deepStrictEqual(packageJson.uni_modules.dependencies, ['GC-JSPlugin']);
  assert.doesNotMatch(
    read('Hbuilder_Example/sdk-bootstrap.js'),
    /bridge\/install\.js/
  );
  const buildSwitch = read('Hbuilder_Example/gc-build-entry.js');
  const activeModeExports = buildSwitch.match(
    /^\s*export \* from ['"]\.\/gc-build-entry\.(?:uniapp|wgt)\.js['"]/gm
  ) || [];
  assert.strictEqual(
    activeModeExports.length,
    1,
    'gc-build-entry.js must have exactly one active build-mode export'
  );
  assert.match(buildSwitch, /gc-build-entry\.uniapp\.js/);
  assert.match(buildSwitch, /gc-build-entry\.wgt\.js/);

  const uniappBuildEntry = read('Hbuilder_Example/gc-build-entry.uniapp.js');
  assert.match(
    uniappBuildEntry,
    /^import '@\/uni_modules\/GC-UniPlugin\/setup\.js'/
  );
  assert.match(uniappBuildEntry, /from '@\/uni_modules\/GC-UniPlugin'/);
  assert.match(uniappBuildEntry, /from '\.\/sdk-bootstrap\.js'/);

  const wgtBuildEntry = read('Hbuilder_Example/gc-build-entry.wgt.js');
  assert.match(wgtBuildEntry, /from '@\/uni_modules\/GC-JSPlugin'/);
  assert.match(wgtBuildEntry, /export function initializeGuanceSDK\(\) \{\}/);
  assert.doesNotMatch(wgtBuildEntry, /GC-UniPlugin/);
  assert.doesNotMatch(wgtBuildEntry, /GC-UniSessionReplay|sdk-bootstrap/);

  assert.match(
    read('Hbuilder_Example/main.js'),
    /from '\.\/gc-build-entry\.js'/
  );
  assert.match(
    read('Hbuilder_Example/main.js'),
    /gcErrorTracking\.startTracking\(\)/,
    'JS Error collection must start in both normal UniApp and WGT builds'
  );
  assert.doesNotMatch(
    read('Hbuilder_Example/sdk-bootstrap.js'),
    /gcErrorTracking/,
    'JS Error collection must not be hidden behind the normal-UniApp SDK initializer'
  );
  assert.match(
    read('Hbuilder_Example/sdk-bootstrap.js'),
    /import\s*\{\s*logger,\s*mobileAgent,\s*rum,\s*tracer\s*\}\s*from '@\/uni_modules\/GC-UniPlugin'/
  );

  for (const relativePath of [
    'Hbuilder_Example/pages/index/index.vue',
    'Hbuilder_Example/pages/logging/logging.vue',
    'Hbuilder_Example/pages/rum/rum.vue',
    'Hbuilder_Example/pages/tracing/tracing.vue'
  ]) {
    assert.match(
      read(relativePath),
      /from '@\/gc-build-entry\.js'/,
      `${relativePath} must use the selected Example SDK API entry`
    );
  }

  const exampleApplicationFiles = [];
  const exampleRoot = path.join(root, 'Hbuilder_Example');
  function collectExampleApplicationFiles(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory() && [
        '.hbuilderx',
        '.vite',
        'uni_modules',
        'unpackage'
      ].includes(entry.name)) {
        continue;
      }
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        collectExampleApplicationFiles(fullPath);
      } else if (entry.isFile() && /\.(?:js|vue)$/.test(entry.name)) {
        exampleApplicationFiles.push(fullPath);
      }
    }
  }
  collectExampleApplicationFiles(exampleRoot);

  const allowedUTSApplicationFiles = new Set([
    path.join(exampleRoot, 'gc-build-entry.uniapp.js'),
    path.join(exampleRoot, 'sdk-bootstrap.js')
  ]);
  for (const filePath of exampleApplicationFiles) {
    const source = fs.readFileSync(filePath, 'utf8');
    if (/from\s+['"]@\/uni_modules\/GC-UniPlugin(?:\/|['"])/.test(source)) {
      assert(
        allowedUTSApplicationFiles.has(filePath),
        `${path.relative(root, filePath)} bypasses the Example build-mode boundary`
      );
    }
    if (/from\s+['"]\.\/sdk-bootstrap\.js['"]/.test(source)) {
      assert.strictEqual(
        filePath,
        path.join(exampleRoot, 'gc-build-entry.uniapp.js'),
        `${path.relative(root, filePath)} makes the SDK initializer reachable from WGT`
      );
    }
  }
}

(async () => {
  const legacyBridge = await testLegacyBridgeIsLazyAndCached();
  testInstalledUTSBridgeKeepsFacadeIdentity(legacyBridge);
  await testMissingNativeRuntimeUsesSafeFallbacks();
  testPackageBoundaries();
  delete global.uni;
  console.log('GC-JSPlugin native bridge compatibility checks passed');
})().catch(error => {
  delete global.uni;
  console.error(error);
  process.exitCode = 1;
});
