/**
 * 采集 RUM View Event
 * 注意： 由于 App 的生命周期 onLaunch、onShow 早于第一个 page 的生命周期之前
 * 所以需要在 App 第一个显示的 page 内使用 GCPageMixin 补充页面信息，否则无法获取第一个页面的 viewName
 */
var rum = uni.requireNativePlugin("GCUniPlugin-RUM");
var loadStart;
var currentPage;

export default {
	globalData:{
		GCFirstLoad:true,
	},
	onLaunch: function() {
		this.startWatch()
	},
	onShow: function() {
		var pages = getCurrentPages()
		if (pages.length > 0) {
			let pageInstance = pages[pages.length - 1]
			console.log("onShow", pageInstance)
			currentPage = pageInstance.route
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
			var navBackPagesLength = 0
			uni.addInterceptor('navigateTo', {
				invoke(e) {
					gc.rumRecordNewView(e.url)
				},
				success(){
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
					navBackPagesLength = getCurrentPages().length
					if(navBackPagesLength > 1){
						gc.rumRecordNewView(null)
					}
				},
				success(result) {
					if(navBackPagesLength>1){
						console.log('currentPageLength:'+navBackPagesLength)
						gc.navigateBack()
					}
				}
			})
		},
		rumRecordNewView(url) {
			loadStart = new Date().getTime() * 1000000
			if(url !== null){
				currentPage = url.split('?')[0]
			}else{
				currentPage = null
			}
		},
		rumStopOldStartNew(addListener = true) {
			if (currentPage) {
				console.log("stopView")
				rum.stopView()
				const loadEnd = new Date().getTime() * 1000000
				let duration = (loadEnd - loadStart);
				if (loadStart !== null && duration >= 0) {
					rum.onCreateView({
						'viewName': currentPage,
						'loadTime': duration,
					})
				}
				console.log("startView", currentPage)
				rum.startView({
					'viewName': currentPage
				})
				if(addListener){
					this.addPopGestureEventListener()
				}
			}
			loadStart = null;
		},
		navigateBack(){
			var pages = getCurrentPages()
			if (pages.length > 0) {
				let pageInstance = pages[pages.length - 1]
				currentPage = pageInstance.route
				this.rumStopOldStartNew(false)
			}
		},
		addPopGestureEventListener(){
			var pages = getCurrentPages()
			if (pages.length > 0) {
				let pageInstance = pages[pages.length - 1]
				let object = pageInstance.$getAppWebview()
				let gc = this;
				console.log('addEventListener:'+object)
				object.addEventListener('popGesture',gc.eventListenerPopGesture)
				let orionclose = object.onclose
				object.onclose = function (result){
					console.log('onclose')
					object.removeEventListener('popGesture',gc.eventListenerPopGesture)
					orionclose(result)
				}
			}
		},
		eventListenerPopGesture(e){
			let progress = e.progress
			if(progress == 100){
				console.log('popGesture',e)
				this.navigateBack()
			}
		}
	}

}
