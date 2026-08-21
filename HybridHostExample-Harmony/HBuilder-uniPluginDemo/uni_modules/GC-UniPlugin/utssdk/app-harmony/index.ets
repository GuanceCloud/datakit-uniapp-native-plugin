import "./GCNativeWebView";
import webview from '@ohos.web.webview';
import { Context } from '@kit.AbilityKit';
import { GCUniPluginNative } from "./GCUniPluginNative";
import { UTS, UTSJSONObject, UTSObject } from "@dcloudio/uni-app-runtime";
const GC_UTS_BRIDGE_VERSION: string = '0.2.7-alpha.1';
function parseObject(text: string | null): UTSJSONObject | null {
    if (text == null || text.length == 0) {
        return null;
    }
    return UTS.JSON.parseObject(text);
}
function cloneJSONObject(source: UTSJSONObject | null): UTSJSONObject {
    if (source == null) {
        return new UTSJSONObject({});
    }
    return parseObject(UTS.JSON.stringify(source)) ?? new UTSJSONObject({});
}
function toJSONObject(source: Object | null): UTSJSONObject | null {
    if (source == null) {
        return null;
    }
    return parseObject(UTS.JSON.stringify(source));
}
function cloneParams(params: Object | null): UTSJSONObject {
    return cloneJSONObject(toJSONObject(params));
}
function normalizeAddResourceParams(params: Object | null): UTSJSONObject {
    const result = cloneParams(params);
    const content = result.getJSON('content');
    if (content != null) {
        result['content'] = cloneJSONObject(content);
    }
    return result;
}
const BLACK_RESOURCE_PATTERN = /^https?:\/\/([a-zA-Z0-9-]+\.)?dcloud\.net\.cn(:\d+)?\/.*/;
function filterBlackResource(resourceUrl: string | null): boolean {
    if (resourceUrl == null || resourceUrl.length === 0) {
        return false;
    }
    return BLACK_RESOURCE_PATTERN.test(resourceUrl);
}
function getStringValue(source: UTSJSONObject | null, key: string): string | null {
    if (source == null) {
        return null;
    }
    return source.getString(key);
}
function prepareAddResourceParams(params: Object | null): Object {
    const result = normalizeAddResourceParams(params);
    const content = result.getJSON('content');
    const resourceUrl = getStringValue(content, 'url');
    result['isBlackResource'] = filterBlackResource(resourceUrl);
    return result;
}
class GCMobileConfig extends UTSObject {
    datakitUrl: string | null = null;
    datawayUrl: string | null = null;
    clientToken: string | null = null;
    env: string | null = null;
    debug: boolean | null = null;
    service: string | null = null;
    autoSync: boolean | null = null;
    syncPageSize: number | null = null;
    syncSleepTime: number | null = null;
    enableDataIntegerCompatible: boolean | null = null;
    compressIntakeRequests: boolean | null = null;
    enableLimitWithDbSize: boolean | null = null;
    dbCacheLimit: number | null = null;
    dbDiscardStrategy: string | null = null;
    globalContext: Object | null = null;
    dataModifier: Object | null = null;
    lineDataModifier: Object | null = null;
}
class GCRUMConfig extends UTSObject {
    androidAppId: string | null = null;
    iOSAppId: string | null = null;
    harmonyAppId: string | null = null;
    sampleRate: number | null = null;
    sessionOnErrorSampleRate: number | null = null;
    enableNativeUserAction: boolean | null = null;
    enableNativeUserView: boolean | null = null;
    enableNativeUserResource: boolean | null = null;
    enableResourceHostIP: boolean | null = null;
    enableTrackNativeCrash: boolean | null = null;
    enableTrackNativeAppANR: boolean | null = null;
    enableTrackNativeFreeze: boolean | null = null;
    nativeFreezeDurationMs: number | null = null;
    errorMonitorType: string | string[] | null = null;
    deviceMonitorType: string | string[] | null = null;
    detectFrequency: string | null = null;
    enableTraceWebView: boolean | null = null;
    allowWebViewHost: string[] | null = null;
    globalContext: Object | null = null;
    rumCacheLimitCount: number | null = null;
    rumDiscardStrategy: string | null = null;
}
class GCLoggerConfig extends UTSObject {
    sampleRate: number | null = null;
    enableLinkRumData: boolean | null = null;
    enableCustomLog: boolean | null = null;
    logCacheLimitCount: number | null = null;
    discardStrategy: string | null = null;
    logLevelFilters: string[] | null = null;
    globalContext: Object | null = null;
}
class GCTraceConfig extends UTSObject {
    sampleRate: number | null = null;
    traceType: string | null = null;
    enableLinkRUMData: boolean | null = null;
    enableAutoTrace: boolean | null = null;
}
class GCRUMUserDataParams extends UTSObject {
    userId!: string;
    userName: string | null = null;
    userEmail: string | null = null;
    extra: Object | null = null;
}
class GCRUMActionParams extends UTSObject {
    actionName!: string;
    actionType: string | null = null;
    property: Object | null = null;
}
class GCRUMViewParams extends UTSObject {
    viewName!: string;
    property: Object | null = null;
}
class GCRUMCreateViewParams extends UTSObject {
    viewName!: string;
    loadTime!: number;
}
class GCRUMStopViewParams extends UTSObject {
    property: Object | null = null;
}
class GCRUMErrorParams extends UTSObject {
    type: string | null = null;
    errorType: string | null = null;
    message!: string;
    stack!: string;
    state: string | null = null;
    property: Object | null = null;
}
class GCRUMResourceContentParams extends UTSObject {
    url!: string;
    httpMethod: string | null = null;
    requestHeader: Object | null = null;
    responseHeader: Object | null = null;
    responseBody: string | null = null;
    resourceStatus: number | null = null;
    errorMessage: string | null = null;
    errorStack: string | null = null;
    fetchStartTime: number | null = null;
    requestStartTime: number | null = null;
    responseStartTime: number | null = null;
    responseEndTime: number | null = null;
    tcpStartTime: number | null = null;
    tcpEndTime: number | null = null;
    dnsStartTime: number | null = null;
    dnsEndTime: number | null = null;
    sslStartTime: number | null = null;
    sslEndTime: number | null = null;
}
class GCRUMResourceParams extends UTSObject {
    key!: string;
    property: Object | null = null;
}
class GCRUMAddResourceParams extends UTSObject {
    key!: string;
    content!: GCRUMResourceContentParams;
    property: Object | null = null;
}
class GCLoggerLogParams extends UTSObject {
    content!: string;
    status: string | number | null = null;
    property: Object | null = null;
}
class GCTraceHeaderParams extends UTSObject {
    url!: string;
    key: string | null = null;
}
GCUniPluginNative.setBridgeVersion(GC_UTS_BRIDGE_VERSION);
class mobileAgent {
    static sdkConfig(params: GCMobileConfig) {
        GCUniPluginNative.sdkConfig(params, getHarmonyContext());
    }
    static bindRUMUserData(params: GCRUMUserDataParams) {
        GCUniPluginNative.bindRUMUserData(params);
    }
    static unbindRUMUserData() {
        GCUniPluginNative.unbindRUMUserData();
    }
    static appendGlobalContext(params: Object | null) {
        GCUniPluginNative.appendGlobalContext(params);
    }
    static appendRUMGlobalContext(params: Object | null) {
        GCUniPluginNative.appendRUMGlobalContext(params);
    }
    static appendLogGlobalContext(params: Object | null) {
        GCUniPluginNative.appendLogGlobalContext(params);
    }
    static appendBridgeContext(params: Object | null) {
        GCUniPluginNative.appendBridgeContext(params);
    }
    static flushSyncData() {
        GCUniPluginNative.flushSyncData();
    }
    static clearAllData() {
        GCUniPluginNative.clearAllData();
    }
    static shutDown() {
        GCUniPluginNative.shutDown();
    }
    static manuallySetApplicationStart() {
        GCUniPluginNative.manuallySetApplicationStart();
    }
}
class rum {
    static setConfig(params: GCRUMConfig) {
        GCUniPluginNative.setRumConfig(params);
    }
    static startAction(params: GCRUMActionParams) {
        GCUniPluginNative.startAction(params);
    }
    static addAction(params: GCRUMActionParams) {
        GCUniPluginNative.addAction(params);
    }
    static onCreateView(params: GCRUMCreateViewParams) {
        GCUniPluginNative.onCreateView(params);
    }
    static startView(params: GCRUMViewParams) {
        GCUniPluginNative.startView(params);
    }
    static stopView(params: GCRUMStopViewParams | null) {
        GCUniPluginNative.stopView(params);
    }
    static addError(params: GCRUMErrorParams) {
        GCUniPluginNative.addError(params);
    }
    static startResource(params: GCRUMResourceParams) {
        GCUniPluginNative.startResource(params);
    }
    static stopResource(params: GCRUMResourceParams) {
        GCUniPluginNative.stopResource(params);
    }
    static addResource(params: GCRUMAddResourceParams) {
        GCUniPluginNative.addResource(prepareAddResourceParams(params));
    }
    static isUniAppJSViewTrackingEnabled(): boolean {
        return GCUniPluginNative.isUniAppJSViewTrackingEnabled();
    }
    static isHarmonyUniRequestAutoTrackingEnabled(): boolean {
        return GCUniPluginNative.isHarmonyUniRequestAutoTrackingEnabled();
    }
    static attachWebView(controller: webview.WebviewController, viewName: string | null = null) {
        GCUniPluginNative.attachWebView(controller, viewName);
    }
    static detachWebView(controller: webview.WebviewController) {
        GCUniPluginNative.detachWebView(controller);
    }
}
class logger {
    static setConfig(params: GCLoggerConfig) {
        GCUniPluginNative.setLoggerConfig(params);
    }
    static logging(params: GCLoggerLogParams) {
        GCUniPluginNative.logging(params);
    }
}
class tracer {
    static setConfig(params: GCTraceConfig) {
        GCUniPluginNative.setTraceConfig(params);
    }
    static isHarmonyUniRequestAutoTraceEnabled(): boolean {
        return GCUniPluginNative.isHarmonyUniRequestAutoTraceEnabled();
    }
    static getTraceHeader(params: GCTraceHeaderParams): Object | null {
        return GCUniPluginNative.getTraceHeader(params);
    }
}
function getHarmonyContext(): Context | undefined {
    return getContext() as Context;
}
class GCEnv {
    static readonly PROD: string = 'prod';
    static readonly GRAY: string = 'gray';
    static readonly PRE: string = 'pre';
    static readonly COMMON: string = 'common';
    static readonly LOCAL: string = 'local';
}
class GCDiscardStrategy {
    static readonly DISCARD: string = 'discard';
    static readonly DISCARD_OLDEST: string = 'discardOldest';
}
class GCTraceType {
    static readonly DDTRACE: string = 'ddTrace';
    static readonly ZIPKIN_MULTI_HEADER: string = 'zipkinMultiHeader';
    static readonly ZIPKIN_SINGLE_HEADER: string = 'zipkinSingleHeader';
    static readonly TRACEPARENT: string = 'traceparent';
    static readonly SKYWALKING: string = 'skywalking';
    static readonly JAEGER: string = 'jaeger';
}
class GCMonitorFrequency {
    static readonly NORMAL: string = 'normal';
    static readonly FREQUENT: string = 'frequent';
    static readonly RARE: string = 'rare';
}
class GCLogStatus {
    static readonly INFO: string = 'info';
    static readonly DEBUG: string = 'debug';
    static readonly WARNING: string = 'warning';
    static readonly ERROR: string = 'error';
    static readonly CRITICAL: string = 'critical';
    static readonly OK: string = 'ok';
}
class GCErrorMonitorType {
    static readonly BATTERY: string = 'battery';
    static readonly MEMORY: string = 'memory';
    static readonly CPU: string = 'cpu';
    static readonly ALL: string = 'all';
}
class GCDeviceMonitorType {
    static readonly BATTERY: string = 'battery';
    static readonly MEMORY: string = 'memory';
    static readonly CPU: string = 'cpu';
    static readonly FPS: string = 'fps';
    static readonly ALL: string = 'all';
}
export { mobileAgent as mobileAgent };
export { rum as rum };
export { logger as logger };
export { tracer as tracer };
export { GCEnv as GCEnv };
export { GCDiscardStrategy as GCDiscardStrategy };
export { GCTraceType as GCTraceType };
export { GCMonitorFrequency as GCMonitorFrequency };
export { GCLogStatus as GCLogStatus };
export { GCErrorMonitorType as GCErrorMonitorType };
export { GCDeviceMonitorType as GCDeviceMonitorType };
