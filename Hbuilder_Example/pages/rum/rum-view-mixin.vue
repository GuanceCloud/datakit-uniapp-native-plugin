<template>
	<view>
		<text>Page mixin method implements rum view, note that it needs to be used separately from GCWatchRouter otherwise view data will be reported repeatedly</text>
		
	</view>
</template>

<script>
import  {gcPageViewMixinOnly} from '@/uni_modules/GC-JSPlugin';
	export default {
		data() {
			return {
				
			}
		},
		mixins:[gcPageViewMixinOnly],
		methods: {
			
		}
	}
</script>

<style>

</style>
