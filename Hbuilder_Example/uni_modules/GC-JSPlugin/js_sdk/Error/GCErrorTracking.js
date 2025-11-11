const FT_JS_PLUGIN_VERSION = '0.2.6-alpha.2';
/**
 * Error information collection module
 * Responsible for capturing console.error and uni.onError errors
 */
const EMPTY_MESSAGE = 'Unknown Error';
const CONSOLE_ERROR = "console_error";
const rum = uni.requireNativePlugin("GCUniPlugin-RUM");

let originalConsoleError = null;
let originalVueErrorHandler = null;
let appStateTrackingBound = false;
let uniErrorListener = null;

// Application state management - initially in startup state
let appState = 'startup';
let isUniApiAvailable = typeof uni !== 'undefined';

// Monitor application show/hide state changes
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
	if (appState == 'startup') {
		if (getCurrentPages().length > 0) {
			appState = 'run';
		}
	}
	return appState;
	// #endif
}
export const gcErrorTracking = {
	isTracking: false,
	/**
	 * Initialize error collection
	 */
	startTracking() {
		if (this.isTracking) {
			console.log('[FTLog] Error tracking is already active');
			return;
		}
		try {
			console.log(`[FTLog] Error tracking initialized (version: ${FT_JS_PLUGIN_VERSION})`);

			setupAppStateTracking();

			// Capture console.error
			this.captureConsoleError();
			// #ifdef VUE3
			// Capture uni.onError
			this.captureUniError();
			//  #endif

			// #ifndef VUE3
			this.captureVueComponentError();
			// #endif

			this.isTracking = true;

		} catch (e) {
			console.error('[FTLog] An exception occurred during uni error collection:', e);
		}
	},

	/**
	 * Capture console.error errors
	 */
	captureConsoleError() {
		if (originalConsoleError) return;
		originalConsoleError = console.error;
		console.error = function(...args) {
			// Call the original method to ensure errors are normally output to the console
			originalConsoleError.apply(console, args);
			// Process error information
			try {
				// #ifndef VUE3
				// Filter 1: args[0] is a Vue2 warning string (starts with [Vue warn]: )
				const firstArg = args[0];
				if (typeof firstArg === 'string' && firstArg.startsWith('[Vue warn]: ')) {
					console.log('[FTLog] Skip Vue2 warning string:', firstArg);
					return;
				}
	
				// Filter 2: Error instances marked by Vue.config.errorHandler
				const err = args.find(item => item instanceof Error); // Find the actual Error instance
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
	
				// Report error information
				this.reportError(errorInfo);
			} catch (e) {
				originalConsoleError('[FTLog] An exception occurred during error collection:', e);
			}
		}.bind(this);
	},

	/**
	 * Capture uni.onError errors
	 */
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

			// Preserve original error handling logic
			if (originalVueErrorHandler) {
				originalVueErrorHandler(err, vm, info);
			}
		};
	},
	/**
	 * Report error information
	 * @param {Object} errorInfo - Error information object
	 */
	reportError(errorInfo) {
		console.log('[FTLog] Error captured, ready to report:', errorInfo);
		if (rum) {
			rum.addError(errorInfo);
		}
	},

	/**
	 * Get error message
	 * @param {any} error - Error object or information
	 * @returns {string} Error message
	 */
	getErrorMessage(error) {
		let message = EMPTY_MESSAGE;
		if (error === undefined || error === null) {
			message = EMPTY_MESSAGE;
		} else if (typeof error === 'object' && 'message' in error) {
			message = String(error.message);
		} else {
			message = String(error);
		}
		return message;
	},

	/**
	 * Get error stack trace
	 * @param {any} error - Error object or information
	 * @returns {string} Error stack trace
	 */
	getErrorStackTrace(error) {
		let stack = '';
		if (error === undefined) {
			stack = '';
		} else if (typeof error === 'string') {
			stack = '';
		} else if ('componentStack' in error) {
			stack = String(error.componentStack);
		} else if ('stacktrace' in error) {
			stack = String(error.stacktrace);
		} else if ('stack' in error) {
			stack = String(error.stack);
		} else if (('sourceURL' in error) && ('line' in error) && ('column' in error)) {
			stack = `at ${error.sourceURL}:${error.line}:${error.column}`;
		}
		return stack;
	},
	stopTracking() {
		if (!this.isTracking) return;
		// 1. Restore original console.error
		if (originalConsoleError) {
			console.error = originalConsoleError;
			originalConsoleError = null;
			console.log('[FTLog] Restored original console.error');
		}
		// 2. Restore original Vue.config.errorHandler (Vue2)
		// #ifndef VUE3
		if (originalVueErrorHandler !== null) { // Note: Avoid overwriting with undefined
			Vue.config.errorHandler = originalVueErrorHandler;
			originalVueErrorHandler = null;
			console.log('[FTLog] Restored original Vue.config.errorHandler');
		}
		// #endif

		// 3. Remove uni.onError listener (Vue3)
		// #ifdef VUE3
		if (uniErrorListener && typeof uni.offError === 'function') {
			uni.offError(uniErrorListener);
			uniErrorListener = null;
			console.log('[FTLog] Removed uni.onError listener');
		}
		// #endif
		// 4. Reset flags
		this.isTracking = false;
		appStateTrackingBound = false; // Reset app state tracking flag
		console.log('[FTLog] Error tracking stopped, resources released');
	}
};