<template>
	<view class="btn-list">
		<!-- #ifdef APP-HARMONY -->
		<button type="warn" @click="triggerHarmonyNativeCrash()">Trigger Harmony Native Crash</button>
		<button type="warn" @click="triggerHarmonyLongTask()">Trigger Harmony Long Task (3s)</button>
		<button type="warn" @click="triggerHarmonyNativeANR()">Trigger Harmony Native ANR (10s)</button>
		<!-- #endif -->
	</view>
</template>

<script>
	// #ifdef APP-HARMONY
	import { blockHarmonyMainThread } from '@/uni_modules/gc-test'
	// #endif

	export default {
		methods: {
			triggerHarmonyNativeCrash() {
				// #ifdef APP-HARMONY
				uni.showModal({
					title: 'Trigger Native Crash',
					content: 'This test immediately terminates the Harmony process. Reopen the app manually to let the SDK collect the native crash event.',
					confirmText: 'Crash',
					success: (result) => {
						if (result.confirm) {
							uni.__createAppCrash()
						}
					}
				})
				// #endif
			},
			triggerHarmonyLongTask() {
				// #ifdef APP-HARMONY
				uni.showModal({
					title: 'Trigger Long Task',
					content: 'This blocks the Harmony UI thread for 3 seconds. enableTrackNativeFreeze must be enabled and nativeFreezeDurationMs must be below 3000.',
					confirmText: 'Block 3s',
					success: (result) => {
						if (result.confirm) {
							blockHarmonyMainThread(3000)
						}
					}
				})
				// #endif
			},
			triggerHarmonyNativeANR() {
				// #ifdef APP-HARMONY
				uni.showModal({
					title: 'Trigger Native ANR',
					content: 'This test blocks the Harmony UI thread for 10 seconds. Make sure enableTrackNativeAppANR is enabled before continuing.',
					confirmText: 'Block 10s',
					success: (result) => {
						if (result.confirm) {
							blockHarmonyMainThread(10000)
						}
					}
				})
				// #endif
			}
		}
	}
</script>

<style>
</style>
