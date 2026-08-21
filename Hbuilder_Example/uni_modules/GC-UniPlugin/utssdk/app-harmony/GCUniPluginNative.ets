/**
 * ArkTS implementation backing the HarmonyOS GC-UniPlugin UTS facade.
 *
 * ETS files cannot import UTS modules. Keep Harmony SDK state and platform
 * types here; the UTS facade passes public API values and bridge metadata in.
 */
import type { DataModifier, DataModifierValue, LineDataModifier } from '@guancecloud/ft_sdk';
import { Context } from '@kit.AbilityKit';
import webview from '@ohos.web.webview';
import {
  AppState,
  DBCacheDiscard,
  DetectFrequency,
  DeviceMetricsMonitorType,
  ErrorMonitorType,
  FTLogger,
  FTLoggerConfig,
  FTRUMConfig,
  FTRUMGlobalManager,
  FTSDK,
  FTSDKConfig,
  FTTraceConfig,
  FTTraceManager,
  FTWebViewHandler,
  LogCacheDiscard,
  NetStatusBean,
  ResourceParams,
  RUMCacheDiscard,
  Status,
  TraceType,
  UserData
} from '@guancecloud/ft_sdk';

type HarmonyValue = string | number | boolean | object;
type HarmonyOptionalValue = HarmonyValue | null;
type HarmonyProperties = Record<string, HarmonyOptionalValue>;
type HarmonyDataModifierParams = Record<string, DataModifierValue>;
type HarmonyLineDataModifierParams = Record<string, HarmonyDataModifierParams>;
type HarmonyBooleanValue = boolean | number | string;

interface HarmonyMobileConfig {
  datakitUrl?: string | null;
  datawayUrl?: string | null;
  clientToken?: string | null;
  serverUrl?: string | null;
  metricsUrl?: string | null;
  env?: string | null;
  debug?: HarmonyBooleanValue | null;
  enableSDKDebugLog?: HarmonyBooleanValue | null;
  service?: string | null;
  serviceName?: string | null;
  autoSync?: boolean | null;
  syncPageSize?: number | null;
  syncSleepTime?: number | null;
  enableDataIntegerCompatible?: boolean | null;
  compressIntakeRequests?: boolean | null;
  enableLimitWithDbSize?: boolean | null;
  dbCacheLimit?: number | null;
  dbDiscardStrategy?: string | null;
  globalContext?: HarmonyProperties | null;
  dataModifier?: HarmonyDataModifierParams | null;
  lineDataModifier?: HarmonyLineDataModifierParams | null;
  remoteConfiguration?: boolean | null;
  remoteConfigMiniUpdateInterval?: number | null;
  enableDataFilter?: boolean | null;
  dataFilters?: Record<string, string[]> | null;
}

interface HarmonyDatakitURLParams {
  datakitUrl: string;
}

interface HarmonyDatawayURLParams {
  datawayUrl: string;
  clientToken: string;
}

interface HarmonyRUMUserDataParams {
  userId: string;
  userName?: string | null;
  userEmail?: string | null;
  extra?: HarmonyProperties | null;
}

interface HarmonyRUMConfig {
  androidAppId?: string | null;
  iOSAppId?: string | null;
  harmonyAppId?: string | null;
  sampleRate?: number | null;
  samplerate?: number | null;
  sessionOnErrorSampleRate?: number | null;
  enableNativeUserAction?: boolean | null;
  enableNativeUserView?: boolean | null;
  enableNativeUserResource?: boolean | null;
  enableResourceHostIP?: boolean | null;
  enableTrackNativeCrash?: boolean | null;
  enableTrackNativeAppANR?: boolean | null;
  enableTrackNativeFreeze?: boolean | null;
  nativeFreezeDurationMs?: number | null;
  errorMonitorType?: string | string[] | null;
  deviceMonitorType?: string | string[] | null;
  detectFrequency?: string | null;
  enableTraceWebView?: boolean | null;
  allowWebViewHost?: string[] | null;
  globalContext?: HarmonyProperties | null;
  rumCacheLimitCount?: number | null;
  rumDiscardStrategy?: string | null;
}

interface HarmonyRUMActionParams {
  actionName: string;
  actionType?: string | null;
  property?: HarmonyProperties | null;
}

interface HarmonyRUMCreateViewParams {
  viewName: string;
  loadTime: number;
}

interface HarmonyRUMViewParams {
  viewName: string;
  property?: HarmonyProperties | null;
}

interface HarmonyRUMStopViewParams {
  property?: HarmonyProperties | null;
}

interface HarmonyRUMErrorParams {
  type?: string | null;
  errorType?: string | null;
  message: string;
  stack: string;
  state?: string | null;
  property?: HarmonyProperties | null;
}

interface HarmonyRUMResourceParams {
  key: string;
  property?: HarmonyProperties | null;
}

