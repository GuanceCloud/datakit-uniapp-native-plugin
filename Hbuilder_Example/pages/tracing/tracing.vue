<template>
	<view class="btn-list">
		<button type="primary" @click="tracing()">Network Link Tracing</button>
	</view>
</template>

<script>
	import Utils from '../../utils.js';
	var tracer = uni.requireNativePlugin("GCUniPlugin-Tracer");
	let requestUrl = "http://10.100.64.166:8000/api/user";
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
				console.log('Calling getTraceHeader:' + header)
				Utils.request(requestUrl, header)
			}
		},
	}
</script>

<style>

</style>
