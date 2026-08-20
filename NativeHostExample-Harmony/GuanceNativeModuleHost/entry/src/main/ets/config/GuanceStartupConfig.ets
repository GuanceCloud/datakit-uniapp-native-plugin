/**
 * Demo startup configuration owned by the Harmony host. Production apps
 * should inject these values from their own build or runtime configuration.
 * Classes are used because ArkTS strict mode does not permit untyped object
 * literals at this boundary.
 */
class MobileGlobalContext {
  sdk_globalContext: string = 'custom_sdk_globalContext';
}

class RumGlobalContext {
  track_id: string = 'track_id';
  rum_globalContext: string = 'custom_rum_globalContext';
}

class LoggerGlobalContext {
  logger_globalContext: string = 'custom_logger_globalContext';
}

class MobileStartupConfig {
  datawayUrl: string = '';
  clientToken: string = '';
  autoSync: boolean = true;
  debug: boolean = true;
  env: string = 'common';
  globalContext: MobileGlobalContext = new MobileGlobalContext();
}

class RumStartupConfig {
  harmonyAppId: string = 'com_uniapp_harmony';
  errorMonitorType: string[] = ['cpu', 'memory', 'battery'];
  deviceMonitorType: string = 'all';
  enableNativeUserAction: boolean = true;
  enableNativeUserView: boolean = true;
  enableNativeUserResource: boolean = true;
  enableTrackNativeCrash: boolean = true;
  enableTrackNativeAppANR: boolean = true;
  enableTrackNativeFreeze: boolean = true;
  nativeFreezeDurationMs: number = 400;
  rumDiscardStrategy: string = 'discardOldest';
  rumCacheLimitCount: number = 10000;
  enableTraceWebView: boolean = true;
  allowWebViewHost: string[] = ['10.100.64.166'];
  globalContext: RumGlobalContext = new RumGlobalContext();
}

class LoggerStartupConfig {
  enableLinkRumData: boolean = true;
  enableCustomLog: boolean = true;
  discardStrategy: string = 'discardOldest';
  logLevelFilters: string[] = ['info', 'warn', 'error'];
  logCacheLimitCount: number = 6000;
  globalContext: LoggerGlobalContext = new LoggerGlobalContext();
}

class TracerStartupConfig {
  traceType: string = 'ddTrace';
  enableLinkRUMData: boolean = true;
}

class HostStartupConfig {
  mobile: MobileStartupConfig = new MobileStartupConfig();
  rum: RumStartupConfig = new RumStartupConfig();
  logger: LoggerStartupConfig = new LoggerStartupConfig();
  tracer: TracerStartupConfig = new TracerStartupConfig();
}

export const GUANCE_STARTUP_CONFIG: HostStartupConfig = new HostStartupConfig();
