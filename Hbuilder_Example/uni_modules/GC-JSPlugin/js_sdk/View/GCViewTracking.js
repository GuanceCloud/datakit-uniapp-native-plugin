import {
	rum as gcRum
} from '../native.js';
const LOAD_TIME_UNAVAILABLE = -1;
const RELOAD_LOAD_TIME = 0;
const LIFECYCLE_FALLBACK_TIMEOUT_MS = 5000;
const PAGE_READY_FALLBACK_TIMEOUT_MS = 5000;

// #ifndef VUE3
import Vue from 'vue';
// #endif

class PageMonitor {
	constructor() {
		this.initialized = false;
		this.pageHookInstalled = false;
		this.appInForeground = true;
		this.debugEnabled = false;
		this.currentPage = null;
		this.currentPageState = null;
		this.activeViewPath = null;
		this.activePageState = null;

		this.routeTransactionId = 0;
		this.pendingRouteTransactions = [];
		this.pageStateByVm = new WeakMap();
		this.latestPageStateByViewKey = {};

		this.sessionReplayJS = null;
		this.sessionReplayInjectedWebViews = new WeakSet();
		this.eventListeners = [];
		this.rum = gcRum;
	}

	setDebugEnabled(enabled) {
		this.debugEnabled = enabled === true;
		if (this.debugEnabled) {
			this.debugLog('debug', this.currentPage, {
				reason: 'enabled'
			});
		}
	}

	debugLog(event, pagePath, details = null) {
		if (!this.debugEnabled) return;
		const payload = {
			event,
			pagePath: this.normalizePagePath(pagePath),
			timestamp: Date.now()
		};
		if (details && typeof details === 'object') {
			Object.keys(details).forEach(key => {
				payload[key] = details[key];
			});
		}
		console.log('[FTLog][ViewTracking][Debug]', payload);
	}

