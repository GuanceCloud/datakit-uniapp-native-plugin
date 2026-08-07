import App from './App'
import {
  gcViewTracking
} from '@/uni_modules/GC-UniPlugin/js_sdk'
import {
  initializeGuanceSDK
} from './sdk-bootstrap.js'

initializeGuanceSDK()

// Session Replay is iOS-only in this plugin. Keep the optional replay bootstrap
// out of Harmony builds so normal WebView RUM does not wait for a `records`
// bridge that is intentionally not installed there.
// #ifdef APP-IOS
const jsCode = `   
    (function() {
      var bridge = window.FTWebViewJavascriptBridge;
      if (!bridge || bridge.__gcSessionReplayEventDebug || !bridge.sendEvent) {
        return;
      }
      bridge.__gcSessionReplayEventDebug = true;
      var originalSendEvent = bridge.sendEvent;
      bridge.sendEvent = function(data) {
        var event = data;
        if (typeof data === 'string') {
          try {
            event = JSON.parse(data);
          } catch (_) {}
        }
        if (event && event.name === 'session_replay') {
          console.log('[DEBUG-SR-WEB-EVENT-4d9a] session_replay sent to native bridge');
        }
        return originalSendEvent.apply(this, arguments);
      };
    })();

    // Dynamically create and load external script
    var script = document.createElement('script');
    script.src = 'https://static.guance.com/browser-sdk/v3/dataflux-rum.js';
    script.onload = function() {
			DATAFLUX_RUM.setGlobalContextProperty('wgt_id', 'wgt_id_1');
			DATAFLUX_RUM.setGlobalContextProperty('wgt_name', 'wgt_name_1');
      // Initialize after script loads
      DATAFLUX_RUM.init({
        applicationId: 'xxxx',
        site: 'xxxxx',
        clientToken: 'xxxxx',
        env: "production",
        version: "1.0.0",
        service: "browser",
        sessionSampleRate: 100,
        sessionReplaySampleRate: 100,
        compressIntakeRequests: true,
        trackInteractions: true,
        traceType: "ddtrace"
      });
      window.DATAFLUX_RUM.startSessionReplayRecording();
    };
    document.head.appendChild(script);
`;
gcViewTracking.evalSessionReplayJS(jsCode);
// #endif
// #ifndef VUE3
import Vue from 'vue'
gcViewTracking.startTracking()
Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue({
    ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
export function createApp() {
  const app = createSSRApp(App)
  gcViewTracking.startTracking(app)
  return {
    app
  }
}
// #endif