interface HarmonyRUMResourceContent {
  url: string;
  httpMethod?: string | null;
  requestHeader?: HarmonyOptionalValue;
  responseHeader?: HarmonyOptionalValue;
  responseBody?: string | null;
  resourceStatus?: number | null;
  errorMessage?: string | null;
  errorStack?: string | null;
  fetchStartTime?: number | null;
  requestStartTime?: number | null;
  responseStartTime?: number | null;
  responseEndTime?: number | null;
  tcpStartTime?: number | null;
  tcpEndTime?: number | null;
  dnsStartTime?: number | null;
  dnsEndTime?: number | null;
  sslStartTime?: number | null;
  sslEndTime?: number | null;
}

interface HarmonyRUMAddResourceParams extends HarmonyRUMResourceParams {
  content: HarmonyRUMResourceContent;
}

interface HarmonyLoggerConfig {
  sampleRate?: number | null;
  samplerate?: number | null;
  enableLinkRumData?: boolean | null;
  enableCustomLog?: boolean | null;
  logCacheLimitCount?: number | null;
  discardStrategy?: string | null;
  logLevelFilters?: string[] | null;
  globalContext?: HarmonyProperties | null;
}

interface HarmonyLoggerLogParams {
  content: string;
  status?: string | number | null;
  property?: HarmonyProperties | null;
}

interface HarmonyTraceConfig {
  sampleRate?: number | null;
  samplerate?: number | null;
  traceType?: string | null;
  enableLinkRUMData?: boolean | null;
  enableAutoTrace?: boolean | null;
}

interface HarmonyTraceHeaderParams {
  url: string;
  key?: string | null;
}

const pendingViewLoadTimes: Map<string, number> = new Map();
const bridgeContext: Map<string, HarmonyOptionalValue> = new Map();
let currentViewName = '';
let uniAppJSViewTrackingEnabled = true;
let harmonyUniRequestAutoTrackingEnabled = false;
let harmonyUniRequestAutoTraceEnabled = false;
let activeRumConfig: FTRUMConfig | null = null;
const attachedWebViewHandlers: Map<webview.WebviewController, FTWebViewHandler> = new Map();

export class GCUniPluginNative {
  static setBridgeVersion(version: string) {
    const sdkBridgeInfo: Record<string, string> = {};
    sdkBridgeInfo.uniapp = version;
    bridgeContext.set('sdk_bridge_info', sdkBridgeInfo);
  }

