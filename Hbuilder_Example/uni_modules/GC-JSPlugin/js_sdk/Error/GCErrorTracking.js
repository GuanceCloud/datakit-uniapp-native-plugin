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

function debugLog(event, details = null) {
	if (process.env.NODE_ENV !== 'development') return;
	console.log('[FTLog][ErrorTracking][Debug]', {
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
	startTracking() {
		if (this.isTracking) {
			debugLog('start-ignored', {
				reason: 'already active'
			});
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
			debugLog('initialization-error', {
				error: formatError(e)
			});
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
					return;
				}

				const err = args.find(item => item instanceof Error);
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
				this.reportError(errorInfo);
			} catch (e) {
				debugLog('console-error-collection-error', {
					error: formatError(e)
				});
			}
		}.bind(this);
	},
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
				});
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
				});
			}

			if (originalVueErrorHandler) {
				originalVueErrorHandler(err, vm, info);
			}
		};
	},
	reportError(errorInfo) {
		debugLog('error-reported', {
			type: errorInfo.type,
			message: errorInfo.message,
			state: errorInfo.state
		});
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
		}
		// #ifndef VUE3
		if (originalVueErrorHandler !== null) {
			Vue.config.errorHandler = originalVueErrorHandler;
			originalVueErrorHandler = null;
		}
		// #endif
		// #ifdef VUE3
		if (uniErrorListener && typeof uni.offError === 'function') {
			uni.offError(uniErrorListener);
			uniErrorListener = null;
		}
		// #endif
		this.isTracking = false;
		appStateTrackingBound = false;
		debugLog('stopped');
	}
};
