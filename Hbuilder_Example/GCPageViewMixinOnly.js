/**
 * Used for single View data collection, not used together with GCWatchRouter.js
 */
var rum = uni.requireNativePlugin("GCUniPlugin-RUM");
var loadStart;

/**
 * Get the current page route path 
 * @returns {string|null} The current page route (e.g. "pages/home/index"), returns null if failed
 */
const getCurrentPagePath = () => {
  try {
    return getCurrentPages().pop()?.route || null;
  } catch (e) {
    return null;
  }
};

export const rumViewMixin = {
	onLoad() {
		loadStart = new Date().getTime() * 1000000
	},
	onReady() {
		// The page has completed its initial rendering.
		const loadEnd = new Date().getTime() * 1000000
		var duration = 0;
		if (loadStart !== null) {
			duration = (loadEnd - loadStart);
		}
		loadStart = null;
		let pagePath = getCurrentPagePath();
		if (pagePath === null){
			return;
		}
		if (duration >= 0 ) {
			rum.onCreateView({
				'viewName': pagePath,
				'loadTime': duration,
			})
		}
		rum.startView({
			'viewName': pagePath
		})

	},
	onShow() {
		// The page is triggered each time it appears on the screen.
		if (loadStart === null) {
			let pagePath = getCurrentPagePath();
			if (pagePath !== null){
			rum.startView({
				'viewName': pagePath
			})
			}
		}
	},
	onUnload() {
		rum.stopView()
	}

}