  static sdkConfig(params: object, context: Context | undefined) {
    try {
      const configParams = params as HarmonyMobileConfig;
      const datawayUrl = firstHarmonyString(configParams.datawayUrl);
      const clientToken = firstHarmonyString(configParams.clientToken);
      const datakitUrl = firstHarmonyString(configParams.datakitUrl, configParams.serverUrl, configParams.metricsUrl);
      let config: FTSDKConfig;

      if (datawayUrl != null && clientToken != null) {
        config = FTSDKConfig.builder(datawayUrl, clientToken);
      } else if (datakitUrl != null) {
        config = FTSDKConfig.builder(datakitUrl);
      } else {
        console.error('[GC-UniPlugin] sdkConfig failed: missing datawayUrl/clientToken or datakitUrl/serverUrl/metricsUrl');
        return;
      }

      const debug = firstHarmonyBoolean(configParams.debug, configParams.enableSDKDebugLog);
      if (debug !== null) {
        config.setDebug(debug);
      }
      if (configParams.env) {
        config.setEnv(configParams.env);
      }
      const serviceName = firstHarmonyString(configParams.service, configParams.serviceName);
      if (serviceName != null) {
        config.setServiceName(serviceName);
      }
      if (configParams.autoSync !== undefined && configParams.autoSync !== null) {
        config.setAutoSync(configParams.autoSync);
      }
      if (configParams.syncPageSize !== undefined && configParams.syncPageSize !== null) {
        config.setCustomSyncPageSize(configParams.syncPageSize);
      }
      if (configParams.syncSleepTime !== undefined && configParams.syncSleepTime !== null) {
        config.setSyncSleepTime(configParams.syncSleepTime);
      }
      if (configParams.enableDataIntegerCompatible === true) {
        config.enableDataIntegerCompatible();
      }
      if (configParams.compressIntakeRequests !== undefined && configParams.compressIntakeRequests !== null) {
        config.setCompressIntakeRequests(configParams.compressIntakeRequests);
      }
      if (configParams.dbCacheLimit !== undefined && configParams.dbCacheLimit !== null) {
        config.enableLimitWithDbSize(configParams.dbCacheLimit);
      } else if (configParams.enableLimitWithDbSize === true) {
        config.enableLimitWithDbSize();
      }
      const dbDiscard = harmonyDbCacheDiscard(configParams.dbDiscardStrategy);
      if (dbDiscard !== null) {
        config.setDbCacheDiscard(dbDiscard);
      }
      if (configParams.globalContext !== undefined && configParams.globalContext !== null) {
        const globalContext = configParams.globalContext;
        const keys = Object.keys(globalContext);
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          config.addGlobalContext(key, toHarmonyObject(globalContext[key]));
        }
      }
      if (configParams.dataModifier) {
        config.setDataModifier(new HarmonyDataModifier(toHarmonyDataModifierMap(configParams.dataModifier)));
      }
      if (configParams.lineDataModifier) {
        config.setLineDataModifier(new HarmonyLineDataModifier(toHarmonyLinePatches(configParams.lineDataModifier)));
      }
      if (configParams.remoteConfiguration !== undefined ||
        configParams.remoteConfigMiniUpdateInterval !== undefined ||
        configParams.enableDataFilter !== undefined ||
        configParams.dataFilters !== undefined) {
        console.warn('[GC-UniPlugin] remote configuration and data filters are not supported on HarmonyOS');
      }

      if (context === undefined) {
        console.error('[GC-UniPlugin] sdkConfig failed: Harmony application context is unavailable');
        return;
      }
      FTSDK.install(config, context);
      console.log('[GC-UniPlugin] sdkConfig completed successfully');
    } catch (error) {
      console.error('[GC-UniPlugin] sdkConfig failed:', error);
    }
  }

  static bindRUMUserData(params: object) {
    try {
      const userParams = params as HarmonyRUMUserDataParams;
      const userData = new UserData();
      userData.setId(userParams.userId);
      if (userParams.userName) {
        userData.setName(userParams.userName);
      }
      if (userParams.userEmail) {
        userData.setEmail(userParams.userEmail);
      }
      if (userParams.extra !== undefined && userParams.extra !== null) {
        const extra = userParams.extra;
        const keys = Object.keys(extra);
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          userData.addExt(key, String(extra[key]));
        }
      }
      FTSDK.bindRumUserData(userData);
    } catch (error) {
      console.error('[GC-UniPlugin] bindRUMUserData failed:', error);
    }
  }

  static unbindRUMUserData() {
    FTSDK.unbindRumUserData();
  }

  static setDatakitURL(params: object) {
    const datakitParams = params as HarmonyDatakitURLParams;
    console.warn(`[GC-UniPlugin] setDatakitURL is not supported on HarmonyOS: ${datakitParams.datakitUrl}`);
  }

  static setDatawayURL(params: object) {
    const datawayParams = params as HarmonyDatawayURLParams;
    console.warn(`[GC-UniPlugin] setDatawayURL is not supported on HarmonyOS: ${datawayParams.datawayUrl}`);
  }

  static updateRemoteConfigWithMiniUpdateInterval(params: object) {
    const updateParams = params as Record<string, number | null>;
    const interval = updateParams.miniUpdateInterval;
    console.warn(`[GC-UniPlugin] updateRemoteConfigWithMiniUpdateInterval is not supported on HarmonyOS: ${interval}`);
  }

  static appendGlobalContext(params: object | null) {
    if (params) {
      FTSDK.appendGlobalContext(toHarmonyStringMap(params as HarmonyProperties));
    }
  }

  static appendRUMGlobalContext(params: object | null) {
    if (params) {
      FTSDK.appendRUMGlobalContext(toHarmonyStringMap(params as HarmonyProperties));
    }
  }

  static appendLogGlobalContext(params: object | null) {
    if (params) {
      FTSDK.appendLogGlobalContext(toHarmonyStringMap(params as HarmonyProperties));
    }
  }

  static appendBridgeContext(params: object | null) {
    if (!params) {
      return;
    }
    const context = params as HarmonyProperties;
    const keys = Object.keys(context);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      bridgeContext.set(key, context[key]);
    }
    if (activeRumConfig !== null) {
      syncBridgeContextToRUMGlobalContext();
    }
  }

  static flushSyncData() {
    FTSDK.flushSyncData();
  }

  static clearAllData() {
    FTSDK.clearAllData();
  }

  static shutDown() {
    FTSDK.shutDown();
  }

  static manuallySetApplicationStart() {
    console.log('[GC-UniPlugin] manuallySetApplicationStart is not supported on HarmonyOS');
  }

  static setRumConfig(params: object) {
    try {
      const rumParams = params as HarmonyRUMConfig;
      const rumAppId = rumParams.harmonyAppId || rumParams.androidAppId || rumParams.iOSAppId;
      if (!rumAppId) {
        console.error('[GC-UniPlugin] rumSetConfig failed: missing RUM app id');
        return;
      }

      const config = new FTRUMConfig().setRumAppId(rumAppId);
      const sampleRate = firstHarmonyNumber(rumParams.sampleRate, rumParams.samplerate);
      if (sampleRate !== null) {
        config.setSamplingRate(sampleRate);
      }
      if (rumParams.sessionOnErrorSampleRate !== undefined && rumParams.sessionOnErrorSampleRate !== null) {
        config.setSessionErrorSampleRate(rumParams.sessionOnErrorSampleRate);
      }
      if (rumParams.enableNativeUserAction !== undefined && rumParams.enableNativeUserAction !== null) {
        config.setEnableTraceUserAction(rumParams.enableNativeUserAction);
      }
      if (rumParams.enableNativeUserView !== undefined && rumParams.enableNativeUserView !== null) {
        config.setEnableTraceUserView(rumParams.enableNativeUserView);
      }
      if (rumParams.enableNativeUserResource !== undefined && rumParams.enableNativeUserResource !== null) {
        config.setEnableTraceUserResource(rumParams.enableNativeUserResource);
      }
      // uni.request is implemented by DCloud's NetworkKit wrapper on HarmonyOS.
      // The JS interceptor delegates to the native RUM and Trace SDK APIs.
      harmonyUniRequestAutoTrackingEnabled = rumParams.enableNativeUserResource === true;
      if (rumParams.enableResourceHostIP !== undefined && rumParams.enableResourceHostIP !== null) {
        config.setEnableResourceHostIP(rumParams.enableResourceHostIP);
      }
      if (rumParams.enableTrackNativeCrash !== undefined && rumParams.enableTrackNativeCrash !== null) {
        config.setEnableTrackAppCrash(rumParams.enableTrackNativeCrash);
      }
      if (rumParams.enableTrackNativeAppANR !== undefined && rumParams.enableTrackNativeAppANR !== null) {
        config.setEnableTrackAppANR(rumParams.enableTrackNativeAppANR);
      }
      if (rumParams.enableTrackNativeFreeze !== undefined && rumParams.enableTrackNativeFreeze !== null) {
        config.setEnableTrackAppUIBlock(rumParams.enableTrackNativeFreeze, rumParams.nativeFreezeDurationMs || 1000);
      }
      const errorMonitorType = harmonyErrorMonitorType(rumParams.errorMonitorType);
      if (errorMonitorType !== 0) {
        config.setExtraMonitorTypeWithError(errorMonitorType);
      }
      const deviceMonitorType = harmonyDeviceMonitorType(rumParams.deviceMonitorType);
      if (deviceMonitorType !== 0) {
        config.setDeviceMetricsMonitorType(deviceMonitorType);
        config.setDeviceMetricsDetectFrequency(
          harmonyDetectFrequency(rumParams.detectFrequency || 'normal')
        );
      }
      if (rumParams.enableTraceWebView !== undefined && rumParams.enableTraceWebView !== null) {
        config.setEnableTraceWebView(rumParams.enableTraceWebView);
      }
      if (rumParams.allowWebViewHost !== undefined) {
        config.setAllowWebViewHost(rumParams.allowWebViewHost);
      }
      if (rumParams.globalContext !== undefined && rumParams.globalContext !== null) {
        const globalContext = rumParams.globalContext;
        const keys = Object.keys(globalContext);
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          config.addGlobalContext(key, toHarmonyObject(globalContext[key]));
        }
      }
      if (rumParams.rumCacheLimitCount !== undefined && rumParams.rumCacheLimitCount !== null) {
        config.setRumCacheLimitCount(rumParams.rumCacheLimitCount);
      }
      const rumDiscard = harmonyRumCacheDiscard(rumParams.rumDiscardStrategy);
      if (rumDiscard !== null) {
        config.setRumCacheDiscardStrategy(rumDiscard);
      }
      FTSDK.installRUMConfig(config);
      activeRumConfig = config;
      // WebView RUM is received by FTWebViewHandler and does not pass through
      // mergeRumBridgeContext(). Keep the same bridge metadata in the SDK's
      // dynamic RUM tags so Browser RUM Actions include sdk_bridge_info too.
      syncBridgeContextToRUMGlobalContext();
    } catch (error) {
      console.error('[GC-UniPlugin] rumSetConfig failed:', error);
    }
  }

  static startAction(params: object) {
    const actionParams = params as HarmonyRUMActionParams;
    FTRUMGlobalManager.getInstance().startAction(
      actionParams.actionName,
      actionParams.actionType || 'click',
      mergeRumBridgeContext(actionParams.property)
    );
  }

  static isUniAppJSViewTrackingEnabled(): boolean {
    return uniAppJSViewTrackingEnabled;
  }

  static isHarmonyUniRequestAutoTrackingEnabled(): boolean {
    return harmonyUniRequestAutoTrackingEnabled;
  }

  static isHarmonyUniRequestAutoTraceEnabled(): boolean {
    return harmonyUniRequestAutoTraceEnabled;
  }

  static addAction(params: object) {
    const actionParams = params as HarmonyRUMActionParams;
    FTRUMGlobalManager.getInstance().addAction(
      actionParams.actionName,
      actionParams.actionType || 'click',
      mergeRumBridgeContext(actionParams.property)
    );
  }

  static onCreateView(params: object) {
    const viewParams = params as HarmonyRUMCreateViewParams;
    if (!viewParams.viewName || viewParams.loadTime <= 0) {
      return;
    }
    pendingViewLoadTimes.set(viewParams.viewName, viewParams.loadTime);
    if (currentViewName === viewParams.viewName) {
      FTRUMGlobalManager.getInstance().updateLoadTime(viewParams.loadTime);
      pendingViewLoadTimes.delete(viewParams.viewName);
    }
  }

  static startView(params: object) {
    startHarmonyView(params as HarmonyRUMViewParams);
  }

  static stopView(params: object | null) {
    const viewParams = params == null ? null : params as HarmonyRUMStopViewParams;
    const property = mergeRumBridgeContext(viewParams == null ? null : viewParams.property);
    FTRUMGlobalManager.getInstance().stopView(property);
    currentViewName = '';
  }

  static addError(params: object) {
    const errorParams = params as HarmonyRUMErrorParams;
    const property = mergeRumBridgeContext(errorParams.property);
    FTRUMGlobalManager.getInstance().addError(
      errorParams.stack,
      errorParams.message,
      errorParams.type || errorParams.errorType || 'uniapp_crash',
      harmonyAppState(errorParams.state),
      property
    );
  }

  static startResource(params: object) {
    const resourceParams = params as HarmonyRUMResourceParams;
    FTRUMGlobalManager.getInstance().startResource(resourceParams.key, mergeRumBridgeContext(resourceParams.property));
  }

  static stopResource(params: object) {
    const resourceParams = params as HarmonyRUMResourceParams;
    FTRUMGlobalManager.getInstance().stopResource(resourceParams.key, mergeRumBridgeContext(resourceParams.property));
  }

  static addResource(params: object) {
    const resourceParams = params as HarmonyRUMAddResourceParams;
    const content = resourceParams.content;
    const resource = new ResourceParams();
    resource.url = content.url;
    resource.resourceMethod = content.httpMethod || 'GET';
    resource.requestHeader = normalizeHarmonyHeader(content.requestHeader);
    resource.responseHeader = normalizeHarmonyHeader(content.responseHeader);
    resource.responseBody = content.responseBody || '';
    resource.resourceStatus = content.resourceStatus || 0;
    resource.requestErrorMsg = content.errorMessage || '';
    resource.requestErrorStack = content.errorStack || '';
    resource.setProperty(toHarmonyObjectMap(mergeRumBridgeContext(resourceParams.property)));

    const netStatus = new NetStatusBean();
    applyHarmonyResourceTiming(netStatus, content);
    FTRUMGlobalManager.getInstance().addResource(resourceParams.key, resource, netStatus);
  }

  /**
   * Attach the SDK's direct JavaScriptProxy bridge to a native controller.
   * Call this from a Harmony native/UTS WebView controller-attached callback,
   * before its page is loaded. GCNativeWebView.ets is the built-in Harmony
   * native component implementation used by the example page.
   */
  static attachWebView(controller: webview.WebviewController, viewName?: string | null) {
    const config = activeRumConfig;
    if (config === null || !config.isEnableTraceWebView()) {
      return;
    }
    try {
      const attachedHandler = attachedWebViewHandlers.get(controller);
      if (attachedHandler !== null && attachedHandler !== undefined) {
        attachedHandler.setNativeViewName(harmonyWebViewName(viewName));
        attachedHandler.setWebView(controller, config);
        return;
      }
      const handler = new FTWebViewHandler();
      attachedWebViewHandlers.set(controller, handler);
      handler.setNativeViewName(harmonyWebViewName(viewName));
      handler.setWebView(controller, config);
    } catch (error) {
      console.error('[GC-UniPlugin] attachWebView failed:', error);
    }
  }

  /** Release a direct JavaScriptProxy bridge when its native WebView is destroyed. */
  static detachWebView(controller: webview.WebviewController) {
    const handler = attachedWebViewHandlers.get(controller);
    if (handler === null || handler === undefined) {
      return;
    }
    try {
      handler.clearWebController();
    } catch (error) {
      console.error('[GC-UniPlugin] detachWebView failed:', error);
    }
    attachedWebViewHandlers.delete(controller);
  }

  static setLoggerConfig(params: object) {
    try {
      const loggerParams = params as HarmonyLoggerConfig;
      const config = new FTLoggerConfig();
      if (loggerParams.enableCustomLog !== undefined && loggerParams.enableCustomLog !== null) {
        config.setEnableCustomLog(loggerParams.enableCustomLog);
      }
      const sampleRate = firstHarmonyNumber(loggerParams.sampleRate, loggerParams.samplerate);
      if (sampleRate !== null) {
        config.setSamplingRate(sampleRate);
      }
      if (loggerParams.discardStrategy === 'discardOldest') {
        config.setLogCacheDiscardStrategy(LogCacheDiscard.DISCARD_OLDEST);
      } else if (loggerParams.discardStrategy === 'discard') {
        config.setLogCacheDiscardStrategy(LogCacheDiscard.DISCARD);
      }
      if (loggerParams.logLevelFilters && loggerParams.logLevelFilters.length > 0) {
        const filters: string[] = [];
        for (let i = 0; i < loggerParams.logLevelFilters.length; i++) {
          const status = Status.fromName(normalizeHarmonyLogStatus(String(loggerParams.logLevelFilters[i])));
          if (status) {
            filters.push(status.name);
          }
        }
        if (filters.length > 0) {
          config.setLogLevelFilters(filters);
        }
      }
      if (loggerParams.enableLinkRumData !== undefined && loggerParams.enableLinkRumData !== null) {
        config.setEnableLinkRumData(loggerParams.enableLinkRumData);
      }
      if (loggerParams.globalContext !== undefined && loggerParams.globalContext !== null) {
        const globalContext = loggerParams.globalContext;
        const keys = Object.keys(globalContext);
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          config.addGlobalContext(key, String(globalContext[key]));
        }
      }
      if (loggerParams.logCacheLimitCount !== undefined && loggerParams.logCacheLimitCount !== null) {
        config.setLogCacheLimitCount(loggerParams.logCacheLimitCount);
      }
      FTSDK.installLogConfig(config);
    } catch (error) {
      console.error('[GC-UniPlugin] loggerSetConfig failed:', error);
    }
  }

  static logging(params: object) {
    const logParams = params as HarmonyLoggerLogParams;
    const status = normalizeHarmonyLogStatus(logParams.status == null ? 'info' : String(logParams.status));
    const logStatus = Status.fromName(status) || Status.INFO;
    FTLogger.logBackground(logParams.content, logStatus, mergeLogBridgeContext(logParams.property));
  }

  static setTraceConfig(params: object) {
    try {
      const traceParams = params as HarmonyTraceConfig;
      const config = new FTTraceConfig();
      const sampleRate = firstHarmonyNumber(traceParams.sampleRate, traceParams.samplerate);
      if (sampleRate !== null) {
        config.setSamplingRate(sampleRate);
      }
      if (traceParams.traceType) {
        config.setTraceType(harmonyTraceType(traceParams.traceType));
      }
      if (traceParams.enableLinkRUMData !== undefined && traceParams.enableLinkRUMData !== null) {
        config.setEnableLinkRUMData(traceParams.enableLinkRUMData);
      }
      if (traceParams.enableAutoTrace !== undefined && traceParams.enableAutoTrace !== null) {
        config.setEnableAutoTrace(traceParams.enableAutoTrace);
      }
      FTSDK.installTraceConfig(config);
      harmonyUniRequestAutoTraceEnabled = traceParams.enableAutoTrace === true;
    } catch (error) {
      console.error('[GC-UniPlugin] tracerSetConfig failed:', error);
    }
  }

  static getTraceHeader(params: object): Record<string, string> | null {
    try {
      const traceHeaderParams = params as HarmonyTraceHeaderParams;
      return FTTraceManager.getInstance().getTraceHeader(traceHeaderParams.key || traceHeaderParams.url, traceHeaderParams.url);
    } catch (error) {
      console.error('[GC-UniPlugin] tracerGetTraceHeader failed:', error);
      return null;
    }
  }
}

