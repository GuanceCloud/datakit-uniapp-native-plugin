/**
 * Collect RUM View Event
 * Note: Since the App lifecycle onLaunch, onShow occurs before the first page lifecycle
 * So you need to use GCPageMixin in the first displayed page of the App to supplement page information, otherwise you cannot get the viewName of the first page
 */
var rum = uni.requireNativePlugin("GCUniPlugin-RUM");

export const gcWatchRouter = {
	globalData: {
		GCFirstLoad: true,
	},
	data() {
		return {
			loadStart: null,
			currentPage: null,
			navBackPagesLength: 0
		};
	},
	onLaunch: function() {
		this.startWatch()
	},
	onShow: function() {
		var pages = getCurrentPages()
		if (pages.length > 0) {
			let pageInstance = pages[pages.length - 1]
			console.log("onShow", pageInstance)
			this.currentPage = pageInstance.route
			rum.startView({
				'viewName': pageInstance.route
			})
		}

	},
	onHide: function() {
		//console.log("onHide")
		rum.stopView()
	},
	methods: {
		startWatch() {
			var gc = this
			uni.addInterceptor('navigateTo', {
				invoke(e) {
					gc.rumRecordNewView(e.url)
				},
				success() {
					gc.rumStopOldStartNew()
				}
			})
			uni.addInterceptor('redirectTo', {
				invoke(e) {
					gc.rumRecordNewView(e.url)
				},
				success() {
					gc.rumStopOldStartNew()
				}
			})
			uni.addInterceptor('reLaunch', {
				invoke(e) {
					gc.rumRecordNewView(e.url)
				},
				success() {
					gc.rumStopOldStartNew()
				}
			})
			uni.addInterceptor('switchTab', {
				invoke(e) {
					gc.rumRecordNewView(e.url)
				},
				success() {
					gc.rumStopOldStartNew()
				}
			})
			uni.addInterceptor('navigateBack', {
				invoke() {
					this.navBackPagesLength = getCurrentPages().length
					if (this.navBackPagesLength > 1) {
						gc.rumRecordNewView(null)
					}
				},
				success(result) {
					if (this.navBackPagesLength > 1) {
						console.log('currentPageLength:' + this.navBackPagesLength)
						gc.navigateBack()
					}
				}
			})
		},
		rumRecordNewView(url) {
			this.loadStart = new Date().getTime() * 1000000
			if (url !== null) {
				this.currentPage = url.split('?')[0]
			} else {
				this.currentPage = null
			}
		},
		rumStopOldStartNew(addListener = true) {
			if (this.currentPage) {
				console.log("stopView")
				rum.stopView()
				const loadEnd = new Date().getTime() * 1000000
				let duration = (loadEnd - this.loadStart);
				if (this.loadStart !== null && duration >= 0) {
					rum.onCreateView({
						'viewName': this.currentPage,
						'loadTime': duration,
					})
				}
				console.log("startView", this.currentPage)
				rum.startView({
					'viewName': this.currentPage
				})
				if (addListener) {
					this.addPopGestureEventListener()
				}
			}
			this.loadStart = null;
		},
		navigateBack() {
			var pages = getCurrentPages()
			if (pages.length > 0) {
				let pageInstance = pages[pages.length - 1]
				this.currentPage = pageInstance.route
				this.rumStopOldStartNew(false)
			}
		},
		addPopGestureEventListener() {
			var pages = getCurrentPages()
			if (pages.length > 0) {
				let pageInstance = pages[pages.length - 1]
				let object = pageInstance.$getAppWebview()
				let gc = this;
				console.log('addEventListener:' + object)
				object.addEventListener('popGesture', gc.eventListenerPopGesture)
				let orionclose = object.onclose
				object.onclose = function(result) {
					console.log('onclose')
					object.removeEventListener('popGesture', gc.eventListenerPopGesture)
					orionclose(result)
				}
			}
		},
		eventListenerPopGesture(e) {
			let progress = e.progress
			if (progress == 100) {
				console.log('popGesture', e)
				this.navigateBack()
			}
		}
	}

}