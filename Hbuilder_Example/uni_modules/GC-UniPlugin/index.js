/**
 * GC-UniPlugin JS Compatibility Layer
 * Provides compatibility with uni.requireNativePlugin() API
 * 
 * Note: In uni-app, UTS plugins are automatically available through uni.requireNativePlugin()
 * when properly configured in package.json. This file provides a compatibility layer
 * for cases where direct import is needed.
 */

// #ifdef APP-HARMONY
// In HarmonyOS, UTS plugins should be accessible via uni.requireNativePlugin()
// But if that doesn't work, we can try direct import
// Note: UTS plugins in uni-app are typically accessed via uni.requireNativePlugin()
// and the plugin name should match the configuration in package.json

// For now, export empty objects as fallback
// The actual plugin access should work through uni.requireNativePlugin()
// when the UTS plugin is properly registered
export const GCUniPluginMobileAgent = {};
export const GCUniPluginRUM = {};
export const GCUniPluginLogger = {};
export const GCUniPluginTracer = {};

// #endif

// #ifndef APP-HARMONY
// For non-HarmonyOS platforms, return empty objects
// These will be handled by native plugins (Android/iOS)
export const GCUniPluginMobileAgent = {};
export const GCUniPluginRUM = {};
export const GCUniPluginLogger = {};
export const GCUniPluginTracer = {};
// #endif