function firstHarmonyString(
  first: string | null | undefined,
  second?: string | null,
  third?: string | null
): string | null {
  const firstValue = normalizeHarmonyString(first);
  if (firstValue !== null) {
    return firstValue;
  }
  const secondValue = normalizeHarmonyString(second);
  if (secondValue !== null) {
    return secondValue;
  }
  return normalizeHarmonyString(third);
}

function firstHarmonyNumber(
  first: number | null | undefined,
  second?: number | null
): number | null {
  if (first !== undefined && first !== null) {
    return first;
  }
  if (second !== undefined && second !== null) {
    return second;
  }
  return null;
}

function normalizeHarmonyString(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function firstHarmonyBoolean(
  first: HarmonyBooleanValue | null | undefined,
  second?: HarmonyBooleanValue | null
): boolean | null {
  const firstValue = normalizeHarmonyBoolean(first);
  if (firstValue !== null) {
    return firstValue;
  }
  return normalizeHarmonyBoolean(second);
}

function normalizeHarmonyBoolean(value: HarmonyBooleanValue | null | undefined): boolean | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1') {
    return true;
  }
  if (normalized === 'false' || normalized === '0') {
    return false;
  }
  return null;
}

function harmonyWebViewName(value?: string | null): string {
  return value !== undefined && value !== null && value.length > 0 ? value : 'webview';
}

