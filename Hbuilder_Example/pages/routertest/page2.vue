<template>
	<view class="btn-list">
		<button type="primary" @click="redirectTo()">redirectTo</button>
		<button type="primary" @click="navigateBack()">navigateBack</button>
	</view>
</template>

<script>
	export default {
		methods: {
			redirectTo() {
				uni.redirectTo({
					url: '/pages/routertest/page'
				})
			},
			navigateBack() {
				uni.navigateBack()
			}
		}
	}
</script>

<style>
</style>