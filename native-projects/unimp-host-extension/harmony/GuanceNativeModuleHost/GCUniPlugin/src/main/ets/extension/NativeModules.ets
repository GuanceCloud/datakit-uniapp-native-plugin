import { Context } from '@kit.AbilityKit';
import webview from '@ohos.web.webview';
import { registerModule } from '@dcloudio/uni-app-runtime';
import { GCUniPluginNative } from '../bridge/GCUniPluginNative';

let hostContext: Context | null = null;

/**
 * The four public module names match the existing Android GC-UniPlugin
 * integration. Their functions mirror the classes exported by index.uts.
 */
export class GCUniPluginModuleName {
  static readonly MOBILE_AGENT: string = 'GCUniPlugin-MobileAgent';
  static readonly RUM: string = 'GCUniPlugin-RUM';
  static readonly LOGGER: string = 'GCUniPlugin-Logger';
  static readonly TRACER: string = 'GCUniPlugin-Tracer';
}

/**
 * Host-owned configuration for starting the native SDK before a WGT opens.
 * The shapes intentionally match the parameters accepted by the four public
 * native modules so bridge state and the underlying SDK stay in sync.
 */
interface GCUniPluginStartupConfig {
  mobile: object;
  rum: object;
  logger: object;
  tracer: object;
}

function currentContext(): Context | undefined {
  return hostContext === null ? undefined : hostContext;
}

const mobileAgentModule: ESObject = {
  sdkConfig: (params: object): void => {
    GCUniPluginNative.sdkConfig(params, currentContext());
  },
  bindRUMUserData: (params: object): void => GCUniPluginNative.bindRUMUserData(params),
  unbindRUMUserData: (): void => GCUniPluginNative.unbindRUMUserData(),
  appendGlobalContext: (params: object | null): void => GCUniPluginNative.appendGlobalContext(params),
  appendRUMGlobalContext: (params: object | null): void => GCUniPluginNative.appendRUMGlobalContext(params),
  appendLogGlobalContext: (params: object | null): void => GCUniPluginNative.appendLogGlobalContext(params),
  appendBridgeContext: (params: object | null): void => GCUniPluginNative.appendBridgeContext(params),
  flushSyncData: (): void => GCUniPluginNative.flushSyncData(),
  clearAllData: (): void => GCUniPluginNative.clearAllData(),
  shutDown: (): void => GCUniPluginNative.shutDown(),
  manuallySetApplicationStart: (): void => GCUniPluginNative.manuallySetApplicationStart()
} as ESObject;

const rumModule: ESObject = {
  setConfig: (params: object): void => GCUniPluginNative.setRumConfig(params),
  startAction: (params: object): void => GCUniPluginNative.startAction(params),
  addAction: (params: object): void => GCUniPluginNative.addAction(params),
  onCreateView: (params: object): void => GCUniPluginNative.onCreateView(params),
  startView: (params: object): void => GCUniPluginNative.startView(params),
  stopView: (params: object | null): void => GCUniPluginNative.stopView(params),
  addError: (params: object): void => GCUniPluginNative.addError(params),
  startResource: (params: object): void => GCUniPluginNative.startResource(params),
  stopResource: (params: object): void => GCUniPluginNative.stopResource(params),
  addResource: (params: object): void => GCUniPluginNative.addResource(params),
  isUniAppJSViewTrackingEnabled: (): boolean => GCUniPluginNative.isUniAppJSViewTrackingEnabled(),
  isHarmonyUniRequestAutoTrackingEnabled: (): boolean => GCUniPluginNative.isHarmonyUniRequestAutoTrackingEnabled(),
  attachWebView: (controller: webview.WebviewController, viewName?: string | null): void =>
    GCUniPluginNative.attachWebView(controller, viewName),
  detachWebView: (controller: webview.WebviewController): void => GCUniPluginNative.detachWebView(controller)
} as ESObject;

const loggerModule: ESObject = {
  setConfig: (params: object): void => GCUniPluginNative.setLoggerConfig(params),
  logging: (params: object): void => GCUniPluginNative.logging(params)
} as ESObject;

const tracerModule: ESObject = {
  setConfig: (params: object): void => GCUniPluginNative.setTraceConfig(params),
  getTraceHeader: (params: object): Record<string, string> | null => GCUniPluginNative.getTraceHeader(params),
  isHarmonyUniRequestAutoTraceEnabled: (): boolean => GCUniPluginNative.isHarmonyUniRequestAutoTraceEnabled()
} as ESObject;

let isRegistered = false;

/**
 * Call after UniMP Runtime initialization and before the WGT uses
 * uni.requireNativePlugin(). Passing the context is required once per host.
 */
export function registerNativeModules(context?: Context): void {
  if (context !== undefined) {
    hostContext = context;
  }
  if (isRegistered) {
    return;
  }
  registerModule(GCUniPluginModuleName.MOBILE_AGENT, mobileAgentModule);
  registerModule(GCUniPluginModuleName.RUM, rumModule);
  registerModule(GCUniPluginModuleName.LOGGER, loggerModule);
  registerModule(GCUniPluginModuleName.TRACER, tracerModule);
  isRegistered = true;
  console.info('[Guance] All GCUniPlugin modules registered');
}

let isNativeSDKInitialized = false;

/**
 * Initialize the Guance SDK from the Harmony host. Call this from
 * UIAbility.onCreate before the UniMP runtime loads a WGT.
 */
export function initializeNativeSDK(context: Context, config: object): boolean {
  if (isNativeSDKInitialized) {
    return true;
  }
  const startupConfig = config as GCUniPluginStartupConfig;
  if (!GCUniPluginNative.sdkConfig(startupConfig.mobile, context)) {
    console.error('[Guance] Native SDK initialization skipped: base configuration failed');
    return false;
  }

  GCUniPluginNative.setRumConfig(startupConfig.rum);
  GCUniPluginNative.setLoggerConfig(startupConfig.logger);
  GCUniPluginNative.setTraceConfig(startupConfig.tracer);
  isNativeSDKInitialized = true;
  console.info('[Guance] Native SDK, RUM, Logger, and Trace initialized');
  return true;
}
