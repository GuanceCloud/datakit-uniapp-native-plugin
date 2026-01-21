<script>
	import * as SDKConst from '@/utils.js'
	import {gcWatchRouter} from '@/uni_modules/GC-JSPlugin';
	import { getMobileAgent, getRUM, getLogger, getTracer } from '@/utils/pluginManager.js';
	
	var ftMobileSDK = getMobileAgent();
	var logger = getLogger();
	var rum = getRUM();
	var tracer = getTracer();
export default {
		mixins:[gcWatchRouter],
		onLaunch: function() {
			ftMobileSDK.sdkConfig({
				'datakitUrl': SDKConst.SERVER_URL,
				//'datawayUrl': SDKConst.DATAWAY_URL,
				//'clientToken': SDKConst.CLIENT_TOKEN,
				// 'autoSync': true,
				// 'syncPageSize': 15,
				// 'syncSleepTime': 100,
				// 'enableDataIntegerCompatible':true,
				// 'compressIntakeRequests':true,
				// 'dbCacheLimit':30*1024,
				// 'enableLimitWithDbSize':true,
				// 'dbDiscardStrategy':'discard',
				'debug': true,
				'env': 'common',
				'globalContext': {
					'sdk_globalContext': 'custom_sdk_globalContext'
				}
			})
			rum.setConfig({
				'androidAppId': SDKConst.ANDROID_APP_ID,
				'iOSAppId': SDKConst.IOS_APP_ID,
				'harmonyAppId': SDKConst.HARMONY_APP_ID,
				'errorMonitorType': ['cpu', 'memory'],
				'deviceMonitorType': 'all',
				'enableNativeUserResource':true,
				'enableTrackNativeCrash':true,
				'enableTrackNativeAppANR':true,
				'enableTrackNativeFreeze':true,
				'nativeFreezeDurationMs':400,
				'rumDiscardStrategy':'discardOldest',
				'rumCacheLimitCount': 10000,
				'enableTraceWebView': true,
				'allowWebViewHost': ['10.100.64.166'],
				'globalContext': {
					'track_id': SDKConst.TRACK_ID,
					'rum_globalContext': 'custom_rum_globalContext'
				}
			})
			logger.setConfig({
				'enableLinkRumData': true,
				'enableCustomLog': true,
				'discardStrategy': 'discardOldest',
				'logLevelFilters': [
					'info',
					'warn',
					'error',
					'fatal'
				],
				'logCacheLimitCount':6000,
				'globalContext': {
					'logger_globalContext': 'custom_logger_globalContext'
				}
			})
			tracer.setConfig({
				'traceType': 'ddTrace',
				'enableLinkRUMData':true,
			})
		}
	}
</script>

<style>
	/* Common CSS for each page */
	.btn-list {
		padding: 0px 30px;
	}

	.btn-list button {
		margin-top: 20px;
		font-size: 34rpx;
	}

	.text-area {
		display: flex;
		justify-content: center;
	}

	.title {
		font-size: 24rpx;
		color: #66ccff;
	}
</style>
