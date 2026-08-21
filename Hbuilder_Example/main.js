import App from './App'
import {
  gcErrorTracking,
  gcViewTracking,
  gcActionTracking,
  gcResourceTracking
} from '@/uni_modules/GC-JSPlugin'
import {
  initializeGuanceSDK
} from './gc-build-entry.js'

initializeGuanceSDK();
gcErrorTracking.startTracking();

// #ifdef APP-HARMONY
gcActionTracking.startTracking();
// #endif

gcResourceTracking.startTracking({
  enableIOS: false
});

// Traditional uni-app JavaScript cannot use APP-IOS/APP-ANDROID conditions.
// APP-PLUS includes Android and iOS while keeping this Browser Session Replay
// bootstrap out of Harmony builds.
// #ifdef APP-PLUS
const jsCode = `
    // Dynamically create and load external script
    var script = document.createElement('script');
    script.src = 'https://static.guance.com/browser-sdk/v3/dataflux-rum.js';
    script.onload = function() {
	  DATAFLUX_RUM.setGlobalContextProperty('wgt_id', 'wgt_id_1');
	  DATAFLUX_RUM.setGlobalContextProperty('wgt_name', 'wgt_name_1');
      // Initialize after script loads
	  window.DATAFLUX_RUM &&
	    window.DATAFLUX_RUM.init({
	      // Bridge mode still validates an intake origin, but sends RUM data through
	      // FTWebViewJavascriptBridge instead of making requests to this address.
	      datakitOrigin: window.location.origin,
	    })
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
