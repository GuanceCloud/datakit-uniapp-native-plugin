import {
	rum,
	tracer
} from '../native.js';
let interceptorInstalled = false;
let startTrackingInvoked = false;
let trackingConfig = {
	enableIOS: true
};

function debugLog(event, details = null) {
	if (process.env.NODE_ENV !== 'development') return;
	console.log('[FTLog][ResourceTracking][Debug]', {
		event: event,
		details: details,
		timestamp: Date.now()
	});
}

function getCurrentPlatform() {
	if (typeof uni === 'undefined' || typeof uni.getSystemInfoSync !== 'function') {
		return 'unknown';
	}
	return uni.getSystemInfoSync().platform;
}

function isSupportedPlatform(platform) {
	return platform === 'ios' || platform === 'android' || platform === 'harmonyos';
}

function isTrackingEnabledForPlatform(platform) {
	return platform !== 'ios' || trackingConfig.enableIOS;
}

function applyTrackingConfig(config) {
	trackingConfig = {
		enableIOS: !config || config.enableIOS !== false
	};
}

function createRequestKey() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		const random = Math.random() * 16 | 0;
		const value = c === 'x' ? random : (random & 0x3 | 0x8);
		return value.toString(16);
	});
}

function getTraceHeaders(key, url) {
	try {
		return tracer.getTraceHeader({
			key: key,
			url: url
		}) || {};
	} catch (error) {
		debugLog('trace-header-error', {
			url: url,
			error: error && (error.stack || error.message || String(error))
		});
		return {};
	}
}

function stringifyResponseBody(value) {
	if (value === null || value === undefined) {
		return '';
	}
	if (typeof value === 'string') {
		return value;
	}
	try {
		return JSON.stringify(value);
	} catch (error) {
		return String(value);
	}
}

function completeResource(request, response) {
	try {
		rum.stopResource({ key: request.key });
		rum.addResource({
			key: request.key,
			content: {
				url: request.url,
				httpMethod: request.method,
				requestHeader: request.requestHeaders,
				responseHeader: response.header,
				responseBody: stringifyResponseBody(response.data),
				resourceStatus: response.statusCode
			}
		});
		debugLog('resource-completed', {
			statusCode: response.statusCode,
			url: request.url,
			key: request.key
		});
	} catch (error) {
		debugLog('resource-completion-error', {
			url: request.url,
			key: request.key,
			error: error && (error.stack || error.message || String(error))
		});
	}
}

function completeResourceError(request, error) {
	try {
		const errorMessage = error.errMsg || error.message || String(error);
		// The native SDK generates the correlated network Error from a failed
		// Resource when it has an error stack. uni.request timeout objects do
		// not consistently contain one, so preserve the message as a fallback.
		const errorStack = error.stack || errorMessage;
		rum.stopResource({ key: request.key });
		rum.addResource({
			key: request.key,
			content: {
				url: request.url,
				httpMethod: request.method,
				requestHeader: request.requestHeaders,
				responseBody: stringifyResponseBody(error.data),
				resourceStatus: error.statusCode || 0,
				errorMessage: errorMessage,
				errorStack: errorStack
			}
		});
		debugLog('resource-failed', {
			error: errorMessage,
			url: request.url,
			key: request.key
		});
	} catch (trackingError) {
		debugLog('resource-failure-error', {
			url: request.url,
			key: request.key,
			error: trackingError && (trackingError.stack || trackingError.message || String(trackingError))
		});
	}
}

/**
 * Tracks DCloud uni.request with the Android, iOS, and HarmonyOS native RUM
 * SDK APIs.
 *
 * The interceptor injects Trace headers and observes DCloud's request
 * lifecycle. Disable iOS tracking when enableNativeUserResource is enabled
 * because iOS dispatches uni.request through native URLSession and the native
 * SDK already collects it.
 */
export const gcResourceTracking = {
	startTracking(config = {}) {
		// #ifdef APP-PLUS || APP-HARMONY
		const platform = getCurrentPlatform();
		const hasAddInterceptor = typeof uni !== 'undefined' && typeof uni.addInterceptor === 'function';
		if (startTrackingInvoked) {
			debugLog('start-ignored', {
				platform: platform,
				reason: 'already invoked'
			});
			return false;
		}
		startTrackingInvoked = true;

		applyTrackingConfig(config);
		const platformTrackingEnabled = isTrackingEnabledForPlatform(platform);
		if (!isSupportedPlatform(platform) || !platformTrackingEnabled ||
			!hasAddInterceptor) {
			debugLog('not-installed', {
				interceptorInstalled: interceptorInstalled,
				platform: platform,
				platformTrackingEnabled: platformTrackingEnabled,
				hasAddInterceptor: hasAddInterceptor
			});
			return false;
		}

		uni.addInterceptor('request', {
			invoke(options) {
				try {
					const key = options.__gcResourceKey || createRequestKey();
					// This key is JavaScript-only correlation metadata. Remove it before
					// DCloud dispatches the request to its native networking implementation.
					delete options.__gcResourceKey;
					const traceHeaders = getTraceHeaders(key, options.url);
					// Explicit request headers take precedence over SDK-generated headers.
					options.header = Object.assign({}, traceHeaders, options.header || {});
					rum.startResource({ key: key });
					const request = {
						key: key,
						url: options.url,
						method: options.method || 'GET',
						requestHeaders: Object.assign({}, options.header || {})
					};
					// DCloud may recreate the request options object before invoking
					// interceptor success/fail hooks. Wrap the callbacks here so the
					// same closure keeps the exact startResource key.
					const originalSuccess = options.success;
					const originalFail = options.fail;
					options.success = (response) => {
						completeResource(request, response);
						return typeof originalSuccess === 'function' ? originalSuccess(response) : response;
					};
					options.fail = (error) => {
						completeResourceError(request, error);
						return typeof originalFail === 'function' ? originalFail(error) : error;
					};
				} catch (error) {
					debugLog('request-invocation-error', {
						url: options && options.url,
						error: error && (error.stack || error.message || String(error))
					});
				}
				return options;
			}
		});
		interceptorInstalled = true;
		debugLog('installed', {
			platform: platform
		});
		return true;
		// #endif
		return false;
	},

	isTracking() {
		// #ifdef APP-PLUS || APP-HARMONY
		return interceptorInstalled;
		// #endif
		return false;
	},

	shouldUseManualTracking() {
		// #ifdef APP-PLUS || APP-HARMONY
		const platform = getCurrentPlatform();
		if (isSupportedPlatform(platform) && !isTrackingEnabledForPlatform(platform)) {
			return false;
		}
		return !interceptorInstalled;
		// #endif
		return true;
	}
};