async function startHarmonyView(params: HarmonyRUMViewParams): Promise<void> {
  try {
    const manager = FTRUMGlobalManager.getInstance();
    await manager.startView(params.viewName, mergeRumBridgeContext(params.property));
    currentViewName = params.viewName;
    const loadTime = pendingViewLoadTimes.get(params.viewName);
    if (loadTime !== undefined) {
      manager.updateLoadTime(loadTime);
      pendingViewLoadTimes.delete(params.viewName);
    }
  } catch (error) {
    console.error('[GC-UniPlugin] rumStartView failed:', error);
  }
}

class HarmonyDataModifier implements DataModifier {
  private readonly replacements: Map<string, DataModifierValue>;

  constructor(replacements: Map<string, DataModifierValue>) {
    this.replacements = replacements;
  }

  modify(key: string, value: DataModifierValue): DataModifierValue | null {
    const replacement = this.replacements.get(key);
    return replacement === undefined ? null : replacement;
  }
}

class HarmonyLineDataModifier implements LineDataModifier {
  private readonly patches: Map<string, Map<string, DataModifierValue>>;

  constructor(patches: Map<string, Map<string, DataModifierValue>>) {
    this.patches = patches;
  }

  modify(measurement: string, data: Map<string, DataModifierValue>): Map<string, DataModifierValue> | null {
    let patch = this.patches.get(measurement);
    if (patch === undefined || patch === null) {
      patch = this.patches.get('log');
    }
    if (patch === undefined || patch === null) {
      return null;
    }

    const result = new Map<string, DataModifierValue>();
    patch.forEach((value, key) => {
      result.set(key, value);
    });
    return result;
  }
}

