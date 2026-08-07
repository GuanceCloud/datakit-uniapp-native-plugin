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
		// Page data
		this.currentPage = null;
		this.activeViewPath = null;
		this.navBackPagesLength = 0;
		// A page load belongs to a page instance rather than a route. A tab page
		// can be cached and multiple instances can have the same route.
		this.pendingPageLoads = new Map();
		this.isAppActive = true;
		this.sessionReplayJS = null;
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
			// #ifdef APP-PLUS || APP-HARMONY

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
		if (!this.initialized) return;

		const pages = getCurrentPages();
		const currentPage = pages.length > 0 ? pages[pages.length - 1] : null;
		const pagePath = this.getPagePath(currentPage);
		if (!pagePath) {
			return;
		}

		// The lifecycle of this page has already started (for example after a hot
		// reload), so it has no trustworthy onLoad timestamp. Record the View
		// without fabricating a loading duration from the app process start time.
		this.currentPage = pagePath;
		console.log('[FTLog] Existing page detected without a load lifecycle:' + pagePath);
		if (!currentPage || !this.pendingPageLoads.has(currentPage.$vm)) {
			this.activateView(pagePath);
		}
	}

	isJSViewTrackingEnabled() {
		// #ifdef APP-HARMONY
		return typeof this.rum.isUniAppJSViewTrackingEnabled === 'function' &&
			this.rum.isUniAppJSViewTrackingEnabled();
		// #endif
		return true;
	}
	getCurrentPagePath(){
		const page = getCurrentPages().pop()
		return this.getPagePath(page);
	}
	evalSessionReplayJS(js) {
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
				this.handleAppShow();
			});

			// Listen for App hiding
			addAppListener('pause', () => {
				this.handleAppHide();
			});

			console.log('[FTLog] watchAppLifecycle internal logic executed successfully');
		} catch (error) {
			console.error('[FTLog] Error executing watchAppLifecycle method:', error);
			// Throw error for upper layer to catch, avoid silent failure
			throw error;
		}
	}

	handleAppShow() {
		this.isAppActive = true;
		const pages = getCurrentPages();
		const currentPage = pages.length > 0 ? pages[pages.length - 1] : null;
		const pagePath = this.getPagePath(currentPage);
		if (!pagePath) return;
		this.currentPage = pagePath;
		console.log('[FTLog] App display detected:' + pagePath);
		if (!currentPage || !this.pendingPageLoads.has(currentPage.$vm)) {
			this.activateView(pagePath);
		}
	}

	handleAppHide() {
		console.log('[FTLog] App hiding detected');
		this.isAppActive = false;
		// Date.now() includes background time. Do not report a page that becomes
		// ready after it was hidden as a visible page load.
		this.pendingPageLoads.clear();
		this.deactivateView();
	}

	// Monitor route changes
	startWatchRouter() {
		const registerRouteInterceptor = (name) => {
			uni.addInterceptor(name, {
				invoke: (e) => {
					if (!this.pageHookInstalled) {
						this.rumRecordNewView(e.url);
					}
				},
				success: () => {
					if (!this.pageHookInstalled) {
						this.rumStartView();
					}
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
		registerRouteInterceptor('switchTab');

		// Listen for navigateBack
		uni.addInterceptor('navigateBack', {
			invoke: () => {
				this.navBackPagesLength = getCurrentPages().length;
				if (this.navBackPagesLength > 1) {
					this.currentPage = null;
				}
			},
			success: () => {
				if (!this.pageHookInstalled && this.navBackPagesLength > 1) {
					this.navigateBack();
				}
			}
		});
	}

	// Record new page
	rumRecordNewView(url) {
		const pagePath = this.normalizePagePath(url);
		this.currentPage = pagePath;
	}

	// Stop old page monitoring and start new page monitoring
	rumStopView(){
		this.deactivateView();
	}

	rumStartView(){
		if (!this.isJSViewTrackingEnabled()) {
			return;
		}
		console.log('[FTLog] this.currentPage:'+this.currentPage);
		if (this.currentPage) {
			this.activateView(this.currentPage);
		}
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
		if (!this.isPageVm(vm)) return;

		const pagePath = this.getPagePathFromVm(vm);
		if (!pagePath) return;

		this.currentPage = pagePath;
		if (this.isAppActive) {
			this.pendingPageLoads.set(vm, {
				pagePath,
				startTime: Date.now() * 1000000
			});
		}
	}

	handlePageReady(vm) {
		if (!this.isPageVm(vm)) return;

		const pendingView = this.pendingPageLoads.get(vm);
		if (!pendingView) {
			return;
		}
		this.pendingPageLoads.delete(vm);

		// A later page can become current before this page's onReady. That older
		// lifecycle must not create a View or consume its elapsed time.
		if (!this.isAppActive || !this.isCurrentPageVm(vm)) {
			return;
		}
		const duration = Date.now() * 1000000 - pendingView.startTime;
		if (duration >= 0) {
			this.reportCreateView(pendingView.pagePath, duration);
		}
		this.activateView(pendingView.pagePath);
	}

	handlePageShow(vm) {
		if (!this.isPageVm(vm)) return;

		const pagePath = this.getPagePathFromVm(vm);
		if (!pagePath) return;

		this.currentPage = pagePath;
		// A freshly created page has a pending onLoad → onReady interval. Wait for
		// onReady so onCreateView and startView receive the same View lifecycle.
		if (!this.pendingPageLoads.has(vm)) {
			this.activateView(pagePath);
		}
	}

	handlePageHide(vm) {
		if (!this.isPageVm(vm)) return;

		const pagePath = this.getPagePathFromVm(vm);
		if (!pagePath) return;

		this.pendingPageLoads.delete(vm);
		this.deactivateView(pagePath);
	}

	handlePageUnload(vm) {
		if (!this.isPageVm(vm)) return;

		const pagePath = this.getPagePathFromVm(vm);
		if (!pagePath) return;

		this.pendingPageLoads.delete(vm);
		this.deactivateView(pagePath);
	}

	isPageVm(vm) {
		if (!vm) return false;
		const pages = getCurrentPages();
		return pages.some(page => page.$vm === vm);
	}

	isCurrentPageVm(vm) {
		const pages = getCurrentPages();
		return pages.length > 0 && pages[pages.length - 1].$vm === vm;
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

	activateView(pagePath) {
		if (!this.isJSViewTrackingEnabled()) {
			return;
		}
		const normalizedPath = this.normalizePagePath(pagePath);
		if (!normalizedPath || this.activeViewPath === normalizedPath) {
			return;
		}
		const {
			view_name,
			qureyJsonStr
		} = this.parseUrl(normalizedPath);
		if (!view_name) {
			return;
		}
		// Explicitly close the current View before starting the next one. Do not
		// rely on the native startView implementation to implicitly close it:
		// that path can preserve stale View context during a page transition.
		if (this.activeViewPath) {
			this.rum.stopView(null);
			this.activeViewPath = null;
		}
		console.log('[FTLog] startView：' + view_name);
		this.rum.startView({
			'viewName': view_name,
			'property': {
				'view_url_query': qureyJsonStr
			}
		});
		this.activeViewPath = normalizedPath;
		this.evalJS();
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
		if (!this.isJSViewTrackingEnabled()) {
			return;
		}
		const {
			view_name
		} = this.parseUrl(pagePath);
		if (!view_name) {
			return;
		}
		this.rum.onCreateView({
			'viewName': view_name,
			'loadTime': duration,
		});
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
			if (webView) {
				webView.evalJS(this.buildSessionReplayInjectionJS());
			}
		}
	}

	buildSessionReplayInjectionJS() {
		const sessionReplayJS = this.sessionReplayJS;
		return `
;(function () {
	var stateKey = '__GC_UNI_SESSION_REPLAY_BOOTSTRAP_STATE__';
	if (window[stateKey] === 'waiting' || window[stateKey] === 'started') {
		return;
	}
	window[stateKey] = 'waiting';
	var attempt = 0;
	var maxAttempts = 200;

	function hasRecordsBridge() {
		var bridge = window.FTWebViewJavascriptBridge;
		if (!bridge || typeof bridge.getCapabilities !== 'function') {
			return false;
		}
		var capabilities = bridge.getCapabilities();
		if (Array.isArray(capabilities)) {
			return capabilities.indexOf('records') !== -1;
		}
		return typeof capabilities === 'string' && capabilities.indexOf('records') !== -1;
	}

	function startSessionReplay() {
		try {
			(function () {
${sessionReplayJS}
			}).call(window);
			window[stateKey] = 'started';
		} catch (error) {
			window[stateKey] = null;
			console.error('[FTLog] Session Replay Web SDK injection failed:', error);
		}
	}

	function waitForBridge() {
		if (hasRecordsBridge()) {
			startSessionReplay();
			return;
		}
		attempt += 1;
		if (attempt < maxAttempts) {
			setTimeout(waitForBridge, 50);
			return;
		}
		window[stateKey] = null;
		console.warn('[FTLog] Session Replay Web SDK injection skipped because the Native records bridge is unavailable.');
	}

	waitForBridge();
})();`;
	}
}

// Export singleton instance
export const gcViewTracking = new PageMonitor();
