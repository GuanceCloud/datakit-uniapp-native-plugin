const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const trackerPaths = [
  'Hbuilder_Example/uni_modules/GC-JSPlugin/js_sdk/Request/GCResourceTracking.js',
  'HybridHostExample-Harmony/HBuilder-uniPluginDemo/uni_modules/GC-UniPlugin/js_sdk/Request/GCResourceTracking.js'
];

for (const trackerPath of trackerPaths) {
  const source = fs.readFileSync(path.join(root, trackerPath), 'utf8');
  const appRuntimeGuards = source.match(/#ifdef APP-PLUS \|\| APP-HARMONY/g) || [];

  assert.strictEqual(
    appRuntimeGuards.length,
    3,
    `${trackerPath} must retain all three runtime sections for classic iOS/Android and HarmonyOS builds`
  );
  assert.doesNotMatch(
    source,
    /#ifdef APP-IOS \|\| APP-ANDROID \|\| APP-HARMONY/,
    `${trackerPath} must not use UTS-only APP-IOS/APP-ANDROID guards in JavaScript`
  );
}

console.log('GCResourceTracking platform guard checks passed');
