<script>
	import {
		initializeGuanceSDK
	} from './sdk-bootstrap.js'
	import {
		gcViewTracking
	} from '@/uni_modules/GC-UniPlugin/js_sdk'
	export default {
		onLaunch: function() {
			initializeGuanceSDK()
		},
		onShow: function() {
			gcViewTracking.handleAppShow()
		},
		onHide: function() {
			gcViewTracking.handleAppHide()
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
