<template>
	<view class="btn-list">
		<button type="primary" @click="tracing()">Network Link Tracing</button>
	</view>
</template>

<script>
	import Utils from '../../utils.js';
	import { tracer } from '@/gc-build-entry.js';
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
				// #ifdef APP-HARMONY
				uni.request({
					url: requestUrl,
					header: header,
					__gcResourceKey: key
				})
				// #endif
				// #ifndef APP-HARMONY
				Utils.request(requestUrl, header)
				// #endif
			}
		},
	}
</script>

<style>

</style>
