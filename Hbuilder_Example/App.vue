<script>
	import {
		initializeGuanceSDK
	} from './sdk-bootstrap.js'

	export default {
		onLaunch: function() {
			initializeGuanceSDK()
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
