import {
  gcErrorTracking,
  gcHarmonyNetworkTracking
} from '@/uni_modules/GC-UniPlugin/js_sdk';
import {
  logger,
  mobileAgent,
  rum,
  tracer
} from '@/uni_modules/GC-UniPlugin';
import { guanceConfig } from './guance-config.js';

let initialized = false;

export function isGuanceConfigured() {
  return Boolean(
    guanceConfig.datawayUrl &&
    guanceConfig.clientToken &&
    guanceConfig.harmonyAppId
  );
}

export function initializeGuanceSDK() {
  if (initialized) {
    return true;
  }

  if (!isGuanceConfigured()) {
    console.warn(
      '[Guance Harmony Host] SDK initialization skipped. Set datawayUrl, clientToken, and harmonyAppId in guance-config.js.'
    );
    return false;
  }

  mobileAgent.sdkConfig({
    datawayUrl: guanceConfig.datawayUrl,
    clientToken: guanceConfig.clientToken,
    env: guanceConfig.env,
    service: guanceConfig.service,
    autoSync: true,
    debug: true,
    globalContext: {
      integration_host: 'harmony'
    }
  });

  rum.setConfig({
    harmonyAppId: guanceConfig.harmonyAppId,
    sampleRate: 100,
    sessionOnErrorSampleRate: 100,
    enableNativeUserAction: true,
    enableNativeUserView: true,
    enableNativeUserResource: true,
    enableTrackNativeCrash: true,
    enableTrackNativeAppANR: true,
    enableTrackNativeFreeze: true,
    nativeFreezeDurationMs: 1000,
    enableTraceWebView: true,
    allowWebViewHost: guanceConfig.allowWebViewHost,
    globalContext: {
      integration_host: 'harmony'
    }
  });

  logger.setConfig({
    enableLinkRumData: true,
    enableCustomLog: true,
    sampleRate: 100,
    discardStrategy: 'discardOldest'
  });

  tracer.setConfig({
    traceType: 'ddTrace',
    enableLinkRUMData: true,
    sampleRate: 100
  });

  gcErrorTracking.startTracking();
  // #ifdef APP-HARMONY
  // uni.request is tracked through the Harmony native bridge when resource
  // collection is enabled above. This call is intentionally Harmony-only.
  gcHarmonyNetworkTracking.startTracking();
  // #endif

  initialized = true;
  console.log('[Guance Harmony Host] SDK initialized');
  return true;
}
