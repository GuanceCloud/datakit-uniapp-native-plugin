import {
	rum
} from '@/uni_modules/GC-UniPlugin';

const EMPTY_MESSAGE = 'Unknown Error';
const CONSOLE_ERROR = 'console_error';
const FT_JS_PLUGIN_VERSION = '0.2.7-alpha.1';

let originalConsoleError = null;
let originalVueErrorHandler = null;
let appStateTrackingBound = false;
let uniErrorListener = null;

let appState = 'startup';
const isUniApiAvailable = typeof uni !== 'undefined';

function setupAppStateTracking() {
	if (appStateTrackingBound) return;
	if (isUniApiAvailable && typeof uni.onAppShow === 'function' && typeof uni.onAppHide === 'function') {
		uni.onAppShow(() => appState = 'run');
		uni.onAppHide(() => appState = 'unknown');
		appStateTrackingBound = true;
	}
}

function getAppState() {
	// #ifdef VUE3
	return appState;
	// #endif
	// #ifndef VUE3
	if (appState === 'startup') {
		if (getCurrentPages().length > 0) {
			appState = 'run';
		}
	}
	return appState;
	// #endif
}

function hasProperty(error, key) {
	return error !== null && typeof error === 'object' && key in error;
}

export const gcErrorTracking = {
	isTracking: false,
	startTracking() {
		if (this.isTracking) {
			console.log('[FTLog] Error tracking is already active', " at uni_modules/GC-UniPlugin/js_sdk/Error/GCErrorTracking.js:48");
			return;
		}
		try {
			console.log(`[FTLog] Error tracking initialized (version: ${FT_JS_PLUGIN_VERSION})`, " at uni_modules/GC-UniPlugin/js_sdk/Error/GCErrorTracking.js:52");
			setupAppStateTracking();
			this.captureConsoleError();
			// #ifdef VUE3
			this.captureUniError();
			// #endif
			// #ifndef VUE3
			this.captureVueComponentError();
			// #endif
			this.isTracking = true;
		} catch (e) {
			console.error('[FTLog] An exception occurred during uni error collection:', e, " at uni_modules/GC-UniPlugin/js_sdk/Error/GCErrorTracking.js:63");
		}
	},
	captureConsoleError() {
		if (originalConsoleError) return;
		originalConsoleError = console.error;
		console.error = function(...args) {
			originalConsoleError.apply(console, args);
			try {
				// #ifndef VUE3
				const firstArg = args[0];
				if (typeof firstArg === 'string' && firstArg.startsWith('[Vue warn]: ')) {
					console.log('[FTLog] Skip Vue2 warning string:', firstArg, " at uni_modules/GC-UniPlugin/js_sdk/Error/GCErrorTracking.js:75");
					return;
				}

				const err = args.find(item => item instanceof Error);
				if (err && err.__ft_vue_component_error__) {
					console.log('[FTLog] Skip marked Vue2 component error', " at uni_modules/GC-UniPlugin/js_sdk/Error/GCErrorTracking.js:81");
					return;
				}
				// #endif
				const errorInfo = {
					type: CONSOLE_ERROR,
					message: this.getErrorMessage(args[0]),
					stack: this.getErrorStackTrace(args[0]),
					state: appState,
				};
				this.reportError(errorInfo);
			} catch (e) {
				originalConsoleError('[FTLog] An exception occurred during error collection:', e);
			}
		}.bind(this);
	},
	captureUniError() {
		if (!isUniApiAvailable || typeof uni.onError !== 'function' || uniErrorListener) return;
		uniErrorListener = (error) => {
			try {
				console.log(error, " at uni_modules/GC-UniPlugin/js_sdk/Error/GCErrorTracking.js:101");
				const errorInfo = {
					message: this.getErrorMessage(error),
					stack: this.getErrorStackTrace(error),
					state: getAppState(),
				};
				this.reportError(errorInfo);
			} catch (e) {
				console.error('[FTLog] An exception occurred during uni error collection:', e, " at uni_modules/GC-UniPlugin/js_sdk/Error/GCErrorTracking.js:109");
			}
		};
		uni.onError(uniErrorListener);
	},
	captureVueComponentError() {
		if (typeof Vue === 'undefined' || typeof Vue.config.errorHandler !== 'function' || originalVueErrorHandler !== null) return;
		originalVueErrorHandler = Vue.config.errorHandler;
		Vue.config.errorHandler = (err, vm, info) => {
			try {
				if (err instanceof Error) {
					err.__ft_vue_component_error__ = true;
				}
				const errorInfo = {
					message: this.getErrorMessage(err),
					stack: this.getErrorStackTrace(err),
					state: getAppState(),
				};
				this.reportError(errorInfo);
			} catch (e) {
				console.error('[FTLog] Vue component error collection failed:', e, " at uni_modules/GC-UniPlugin/js_sdk/Error/GCErrorTracking.js:129");
			}

			if (originalVueErrorHandler) {
				originalVueErrorHandler(err, vm, info);
			}
		};
	},
	reportError(errorInfo) {
		console.log('[FTLog] Error captured, ready to report:', errorInfo, " at uni_modules/GC-UniPlugin/js_sdk/Error/GCErrorTracking.js:138");
		if (rum && typeof rum.addError === 'function') {
			rum.addError(errorInfo);
		}
	},
	getErrorMessage(error) {
		if (error === undefined || error === null) {
			return EMPTY_MESSAGE;
		}
		if (hasProperty(error, 'message')) {
			return String(error.message);
		}
		return String(error);
	},
	getErrorStackTrace(error) {
		if (error === undefined || error === null || typeof error === 'string') {
			return '';
		}
		if (hasProperty(error, 'componentStack')) {
			return String(error.componentStack);
		}
		if (hasProperty(error, 'stacktrace')) {
			return String(error.stacktrace);
		}
		if (hasProperty(error, 'stack')) {
			return String(error.stack);
		}
		if (hasProperty(error, 'sourceURL') && hasProperty(error, 'line') && hasProperty(error, 'column')) {
			return `at ${error.sourceURL}:${error.line}:${error.column}`;
		}
		return '';
	},
	stopTracking() {
		if (!this.isTracking) return;
		if (originalConsoleError) {
			console.error = originalConsoleError;
			originalConsoleError = null;
			console.log('[FTLog] Restored original console.error', " at uni_modules/GC-UniPlugin/js_sdk/Error/GCErrorTracking.js:175");
		}
		// #ifndef VUE3
		if (originalVueErrorHandler !== null) {
			Vue.config.errorHandler = originalVueErrorHandler;
			originalVueErrorHandler = null;
			console.log('[FTLog] Restored original Vue.config.errorHandler', " at uni_modules/GC-UniPlugin/js_sdk/Error/GCErrorTracking.js:181");
		}
		// #endif
		// #ifdef VUE3
		if (uniErrorListener && typeof uni.offError === 'function') {
			uni.offError(uniErrorListener);
			uniErrorListener = null;
			console.log('[FTLog] Removed uni.onError listener', " at uni_modules/GC-UniPlugin/js_sdk/Error/GCErrorTracking.js:188");
		}
		// #endif
		this.isTracking = false;
		appStateTrackingBound = false;
		console.log('[FTLog] Error tracking stopped, resources released', " at uni_modules/GC-UniPlugin/js_sdk/Error/GCErrorTracking.js:193");
	}
};
