<template>
	<view class="btn-list">
		<button type="primary" @click="tracing()">网络链路追踪</button>
	</view>
</template>

<script>
	import Utils from '../../utils.js';
	var tracer = uni.requireNativePlugin("GCUniPlugin-Tracer");
	let requestUrl =
		"http://testing-ft2x-api.cloudcare.cn/api/v1/account/permissions";
	export default {
		data() {
			return {

			}
		},
		methods: {
			tracing() {
				let key = Utils.getUUID();
				var header = tracer.getTraceHeader({
					'key': key,
					'url': requestUrl,
				})
				console.log('调用getTraceHeader:' + header)
				Utils.request(requestUrl, header)
			}
		},
	}
</script>

<style>

</style>
