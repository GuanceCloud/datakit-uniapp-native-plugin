/**
 * Plugin Manager - Unified plugin access for all platforms
 * Provides compatibility layer for HarmonyOS UTS plugins.
 */

// #ifdef APP-HARMONY
import {
  sdkConfig,
  bindRUMUserData,
  unbindRUMUserData,
  flushSyncData,
  appendGlobalContext,
  appendLogGlobalContext,
  appendRUMGlobalContext,
  shutDown,
  clearAllData,
  manuallySetApplicationStart,
  appendBridgeContext,
  rumSetConfig,
  rumStartAction,
  rumAddAction,
  rumOnCreateView,
  rumStartView,
  rumStopView,
  rumAddError,
  rumStartResource,
  rumStopResource,
  rumAddResource,
  loggerSetConfig,
  loggerLogging,
  tracerSetConfig,
  tracerGetTraceHeader
} from '@/uni_modules/GC-UniPlugin-HarmonyOS';
// #endif

/**
 * Get native plugin - compatible with all platforms
 * @param {string} pluginName - Plugin name (e.g., "GCUniPlugin-MobileAgent")
 * @returns {object} Plugin object
 */
// #ifdef APP-HARMONY
const harmonyMobileAgent = {
  sdkConfig,
  bindRUMUserData,
  unbindRUMUserData,
  flushSyncData,
  appendGlobalContext,
  appendLogGlobalContext,
  appendRUMGlobalContext,
  shutDown,
  clearAllData,
  manuallySetApplicationStart,
  appendBridgeContext
};

const harmonyRUM = {
  setConfig: rumSetConfig,
  startAction: rumStartAction,
  addAction: rumAddAction,
  onCreateView: rumOnCreateView,
  startView: rumStartView,
  stopView: rumStopView,
  addError: rumAddError,
  startResource: rumStartResource,
  stopResource: rumStopResource,
  addResource: rumAddResource
};

const harmonyLogger = {
  setConfig: loggerSetConfig,
  logging: loggerLogging
};

const harmonyTracer = {
  setConfig: tracerSetConfig,
  getTraceHeader: tracerGetTraceHeader
};

export const getMobileAgent = () => harmonyMobileAgent;
export const getRUM = () => harmonyRUM;
export const getLogger = () => harmonyLogger;
export const getTracer = () => harmonyTracer;
// #endif

// #ifndef APP-HARMONY
export function getNativePlugin(pluginName) {
  const plugin = uni.requireNativePlugin(pluginName);

  if (!plugin) {
    console.warn(`[PluginManager] Plugin not found: ${pluginName}. Make sure the plugin is properly configured.`);
    return {};
  }

  return plugin;
}

export const getMobileAgent = () => getNativePlugin("GCUniPlugin-MobileAgent");
export const getRUM = () => getNativePlugin("GCUniPlugin-RUM");
export const getLogger = () => getNativePlugin("GCUniPlugin-Logger");
export const getTracer = () => getNativePlugin("GCUniPlugin-Tracer");
// #endif