	startTracking(app) {
		if (this.initialized) return;
		this.initialized = true;
		this.debugLog('initialized', null);

		try {
			// #ifdef APP-PLUS || APP-HARMONY
			this.pageHookInstalled = this.installPageHooks(app);
			this.watchAppLifecycle();
			this.startWatchRouter();
			this.checkInitialPage();
			// #endif
		} catch (error) {
			this.debugLog('initialization-error', null, {
				error: error && (error.stack || error.message || String(error))
			});
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

		// Vue 3: startTracking(app) is called after createSSRApp(App).
		if (app && typeof app.mixin === 'function') {
			app.mixin(mixin);
			this.debugLog('hooks-installed', null, {
				method: 'app.mixin'
			});
			return true;
		}

		// Vue 2: startTracking() is called before the root Vue instance is created.
		// #ifndef VUE3
		if (typeof Vue !== 'undefined' && Vue && typeof Vue.mixin === 'function') {
			Vue.mixin(mixin);
			this.debugLog('hooks-installed', null, {
				method: 'Vue.mixin'
			});
			return true;
		}
		// #endif

		this.debugLog('hooks-unavailable', null, {
			loadTime: LOAD_TIME_UNAVAILABLE
		});
		return false;
	}

	checkInitialPage() {
		if (!this.initialized) return;

		const page = this.getCurrentPage();
		const pagePath = this.getPagePath(page);
		if (!pagePath) return;

		let state = this.getPageState(page && page.$vm, pagePath, false);
		if (!state) {
			// Tracking started after onLoad, so lifecycle load timing is unavailable.
			state = this.createPageState(page && page.$vm, pagePath, null, false);
			state.ready = true;
			state.needDuration = false;
			state.initialLoadTime = LOAD_TIME_UNAVAILABLE;
		}
		this.showPageState(state, 'initial-page');
	}

	evalSessionReplayJS(js) {
		if (this.sessionReplayJS !== js) {
			this.sessionReplayInjectedWebViews = new WeakSet();
		}
		this.sessionReplayJS = js;
	}

	isJSViewTrackingEnabled() {
		// #ifdef APP-HARMONY
		// Older native bridges do not expose this switch; preserve the existing
		// JS View collector in that case.
		return typeof this.rum.isUniAppJSViewTrackingEnabled !== 'function' ||
			this.rum.isUniAppJSViewTrackingEnabled();
		// #endif
		return true;
	}

	watchAppLifecycle() {
		const addAppListener = (event, callback) => {
			try {
				if (typeof plus === 'undefined') {
					this.debugLog('listener-unavailable', null, {
						event
					});
					return;
				}
				plus.globalEvent.addEventListener(event, callback);
				this.eventListeners.push({
					event,
					callback
				});
			} catch (error) {
				this.debugLog('listener-error', null, {
					event,
					error: error && (error.stack || error.message || String(error))
				});
			}
		};

		addAppListener('resume', () => this.handleAppResume());
		addAppListener('pause', () => this.handleAppPause());
	}

	handleAppResume() {
		this.appInForeground = true;
		const page = this.getCurrentPage();
		const pagePath = this.getPagePath(page);
		this.debugLog('lifecycle', pagePath, {
			lifecycle: 'app:resume'
		});
		if (!pagePath) return;

		let state = this.getPageState(page && page.$vm, pagePath, true);
		if (!state) {
			// The page lifecycle is not observable (for example tracking started late).
			state = this.createPageState(page && page.$vm, pagePath, null, false);
			state.ready = true;
			state.needDuration = false;
			state.initialLoadTime = LOAD_TIME_UNAVAILABLE;
		}
		this.showPageState(state, 'app:resume');
	}

	handleAppPause() {
		this.appInForeground = false;
		this.debugLog('lifecycle', this.activeViewPath || this.currentPage, {
			lifecycle: 'app:pause'
		});
		this.cancelPageReadyFallback(this.currentPageState);
		this.deactivateView(null, 'app:pause');
	}

	startWatchRouter() {
		this.registerRouteInterceptor('navigateTo');
		this.registerRouteInterceptor('redirectTo');
		this.registerRouteInterceptor('switchTab');
		this.registerRouteInterceptor('reLaunch');

		uni.addInterceptor('navigateBack', {
			success: () => {
				if (!this.pageHookInstalled) {
					this.startCurrentPageWithoutLifecycle();
				}
			}
		});
	}

	registerRouteInterceptor(routeType) {
		const transactions = [];
		uni.addInterceptor(routeType, {
			invoke: (options) => {
				const transaction = this.createRouteTransaction(
					options && options.url,
					routeType
				);
				transactions.push(transaction);
			},
			success: () => {
				const transaction = transactions.shift();
				if (!transaction) return;
				transaction.succeeded = true;
				if (!this.pageHookInstalled) {
					this.startRouteWithoutLifecycle(transaction, 'route-hooks-unavailable');
				} else {
					this.scheduleRouteLifecycleFallback(transaction);
				}
			},
			fail: () => {
				this.cancelRouteTransaction(transactions.shift());
			}
		});
	}

	createRouteTransaction(url, routeType) {
		const pagePath = this.resolvePagePath(url);
		if (!pagePath) return null;

		const transaction = {
			id: ++this.routeTransactionId,
			pagePath,
			routeType,
			claimed: false,
			failed: false,
			succeeded: false
		};
		this.pendingRouteTransactions.push(transaction);
		return transaction;
	}

	cancelRouteTransaction(transaction) {
		if (!transaction) return;
		transaction.failed = true;
		if (transaction.lifecycleFallbackTimer) {
			clearTimeout(transaction.lifecycleFallbackTimer);
			transaction.lifecycleFallbackTimer = null;
		}
		this.removePendingRouteTransaction(transaction);
	}

	scheduleRouteLifecycleFallback(transaction) {
		if (!transaction || transaction.failed || transaction.claimed) return;
		transaction.lifecycleFallbackTimer = setTimeout(() => {
			transaction.lifecycleFallbackTimer = null;
			if (transaction.failed || transaction.claimed) return;
			const currentPath = this.getCurrentPagePath();
			if (this.getViewKey(currentPath) !== this.getViewKey(transaction.pagePath)) {
				this.removePendingRouteTransaction(transaction);
				return;
			}
			this.debugLog('lifecycle-fallback', transaction.pagePath, {
				reason: 'page lifecycle was not observed',
				loadTime: LOAD_TIME_UNAVAILABLE
			});
			transaction.claimed = true;
			this.startRouteWithoutLifecycle(transaction, 'route-lifecycle-timeout');
		}, LIFECYCLE_FALLBACK_TIMEOUT_MS);
	}

	removePendingRouteTransaction(transaction) {
		const index = this.pendingRouteTransactions.indexOf(transaction);
		if (index >= 0) {
			this.pendingRouteTransactions.splice(index, 1);
		}
	}

	takePendingRouteTransaction(pagePath) {
		const normalizedPath = this.normalizePagePath(pagePath);
		const viewKey = this.getViewKey(normalizedPath);
		let transaction = this.pendingRouteTransactions.find(item => {
			return !item.failed && !item.claimed && item.pagePath === normalizedPath;
		});
		if (!transaction) {
			transaction = this.pendingRouteTransactions.find(item => {
				return !item.failed && !item.claimed && this.getViewKey(item.pagePath) === viewKey;
			});
		}
		if (!transaction) return null;

		transaction.claimed = true;
		if (transaction.lifecycleFallbackTimer) {
			clearTimeout(transaction.lifecycleFallbackTimer);
			transaction.lifecycleFallbackTimer = null;
		}
		this.removePendingRouteTransaction(transaction);
		return transaction;
	}

	startRouteWithoutLifecycle(transaction, reason = 'route-without-lifecycle') {
		if (!transaction || transaction.failed) return;
		this.removePendingRouteTransaction(transaction);

		const page = this.getCurrentPage();
		const currentPath = this.getPagePath(page);
		const currentPageMatches =
			this.getViewKey(currentPath) === this.getViewKey(transaction.pagePath);
		const pagePath = transaction.pagePath;

		let state = this.getPageState(
			currentPageMatches && page ? page.$vm : null,
			pagePath,
			false
		);
		if (!state) {
			state = this.createPageState(
				currentPageMatches && page ? page.$vm : null,
				pagePath,
				transaction,
				false
			);
			state.ready = true;
			state.needDuration = false;
			state.initialLoadTime = LOAD_TIME_UNAVAILABLE;
		}
		this.showPageState(state, reason);
	}

	startCurrentPageWithoutLifecycle() {
		const page = this.getCurrentPage();
		const pagePath = this.getPagePath(page);
		if (!pagePath) return;

		let state = this.getPageState(page && page.$vm, pagePath, true);
		if (!state) {
			state = this.createPageState(page && page.$vm, pagePath, null, false);
			state.ready = true;
			state.needDuration = false;
			state.initialLoadTime = LOAD_TIME_UNAVAILABLE;
		}
		this.showPageState(state, 'navigateBack-hooks-unavailable');
	}

	handlePageLoad(vm) {
		if (this.isAppLifecycleVm(vm)) return;
		const lifecyclePath = this.getLifecyclePagePath(vm);
		this.debugLog('lifecycle', lifecyclePath, {
			lifecycle: 'onLoad'
		});
		if (!lifecyclePath) return;

		const transaction = this.takePendingRouteTransaction(lifecyclePath);
		const pagePath = transaction ? transaction.pagePath : lifecyclePath;
		let state = this.getPageState(vm, pagePath, false);
		if (!state) {
			state = this.createPageState(vm, pagePath, transaction, true);
		} else if (state.startCount === 0 && state.initialLoadTime === null) {
			this.cancelPageReadyFallback(state);
			this.updatePageStatePath(state, pagePath);
			state.routeTransaction = transaction || state.routeTransaction;
			state.needDuration = true;
			state.loadStart = Date.now();
			state.ready = false;
		}
		this.bindPageStateVm(state, vm);
	}

	handlePageReady(vm) {
		if (this.isAppLifecycleVm(vm)) return;
		const lifecyclePath = this.getLifecyclePagePath(vm);
		this.debugLog('lifecycle', lifecyclePath, {
			lifecycle: 'onReady'
		});
		if (!lifecyclePath) return;

		let state = this.getPageState(vm, lifecyclePath, true);
		if (!state) {
			const transaction = this.takePendingRouteTransaction(lifecyclePath);
			state = this.createPageState(
				vm,
				transaction ? transaction.pagePath : lifecyclePath,
				transaction,
				false
			);
		}
		this.bindPageStateVm(state, vm);
		state.ready = true;
		this.cancelPageReadyFallback(state);
		if (state.needDuration && state.initialLoadTime === null) {
			state.initialLoadTime = this.calculateInitialLoadTime(state);
			state.needDuration = false;
		}
		this.tryActivateVisiblePageState(state, true, 'page:onReady');
	}

	handlePageShow(vm) {
		if (this.isAppLifecycleVm(vm)) return;
		const lifecyclePath = this.getLifecyclePagePath(vm);
		this.debugLog('lifecycle', lifecyclePath, {
			lifecycle: 'onShow'
		});
		if (!lifecyclePath) return;

		const transaction = this.takePendingRouteTransaction(lifecyclePath);
		const pagePath = transaction ? transaction.pagePath : lifecyclePath;
		let state = this.getPageState(vm, pagePath, true);
		if (!state) {
			state = this.createPageState(vm, pagePath, transaction, false);
		}
		this.bindPageStateVm(state, vm);
		if (transaction) {
			this.updatePageStatePath(state, transaction.pagePath);
			state.routeTransaction = transaction;
		}

		state.visible = true;
		this.latestPageStateByViewKey[state.viewKey] = state;
		this.currentPageState = state;
		this.currentPage = state.pagePath;

		this.tryActivateVisiblePageState(state, true, 'page:onShow');
	}

	handlePageHide(vm) {
		if (this.isAppLifecycleVm(vm)) return;
		const pagePath = this.getPagePathFromVm(vm);
		this.debugLog('lifecycle', pagePath, {
			lifecycle: 'onHide'
		});
		const state = this.getPageState(vm, pagePath, true);
		if (state) {
			state.visible = false;
			this.cancelPageReadyFallback(state);
			if (this.currentPageState === state) {
				this.currentPageState = null;
			}
			this.deactivatePageState(state, 'page:onHide');
			return;
		}
		this.deactivateView(pagePath, 'page:onHide-without-state');
	}

	handlePageUnload(vm) {
		if (this.isAppLifecycleVm(vm)) return;
		const pagePath = this.getPagePathFromVm(vm);
		this.debugLog('lifecycle', pagePath, {
			lifecycle: 'onUnload'
		});
		const state = this.getPageState(vm, pagePath, true);
		if (!state) {
			this.deactivateView(pagePath, 'page:onUnload-without-state');
			return;
		}

		state.visible = false;
		this.cancelPageReadyFallback(state);
		this.deactivatePageState(state, 'page:onUnload');
		if (this.currentPageState === state) {
			this.currentPageState = null;
		}
		if (this.latestPageStateByViewKey[state.viewKey] === state) {
			delete this.latestPageStateByViewKey[state.viewKey];
		}
		if (this.canUseWeakKey(vm)) {
			this.pageStateByVm.delete(vm);
		}
	}

	createPageState(vm, pagePath, transaction, needDuration) {
		const normalizedPath = this.normalizePagePath(pagePath);
		const state = {
			pagePath: normalizedPath,
			viewKey: this.getViewKey(normalizedPath),
			pageVm: null,
			confirmedPageVm: null,
			routeTransaction: transaction,
			needDuration,
			loadStart: needDuration ? Date.now() : null,
			ready: false,
			visible: false,
			initialLoadTime: null,
			readyFallbackTimer: null,
			startCount: 0
		};
		this.bindPageStateVm(state, vm);
		if (state.viewKey) {
			this.latestPageStateByViewKey[state.viewKey] = state;
		}
		return state;
	}

	bindPageStateVm(state, vm) {
		if (!state || !this.canUseWeakKey(vm)) return;
		state.pageVm = vm;
		this.pageStateByVm.set(vm, state);
		if (this.isPageVm(vm)) {
			state.confirmedPageVm = vm;
		}
	}

	updatePageStatePath(state, pagePath) {
		const normalizedPath = this.normalizePagePath(pagePath);
		if (!state || !normalizedPath || state.pagePath === normalizedPath) return;
		const oldViewKey = state.viewKey;
		state.pagePath = normalizedPath;
		state.viewKey = this.getViewKey(normalizedPath);
		if (oldViewKey && this.latestPageStateByViewKey[oldViewKey] === state) {
			delete this.latestPageStateByViewKey[oldViewKey];
		}
		if (state.viewKey) {
			this.latestPageStateByViewKey[state.viewKey] = state;
		}
	}

	getPageState(vm, pagePath, allowViewKeyFallback) {
		if (this.canUseWeakKey(vm)) {
			const state = this.pageStateByVm.get(vm);
			if (state) return state;
		}
		if (!allowViewKeyFallback) return null;
		const viewKey = this.getViewKey(pagePath);
		const candidate = viewKey ? this.latestPageStateByViewKey[viewKey] || null : null;
		if (
			candidate &&
			this.isPageVm(vm) &&
			candidate.confirmedPageVm &&
			candidate.confirmedPageVm !== vm
		) {
			return null;
		}
		return candidate;
	}

	showPageState(state, reason = 'show-page-state') {
		if (!state) return;
		state.visible = true;
		this.latestPageStateByViewKey[state.viewKey] = state;
		this.currentPageState = state;
		this.currentPage = state.pagePath;
		this.tryActivateVisiblePageState(state, true, reason);
	}

	resolveInitialLoadTimeForShow(state) {
		if (!state) return false;
		if (state.startCount > 0 || state.initialLoadTime !== null) return true;
		if (state.needDuration && typeof state.loadStart === 'number') {
			// The first visible View waits for initial rendering to complete so that
			// loadTime represents onReady - onLoad rather than onShow - onLoad.
			if (!state.ready) return false;
			state.initialLoadTime = this.calculateInitialLoadTime(state);
		} else {
			state.initialLoadTime = LOAD_TIME_UNAVAILABLE;
		}
		state.needDuration = false;
		return true;
	}

	tryActivateVisiblePageState(state, injectSessionReplay, reason) {
		if (!state || !state.visible) return;
		if (!this.resolveInitialLoadTimeForShow(state)) {
			if (this.activePageState && this.activePageState !== state) {
				this.deactivateView(null, `view-replaced-before-${reason}`);
			}
			this.schedulePageReadyFallback(state);
			return;
		}
		this.cancelPageReadyFallback(state);
		if (this.appInForeground) {
			this.activatePageState(state, injectSessionReplay, reason);
		}
	}

	schedulePageReadyFallback(state) {
		if (
			!state ||
			state.ready ||
			state.startCount > 0 ||
			state.initialLoadTime !== null ||
			state.readyFallbackTimer !== null
		) {
			return;
		}
		state.readyFallbackTimer = setTimeout(() => {
			state.readyFallbackTimer = null;
			if (state.ready || state.startCount > 0 || !state.visible) return;
			state.needDuration = false;
			state.initialLoadTime = LOAD_TIME_UNAVAILABLE;
			this.debugLog('lifecycle-fallback', state.pagePath, {
				reason: 'page onReady was not observed',
				loadTime: LOAD_TIME_UNAVAILABLE
			});
			this.tryActivateVisiblePageState(state, true, 'page:onReady-timeout');
		}, PAGE_READY_FALLBACK_TIMEOUT_MS);
	}

	cancelPageReadyFallback(state) {
		if (!state || state.readyFallbackTimer === null) return;
		clearTimeout(state.readyFallbackTimer);
		state.readyFallbackTimer = null;
	}

	calculateInitialLoadTime(state) {
		if (!state) return LOAD_TIME_UNAVAILABLE;
		if (typeof state.loadStart !== 'number') {
			return LOAD_TIME_UNAVAILABLE;
		}
		return Math.max(0, Date.now() - state.loadStart) * 1000000;
	}

	getNextLoadTime(state) {
		if (!state) return null;
		return state.startCount > 0 ? RELOAD_LOAD_TIME : state.initialLoadTime;
	}

	activatePageState(state, injectSessionReplay = true, reason = 'activate-page-state') {
		if (!state || !state.visible || !this.appInForeground || !this.isJSViewTrackingEnabled()) {
			return;
		}
		if (this.activePageState !== state) {
			const loadTime = this.getNextLoadTime(state);
			if (loadTime === null) return;
			if (this.activePageState) {
				this.deactivateView(null, `view-replaced-before-${reason}`);
			}
			const parsedUrl = this.parseUrl(state.pagePath);
			if (!parsedUrl.view_name) return;
			const params = {
				viewName: parsedUrl.view_name,
				property: {
					view_url_query: parsedUrl.queryJsonStr
				}
			};
			this.reportCreateView(state.pagePath, loadTime);
			this.debugLog('startView', state.pagePath, {
				reason,
				loadTime
			});
			this.rum.startView(params);
			state.startCount += 1;
			this.activePageState = state;
			this.activeViewPath = state.pagePath;
		}
		if (injectSessionReplay && this.shouldInjectSessionReplay(state)) {
			this.evalJS(state);
		}
	}

	// Kept as a small compatibility wrapper for callers inside older integrations.
	activateView(pagePath, injectSessionReplay = true) {
		let state = this.getPageState(null, pagePath, true);
		if (!state) {
			state = this.createPageState(null, pagePath, null, false);
			state.ready = true;
			state.needDuration = false;
			state.initialLoadTime = LOAD_TIME_UNAVAILABLE;
		}
		state.visible = true;
		this.currentPageState = state;
		this.currentPage = state.pagePath;
		this.activatePageState(state, injectSessionReplay, 'compatibility-activateView');
	}

	deactivatePageState(state, reason = 'deactivate-page-state') {
		if (!state || this.activePageState !== state) return;
		this.deactivateView(null, reason);
	}

	deactivateView(pagePath = null, reason = 'deactivate-view') {
		if (!this.activePageState) return;
		const normalizedPath = this.normalizePagePath(pagePath);
		if (normalizedPath && normalizedPath !== this.activeViewPath) return;
		this.debugLog('stopView', this.activeViewPath, {
			reason
		});
		this.rum.stopView(null);
		this.activePageState = null;
		this.activeViewPath = null;
	}

	reportCreateView(pagePath, duration) {
		if (!this.isJSViewTrackingEnabled()) return;
		const viewName = this.getViewKey(pagePath);
		if (!viewName) return;
		const params = {
			viewName,
			loadTime: duration
		};
		this.debugLog('onCreateView', pagePath, {
			loadTime: duration
		});
		this.rum.onCreateView(params);
	}

	shouldInjectSessionReplay(state) {
		if (!this.sessionReplayJS || !state || !state.visible || !this.appInForeground) {
			return false;
		}
		const page = this.getCurrentPage();
		if (!page) return false;
		if (state.confirmedPageVm && page.$vm && state.confirmedPageVm !== page.$vm) {
			return false;
		}
		return this.getViewKey(this.getPagePath(page)) === state.viewKey;
	}

	evalJS(state = this.currentPageState) {
		if (!this.shouldInjectSessionReplay(state)) return;
		const page = this.getCurrentPage();
		if (!page || typeof page.$getAppWebview !== 'function') return;

		try {
			const webView = page.$getAppWebview();
			if (!this.canUseWeakKey(webView) || this.sessionReplayInjectedWebViews.has(webView)) {
				return;
			}
			webView.evalJS(this.sessionReplayJS);
			this.sessionReplayInjectedWebViews.add(webView);
		} catch (error) {
			this.debugLog('session-replay-injection-error', state.pagePath, {
				error: error && (error.stack || error.message || String(error))
			});
		}
	}

	getCurrentPage() {
		const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : [];
		return pages.length > 0 ? pages[pages.length - 1] : null;
	}

	getCurrentPagePath() {
		return this.getPagePath(this.getCurrentPage());
	}

	isPageVm(vm) {
		if (!this.canUseWeakKey(vm)) return false;
		const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : [];
		return pages.some(page => page && page.$vm === vm);
	}

	getPagePath(page) {
		if (!page) return null;
		if (page.$page && page.$page.fullPath) {
			return this.normalizePagePath(page.$page.fullPath);
		}
		return this.normalizePagePath(page.route);
	}

	getPagePathFromVm(vm) {
		if (!vm) return null;
		let vmPage = null;
		try {
			vmPage = vm.$page;
		} catch (error) {
			// The uni-app $page getter can run before the page scope is attached.
		}
		if (vmPage && vmPage.fullPath) {
			return this.normalizePagePath(vmPage.fullPath);
		}
		const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : [];
		const page = pages.find(item => item && item.$vm === vm);
		const pagePath = this.getPagePath(page);
		if (pagePath) return pagePath;
		let route = null;
		try {
			route = vm.route;
		} catch (error) {
			// Route access is best-effort while the page instance is being attached.
		}
		return this.normalizePagePath(route);
	}

	isAppLifecycleVm(vm) {
		if (!vm) return false;
		try {
			const options = vm.$options;
			return Boolean(
				(options && options.mpType === 'app') ||
				vm.mpType === 'app' ||
				vm.$mpType === 'app'
			);
		} catch (error) {
			return false;
		}
	}

	getLifecyclePagePath(vm) {
		const vmPagePath = this.getPagePathFromVm(vm);
		if (vmPagePath) return vmPagePath;
		const pending = this.pendingRouteTransactions.find(item => !item.failed && !item.claimed);
		if (pending) return pending.pagePath;
		return this.getCurrentPagePath();
	}

	getViewKey(pagePath) {
		return this.parseUrl(pagePath).view_name;
	}

	resolvePagePath(url) {
		if (!url || typeof url !== 'string') return null;
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

	normalizePagePath(url) {
		if (!url || typeof url !== 'string') return null;
		let normalizedUrl = url.trim();
		if (!normalizedUrl) return null;
		while (normalizedUrl.startsWith('./')) {
			normalizedUrl = normalizedUrl.slice(2);
		}
		while (normalizedUrl.startsWith('/')) {
			normalizedUrl = normalizedUrl.slice(1);
		}
		return normalizedUrl || null;
	}

	parseUrl(url) {
		const viewUrlQuery = {};
		const normalizedUrl = this.normalizePagePath(url);
		let viewName = '';
		if (normalizedUrl) {
			const queryIndex = normalizedUrl.indexOf('?');
			viewName = queryIndex >= 0 ? normalizedUrl.slice(0, queryIndex) : normalizedUrl;
			const queryString = queryIndex >= 0 ? normalizedUrl.slice(queryIndex + 1) : '';
			if (queryString) {
				queryString.split('&').forEach(item => {
					if (!item) return;
					const separatorIndex = item.indexOf('=');
					const rawKey = separatorIndex >= 0 ? item.slice(0, separatorIndex) : item;
					const rawValue = separatorIndex >= 0 ? item.slice(separatorIndex + 1) : '';
					if (!rawKey) return;
					viewUrlQuery[this.decodeQueryComponent(rawKey)] =
						this.decodeQueryComponent(rawValue);
				});
			}
		}
		const queryJsonStr = JSON.stringify(viewUrlQuery);
		return {
			view_name: viewName,
			queryJsonStr,
			// Preserve the misspelled field for source compatibility.
			qureyJsonStr: queryJsonStr
		};
	}

	decodeQueryComponent(value) {
		try {
			return decodeURIComponent(String(value).replace(/\+/g, ' '));
		} catch (error) {
			return String(value);
		}
	}

	canUseWeakKey(value) {
		return (typeof value === 'object' && value !== null) || typeof value === 'function';
	}
}

// Export singleton instance
export const gcViewTracking = new PageMonitor();