function harmonyAppState(value: string | null | undefined): AppState {
  if (value === 'run') {
    return AppState.RUN;
  }
  if (value === 'background') {
    return AppState.BACKGROUND;
  }
  return AppState.UNKNOWN;
}

function harmonyTraceType(value: string): TraceType {
  switch (value) {
    case 'zipkinMultiHeader': return TraceType.ZIPKIN_MULTI_HEADER;
    case 'zipkinSingleHeader': return TraceType.ZIPKIN_SINGLE_HEADER;
    case 'traceparent': return TraceType.TRACEPARENT;
    case 'skywalking': return TraceType.SKYWALKING;
    case 'jaeger': return TraceType.JAEGER;
    default: return TraceType.DDTRACE;
  }
}

function harmonyDbCacheDiscard(value: string | null | undefined): DBCacheDiscard | null {
  if (value === 'discard') {
    return DBCacheDiscard.DISCARD;
  }
  if (value === 'discardOldest') {
    return DBCacheDiscard.DISCARD_OLDEST;
  }
  return null;
}

function harmonyRumCacheDiscard(value: string | null | undefined): RUMCacheDiscard | null {
  if (value === 'discard') {
    return RUMCacheDiscard.DISCARD;
  }
  if (value === 'discardOldest') {
    return RUMCacheDiscard.DISCARD_OLDEST;
  }
  return null;
}

