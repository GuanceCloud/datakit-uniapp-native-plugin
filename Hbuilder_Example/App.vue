<script>
	import * as SDKConst from '@/utils.js'
	import WatchRouter from '@/GCWatchRouter.js'	
	var ftMobileSDK = uni.requireNativePlugin("GCUniPlugin-MobileAgent");
	var logger = uni.requireNativePlugin("GCUniPlugin-Logger");
	var rum = uni.requireNativePlugin("GCUniPlugin-RUM");
	var tracer = uni.requireNativePlugin("GCUniPlugin-Tracer");
    export var appState = 'startup';
	export default {
		mixins:[WatchRouter],
		onLaunch: function() {
			ftMobileSDK.sdkConfig({
				'datakitUrl': SDKConst.SERVER_URL,
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
				'errorMonitorType': ['cpu', 'memory'],
				'deviceMonitorType': 'all',
				'enableNativeUserResource':true,
				'enableTrackNativeCrash':true,
				'enableTrackNativeAppANR':true,
				'enableTrackNativeFreeze':true,
				'nativeFreezeDurationMs':400,
				'rumDiscardStrategy':'discardOldest',
				'rumCacheLimitCount': 10000,
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
					'warning',
					'error'
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
		},
		onShow: function() {
			appState = 'run'
		},
		onHide: function() {
		},
		onError: function(err) {
			if (err instanceof Error) {
				console.log('Error name:', err.name);
				console.log('Error message:', err.message);
				console.log('Error stack:', err.stack);
				if (rum) {
					rum.addError({
						'message': err.message,
						'stack': err.stack,
						'state': 'run',
					})
				}
			} else if (err instanceof String) {
				console.log('Error:', err);
				if (rum) {
					rum.addError({
						'message': err,
						'stack': err,
						'state': 'run',
					})
				}
			}
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
