<template>
	<view class="btn-list">
		<button type="primary" @click="navigateTo()">navigateTo</button>
		<button type="primary" @click="reLaunch()">reLaunch</button>
	</view>
</template>
    
<script>
	export default {
		methods: {
			navigateTo(){
				uni.navigateTo({
					url:'/pages/routertest/page'
				})
			},
			reLaunch(){
				uni.reLaunch({
					url:'/pages/routertest/tab3'
				})
			}
			
		}
	}
</script>

<style>
</style>