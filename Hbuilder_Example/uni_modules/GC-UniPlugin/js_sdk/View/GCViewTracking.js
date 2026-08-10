import {
	rum as gcRum
} from '@/uni_modules/GC-UniPlugin';

const FT_JS_PLUGIN_VERSION = '0.2.7-alpha.1';

// #ifndef VUE3
import Vue from 'vue';
// #endif

class PageMonitor {
	constructor() {
		// Plugin status
		this.initialized = false;
		this.pageHookInstalled = false;
		// Homepage status flag
		this.firstPageDetected = false;
		this.appLaunched = false;
		// Page data
		this.loadStart = null;
		this.currentPage = null;
		this.activeViewPath = null;
		this.navBackPagesLength = 0;
		this.pendingViewLoadMap = {};
		this.pageLoadStartMap = {};
		this.pendingViewShowMap = {};
		this.loadedViewPathMap = {};
		this.loadedPageVms = new WeakSet();
		this.sessionReplayJS = null;
		this.sessionReplayInjectedWebViews = new WeakSet();
		// Store event listeners for easy destruction
		this.eventListeners = [];
		// Native RUM plugin
		this.rum = gcRum;
	}

	// Initialize monitoring
	startTracking(app) {

		if (this.initialized) return;
		this.initialized = true;

		console.log(`[FTLog] View tracking initialized (version: ${FT_JS_PLUGIN_VERSION})`);

		try {
			//	#ifdef APP-PLUS

			// 1. Record app launch time (execute as early as possible)
			this.recordAppLaunchTime();
			this.pageHookInstalled = this.installPageHooks(app);

			// Monitor App lifecycle
			this.watchAppLifecycle();

			// Monitor route changes
			this.startWatchRouter();

			this.checkInitialPage();

			console.log('[FTLog] View tracking plugin initialized successfully');
			// #endif
		} catch (error) {
			console.error('[FTLog] View tracking plugin initialization failed:', error);
			this.initialized = false;
		}
	}
	installPageHooks(app) {
		const mixin = {
			onLoad() {
				gcViewTracking.handlePageLoad(this);
			},
			onReady() {
				gcViewTracking.handlePageReady(this);
			},
			onShow() {
				gcViewTracking.handlePageShow(this);
			},
			onHide() {
				gcViewTracking.handlePageHide(this);
			},
			onUnload() {
				gcViewTracking.handlePageUnload(this);
			}
		};

		if (app && typeof app.mixin === 'function') {
			app.mixin(mixin);
			console.log('[FTLog] View tracking page hooks installed through app.mixin');
			return true;
		}

		// #ifndef VUE3
		if (typeof Vue !== 'undefined' && Vue && typeof Vue.mixin === 'function') {
			Vue.mixin(mixin);
			console.log('[FTLog] View tracking page hooks installed through Vue.mixin');
			return true;
		}
		// #endif

		console.warn('[FTLog] View tracking page hooks were not installed, falling back to router success timing');
		return false;
	}
	checkInitialPage() {
		if (!this.initialized || this.firstPageDetected) return;

		const page = getCurrentPages().pop();
		const pagePath = this.getPagePath(page);
		if (!pagePath) {
			return;
		}

		this.currentPage = pagePath;
		if (this.pageHookInstalled) {
			// The page hooks own loadTime. A page already present here may have
			// finished rendering, so there is no trustworthy load start to report.
			if (page.$vm) {
				this.loadedPageVms.add(page.$vm);
			}
			this.loadedViewPathMap[this.getViewKey(pagePath)] = true;
			this.activateView(pagePath);
			this.firstPageDetected = true;
			return;
		}
		this.loadStart = this.getLaunchStartTime();
		console.log('[FTLog] First page fallback check:' + pagePath);
		this.rumStartView();
		this.firstPageDetected = true;
	}
	getCurrentPagePath(){
		const page = getCurrentPages().pop()
		return this.getPagePath(page);
	}
	evalSessionReplayJS(js) {
		if (this.sessionReplayJS !== js) {
			this.sessionReplayInjectedWebViews = new WeakSet();
		}
		this.sessionReplayJS = js;
	}
	// Check initial page and record
	watchAppLifecycle() {
		try {
			const addAppListener = (event, callback) => {
				try {
					if (typeof plus !== 'undefined') {
						plus.globalEvent.addEventListener(event, callback);
						this.eventListeners.push({
							event,
							callback
						});
						return true;
					}
					console.warn(`[FTLog] Unsupported event listener type: ${event}`);
					return false;
				} catch (e) {
					console.error(`[FTLog] Failed to add event listener ${event}:`, e);
					return false;
				}
			};

			// Listen for App display
			addAppListener('resume', () => {
				const pagePath = this.getCurrentPagePath();
				if (!pagePath) return;
				this.currentPage = pagePath;
				console.log('[FTLog] App display (resume) detected:' + pagePath);
				this.activateView(pagePath);
			});

			// Listen for App hiding
			addAppListener('pause', () => {
				console.log('[FTLog] App hiding (pause) detected');
				this.deactivateView();
			});

			console.log('[FTLog] watchAppLifecycle internal logic executed successfully');
		} catch (error) {
			console.error('[FTLog] Error executing watchAppLifecycle method:', error);
			// Throw error for upper layer to catch, avoid silent failure
			throw error;
		}
	}

