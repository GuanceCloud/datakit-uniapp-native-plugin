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
		mobileAgent
	} from '@/uni_modules/GC-UniPlugin'
	export default {
		data() {
			return {}
		},
		onReady(){
			console.log('index onReady')
		},
		methods: {
          bindUser(){
			mobileAgent.bindRUMUserData({
				'userId':'Test userId',
				'userName':'Test name',
				'userEmail':'test@123.com',
				'extra':{
					'age':'20'
				}
			})
          },
		  unbindUser(){
			  mobileAgent.unbindRUMUserData()
		  },
		  appendGlobalContext(){
			  mobileAgent.appendGlobalContext({
				  'ft_global_key':'ft_global_value'
			  })
		  },
		  appendRUMGlobalContext(){
			  mobileAgent.appendRUMGlobalContext({
				  'ft_global_rum_key':'ft_global_rum_value'
  			  })
		  },
		  appendLogGlobalContext(){
			  mobileAgent.appendLogGlobalContext({
				  'ft_global_log_key':'ft_global_log_value'
		     })
		  },
		  appendBridgeContext(){
			  mobileAgent.appendBridgeContext({
				 'ft_bridge_context': 'ft_bridge_context_value'
			 })
		  },
		  flushSyncData(){
			  mobileAgent.flushSyncData()
		  },
		  clearAllData(){
			  mobileAgent.clearAllData()
		  },
		  shutDown(){
			  mobileAgent.shutDown()
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
