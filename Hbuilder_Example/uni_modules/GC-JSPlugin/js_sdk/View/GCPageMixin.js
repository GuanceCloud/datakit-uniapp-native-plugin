/**
 * Used to supplement WatchRouter data information on the first page
 */
// #ifdef APP-HARMONY
import { getRUM } from '@/utils/pluginManager.js';
var rum = getRUM();
// #endif
// #ifndef APP-HARMONY
var rum = uni.requireNativePlugin("GCUniPlugin-RUM");
// #endif

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

export const gcPageMixin = {
	data() {
		return {
			loadStart: 0
		}
	},
	onLoad() {
		this.loadStart = new Date().getTime() * 1000000
	},
	onReady() {
		if (getApp().globalData.GCFirstLoad) {
			getApp().globalData.GCFirstLoad = false
			const loadEnd = new Date().getTime() * 1000000
			let duration = (loadEnd - this.loadStart);
			let pagePath = getCurrentPagePath();
			if (pagePath === null) {
				return;
			}
			if (this.loadStart !== null && duration >= 0) {
				rum.onCreateView({
					'viewName': pagePath,
					'loadTime': duration,
				})
			}
			this.loadStart = null;
			rum.startView({
				'viewName': pagePath
			})
		}
	}
}