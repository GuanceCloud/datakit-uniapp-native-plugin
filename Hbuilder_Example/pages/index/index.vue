<template>
		<view class="btn-list">
			<button type="primary" @click="bindUser()">Bind User</button>
			<button type="primary" @click="unbindUser()">Unbind User</button>
			<button type="primary" @click="appendGlobalContext()">appendGlobalContext</button>
			<button type="primary" @click="appendRUMGlobalContext()">appendRUMGlobalContext</button>
			<button type="primary" @click="appendLogGlobalContext()">appendLogGlobalContext</button>
			<button type="primary" @click="appendBridgeContext()">appendBridgeContext</button>
			<button type="primary" @click="flushSyncData()">Manual Data Sync</button>
			<button type="primary" @click="clearAllData()">Clear Unsynchronized Local Data</button>
			<button type="primary" @click="interfaceConfigSmokeTest()">Interface Config Smoke Test</button>
			<button type="primary" @click="manuallySetApplicationStart()">Manual Application Start</button>
			<button type="warn" @click="shutDown()">SDK Shutdown</button>
			<button type="primary" @click="navigatorToLogPage()">Log Output</button>
			<navigator url="../tracing/tracing">
				<button type="primary">Network Link Tracing</button>
			</navigator>
			<navigator url="../rum/rum">
				<button type="primary">RUM Data Collection</button>
			</navigator>
			<navigator url="../webview/webView">
				<button type="primary">WebView</button>
			</navigator>
		</view>
	
</template>

<script>
	import {
		gcPageMixin
	} from '@/uni_modules/GC-UniPlugin/js_sdk';
	import {
		logger,
		mobileAgent as ftMobileSDK,
		rum,
		tracer
	} from '@/uni_modules/GC-UniPlugin';
	import * as SDKConst from '@/utils.js'
	export default {
		data() {
			return {}
		},
		mixins:[gcPageMixin],
		onReady(){
			console.log('index onReady')
		},
		methods: {
          bindUser(){
          	ftMobileSDK.bindRUMUserData({
				'userId':'Test userId',
				'userName':'Test name',
				'userEmail':'test@123.com',
				'extra':{
					'age':'20'
				}
			})
          },
		  unbindUser(){
			  ftMobileSDK.unbindRUMUserData()
		  },
		  appendGlobalContext(){
			  ftMobileSDK.appendGlobalContext({
				  'ft_global_key':'ft_global_value'
			  })
		  },
		  appendRUMGlobalContext(){
		  	  ftMobileSDK.appendRUMGlobalContext({
				  'ft_global_rum_key':'ft_global_rum_value'
  			  })
		  },
		  appendLogGlobalContext(){
		  	  ftMobileSDK.appendLogGlobalContext({
				  'ft_global_log_key':'ft_global_log_value'
		     })
		  },
		  appendBridgeContext(){
			  ftMobileSDK.appendBridgeContext({
				 'ft_bridge_context': 'ft_bridge_context_value'
			 })
		  },
		  flushSyncData(){
		  	  ftMobileSDK.flushSyncData()
		  },
		  clearAllData(){
		  	  ftMobileSDK.clearAllData()
		  },
		  interfaceConfigSmokeTest(){
			  ftMobileSDK.sdkConfig({
				  datawayUrl: SDKConst.SERVER_URL,
				  clientToken: SDKConst.CLIENT_TOKEN,
				  env: 'common',
				  debug: true,
				  service: 'df_rum_android_interface',
				  autoSync: false,
				  syncPageSize: 10,
				  syncSleepTime: 100,
				  enableDataIntegerCompatible: true,
				  compressIntakeRequests: false,
				  enableLimitWithDbSize: true,
				  dbDiscardStrategy: 'discardOldest',
				  globalContext: {
					  interface_sdk_globalContext: 'interface_sdk_globalContext'
				  }
			  })
			  rum.setConfig({
				  androidAppId: SDKConst.ANDROID_APP_ID,
				  iOSAppId: SDKConst.IOS_APP_ID,
				  sampleRate: 1,
				  sessionOnErrorSampleRate: 1,
				  enableNativeUserAction: true,
				  enableNativeUserView: true,
				  enableNativeUserResource: true,
				  enableResourceHostIP: true,
				  enableTrackNativeCrash: true,
				  enableTrackNativeAppANR: true,
				  enableTrackNativeFreeze: true,
				  nativeFreezeDurationMs: 400,
				  errorMonitorType: ['cpu', 'memory'],
				  deviceMonitorType: ['cpu', 'memory', 'fps'],
				  detectFrequency: 'frequent',
				  rumDiscardStrategy: 'discardOldest',
				  rumCacheLimitCount: 1000,
				  enableTraceWebView: true,
				  allowWebViewHost: [],
				  globalContext: {
					  interface_rum_globalContext: 'interface_rum_globalContext'
				  }
			  })
			  logger.setConfig({
				  sampleRate: 1,
				  enableLinkRumData: true,
				  enableCustomLog: true,
				  discardStrategy: 'discardOldest',
				  logLevelFilters: ['info', 'warning', 'error', 'critical', 'ok'],
				  logCacheLimitCount: 1000,
				  globalContext: {
					  interface_logger_globalContext: 'interface_logger_globalContext'
				  }
			  })
			  tracer.setConfig({
				  sampleRate: 1,
				  traceType: 'traceparent',
				  enableLinkRUMData: true
			  })
			  logger.logging({
				  content: 'Interface Config Smoke Test',
				  status: 'debug',
				  property: {
					  interface_config_smoke_test: 'passed'
				  }
			  })
			  const header = tracer.getTraceHeader({
				  key: 'interface-config-smoke-test',
				  url: 'https://httpbin.org/status/200'
			  })
			  console.log('Interface Config Smoke Test header:' + JSON.stringify(header))
		  },
		  manuallySetApplicationStart(){
			  ftMobileSDK.manuallySetApplicationStart()
		  },
		  shutDown(){
			  ftMobileSDK.shutDown()
		  },
		  navigatorToLogPage(){
			  uni.navigateTo({
			    url: '../logging/logging?id=123&name=test'
			  });
		 },
		}
	}
</script>

<style>

</style>
