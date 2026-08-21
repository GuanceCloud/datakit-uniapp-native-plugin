import * as SDKConst from '@/utils.js'
import {
	logger,
	mobileAgent,
	rum,
	tracer
} from '@/uni_modules/GC-UniPlugin'

// #ifdef APP-PLUS
import {
	GCUniSessionReplay,
	GCSessionReplayImagePrivacy,
	GCSessionReplayTextAndInputPrivacy,
	GCSessionReplayTouchPrivacy
} from '@/uni_modules/GC-UniSessionReplay'
// #endif


let initialized = false

export function initializeGuanceSDK() {
	if (initialized) {
		return
	}
	if (!SDKConst.DATAWAY_URL || !SDKConst.CLIENT_TOKEN) {
		console.warn('[Guance] SDK initialization skipped: configure DATAWAY_URL and CLIENT_TOKEN locally.')
		return
	}
	initialized = true

	mobileAgent.sdkConfig({
		datawayUrl: SDKConst.DATAWAY_URL,
		clientToken: SDKConst.CLIENT_TOKEN,
		autoSync: true,
		debug: true,
		env: 'common',
		remoteConfiguration: true,
		remoteConfigMiniUpdateInterval: 600,
		enableDataFilter: true,
		dataFilters: {},
		globalContext: {
			sdk_globalContext: 'custom_sdk_globalContext'
		}
	})

	rum.setConfig({
		androidAppId: SDKConst.ANDROID_APP_ID,
		iOSAppId: SDKConst.IOS_APP_ID,
		harmonyAppId: SDKConst.HARMONY_APP_ID,
		errorMonitorType: ['cpu', 'memory'],
		deviceMonitorType: 'all',
		enableNativeUserResource: true,
		enableTrackNativeCrash: true,
		enableTrackNativeAppANR: true,
		enableTrackNativeFreeze: true,
		nativeFreezeDurationMs: 400,
		rumDiscardStrategy: 'discardOldest',
		rumCacheLimitCount: 10000,
		enableTraceWebView: true,
		// UniApp renders application pages from file:// URLs whose hostname is
		// empty. A host-only allowlist excludes those pages from the native bridge.
		allowWebViewHost: null,
		globalContext: {
			track_id: SDKConst.TRACK_ID,
			rum_globalContext: 'custom_rum_globalContext'
		}
	})

	// #ifdef APP-PLUS
	GCUniSessionReplay.setConfig({
		sampleRate: 100,
		sessionReplayOnErrorSampleRate: 0,
		touchPrivacy: GCSessionReplayTouchPrivacy.SHOW,
		textAndInputPrivacy: GCSessionReplayTextAndInputPrivacy.MASK_SENSITIVE_INPUTS,
		imagePrivacy: GCSessionReplayImagePrivacy.MASK_NONE,
		enableLinkRUMKeys: ['wgt_id']
	})
	// #endif

	logger.setConfig({
		enableLinkRumData: true,
		enableCustomLog: true,
		discardStrategy: 'discardOldest',
		logLevelFilters: ['info', 'warn', 'error'],
		logCacheLimitCount: 6000,
		globalContext: {
			logger_globalContext: 'custom_logger_globalContext'
		}
	})
	tracer.setConfig({
		traceType: 'ddTrace',
		enableLinkRUMData: true
	})
}
