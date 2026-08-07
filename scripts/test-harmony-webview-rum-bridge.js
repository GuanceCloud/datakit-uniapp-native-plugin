const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const harmonySource = read(
  'Hbuilder_Example/uni_modules/GC-UniPlugin/utssdk/app-harmony/index.uts'
);
assert.match(harmonySource, /FTWebViewHandler/);
assert.match(harmonySource, /static attachWebView\(controller: webview\.WebviewController/);
assert.match(harmonySource, /handler\.setWebView\(controller, config\)/);
assert.match(harmonySource, /static detachWebView\(controller: webview\.WebviewController/);
assert.match(harmonySource, /handler\.clearWebController\(\)/);
assert.match(harmonySource, /config\.setAllowWebViewHost\(params\.allowWebViewHost\)/);

const nativeWebViewSource = read(
  'Hbuilder_Example/uni_modules/GC-UniPlugin/utssdk/app-harmony/GCNativeWebView.ets'
);
assert.match(nativeWebViewSource, /defineNativeEmbed\('gcwebview'/);
assert.match(nativeWebViewSource, /controller: webview\.WebviewController/);
assert.match(nativeWebViewSource, /FTSDK\.getRumConfig\(\)/);
assert.match(nativeWebViewSource, /handler\.setWebView\(controller, config\)/);
assert.match(
  nativeWebViewSource,
  /Harmony WebView RUM bridge failed:/,
  'bridge errors must be reported without changing the page load path'
);
assert.match(nativeWebViewSource, /Web\(\{ src: this\.src, controller: this\.controller \}\)/);
assert.doesNotMatch(
  nativeWebViewSource,
  /\.loadUrl\(/,
  'the target document must be loaded exactly once by Web({ src })'
);
assert.match(nativeWebViewSource, /\.position\(\{ x: options\.x, y: options\.y \}\)/);
assert.match(nativeWebViewSource, /\.visibility\(options\.visibility\)/);
assert.match(harmonySource, /import '\.\/GCNativeWebView\.ets';/);

const pageSource = read('Hbuilder_Example/pages/webview/webView.vue');
assert.match(pageSource, /#ifdef APP-HARMONY[\s\S]*?<embed[\s\S]*?tag="gcwebview"/);
assert.match(pageSource, /#ifndef APP-HARMONY[\s\S]*?<web-view/);
assert.doesNotMatch(pageSource, /createWebviewContext/);

const mainSource = read('Hbuilder_Example/main.js');
assert.match(
  mainSource,
  /\/\/ #ifdef APP-IOS\s+const jsCode[\s\S]*?gcViewTracking\.evalSessionReplayJS\(jsCode\);\s+\/\/ #endif/,
  'Harmony normal RUM builds must not inject the iOS Session Replay bootstrap'
);

console.log('Harmony WebView normal RUM bridge checks passed');
