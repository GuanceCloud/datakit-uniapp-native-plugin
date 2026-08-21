import "./GCNativeWebView";
import webview from '@ohos.web.webview';
import { AppState, DBCacheDiscard, DetectFrequency, DeviceMetricsMonitorType, ErrorMonitorType, FTLogger, FTLoggerConfig, FTRUMConfig, FTRUMGlobalManager, FTSDK, FTSDKConfig, FTTraceConfig, FTTraceManager, FTWebViewHandler, LogCacheDiscard, NetStatusBean, ResourceParams, RUMCacheDiscard, Status, TraceType, UserData } from '@guancecloud/ft_sdk';
import { Context } from '@kit.AbilityKit';
import { DataModifier, DataModifierValue, LineDataModifier } from '@guancecloud/ft_sdk';
import { UTSObject, UTS, UTSJSONObject } from "@dcloudio/uni-app-runtime";
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
    samplerate: number | null = null;
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
    samplerate: number | null = null;
    enableLinkRumData: boolean | null = null;
    enableCustomLog: boolean | null = null;
    logCacheLimitCount: number | null = null;
    discardStrategy: string | null = null;
    logLevelFilters: string[] | null = null;
    globalContext: Object | null = null;
}
class GCTraceConfig extends UTSObject {
    sampleRate: number | null = null;
    samplerate: number | null = null;
    traceType: string | null = null;
    enableLinkRUMData: boolean | null = null;
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
const GC_UTS_BRIDGE_VERSION: string = '0.2.7';
const pendingViewLoadTimes: Map<string, number> = new Map();
const bridgeContext: Map<string, Object> = new Map();
let currentViewName = '';
let uniAppJSViewTrackingEnabled = true;
let uniAppJSActionTrackingEnabled = true;
let activeRumConfig: FTRUMConfig | null = null;
const attachedWebViewHandlers: Map<webview.WebviewController, FTWebViewHandler> = new Map();
const sdkBridgeInfo: Record<string, Object> = {};
sdkBridgeInfo.uniapp = GC_UTS_BRIDGE_VERSION;
bridgeContext.set('sdk_bridge_info', sdkBridgeInfo);
class mobileAgent {
    static sdkConfig(params: GCMobileConfig) {
        try {
            const datakitUrl = params.datakitUrl;
            const datawayUrl = params.datawayUrl;
            const clientToken = params.clientToken;
            let config: FTSDKConfig;
            if (datakitUrl != null && datakitUrl.length > 0) {
                config = FTSDKConfig.builder(datakitUrl);
            } else if (datawayUrl != null && datawayUrl.length > 0 && clientToken != null && clientToken.length > 0) {
                config = FTSDKConfig.builder(datawayUrl, clientToken);
            } else {
                UTS.console.error('[GC-UniPlugin] sdkConfig failed: missing datakitUrl or datawayUrl/clientToken', " at uni_modules/GC-UniPlugin/utssdk/app-harmony/index.uts:79");
                return;
            }
            if (params.debug !== undefined && params.debug !== null) {
                config.setDebug(params.debug);
            }
            if (params.env) {
                config.setEnv(params.env);
            }
            if (params.service) {
                config.setServiceName(params.service);
            }
            if (params.autoSync !== undefined && params.autoSync !== null) {
                config.setAutoSync(params.autoSync);
            }
            if (params.syncPageSize !== undefined && params.syncPageSize !== null) {
                config.setCustomSyncPageSize(params.syncPageSize);
            }
            if (params.syncSleepTime !== undefined && params.syncSleepTime !== null) {
                config.setSyncSleepTime(params.syncSleepTime);
            }
            if (params.enableDataIntegerCompatible === true) {
                config.enableDataIntegerCompatible();
            }
            if (params.compressIntakeRequests !== undefined && params.compressIntakeRequests !== null) {
                config.setCompressIntakeRequests(params.compressIntakeRequests);
            }
            if (params.dbCacheLimit !== undefined && params.dbCacheLimit !== null) {
                config.enableLimitWithDbSize(params.dbCacheLimit);
            } else if (params.enableLimitWithDbSize === true) {
                config.enableLimitWithDbSize();
            }
            const dbDiscard = harmonyDbCacheDiscard(params.dbDiscardStrategy);
            if (dbDiscard !== null) {
                config.setDbCacheDiscard(dbDiscard);
            }
            if (params.globalContext) {
                const globalContext = params.globalContext as Record<string, Object>;
                const keys = Object.keys(globalContext);
                for(let i = 0; i < keys.length; i++){
                    const key = keys[i];
                    config.addGlobalContext(key, toHarmonyObject(globalContext[key]));
                }
            }
            if (params.dataModifier) {
                config.setDataModifier(new HarmonyDataModifier(toHarmonyObjectMap(params.dataModifier)));
            }
            if (params.lineDataModifier) {
                config.setLineDataModifier(new HarmonyLineDataModifier(toHarmonyLinePatches(params.lineDataModifier)));
            }
            FTSDK.install(config, getHarmonyContext());
            UTS.console.log('[GC-UniPlugin] sdkConfig completed successfully', " at uni_modules/GC-UniPlugin/utssdk/app-harmony/index.uts:132");
        } catch (error) {
            UTS.console.error('[GC-UniPlugin] sdkConfig failed:', error, " at uni_modules/GC-UniPlugin/utssdk/app-harmony/index.uts:134");
        }
    }
    static bindRUMUserData(params: GCRUMUserDataParams) {
        try {
            const userData = new UserData();
            userData.setId(params.userId);
            if (params.userName) {
                userData.setName(params.userName);
            }
            if (params.userEmail) {
                userData.setEmail(params.userEmail);
            }
            if (params.extra) {
                const extra = params.extra as Record<string, Object>;
                const keys = Object.keys(extra);
                for(let i = 0; i < keys.length; i++){
                    const key = keys[i];
                    userData.addExt(key, String(extra[key]));
                }
            }
            FTSDK.bindRumUserData(userData);
        } catch (error) {
            UTS.console.error('[GC-UniPlugin] bindRUMUserData failed:', error, " at uni_modules/GC-UniPlugin/utssdk/app-harmony/index.uts:158");
        }
    }
    static unbindRUMUserData() {
        FTSDK.unbindRumUserData();
    }
    static appendGlobalContext(params: Object | null) {
        if (params) {
            FTSDK.appendGlobalContext(toHarmonyStringMap(params));
        }
    }
    static appendRUMGlobalContext(params: Object | null) {
        if (params) {
            FTSDK.appendRUMGlobalContext(toHarmonyStringMap(params));
        }
    }
    static appendLogGlobalContext(params: Object | null) {
        if (params) {
            FTSDK.appendLogGlobalContext(toHarmonyStringMap(params));
        }
    }
    static appendBridgeContext(params: Object | null) {
        if (!params) {
            return;
        }
        const context = params as Record<string, Object>;
        const keys = Object.keys(context);
        for(let i = 0; i < keys.length; i++){
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
        UTS.console.log('[GC-UniPlugin] manuallySetApplicationStart is not supported on HarmonyOS', " at uni_modules/GC-UniPlugin/utssdk/app-harmony/index.uts:212");
    }
}
class rum {
    static setConfig(params: GCRUMConfig) {
        try {
            const rumAppId = params.harmonyAppId || params.androidAppId || params.iOSAppId;
            if (!rumAppId) {
                UTS.console.error('[GC-UniPlugin] rumSetConfig failed: missing RUM app id', " at uni_modules/GC-UniPlugin/utssdk/app-harmony/index.uts:221");
                return;
            }
            const config = new FTRUMConfig().setRumAppId(rumAppId);
            const sampleRate = params.sampleRate !== undefined && params.sampleRate !== null ? params.sampleRate : params.samplerate;
            if (sampleRate !== undefined && sampleRate !== null) {
                config.setSamplingRate(sampleRate);
            }
            if (params.sessionOnErrorSampleRate !== undefined && params.sessionOnErrorSampleRate !== null) {
                config.setSessionErrorSampleRate(params.sessionOnErrorSampleRate);
            }
            if (params.enableNativeUserAction !== undefined && params.enableNativeUserAction !== null) {
                config.setEnableTraceUserAction(params.enableNativeUserAction);
            }
            if (params.enableNativeUserView !== undefined && params.enableNativeUserView !== null) {
                config.setEnableTraceUserView(params.enableNativeUserView);
            }
            if (params.enableNativeUserResource !== undefined && params.enableNativeUserResource !== null) {
                config.setEnableTraceUserResource(params.enableNativeUserResource);
            }
            if (params.enableResourceHostIP !== undefined && params.enableResourceHostIP !== null) {
                config.setEnableResourceHostIP(params.enableResourceHostIP);
            }
            if (params.enableTrackNativeCrash !== undefined && params.enableTrackNativeCrash !== null) {
                config.setEnableTrackAppCrash(params.enableTrackNativeCrash);
            }
            if (params.enableTrackNativeAppANR !== undefined && params.enableTrackNativeAppANR !== null) {
                config.setEnableTrackAppANR(params.enableTrackNativeAppANR);
            }
            if (params.enableTrackNativeFreeze !== undefined && params.enableTrackNativeFreeze !== null) {
                config.setEnableTrackAppUIBlock(params.enableTrackNativeFreeze, params.nativeFreezeDurationMs || 1000);
            }
            const errorMonitorType = harmonyErrorMonitorType(params.errorMonitorType);
            if (errorMonitorType !== 0) {
                config.setExtraMonitorTypeWithError(errorMonitorType);
            }
            const deviceMonitorType = harmonyDeviceMonitorType(params.deviceMonitorType);
            if (deviceMonitorType !== 0) {
                config.setDeviceMetricsMonitorType(deviceMonitorType);
                if (params.detectFrequency) {
                    config.setDeviceMetricsDetectFrequency(harmonyDetectFrequency(params.detectFrequency));
                }
            }
            if (params.enableTraceWebView !== undefined && params.enableTraceWebView !== null) {
                config.setEnableTraceWebView(params.enableTraceWebView);
            }
            if (params.allowWebViewHost !== undefined) {
                config.setAllowWebViewHost(params.allowWebViewHost);
            }
            if (params.globalContext) {
                const globalContext = params.globalContext as Record<string, Object>;
                const keys = Object.keys(globalContext);
                for(let i = 0; i < keys.length; i++){
                    const key = keys[i];
                    config.addGlobalContext(key, toHarmonyObject(globalContext[key]));
                }
            }
            if (params.rumCacheLimitCount !== undefined && params.rumCacheLimitCount !== null) {
                config.setRumCacheLimitCount(params.rumCacheLimitCount);
            }
            const rumDiscard = harmonyRumCacheDiscard(params.rumDiscardStrategy);
            if (rumDiscard !== null) {
                config.setRumCacheDiscardStrategy(rumDiscard);
            }
            FTSDK.installRUMConfig(config);
            activeRumConfig = config;
            syncBridgeContextToRUMGlobalContext();
        } catch (error) {
            UTS.console.error('[GC-UniPlugin] rumSetConfig failed:', error, " at uni_modules/GC-UniPlugin/utssdk/app-harmony/index.uts:295");
        }
    }
    static startAction(params: GCRUMActionParams) {
        FTRUMGlobalManager.getInstance().startAction(params.actionName, params.actionType || 'click', mergeRumBridgeContext(params.property));
    }
    static isUniAppJSViewTrackingEnabled(): boolean {
        return uniAppJSViewTrackingEnabled;
    }
    static isUniAppJSActionTrackingEnabled(): boolean {
        return uniAppJSActionTrackingEnabled;
    }
    static addAction(params: GCRUMActionParams) {
        FTRUMGlobalManager.getInstance().addAction(params.actionName, params.actionType || 'click', mergeRumBridgeContext(params.property));
    }
    static onCreateView(params: GCRUMCreateViewParams) {
        if (!params.viewName || params.loadTime <= 0) {
            return;
        }
        pendingViewLoadTimes.set(params.viewName, params.loadTime);
        if (currentViewName === params.viewName) {
            FTRUMGlobalManager.getInstance().updateLoadTime(params.loadTime);
            pendingViewLoadTimes.delete(params.viewName);
        }
    }
    static startView(params: GCRUMViewParams) {
        startHarmonyView(params);
    }
    static stopView(params: GCRUMStopViewParams | null) {
        const property = params == null ? new UTSJSONObject({}) : mergeRumBridgeContext(params.property);
        FTRUMGlobalManager.getInstance().stopView(property);
        currentViewName = '';
    }
    static addError(params: GCRUMErrorParams) {
        const property = mergeRumBridgeContext(params.property);
        FTRUMGlobalManager.getInstance().addError(params.stack, params.message, params.type || params.errorType || 'uniapp_crash', harmonyAppState(params.state), property);
    }
    static startResource(params: GCRUMResourceParams) {
        FTRUMGlobalManager.getInstance().startResource(params.key, mergeRumBridgeContext(params.property));
    }
    static stopResource(params: GCRUMResourceParams) {
        FTRUMGlobalManager.getInstance().stopResource(params.key, mergeRumBridgeContext(params.property));
    }
    static addResource(params: GCRUMAddResourceParams) {
        const content = params.content;
        const resource = new ResourceParams();
        resource.url = content.url;
        resource.resourceMethod = content.httpMethod || 'GET';
        resource.requestHeader = normalizeHarmonyHeader(content.requestHeader);
        resource.responseHeader = normalizeHarmonyHeader(content.responseHeader);
        resource.responseBody = content.responseBody || '';
        resource.resourceStatus = content.resourceStatus || 0;
        resource.requestErrorMsg = content.errorMessage || '';
        resource.requestErrorStack = content.errorStack || '';
        resource.setProperty(toHarmonyObjectMap(mergeRumBridgeContext(params.property)));
        const netStatus = new NetStatusBean();
        applyHarmonyResourceTiming(netStatus, content);
        FTRUMGlobalManager.getInstance().addResource(params.key, resource, netStatus);
    }
    static attachWebView(controller: webview.WebviewController, viewName: string | null = null) {
        const config = activeRumConfig;
        if (config === null || !config.isEnableTraceWebView()) {
            return;
        }
        try {
            const attachedHandler = UTS.mapGet(attachedWebViewHandlers, controller);
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
            UTS.console.error('[GC-UniPlugin] attachWebView failed:', error, " at uni_modules/GC-UniPlugin/utssdk/app-harmony/index.uts:408");
        }
    }
    static detachWebView(controller: webview.WebviewController) {
        const handler = UTS.mapGet(attachedWebViewHandlers, controller);
        if (handler === null || handler === undefined) {
            return;
        }
        try {
            handler.clearWebController();
        } catch (error) {
            UTS.console.error('[GC-UniPlugin] detachWebView failed:', error, " at uni_modules/GC-UniPlugin/utssdk/app-harmony/index.uts:421");
        }
        attachedWebViewHandlers.delete(controller);
    }
}
class logger {
    static setConfig(params: GCLoggerConfig) {
        try {
            const config = new FTLoggerConfig();
            if (params.enableCustomLog !== undefined && params.enableCustomLog !== null) {
                config.setEnableCustomLog(params.enableCustomLog);
            }
            const sampleRate = params.sampleRate !== undefined && params.sampleRate !== null ? params.sampleRate : params.samplerate;
            if (sampleRate !== undefined && sampleRate !== null) {
                config.setSamplingRate(sampleRate);
            }
            if (params.discardStrategy === 'discardOldest') {
                config.setLogCacheDiscardStrategy(LogCacheDiscard.DISCARD_OLDEST);
            } else if (params.discardStrategy === 'discard') {
                config.setLogCacheDiscardStrategy(LogCacheDiscard.DISCARD);
            }
            if (params.logLevelFilters && params.logLevelFilters.length > 0) {
                const filters: string[] = [];
                for(let i = 0; i < params.logLevelFilters.length; i++){
                    const status = Status.fromName(normalizeHarmonyLogStatus(String(params.logLevelFilters[i])));
                    if (status) {
                        filters.push(status.name);
                    }
                }
                if (filters.length > 0) {
                    config.setLogLevelFilters(filters);
                }
            }
            if (params.enableLinkRumData !== undefined && params.enableLinkRumData !== null) {
                config.setEnableLinkRumData(params.enableLinkRumData);
            }
            if (params.globalContext) {
                const globalContext = params.globalContext as Record<string, Object>;
                const keys = Object.keys(globalContext);
                for(let i = 0; i < keys.length; i++){
                    const key = keys[i];
                    config.addGlobalContext(key, String(globalContext[key]));
                }
            }
            if (params.logCacheLimitCount !== undefined && params.logCacheLimitCount !== null) {
                config.setLogCacheLimitCount(params.logCacheLimitCount);
            }
            FTSDK.installLogConfig(config);
        } catch (error) {
            UTS.console.error('[GC-UniPlugin] loggerSetConfig failed:', error, " at uni_modules/GC-UniPlugin/utssdk/app-harmony/index.uts:471");
        }
    }
    static logging(params: GCLoggerLogParams) {
        const status = normalizeHarmonyLogStatus(params.status == null ? 'info' : String(params.status));
        const logStatus = Status.fromName(status) || Status.INFO;
        FTLogger.logBackground(params.content, logStatus, mergeLogBridgeContext(params.property));
    }
}
class tracer {
    static setConfig(params: GCTraceConfig) {
        try {
            const config = new FTTraceConfig();
            const sampleRate = params.sampleRate !== undefined && params.sampleRate !== null ? params.sampleRate : params.samplerate;
            if (sampleRate !== undefined && sampleRate !== null) {
                config.setSamplingRate(sampleRate);
            }
            if (params.traceType) {
                config.setTraceType(harmonyTraceType(params.traceType));
            }
            if (params.enableLinkRUMData !== undefined && params.enableLinkRUMData !== null) {
                config.setEnableLinkRUMData(params.enableLinkRUMData);
            }
            FTSDK.installTraceConfig(config);
        } catch (error) {
            UTS.console.error('[GC-UniPlugin] tracerSetConfig failed:', error, " at uni_modules/GC-UniPlugin/utssdk/app-harmony/index.uts:497");
        }
    }
    static getTraceHeader(params: GCTraceHeaderParams): Object | null {
        try {
            return FTTraceManager.getInstance().getTraceHeader(params.key || params.url, params.url);
        } catch (error) {
            UTS.console.error('[GC-UniPlugin] tracerGetTraceHeader failed:', error, " at uni_modules/GC-UniPlugin/utssdk/app-harmony/index.uts:505");
            return null;
        }
    }
}
function getHarmonyContext(): Context | undefined {
    return getContext() as Context;
}
function harmonyWebViewName(value: string | null = null): string {
    return value !== undefined && value !== null && value.length > 0 ? value : 'webview';
}
async function startHarmonyView(params: GCRUMViewParams): Promise<void> {
    try {
        const manager = FTRUMGlobalManager.getInstance();
        await manager.startView(params.viewName, mergeRumBridgeContext(params.property));
        currentViewName = params.viewName;
        const loadTime = UTS.mapGet(pendingViewLoadTimes, params.viewName);
        if (loadTime !== undefined) {
            manager.updateLoadTime(loadTime);
            pendingViewLoadTimes.delete(params.viewName);
        }
    } catch (error) {
        UTS.console.error('[GC-UniPlugin] rumStartView failed:', error, " at uni_modules/GC-UniPlugin/utssdk/app-harmony/index.uts:532");
    }
}
class HarmonyDataModifier implements DataModifier {
    private readonly replacements: Map<string, object>;
    constructor(replacements: Map<string, object>){
        this.replacements = replacements;
    }
    modify(key: string, value: DataModifierValue): DataModifierValue | null {
        const replacement = UTS.mapGet(this.replacements, key);
        return replacement === undefined ? null : replacement;
    }
}
class HarmonyLineDataModifier implements LineDataModifier {
    private readonly patches: Map<string, Map<string, object>>;
    constructor(patches: Map<string, Map<string, object>>){
        this.patches = patches;
    }
    modify(measurement: string, data: Map<string, DataModifierValue>): Map<string, DataModifierValue> | null {
        let patch = UTS.mapGet(this.patches, measurement);
        if (patch === undefined || patch === null) {
            patch = UTS.mapGet(this.patches, 'log');
        }
        if (patch === undefined || patch === null) {
            return null;
        }
        const result = new Map<string, DataModifierValue>();
        patch.forEach((value, key)=>{
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
    switch(value){
        case 'zipkinMultiHeader':
            return TraceType.ZIPKIN_MULTI_HEADER;
        case 'zipkinSingleHeader':
            return TraceType.ZIPKIN_SINGLE_HEADER;
        case 'traceparent':
            return TraceType.TRACEPARENT;
        case 'skywalking':
            return TraceType.SKYWALKING;
        case 'jaeger':
            return TraceType.JAEGER;
        default:
            return TraceType.DDTRACE;
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
        return [
            value
        ];
    }
    if (value === null || value === undefined) {
        return [];
    }
    return value;
}
function harmonyErrorMonitorType(value: string | string[] | null | undefined): number {
    const values = harmonyMonitorValues(value);
    let result = 0;
    for(let i = 0; i < values.length; i++){
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
    for(let i = 0; i < values.length; i++){
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
function mergeRumBridgeContext(property: Object | null = null): Record<string, object> {
    const result: Record<string, object> = {};
    if (property) {
        const rumProperty = property as Record<string, Object>;
        const keys = Object.keys(rumProperty);
        for(let i = 0; i < keys.length; i++){
            const key = keys[i];
            result[key] = toHarmonyObject(rumProperty[key]);
        }
    }
    bridgeContext.forEach((value, key)=>{
        result[key] = toHarmonyObject(value);
    });
    return result;
}
function syncBridgeContextToRUMGlobalContext(): void {
    const context = new Map<string, string>();
    bridgeContext.forEach((value, key)=>{
        context.set(key, stringifyBridgeContextValue(value));
    });
    if (context.size > 0) {
        FTSDK.appendRUMGlobalContext(context);
    }
}
function stringifyBridgeContextValue(value: Object): string {
    if (typeof value === 'string') {
        return value;
    }
    try {
        const json = UTS.JSON.stringify(value);
        if (json !== undefined) {
            return json;
        }
    } catch (_) {}
    return String(value);
}
function mergeLogBridgeContext(property: Object | null = null): Map<string, object> {
    const result = new Map<string, object>();
    if (property) {
        const logProperty = property as Record<string, Object>;
        const keys = Object.keys(logProperty);
        for(let i = 0; i < keys.length; i++){
            const key = keys[i];
            result.set(key, toHarmonyObject(logProperty[key]));
        }
    }
    bridgeContext.forEach((value, key)=>{
        result.set(key, toHarmonyObject(value));
    });
    return result;
}
function toHarmonyObjectMap(value: Object): Map<string, object> {
    const result = new Map<string, object>();
    const context = value as Record<string, Object>;
    const keys = Object.keys(context);
    for(let i = 0; i < keys.length; i++){
        const key = keys[i];
        result.set(key, toHarmonyObject(context[key]));
    }
    return result;
}
function toHarmonyLinePatches(value: Object): Map<string, Map<string, object>> {
    const result = new Map<string, Map<string, object>>();
    const patches = value as Record<string, Object>;
    const keys = Object.keys(patches);
    for(let i = 0; i < keys.length; i++){
        const key = keys[i];
        result.set(key, toHarmonyObjectMap(patches[key]));
    }
    return result;
}
function toHarmonyStringMap(value: Object): Map<string, string> {
    const result = new Map<string, string>();
    const context = value as Record<string, Object>;
    const keys = Object.keys(context);
    for(let i = 0; i < keys.length; i++){
        const key = keys[i];
        result.set(key, String(context[key]));
    }
    return result;
}
function applyHarmonyResourceTiming(status: NetStatusBean, content: GCRUMResourceContentParams) {
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
function toHarmonyObject(value: Object): object {
    return new Object(value);
}
function normalizeHarmonyHeader(value: Object | null | undefined): string {
    if (typeof value === 'string') {
        return value;
    }
    if (value == null) {
        return '';
    }
    try {
        return UTS.JSON.stringify(value);
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
