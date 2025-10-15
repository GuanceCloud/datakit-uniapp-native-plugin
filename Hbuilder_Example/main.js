import App from './App'
import {
  gcErrorTracking,
  gcViewTracking
} from '@/uni_modules/GC-JSPlugin'

gcErrorTracking.startTracking()
gcViewTracking.startTracking()
const jsCode = `   
    // Dynamically create and load external script
    var script = document.createElement('script');
    script.src = 'https://static.guance.com/browser-sdk/v3/dataflux-rum.js';
    script.onload = function() {
      // Initialize after script loads
      DATAFLUX_RUM.init({
        applicationId: 'xxxx',
        site: 'xxxxx',
        clientToken: 'xxxxx',
        env: "production",
        version: "1.0.0",
        service: "browser",
        sessionSampleRate: 100,
        sessionReplaySampleRate: 70,
        compressIntakeRequests: true,
        trackInteractions: true,
        traceType: "ddtrace"
      });
			DATAFLUX_RUM.setGlobalContextProperty('wgt_id', 'wgt_id_1');
			DATAFLUX_RUM.setGlobalContextProperty('wgt_name', 'wgt_name_1');
      window.DATAFLUX_RUM.startSessionReplayRecording();
    };
    document.head.appendChild(script);
`;
gcViewTracking.evalSessionReplayJS(jsCode);
// #ifndef VUE3
import Vue from 'vue'
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
  return {
    app
  }
}
// #endif