function harmonyMonitorValues(value: string | string[] | null | undefined): string[] {
  if (typeof value === 'string') {
    return [value];
  }
  if (value === null || value === undefined) {
    return [];
  }
  return value;
}

function harmonyErrorMonitorType(value: string | string[] | null | undefined): number {
  const values = harmonyMonitorValues(value);
  let result = 0;
  for (let i = 0; i < values.length; i++) {
    const monitor = values[i].toLowerCase();
    if (monitor === 'all') {
      return ErrorMonitorType.ALL;
    }
    if (monitor === 'battery') {
      result = result | ErrorMonitorType.BATTERY;
    } else if (monitor === 'memory') {
      result = result | ErrorMonitorType.MEMORY;
    } else if (monitor === 'cpu') {
      result = result | ErrorMonitorType.CPU;
    }
  }
  return result;
}

function harmonyDeviceMonitorType(value: string | string[] | null | undefined): number {
  const values = harmonyMonitorValues(value);
  let result = 0;
  for (let i = 0; i < values.length; i++) {
    const monitor = values[i].toLowerCase();
    if (monitor === 'all') {
      return DeviceMetricsMonitorType.ALL;
    }
    if (monitor === 'battery') {
      result = result | DeviceMetricsMonitorType.BATTERY;
    } else if (monitor === 'memory') {
      result = result | DeviceMetricsMonitorType.MEMORY;
    } else if (monitor === 'cpu') {
      result = result | DeviceMetricsMonitorType.CPU;
    } else if (monitor === 'fps') {
      result = result | DeviceMetricsMonitorType.FPS;
    }
  }
  return result;
}

function harmonyDetectFrequency(value: string): DetectFrequency {
  if (value === 'frequent') {
    return DetectFrequency.FREQUENT;
  }
  if (value === 'rare') {
    return DetectFrequency.RARE;
  }
  return DetectFrequency.DEFAULT;
}

function mergeRumBridgeContext(property?: HarmonyProperties | null): Record<string, object> {
  const result: Record<string, object> = {};
  if (property !== undefined && property !== null) {
    const rumProperty = property;
    const keys = Object.keys(rumProperty);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      result[key] = toHarmonyObject(rumProperty[key]);
    }
  }
  bridgeContext.forEach((value, key) => {
    result[key] = toHarmonyObject(value);
  });
  return result;
}

function syncBridgeContextToRUMGlobalContext(): void {
  const context = new Map<string, string>();
  bridgeContext.forEach((value, key) => {
    context.set(key, stringifyBridgeContextValue(value));
  });
  if (context.size > 0) {
    FTSDK.appendRUMGlobalContext(context);
  }
}

