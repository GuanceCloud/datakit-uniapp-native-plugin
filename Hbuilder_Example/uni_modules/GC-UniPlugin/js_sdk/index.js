import {
	gcActionTracking
} from './Action/GCActionTracking.js';

// #ifdef APP-HARMONY
gcActionTracking.startTracking();
// #endif

export {
	mobileAgent,
	rum,
	logger,
	tracer,
	GCEnv,
	GCDiscardStrategy,
	GCTraceType,
	GCMonitorFrequency,
	GCLogStatus,
	GCErrorMonitorType,
	GCDeviceMonitorType
} from './native.js';
export {
	gcRequest
} from './Request/GCRequest.js';
export {
	gcHarmonyNetworkTracking
} from './Request/GCHarmonyNetworkTracking.js';
export {
	gcPageMixin
} from './View/GCPageMixin.js';
export {
	gcPageViewMixinOnly
} from './View/GCPageViewMixinOnly.js';
export {
	gcWatchRouter
} from './View/GCWatchRouter.js';
export {
	gcErrorTracking
} from './Error/GCErrorTracking.js';
export {
	gcViewTracking
} from './View/GCViewTracking.js';
export {
	gcActionTracking
};