	// Record app launch time (core: execute as early as possible)
	recordAppLaunchTime() {
		// Weex App cold start time (obtained through native events)
		if (typeof plus !== 'undefined') {
			// If native launch time is available (supported by some Android devices)
			if (plus.runtime.launchTime) {
				this.appLaunchTime = plus.runtime.launchTime;
			} else {
				// Otherwise use current time as launch time (slightly larger error, but as a fallback)
				this.appLaunchTime = Date.now();
			}
			this.appLaunched = true;
		}
	}

	// Monitor route changes
	startWatchRouter() {
		const registerRouteInterceptor = (name, collectLoadedView = true) => {
			let routePagePath = null;
			uni.addInterceptor(name, {
				invoke: (e) => {
					routePagePath = this.rumRecordNewView(e.url);
				},
				success: () => {
					const targetPagePath = routePagePath || this.currentPage;
					routePagePath = null;
					if (!this.pageHookInstalled) {
						this.rumStartView();
						return;
					}
					this.scheduleRouteFallback(targetPagePath, Date.now(), 0, collectLoadedView);
				}
			});
		};

		// Listen for navigateTo
		registerRouteInterceptor('navigateTo');

		// Listen for redirectTo
		registerRouteInterceptor('redirectTo');

		// Listen for reLaunch
		registerRouteInterceptor('reLaunch');

		// Listen for switchTab
		registerRouteInterceptor('switchTab', false);

		// Listen for navigateBack
		uni.addInterceptor('navigateBack', {
			invoke: () => {
				this.navBackPagesLength = getCurrentPages().length;
				if (this.navBackPagesLength > 1) {
					this.currentPage = null;
				}
			},
			success: () => {
				if (this.navBackPagesLength > 1) {
					if (!this.pageHookInstalled) {
						this.navigateBack();
						return;
					}
					this.scheduleViewActivationFallback();
				}
			}
		});
	}

	scheduleRouteFallback(pagePath, loadEndTime, attempt = 0, collectLoadedView = true) {
		if (!pagePath) return;
		setTimeout(() => {
			const completed = this.completeRouteFallback(
				pagePath,
				loadEndTime,
				attempt >= 5,
				collectLoadedView
			);
			if (!completed && attempt < 5) {
				this.scheduleRouteFallback(pagePath, loadEndTime, attempt + 1, collectLoadedView);
			}
		}, attempt === 0 ? 0 : 20);
	}

