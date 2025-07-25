/**
 * Used for single View data collection, not used together with GCWatchRouter.js
 */
var rum = uni.requireNativePlugin("GCUniPlugin-RUM");
var loadStart;
export const rumViewMixin = {
	onLoad() {
		loadStart = new Date().getTime() * 1000000
		console.log('onLoad');
	},
	onReady() {
		const loadEnd = new Date().getTime() * 1000000
		let duration = (loadEnd - loadStart);
		if (loadStart !== null && duration >= 0) {
			rum.onCreateView({
				'viewName': this.route,
				'loadTime': duration,
			})
		}
		loadStart = null;
		rum.startView({
			'viewName': this.route
		})

	},
	onShow() {
		if (loadStart != null) {
			rum.startView({
				'viewName': this.route
			})
		}
	},
	onHide() {
		rum.stopView()
	},

}
