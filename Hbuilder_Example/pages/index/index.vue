<template>
		<view class="btn-list">
			<button type="primary" @click="bindUser()">绑定用户</button>
			<button type="primary" @click="unbindUser()">解绑用户</button>
			<button type="primary" @click="appendGlobalContext()">appendGlobalContext</button>
			<button type="primary" @click="appendRUMGlobalContext()">appendRUMGlobalContext</button>
			<button type="primary" @click="appendLogGlobalContext()">appendLogGlobalContext</button>		
			<button type="primary" @click="flushSyncData()">主动数据同步</button>
			<button type="primary" @click="clearAllData()">清除未同步本地数据</button>
			<navigator url="../logging/logging">
				<button type="primary">日志输出</button>
			</navigator>
			<navigator url="../tracing/tracing">
				<button type="primary">网络链路追踪</button>
			</navigator>
			<navigator url="../rum/rum">
				<button type="primary">RUM数据采集</button>
			</navigator>
		</view>
	
</template>

<script>
	import GCPageMixin from '../../GCPageMixin.js';
	var ftMobileSDK = uni.requireNativePlugin("GCUniPlugin-MobileAgent");
	export default {
		data() {
			return {}
		},
		mixins:[GCPageMixin],
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
		  flushSyncData(){
		  	  ftMobileSDK.flushSyncData()
		  },
		  clearAllData(){
		  	  ftMobileSDK.clearAllData()
		  },
		}
	}
</script>

<style>

</style>