	completeRouteFallback(
		pagePath,
		loadEndTime,
		allowWithoutCurrentPage = false,
		collectLoadedView = true
	) {
		const normalizedPath = this.normalizePagePath(pagePath);
		const viewKey = this.getViewKey(normalizedPath);
		if (!viewKey) return true;

		const currentPagePath = this.getCurrentPagePath();
		const currentViewKey = this.getViewKey(currentPagePath);
		if (currentViewKey !== viewKey && !allowWithoutCurrentPage) {
			return false;
		}
		if (this.getViewKey(this.currentPage) !== viewKey) {
			return true;
		}
		if (this.loadedViewPathMap[viewKey] && !collectLoadedView) {
			delete this.pageLoadStartMap[viewKey];
			delete this.pendingViewShowMap[viewKey];
			this.takePendingViewLoad(normalizedPath);
			this.loadStart = null;
			this.activateView(normalizedPath, false);
			return true;
		}

		let pendingView = this.pageLoadStartMap[viewKey];
		if (pendingView) {
			delete this.pageLoadStartMap[viewKey];
		} else {
			pendingView = this.takePendingViewLoad(normalizedPath);
		}

		if (pendingView) {
			const duration = Math.max(0, loadEndTime - pendingView.startTime) * 1000000;
			const reportPath = pendingView.pagePath || normalizedPath;
			this.reportCreateView(reportPath, duration);
			this.loadedViewPathMap[viewKey] = true;
			if (pendingView.pageVm) {
				this.loadedPageVms.add(pendingView.pageVm);
			}
			const pages = getCurrentPages();
			const currentPage = pages[pages.length - 1];
			if (currentPage && currentPage.$vm) {
				this.loadedPageVms.add(currentPage.$vm);
			}
			this.loadStart = null;
		}
		delete this.pendingViewShowMap[viewKey];

		if (pendingView || this.loadedViewPathMap[viewKey]) {
			// The lifecycle fallback may start View collection, but it must not
			// broaden Session Replay injection beyond a confirmed page VM.
			this.activateView(normalizedPath, false);
		}
		return true;
	}

	scheduleViewActivationFallback(attempt = 0) {
		setTimeout(() => {
			const pagePath = this.getCurrentPagePath();
			if (!pagePath && attempt < 5) {
				this.scheduleViewActivationFallback(attempt + 1);
				return;
			}
			if (!pagePath) return;
			this.currentPage = pagePath;
			this.activateView(pagePath, false);
		}, attempt === 0 ? 0 : 20);
	}

	// Record new page
	rumRecordNewView(url) {
		const pagePath = this.resolvePagePath(url);
		const startTime = Date.now();
		this.loadStart = startTime * 1000000;
		this.currentPage = pagePath;
		if (!pagePath) {
			return;
		}
		this.pendingViewLoadMap[pagePath] = {
			startTime
		};
		return pagePath;
	}

	// Stop old page monitoring and start new page monitoring
	rumStopView(){
		this.deactivateView();
	}

	rumStartView(){
		console.log('[FTLog] this.currentPage:'+this.currentPage);
		if (this.currentPage) {
			const loadEnd = Date.now() * 1000000;
				let duration = (loadEnd - this.loadStart);
				if (this.loadStart !== null && duration >= 0) {
					this.reportCreateView(this.currentPage, duration);
				}
				this.activateView(this.currentPage);
			}
			this.loadStart = null;
	}
	// Handle back navigation
	navigateBack() {
		const pages = getCurrentPages();
		if (pages.length > 0) {
			const pageInstance = pages[pages.length - 1];
			this.currentPage = this.getPagePath(pageInstance);
			this.activateView(this.currentPage);
		}
	}

	handlePageLoad(vm) {
		// onLoad can run before getCurrentPages() exposes page.$vm, so use the
		// lifecycle receiver directly instead of filtering by page.$vm identity.
		const pagePath = this.getLifecyclePagePath(vm);
		if (!pagePath) return;

		this.currentPage = pagePath;
		if (this.loadedPageVms.has(vm)) return;

		const viewKey = this.getViewKey(pagePath);
		const pendingView = this.takePendingViewLoad(pagePath);
		if (this.loadedViewPathMap[viewKey] && !pendingView) return;
		if (this.pageLoadStartMap[viewKey]) return;

		delete this.loadedViewPathMap[viewKey];
		this.pageLoadStartMap[viewKey] = {
			pagePath,
			pageVm: vm,
			startTime: pendingView ? pendingView.startTime : Date.now()
		};
		if (!this.firstPageDetected) {
			this.firstPageDetected = true;
		}
	}

	takePendingViewLoad(pagePath) {
		const pendingPath = this.getPendingViewLoadPath(pagePath);
		const pendingView = pendingPath ? this.pendingViewLoadMap[pendingPath] : null;
		if (pendingPath) {
			delete this.pendingViewLoadMap[pendingPath];
		}
		return pendingView;
	}

