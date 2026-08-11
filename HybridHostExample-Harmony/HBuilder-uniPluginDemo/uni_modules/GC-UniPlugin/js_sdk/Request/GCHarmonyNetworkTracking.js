import {
	rum
} from '@/uni_modules/GC-UniPlugin';

let interceptorInstalled = false;

function isHarmonyPlatform() {
	if (typeof uni === 'undefined' || typeof uni.getSystemInfoSync !== 'function') {
		return false;
	}
	return uni.getSystemInfoSync().platform === 'harmonyos';
}

function createRequestKey() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		const random = Math.random() * 16 | 0;
		const value = c === 'x' ? random : (random & 0x3 | 0x8);
		return value.toString(16);
	});
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
		console.log('[GC-UniPlugin] Harmony uni.request resource completed:', response.statusCode, request.url, request.key, " at uni_modules/GC-UniPlugin/js_sdk/Request/GCHarmonyNetworkTracking.js:50");
	} catch (error) {
		console.error('[GC-UniPlugin] Harmony uni.request tracking success failed:', error, " at uni_modules/GC-UniPlugin/js_sdk/Request/GCHarmonyNetworkTracking.js:52");
	}
}

function completeResourceError(request, error) {
	try {
		const errorMessage = error.errMsg || error.message || String(error);
		// Harmony SDK generates the correlated network Error from a failed
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
		console.warn('[GC-UniPlugin] Harmony uni.request resource failed:', errorMessage, request.url, request.key, " at uni_modules/GC-UniPlugin/js_sdk/Request/GCHarmonyNetworkTracking.js:76");
	} catch (trackingError) {
		console.error('[GC-UniPlugin] Harmony uni.request tracking fail failed:', trackingError, " at uni_modules/GC-UniPlugin/js_sdk/Request/GCHarmonyNetworkTracking.js:78");
	}
}

/**
 * Tracks DCloud uni.request with the Harmony native RUM SDK APIs.
 *
 * The interceptor only observes DCloud's request lifecycle. It does not
 * inject Trace headers: enableNativeUserResource controls Resource collection
 * only. Explicit gcRequest manual collection retains its own Trace behavior.
 */
export const gcHarmonyNetworkTracking = {
	startTracking() {
		// #ifdef APP-HARMONY
		const platform = typeof uni !== 'undefined' && typeof uni.getSystemInfoSync === 'function' ?
			uni.getSystemInfoSync().platform : 'unknown';
		const hasAddInterceptor = typeof uni !== 'undefined' && typeof uni.addInterceptor === 'function';
		const nativeResourceEnabled = typeof rum.isHarmonyUniRequestAutoTrackingEnabled === 'function' &&
			rum.isHarmonyUniRequestAutoTrackingEnabled();
		if (interceptorInstalled || !isHarmonyPlatform() ||
			!hasAddInterceptor || !nativeResourceEnabled) {
			console.warn('[GC-UniPlugin] Harmony uni.request tracker not installed:', {
				interceptorInstalled: interceptorInstalled,
				platform: platform,
				hasAddInterceptor: hasAddInterceptor,
				nativeResourceEnabled: nativeResourceEnabled
			}, " at uni_modules/GC-UniPlugin/js_sdk/Request/GCHarmonyNetworkTracking.js:99");
			return false;
		}

		uni.addInterceptor('request', {
			invoke(options) {
				try {
					const key = options.__gcResourceKey || createRequestKey();
					// This key is JavaScript-only correlation metadata. Remove it before
					// DCloud dispatches the request to its native NetworkKit implementation.
					delete options.__gcResourceKey;
					console.log('[GC-UniPlugin] Harmony uni.request start:', options.method || 'GET', options.url, key, " at uni_modules/GC-UniPlugin/js_sdk/Request/GCHarmonyNetworkTracking.js:115");
					rum.startResource({ key: key });
					const request = {
						key: key,
						url: options.url,
						method: options.method || 'GET',
						requestHeaders: options.header || {}
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
					console.error('[GC-UniPlugin] Harmony uni.request tracking invoke failed:', error, " at uni_modules/GC-UniPlugin/js_sdk/Request/GCHarmonyNetworkTracking.js:137");
				}
				return options;
			}
		});
		interceptorInstalled = true;
		console.log('[GC-UniPlugin] Harmony uni.request tracker installed:', platform, " at uni_modules/GC-UniPlugin/js_sdk/Request/GCHarmonyNetworkTracking.js:143");
		return true;
		// #endif
		return false;
	},

	isTracking() {
		// #ifdef APP-HARMONY
		return interceptorInstalled &&
			typeof rum.isHarmonyUniRequestAutoTrackingEnabled === 'function' &&
			rum.isHarmonyUniRequestAutoTrackingEnabled();
		// #endif
		return false;
	}
};
