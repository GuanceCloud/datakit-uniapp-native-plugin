import * as SDKConst from '@/utils.js'
import {
	gcErrorTracking
} from '@/uni_modules/GC-UniPlugin/js_sdk'
import {
	logger,
	mobileAgent,
	rum,
	tracer
} from '@/uni_modules/GC-UniPlugin'
import {
	GCUniSessionReplay,
	GCSessionReplayImagePrivacy,
	GCSessionReplayTextAndInputPrivacy,
	GCSessionReplayTouchPrivacy
} from '@/uni_modules/GC-UniSessionReplay'


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
		offlinePackage: true,
		env: 'common',
		globalContext: {
			sdk_globalContext: 'custom_sdk_globalContext'
		}
	})

	rum.setConfig({
		androidAppId: SDKConst.ANDROID_APP_ID,
		iOSAppId: SDKConst.IOS_APP_ID,
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
		enableNativeUserAction: true,
		globalContext: {
			track_id: SDKConst.TRACK_ID,
			rum_globalContext: 'custom_rum_globalContext'
		}
	})


	GCUniSessionReplay.setConfig({
		sampleRate: 100,
		sessionReplayOnErrorSampleRate: 0,
		touchPrivacy: GCSessionReplayTouchPrivacy.SHOW,
		textAndInputPrivacy: GCSessionReplayTextAndInputPrivacy.MASK_SENSITIVE_INPUTS,
		imagePrivacy: GCSessionReplayImagePrivacy.MASK_NONE,
		enableLinkRUMKeys: ['wgt_id']
	})

	gcErrorTracking.startTracking()
	logger.setConfig({
		enableLinkRumData: true,
		enableCustomLog: true,
		discardStrategy: 'discardOldest',
		logLevelFilters: ['warning', 'error'],
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