	getPendingViewLoadPath(pagePath) {
		if (this.pendingViewLoadMap[pagePath]) return pagePath;
		const viewKey = this.getViewKey(pagePath);
		return Object.keys(this.pendingViewLoadMap).find(path => {
			return this.getViewKey(path) === viewKey;
		});
	}

	hasPendingViewLoad(pagePath) {
		return Boolean(this.getPendingViewLoadPath(pagePath));
	}

	handlePageReady(vm) {
		const pagePath = this.getLifecyclePagePath(vm);
		if (!pagePath) return;

		const viewKey = this.getViewKey(pagePath);
		const pendingView = this.pageLoadStartMap[viewKey];
		if (!pendingView || this.loadedPageVms.has(vm)) {
			return;
		}

		const duration = Math.max(0, Date.now() - pendingView.startTime) * 1000000;
		this.reportCreateView(pendingView.pagePath, duration);

		delete this.pageLoadStartMap[viewKey];
		this.loadedViewPathMap[viewKey] = true;
		this.loadedPageVms.add(pendingView.pageVm);
		this.loadedPageVms.add(vm);
		const pendingShow = this.pendingViewShowMap[viewKey];
		if (pendingShow) {
			delete this.pendingViewShowMap[viewKey];
			this.activateView(pendingShow.pagePath, pendingShow.injectSessionReplay);
		}
	}

	handlePageShow(vm) {
		const pagePath = this.getLifecyclePagePath(vm);
		if (!pagePath) return;

		this.currentPage = pagePath;
		const viewKey = this.getViewKey(pagePath);
		const pageLoad = this.pageLoadStartMap[viewKey];
		const pendingRoutePath = this.getPendingViewLoadPath(pagePath);
		if (pageLoad || pendingRoutePath) {
			this.pendingViewShowMap[viewKey] = {
				pagePath: pageLoad ? pageLoad.pagePath : pendingRoutePath,
				injectSessionReplay: this.isPageVm(vm)
			};
			return;
		}
		// View collection accepts lifecycle proxies. Session Replay injection
		// keeps the original page.$vm identity boundary.
		this.activateView(pagePath, this.isPageVm(vm));
	}

	handlePageHide(vm) {
		const pagePath = this.getPagePathFromVm(vm);
		if (!pagePath) return;

		this.deactivateView(pagePath);
	}

	handlePageUnload(vm) {
		const pagePath = this.getPagePathFromVm(vm);
		if (!pagePath) return;

		const viewKey = this.getViewKey(pagePath);
		const pendingView = this.pageLoadStartMap[viewKey];
		delete this.pendingViewLoadMap[pagePath];
		delete this.pageLoadStartMap[viewKey];
		delete this.pendingViewShowMap[viewKey];
		delete this.loadedViewPathMap[viewKey];
		if (pendingView) {
			this.loadedPageVms.delete(pendingView.pageVm);
		}
		this.loadedPageVms.delete(vm);
		this.deactivateView(pagePath);
	}

	isPageVm(vm) {
		if (!vm) return false;
		const pages = getCurrentPages();
		return pages.some(page => page.$vm === vm);
	}

	getPagePath(page) {
		if (!page) {
			return null;
		}
		const fullPath = page.$page && page.$page.fullPath;
		if (fullPath) {
			return this.normalizePagePath(fullPath);
		}
		return this.normalizePagePath(page.route);
	}

	getPagePathFromVm(vm) {
		if (!vm) return null;
		if (vm.$page && vm.$page.fullPath) {
			return this.normalizePagePath(vm.$page.fullPath);
		}
		if (vm.route) {
			return this.normalizePagePath(vm.route);
		}
		const pages = getCurrentPages();
		const page = pages.find(item => item.$vm === vm);
		return this.getPagePath(page);
	}

	getLifecyclePagePath(vm) {
		const vmPagePath = this.getPagePathFromVm(vm);
		if (vmPagePath) return vmPagePath;
		if (this.currentPage && this.hasPendingViewLoad(this.currentPage)) {
			return this.currentPage;
		}
		return this.getCurrentPagePath();
	}

	getLaunchStartTime() {
		return this.appLaunchTime ? this.appLaunchTime * 1000000 : Date.now() * 1000000;
	}

