<template>
	<view class="btn-list">
		<button type="primary" @click="log('info')">Log Status:info</button>
		<button type="primary" @click="log('warning')">Log Status:warning</button>
		<button type="primary" @click="log('error')">Log Status:error</button>
		<button type="primary" @click="log('critical')">Log Status:critical</button>
		<button type="primary" @click="log('ok')">Log Status:ok</button>
	</view>
</template>

<script>
	import { logger } from '@/uni_modules/GC-UniPlugin';
	export default {
		data() {
			return {}
		},
		methods: {
			log(status) {
				logger.logging({
					'content':`Log Status: ${status}`,
					'status':status,
					'property':{
					'log_property':'uni_test'
				}
				})
			}
		}
	}
</script>

<style>

</style>
