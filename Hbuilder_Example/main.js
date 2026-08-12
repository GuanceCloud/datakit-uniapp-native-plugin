import App from './App'
import {
  gcViewTracking
} from '@/uni_modules/GC-UniPlugin/js_sdk'
import {
  initializeGuanceSDK
} from './sdk-bootstrap.js'

// This must precede View Tracking so the first native RUM View has a Session
// Replay sampling context. The UTS hook separately handles the earlier WebView load.
initializeGuanceSDK()

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