	getViewKey(pagePath) {
		return this.parseUrl(pagePath).view_name;
	}

	resolvePagePath(url) {
		if (!url || typeof url !== 'string') {
			return null;
		}
		const trimmedUrl = url.trim();
		if (!trimmedUrl.startsWith('./') && !trimmedUrl.startsWith('../')) {
			return this.normalizePagePath(trimmedUrl);
		}

		const queryIndex = trimmedUrl.indexOf('?');
		const relativePath = queryIndex >= 0 ? trimmedUrl.slice(0, queryIndex) : trimmedUrl;
		const query = queryIndex >= 0 ? trimmedUrl.slice(queryIndex) : '';
		const currentViewName = this.getViewKey(this.getCurrentPagePath());
		const pathSegments = currentViewName ? currentViewName.split('/') : [];
		pathSegments.pop();
		relativePath.split('/').forEach(segment => {
			if (!segment || segment === '.') return;
			if (segment === '..') {
				pathSegments.pop();
				return;
			}
			pathSegments.push(segment);
		});
		return this.normalizePagePath(pathSegments.join('/') + query);
	}

	activateView(pagePath, injectSessionReplay = true) {
		const normalizedPath = this.normalizePagePath(pagePath);
		if (!normalizedPath) {
			return;
		}
		if (this.activeViewPath !== normalizedPath) {
			const {
				view_name,
				qureyJsonStr
			} = this.parseUrl(normalizedPath);
			if (!view_name) {
				return;
			}
			const params = {
				'viewName': view_name,
				'property': {
					'view_url_query': qureyJsonStr
				}
			};
			console.log('[FTLog] startView:', params);
			this.rum.startView(params);
			this.activeViewPath = normalizedPath;
		}
		if (injectSessionReplay) {
			this.evalJS();
		}
	}

	deactivateView(pagePath = null) {
		const normalizedPath = pagePath ? this.normalizePagePath(pagePath) : this.activeViewPath;
		if (!this.activeViewPath) {
			return;
		}
		if (normalizedPath && normalizedPath !== this.activeViewPath) {
			return;
		}
		this.rum.stopView(null);
		this.activeViewPath = null;
	}

	reportCreateView(pagePath, duration) {
		const {
			view_name
		} = this.parseUrl(pagePath);
		if (!view_name) {
			return;
		}
		const params = {
			'viewName': view_name,
			'loadTime': duration,
		};
		console.log('[FTLog] onCreateView:', params);
		this.rum.onCreateView(params);
	}

	normalizePagePath(url) {
		if (!url || typeof url !== 'string') {
			return null;
		}
		let normalizedUrl = url.trim();
		if (!normalizedUrl) {
			return null;
		}
		if (normalizedUrl.startsWith('./')) {
			normalizedUrl = normalizedUrl.slice(2);
		}
		if (normalizedUrl.charAt(0) === '/') {
			normalizedUrl = normalizedUrl.slice(1);
		}
		return normalizedUrl;
	}

	parseUrl(url) {
		const view_url_query = {};
		let view_name = '';
		const normalizedUrl = this.normalizePagePath(url);
		if (normalizedUrl) {
			const urlParts = normalizedUrl.split('?');
			view_name = urlParts[0];
			if (urlParts.length > 1) {
				const queryString = urlParts[1];
				const params = queryString.split('&');

				params.forEach(param => {
					const [key, value] = param.split('=');
					if (key) {
						view_url_query[decodeURIComponent(key)] = value ? decodeURIComponent(value) :
							'';
					}
				});
			}
		}
		const qureyJsonStr = JSON.stringify(view_url_query);
		return {
			view_name,
			qureyJsonStr
		};
	}
	
	evalJS(){
		var pages = getCurrentPages()
		if (pages.length > 0 && this.sessionReplayJS) {
			let pageInstance = pages[pages.length - 1]
			let webView = pageInstance.$getAppWebview()
			if (webView && !this.sessionReplayInjectedWebViews.has(webView)) {
				webView.evalJS(this.sessionReplayJS);
				this.sessionReplayInjectedWebViews.add(webView);
			}
		}
	}
}

// Export singleton instance
export const gcViewTracking = new PageMonitor();
