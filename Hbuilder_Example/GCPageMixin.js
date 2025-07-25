/**
 * Used to supplement WatchRouter data information on the first page
 */
var rum = uni.requireNativePlugin("GCUniPlugin-RUM");
var loadStart;
export default {
	onLoad() {
		loadStart = new Date().getTime() * 1000000
		//console.log('onLoad');
	},
	onReady() {
		//console.log('onReady');
		if (getApp().globalData.GCFirstLoad) {
			getApp().globalData.GCFirstLoad = false
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
		}
	}


}
