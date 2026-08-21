const LEGACY_MODULE_IDS = {
	mobileAgent: 'GCUniPlugin-MobileAgent',
	rum: 'GCUniPlugin-RUM',
	logger: 'GCUniPlugin-Logger',
	tracer: 'GCUniPlugin-Tracer'
};

const legacyModules = {};
let installedBridge = null;
let installedBridgeSource = 'legacy';

function isBridgeModule(value) {
	return value !== null && (typeof value === 'object' || typeof value === 'function');
}

function getLegacyModule(moduleName) {
	if (legacyModules[moduleName]) {
		return legacyModules[moduleName];
	}
	if (typeof uni === 'undefined' || typeof uni.requireNativePlugin !== 'function') {
		return null;
	}

	try {
		const nativeModule = uni.requireNativePlugin(LEGACY_MODULE_IDS[moduleName]);
		if (isBridgeModule(nativeModule)) {
			legacyModules[moduleName] = nativeModule;
			return nativeModule;
		}
	} catch (_) {
		// A WGT may run without its native host while it is being debugged.
	}
	return null;
}

function getBridgeModule(moduleName) {
	if (installedBridge) {
		return installedBridge[moduleName] || null;
	}
	return getLegacyModule(moduleName);
}

function invoke(moduleName, methodName, args, fallbackValue) {
	const bridgeModule = getBridgeModule(moduleName);
	if (!bridgeModule || typeof bridgeModule[methodName] !== 'function') {
		return fallbackValue;
	}
	return bridgeModule[methodName].apply(bridgeModule, args);
}

function createFacade(moduleName, methodFallbacks) {
	const facade = {};
	Object.keys(methodFallbacks).forEach(methodName => {
		facade[methodName] = function(...args) {
			return invoke(moduleName, methodName, args, methodFallbacks[methodName]);
		};
	});
	return facade;
}

export function installNativeBridge(bridge, options = {}) {
	const moduleNames = Object.keys(LEGACY_MODULE_IDS);
	const missingModules = moduleNames.filter(moduleName => !isBridgeModule(bridge && bridge[moduleName]));
	if (missingModules.length > 0) {
		throw new TypeError(`Invalid Guance native bridge: missing ${missingModules.join(', ')}`);
	}

	const previousBridge = installedBridge;
	const previousSource = installedBridgeSource;
	installedBridge = bridge;
	installedBridgeSource = options.source || 'custom';

	// Returning a restore function keeps tests and host hot-reload integrations
	// from replacing the public facade objects.
	return function restoreNativeBridge() {
		if (installedBridge === bridge) {
			installedBridge = previousBridge;
			installedBridgeSource = previousSource;
		}
	};
}

export function getNativeBridgeSource() {
	return installedBridge ? installedBridgeSource : 'legacy';
}

export const mobileAgent = createFacade('mobileAgent', {
	sdkConfig: undefined,
	setDatakitURL: undefined,
	setDatawayURL: undefined,
	updateRemoteConfigWithMiniUpdateInterval: undefined,
	bindRUMUserData: undefined,
	unbindRUMUserData: undefined,
	appendGlobalContext: undefined,
	appendRUMGlobalContext: undefined,
	appendLogGlobalContext: undefined,
	appendBridgeContext: undefined,
	flushSyncData: undefined,
	clearAllData: undefined,
	shutDown: undefined,
	manuallySetApplicationStart: undefined
});

export const rum = createFacade('rum', {
	setConfig: undefined,
	startAction: undefined,
	addAction: undefined,
	onCreateView: undefined,
	startView: undefined,
	stopView: undefined,
	addError: undefined,
	startResource: undefined,
	stopResource: undefined,
	addResource: undefined,
	isUniAppJSViewTrackingEnabled: true,
	isHarmonyUniRequestAutoTrackingEnabled: false,
	attachWebView: undefined,
	detachWebView: undefined
});

export const logger = createFacade('logger', {
	setConfig: undefined,
	logging: undefined
});

export const tracer = createFacade('tracer', {
	setConfig: undefined,
	getTraceHeader: null,
	isHarmonyUniRequestAutoTraceEnabled: false
});

export const GCEnv = Object.freeze({
	PROD: 'prod',
	GRAY: 'gray',
	PRE: 'pre',
	COMMON: 'common',
	LOCAL: 'local'
});

export const GCDiscardStrategy = Object.freeze({
	DISCARD: 'discard',
	DISCARD_OLDEST: 'discardOldest'
});

export const GCTraceType = Object.freeze({
	DDTRACE: 'ddTrace',
	ZIPKIN_MULTI_HEADER: 'zipkinMultiHeader',
	ZIPKIN_SINGLE_HEADER: 'zipkinSingleHeader',
	TRACEPARENT: 'traceparent',
	SKYWALKING: 'skywalking',
	JAEGER: 'jaeger'
});

export const GCMonitorFrequency = Object.freeze({
	NORMAL: 'normal',
	FREQUENT: 'frequent',
	RARE: 'rare'
});

export const GCLogStatus = Object.freeze({
	INFO: 'info',
	DEBUG: 'debug',
	WARNING: 'warning',
	ERROR: 'error',
	CRITICAL: 'critical',
	OK: 'ok'
});

export const GCErrorMonitorType = Object.freeze({
	BATTERY: 'battery',
	MEMORY: 'memory',
	CPU: 'cpu',
	ALL: 'all'
});

export const GCDeviceMonitorType = Object.freeze({
	BATTERY: 'battery',
	MEMORY: 'memory',
	CPU: 'cpu',
	FPS: 'fps',
	ALL: 'all'
});
