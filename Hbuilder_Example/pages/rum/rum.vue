<template>
	<view class="btn-list">
		<button type="primary" @click="onCreateView()">View OnCreate</button>
		<button type="primary" @click="startView()">View Start</button>
		<button type="primary" @click="stopView()">View Stop</button>
		<navigator url="../rum/rum-view-mixin">
			<button type="primary">View Mixin Example</button>
		</navigator>
		<button type="primary" @click="startAction()">Start Action</button>
		<button type="primary" @click="addAction()">Add Action</button>
		<button type="primary" @click="addError()">Add Error</button>
		<button type="primary" @click="resource()">Resource Normal</button>
		<button type="primary" @click="resourceError()">Resource Error</button>
	</view>
</template>

<script>
	import Utils from '../../utils.js';

	var rum = uni.requireNativePlugin("GCUniPlugin-RUM");
	export default {
		data() {
			return {}
		},
		onLoad() {
			console.log('rum onLoad')
		},
		onShow() {
			console.log('rum onShow')
		},
		onReady(){
			console.log('rum onReady')
		},
		methods: {
			onCreateView() {
				rum.onCreateView({
					'viewName': 'custom_rum',
					'loadTime': 100000000,
				})
			},
			startView() {
				rum.startView({
					'viewName': 'custom_rum',
					'property': {
						'startView_property': 'uni_test'
					}
				})
			},
			stopView() {
				rum.stopView({
					'property': {
						'stopView_property': 'uni_test'
					}
				})
			},
			startAction() {
				rum.startAction({
					'actionName': 'Button',
					'actionType': 'click',
					'property': {
						'action_property': 'uni_test'
					}
				})
			},
			addAction() {
				rum.addAction({
					'actionName': 'addButton',
					'actionType': 'click',
					'property': {
						'action_property': 'uni_test'
					}
				})
			},
			addError() {
				rum.addError({
					'message': 'Error message',
					'stack': 'Error stack',
					'property': {
						'error_property': 'uni_test'
					}
				})
			},
			resourceError() {
				Utils.rumRequest('https://httpbin.org/status/400', 'GET', {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				})
			},
			resource() {
				Utils.rumRequest('https://httpbin.org/status/200', 'GET', {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				})
			},
		}
	}
</script>

<style>

</style>
