const FT_JS_PLUGIN_VERSION = '0.2.7';
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

function debugLog(event, details = null, isError = false) {
	if (process.env.NODE_ENV !== 'development') return;
	const level = isError ? 'Error' : 'Debug';
	console.log(`[FTLog][ErrorTracking][${level}]`, {
		event: event,
		details: details,
		timestamp: Date.now()
	});
}

function formatError(error) {
	return error && (error.stack || error.message || String(error));
}

export const gcErrorTracking = {
	isTracking: false,
	/**
	 * Initialize error collection
	 */
	startTracking() {
		if (this.isTracking) {
			debugLog('start-ignored', {
				reason: 'already active'
			});
			return;
		}
		try {
			debugLog('initialized', {
				version: FT_JS_PLUGIN_VERSION
			});

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
			debugLog('initialization-error', {
				error: formatError(e)
			}, true);
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
					return;
				}
	
				// Filter 2: Error instances marked by Vue.config.errorHandler
				const err = args.find(item => item instanceof Error); // Find the actual Error instance
				if (err && err.__ft_vue_component_error__) {
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
				debugLog('console-error-collection-error', {
					error: formatError(e)
				}, true);
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
				const errorInfo = {
					message: this.getErrorMessage(error),
					stack: this.getErrorStackTrace(error),
					state: getAppState(),
				};
				this.reportError(errorInfo);
			} catch (e) {
				debugLog('uni-error-collection-error', {
					error: formatError(e)
				}, true);
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
				debugLog('vue-error-collection-error', {
					error: formatError(e)
				}, true);
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
		debugLog('error-reported', {
			type: errorInfo.type,
			message: errorInfo.message,
			state: errorInfo.state
		});
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
		}
		// 2. Restore original Vue.config.errorHandler (Vue2)
		// #ifndef VUE3
		if (originalVueErrorHandler !== null) { // Note: Avoid overwriting with undefined
			Vue.config.errorHandler = originalVueErrorHandler;
			originalVueErrorHandler = null;
		}
		// #endif

		// 3. Remove uni.onError listener (Vue3)
		// #ifdef VUE3
		if (uniErrorListener && typeof uni.offError === 'function') {
			uni.offError(uniErrorListener);
			uniErrorListener = null;
		}
		// #endif
		// 4. Reset flags
		this.isTracking = false;
		appStateTrackingBound = false; // Reset app state tracking flag
		debugLog('stopped');
	}
};