function stringifyBridgeContextValue(value: HarmonyOptionalValue): string {
  if (typeof value === 'string') {
    return value;
  }
  try {
    const json = JSON.stringify(value);
    if (json !== undefined) {
      return json;
    }
  } catch (_) {
    // Fall through to String() so a malformed optional context does not block
    // RUM collection.
  }
  return String(value);
}

function mergeLogBridgeContext(property?: HarmonyProperties | null): Map<string, object> {
  const result = new Map<string, object>();
  if (property !== undefined && property !== null) {
    const logProperty = property;
    const keys = Object.keys(logProperty);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      result.set(key, toHarmonyObject(logProperty[key]));
    }
  }
  bridgeContext.forEach((value, key) => {
    result.set(key, toHarmonyObject(value));
  });
  return result;
}

function toHarmonyObjectMap(value: HarmonyProperties): Map<string, object> {
  const result = new Map<string, object>();
  const context = value;
  const keys = Object.keys(context);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    result.set(key, toHarmonyObject(context[key]));
  }
  return result;
}

function toHarmonyDataModifierMap(value: HarmonyDataModifierParams): Map<string, DataModifierValue> {
  const result = new Map<string, DataModifierValue>();
  const replacements = value;
  const keys = Object.keys(replacements);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    result.set(key, replacements[key]);
  }
  return result;
}

function toHarmonyLinePatches(value: HarmonyLineDataModifierParams): Map<string, Map<string, DataModifierValue>> {
  const result = new Map<string, Map<string, DataModifierValue>>();
  const patches = value;
  const keys = Object.keys(patches);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    result.set(key, toHarmonyDataModifierMap(patches[key]));
  }
  return result;
}

function toHarmonyStringMap(value: HarmonyProperties): Map<string, string> {
  const result = new Map<string, string>();
  const context = value;
  const keys = Object.keys(context);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    result.set(key, String(context[key]));
  }
  return result;
}

function applyHarmonyResourceTiming(status: NetStatusBean, content: HarmonyRUMResourceContent) {
  const dnsStartTime = content.dnsStartTime;
  const dnsEndTime = content.dnsEndTime;
  if (dnsStartTime !== undefined && dnsStartTime !== null) {
    status.setDNSStartTime(dnsStartTime);
  }
  if (dnsStartTime !== undefined && dnsStartTime !== null && dnsEndTime !== undefined && dnsEndTime !== null) {
    status.setDNSTime(dnsEndTime - dnsStartTime);
  }

  const tcpStartTime = content.tcpStartTime;
  const tcpEndTime = content.tcpEndTime;
  if (tcpStartTime !== undefined && tcpStartTime !== null) {
    status.setConnectStartTime(tcpStartTime);
  }
  if (tcpStartTime !== undefined && tcpStartTime !== null && tcpEndTime !== undefined && tcpEndTime !== null) {
    status.setTcpTime(tcpEndTime - tcpStartTime);
  }

  const sslStartTime = content.sslStartTime;
  const sslEndTime = content.sslEndTime;
  if (sslStartTime !== undefined && sslStartTime !== null) {
    status.setSslStartTime(sslStartTime);
  }
  if (sslStartTime !== undefined && sslStartTime !== null && sslEndTime !== undefined && sslEndTime !== null) {
    status.setSSLTime(sslEndTime - sslStartTime);
  }

  const requestStartTime = content.requestStartTime;
  const responseStartTime = content.responseStartTime;
  if (requestStartTime !== undefined && requestStartTime !== null) {
    status.setFirstByteStartTime(requestStartTime);
  }
  if (requestStartTime !== undefined && requestStartTime !== null && responseStartTime !== undefined && responseStartTime !== null) {
    status.setFirstByteTime(responseStartTime - requestStartTime);
  }

  const responseEndTime = content.responseEndTime;
  if (responseStartTime !== undefined && responseStartTime !== null) {
    status.setDownloadTimeStart(responseStartTime);
  }
  if (responseStartTime !== undefined && responseStartTime !== null && responseEndTime !== undefined && responseEndTime !== null) {
    status.setDownloadTime(responseEndTime - responseStartTime);
  }

  const fetchStartTime = content.fetchStartTime;
  if (fetchStartTime !== undefined && fetchStartTime !== null && responseEndTime !== undefined && responseEndTime !== null) {
    status.setHoleRequestTime(responseEndTime - fetchStartTime);
  }
}

function toHarmonyObject(value: HarmonyOptionalValue): object {
  return new Object(value);
}

function normalizeHarmonyHeader(value: HarmonyOptionalValue | undefined): string {
  if (typeof value === 'string') {
    return value;
  }
  if (value == null) {
    return '';
  }
  try {
    const json = JSON.stringify(value);
    return json === undefined ? '' : json;
  } catch (error) {
    return String(value);
  }
}

function normalizeHarmonyLogStatus(value: string): string {
  const status = value.toLowerCase();
  if (status === 'ok') return 'info';
  if (status === 'critical') return 'fatal';
  if (status === 'warning') return 'warn';
  return status;
}
