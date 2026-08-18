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
const harmonyNativeSource = read(
  'Hbuilder_Example/uni_modules/GC-UniPlugin/utssdk/app-harmony/GCUniPluginNative.ets'
);
assert.match(harmonySource, /from '\.\/GCUniPluginNative\.ets';/);
assert.match(
  harmonySource,
  /function getHarmonyContext\(\): Context \| undefined\s*\{[\s\S]*?return getContext\(\) as Context;\s*\}/,
  'the UTS facade must supply the Harmony application context to the ArkTS proxy'
);
assert.match(harmonySource, /GCUniPluginNative\.sdkConfig\(params, getHarmonyContext\(\)\)/);
assert.match(harmonyNativeSource, /FTWebViewHandler/);
assert.match(harmonyNativeSource, /static attachWebView\(controller: webview\.WebviewController/);
assert.match(harmonyNativeSource, /handler\.setWebView\(controller, config\)/);
assert.match(harmonyNativeSource, /static detachWebView\(controller: webview\.WebviewController/);
assert.match(harmonyNativeSource, /handler\.clearWebController\(\)/);
assert.match(harmonyNativeSource, /config\.setAllowWebViewHost\(rumParams\.allowWebViewHost\)/);
assert.match(
  harmonyNativeSource,
  /FTSDK\.installRUMConfig\(config\);[\s\S]*?syncBridgeContextToRUMGlobalContext\(\);/,
  'WebView RUM must receive bridge context through the SDK dynamic tags'
);
assert.match(
  harmonyNativeSource,
  /function syncBridgeContextToRUMGlobalContext\(\): void \{[\s\S]*?FTSDK\.appendRUMGlobalContext\(context\);/,
  'bridge context must be forwarded to Browser RUM data'
);
assert.match(
  harmonyNativeSource,
  /function stringifyBridgeContextValue\(value: HarmonyOptionalValue\): string \{[\s\S]*?JSON\.stringify\(value\)/,
  'object bridge values such as sdk_bridge_info must be preserved as JSON'
);

const nativeWebViewSource = read(
  'Hbuilder_Example/uni_modules/GC-UniPlugin/utssdk/app-harmony/GCNativeWebView.ets'
);
assert.match(nativeWebViewSource, /defineNativeEmbed\('gcwebview'/);
assert.match(nativeWebViewSource, /controller: webview\.WebviewController/);
assert.match(nativeWebViewSource, /FTSDK\.getRumConfig\(\)/);
assert.match(nativeWebViewSource, /handler\.setWebView\(controller, config\)/);
assert.match(nativeWebViewSource, /enableBridgeCompatibilityCheck/);
assert.match(nativeWebViewSource, /__gc_base_bridge__/);
assert.match(nativeWebViewSource, /controller\.registerJavaScriptProxy\(/);
assert.match(nativeWebViewSource, /\.onConsole\(event => \{/);
assert.match(nativeWebViewSource, /\.onPageEnd\(\(\) => \{[\s\S]*?this\.logBridgeCompatibility\(\);/);
assert.match(nativeWebViewSource, /baseBridge\.ping\(\)/);
assert.match(nativeWebViewSource, /baseResult/);
assert.match(nativeWebViewSource, /FTWebViewJavascriptBridge && window\.FTWebViewJavascriptBridge\.sendEvent/);
assert.match(
  nativeWebViewSource,
  /\.onControllerAttached\(\(\) => \{[\s\S]*?this\.registerBaseJavaScriptBridge\(\);[\s\S]*?this\.attachRUMBridge\(\);[\s\S]*?\}\)/,
  'the base bridge must be registered before the RUM bridge on the same controller'
);
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
assert.match(pageSource, /enableBridgeCompatibilityCheck:\s*true/);

const mainSource = read('Hbuilder_Example/main.js');
assert.match(
  mainSource,
  /\/\/ #ifdef APP-IOS\s+const jsCode[\s\S]*?gcViewTracking\.evalSessionReplayJS\(jsCode\);\s+\/\/ #endif/,
  'Harmony normal RUM builds must not inject the iOS Session Replay bootstrap'
);

console.log('Harmony WebView normal RUM bridge checks passed');
