<template>
	<view>
		<text>页面 mixin 方式实现 rum view，注意需要与 gc_watchRouter 分开使用否则会重复上报 view 数据</text>
		
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
