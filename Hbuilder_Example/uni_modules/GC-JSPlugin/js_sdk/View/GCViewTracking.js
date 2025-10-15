class PageMonitor {
	constructor() {
		// Plugin status
		this.initialized = false;
		// Homepage status flag
		this.firstPageDetected = false;
		this.appLaunched = false;
		// Page data
		this.loadStart = null;
		this.currentPage = null;
		this.navBackPagesLength = 0;
		this.sessionReplayJS = null;
		// Store event listeners for easy destruction
		this.eventListeners = [];
		// Native RUM plugin
		this.rum = uni.requireNativePlugin("GCUniPlugin-RUM");
		// Bind this context
		this.eventListenerPopGesture = this.eventListenerPopGesture.bind(this);
	}

	// Initialize monitoring
	startTracking() {
		console.log('initialized');

		if (this.initialized) return;
		this.initialized = true;
		console.log('initialized');

		try {
			//	#ifdef APP-PLUS	
			console.log('Page monitoring plugin initialized');
			
			// 1. Record app launch time (execute as early as possible)
			this.recordAppLaunchTime();

			// Monitor App lifecycle
			this.watchAppLifecycle();

			// Monitor route changes
			this.startWatchRouter();
            
			this.checkInitialPage();
			
			console.log('Page monitoring plugin initialized successfully');
			// #endif
		} catch (error) {
			console.error('Page monitoring plugin initialization failed:', error);
			this.initialized = false;
		}
	}
    checkInitialPage() {
    		if (!this.initialized) return; 
    		setTimeout(() => {
    			if (!this.initialized || this.firstPageDetected) return; 
    			const page = getCurrentPages().pop();
    			if (page) {
    				this.currentPage = page.route;
    				this.loadStart = this.appLaunchTime ? this.appLaunchTime * 1000000 : Date.now() * 1000000;
					console.log('page.onReady:'+page.route);
					this.rumStartView();
					this.firstPageDetected = true;
    			} else {
    				setTimeout(() => this.checkInitialPage(), 100);
    			}
    		}, 50);
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
					console.warn(`Unsupported event listener type: ${event}`);
					return false;
				} catch (e) {
					console.error(`Failed to add event listener ${event}:`, e);
					return false;
				}
			};

			// Listen for App display
			addAppListener('resume', () => {
				const pages = getCurrentPages();
				if (pages.length > 0) {
					const pageInstance = pages[pages.length - 1];
					this.currentPage = pageInstance.route;
					console.log('App display (resume) detected:' + this.currentPage);
					this.rum.startView({
						'viewName': pageInstance.route
					});
				}
			});

			// Listen for App hiding
			addAppListener('pause', () => {
				console.log('App hiding (pause) detected');
				this.rum.stopView();
			});

			// Listen for App launch completion
			addAppListener('launch', () => {
				console.log('App launch completion (launch) detected');
				// Check initial page again to ensure first page is captured
				this.checkInitialPage();
			});

			console.log('watchAppLifecycle internal logic executed successfully');
		} catch (error) {
			console.error('Error executing watchAppLifecycle method:', error);
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
				console.log('Native launch time:', this.appLaunchTime);
			} else {
				// Otherwise use current time as launch time (slightly larger error, but as a fallback)
				this.appLaunchTime = Date.now();
				console.log('Fallback launch time:', this.appLaunchTime);
			}
			this.appLaunched = true;
		}
	}

	// Monitor route changes
	startWatchRouter() {
		// Listen for navigateTo
		uni.addInterceptor('navigateTo', {
			invoke: (e) => {
				this.rumRecordNewView(e.url);
			},
			success: () => {
				this.rumStartView();
			}
		});

		// Listen for redirectTo
		uni.addInterceptor('redirectTo', {
			invoke: (e) => {
				this.rumRecordNewView(e.url);
			},
			success: () => {
				this.rumStartView();
			}
		});

		// Listen for reLaunch
		uni.addInterceptor('reLaunch', {
			invoke: (e) => {
				this.rumRecordNewView(e.url);
			},
			success: () => {
				this.rumStartView();
			}
		});

		// Listen for switchTab
		uni.addInterceptor('switchTab', {
			invoke: (e) => {
				this.rumRecordNewView(e.url);
			},
			success: () => {
				this.rumStartView();
			}
		});

		// Listen for navigateBack
		uni.addInterceptor('navigateBack', {
			invoke: () => {
				this.navBackPagesLength = getCurrentPages().length;
				if (this.navBackPagesLength > 1) {
					this.rumRecordNewView(null);
				}
			},
			success: () => {
				if (this.navBackPagesLength > 1) {
					this.navigateBack();
				}
			}
		});
	}

	// Record new page
	rumRecordNewView(url) {
		this.loadStart = new Date().getTime() * 1000000;
		this.currentPage = url
	}

	// Stop old page monitoring and start new page monitoring
	rumStopView(){
		this.rum.stopView();
	}
	
	rumStartView(addListener = true){
		console.log('this.currentPage'+this.currentPage);
		if (this.currentPage) {
			const loadEnd = new Date().getTime() * 1000000;
				let duration = (loadEnd - this.loadStart);
				const {
					view_name,
					qureyJsonStr
				} = this.parseUrl(this.currentPage);
				if (this.loadStart !== null && duration >= 0) {
					console.log('[FTLog] duration：' + duration);
					this.rum.onCreateView({
						'viewName': view_name,
						'loadTime': duration,
					});
				}
				console.log('startView：' + view_name);
				// Fixed this loss issue here
				this.rum.startView({
					'viewName': view_name,
					'property': {
						'view_url_query': qureyJsonStr
					}
				})
				if (addListener) {
					this.evalJS();
					this.addPopGestureEventListener();
				}
			}
			this.loadStart = null;
	}
	// Handle back navigation
	navigateBack() {
		const pages = getCurrentPages();
		if (pages.length > 0) {
			const pageInstance = pages[pages.length - 1];
			this.currentPage = pageInstance.route;
			this.rumStopView();
			this.rumStartView(false)
		}
	}

	// Add pop gesture listener
	addPopGestureEventListener() {
		const pages = getCurrentPages();
		if (pages.length > 0) {
			const pageInstance = pages[pages.length - 1];
			const webview = pageInstance.$getAppWebview();
			if (webview) {
				webview.addEventListener('popGesture', this.eventListenerPopGesture);
				// Save original onclose method
				const originalOnClose = webview.onclose;
				webview.onclose = (result) => {
					webview.removeEventListener('popGesture', this.eventListenerPopGesture);
					if (typeof originalOnClose === 'function') {
						originalOnClose(result);
					}
				};
			} else {
				console.log('no webView');
			}
		}
	}

	// Pop gesture event handling
	eventListenerPopGesture(e) {
		const progress = e.progress;
		if (progress === 100) {
			this.navigateBack();
		}
	}

	parseUrl(url) {
		const view_url_query = {};
		let view_name = '';
		if (url) {
			const urlParts = url.split('?');
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
				webView.evalJS(this.sessionReplayJS);
			}
		}
	}
}

// Export singleton instance
export const gcViewTracking = new PageMonitor();