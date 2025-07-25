<template>
	<view>
		<text>Page mixin method implements rum view, note that it needs to be used separately from GCWatchRouter otherwise view data will be reported repeatedly</text>
		
	</view>
</template>

<script>
import { rumViewMixin } from '../../GCPageViewMixinOnly.js';
	export default {
		data() {
			return {
				
			}
		},
		mixins:[rumViewMixin],
		methods: {
			
		}
	}
</script>

<style>

</style>
