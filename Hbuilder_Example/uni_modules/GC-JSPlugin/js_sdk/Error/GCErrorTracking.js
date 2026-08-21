import {
	rum
} from '../native.js';

const EMPTY_MESSAGE = 'Unknown Error';
const CONSOLE_ERROR = 'console_error';
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
			console.log('[FTLog] Error tracking is already active');
			return;
		}
		try {
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
			console.error('[FTLog] An exception occurred during uni error collection:', e);
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
					console.log('[FTLog] Skip Vue2 warning string:', firstArg);
					return;
				}

				const err = args.find(item => item instanceof Error);
				if (err && err.__ft_vue_component_error__) {
					console.log('[FTLog] Skip marked Vue2 component error');
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
				console.log(error);
				const errorInfo = {
					message: this.getErrorMessage(error),
					stack: this.getErrorStackTrace(error),
					state: getAppState(),
				};
				this.reportError(errorInfo);
			} catch (e) {
				console.error('[FTLog] An exception occurred during uni error collection:', e);
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
				console.error('[FTLog] Vue component error collection failed:', e);
			}

			if (originalVueErrorHandler) {
				originalVueErrorHandler(err, vm, info);
			}
		};
	},
	reportError(errorInfo) {
		console.log('[FTLog] Error captured, ready to report:', errorInfo);
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
			console.log('[FTLog] Restored original console.error');
		}
		// #ifndef VUE3
		if (originalVueErrorHandler !== null) {
			Vue.config.errorHandler = originalVueErrorHandler;
			originalVueErrorHandler = null;
			console.log('[FTLog] Restored original Vue.config.errorHandler');
		}
		// #endif
		// #ifdef VUE3
		if (uniErrorListener && typeof uni.offError === 'function') {
			uni.offError(uniErrorListener);
			uniErrorListener = null;
			console.log('[FTLog] Removed uni.onError listener');
		}
		// #endif
		this.isTracking = false;
		appStateTrackingBound = false;
		console.log('[FTLog] Error tracking stopped, resources released');
	}
};
