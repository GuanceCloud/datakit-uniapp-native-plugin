// Register the NativeEmbed implementation whenever the HAR is imported.
import './bridge/GCNativeWebView';

export { GCUniPluginNative } from './bridge/GCUniPluginNative';
export { initializeNativeSDK, registerNativeModules } from './extension/NativeModules';
