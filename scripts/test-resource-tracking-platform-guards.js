const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const trackerPath =
  'Hbuilder_Example/uni_modules/GC-JSPlugin/js_sdk/Request/GCResourceTracking.js';
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

const harmonyTrackerPath =
  'native-projects/native-sdk-hybrid/harmony/HBuilder-uniPluginDemo/uni_modules/GC-UniPlugin/js_sdk/Request/GCResourceTracking.js';
const harmonySource = fs.readFileSync(path.join(root, harmonyTrackerPath), 'utf8');
const harmonyRuntimeGuards = harmonySource.match(/#ifdef APP-HARMONY/g) || [];
assert.strictEqual(
  harmonyRuntimeGuards.length,
  2,
  `${harmonyTrackerPath} must guard installation and state checks as Harmony-only code`
);
assert.doesNotMatch(
  harmonySource,
  /#ifdef APP-PLUS/,
  `${harmonyTrackerPath} must remain isolated from classic iOS/Android builds`
);

console.log('Resource tracking platform guard checks passed');
