@file:Suppress("UNCHECKED_CAST", "USELESS_CAST", "INAPPLICABLE_JVM_NAME", "UNUSED_ANONYMOUS_PARAMETER", "SENSELESS_COMPARISON", "NAME_SHADOWING", "UNNECESSARY_NOT_NULL_ASSERTION")
package uts.sdk.modules.GCUniPlugin
import io.dcloud.uniapp.*
import io.dcloud.uniapp.extapi.*
import io.dcloud.uts.*
import io.dcloud.uts.Map
import io.dcloud.uts.Set
import io.dcloud.uts.UTSAndroid
import kotlin.properties.Delegates
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Deferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import gc.uniplugin.android.GCUniPluginNative
open class GCMobileConfig (
    open var datakitUrl: String? = null,
    open var datawayUrl: String? = null,
    open var clientToken: String? = null,
    open var env: String? = null,
    open var debug: Boolean? = null,
    open var service: String? = null,
    open var autoSync: Boolean? = null,
    open var offlinePackage: Boolean? = null,
    open var syncPageSize: Number? = null,
    open var syncSleepTime: Number? = null,
    open var enableDataIntegerCompatible: Boolean? = null,
    open var compressIntakeRequests: Boolean? = null,
    open var enableLimitWithDbSize: Boolean? = null,
    open var dbCacheLimit: Number? = null,
    open var dbDiscardStrategy: String? = null,
    open var globalContext: Any? = null,
    open var dataModifier: Any? = null,
    open var lineDataModifier: Any? = null,
    open var remoteConfiguration: Boolean? = null,
    open var remoteConfigMiniUpdateInterval: Number? = null,
    open var enableDataFilter: Boolean? = null,
    open var dataFilters: Any? = null,
) : UTSObject()
open class GCDatakitURLParams (
    @JsonNotNull
    open var datakitUrl: String,
) : UTSObject()
open class GCDatawayURLParams (
    @JsonNotNull
    open var datawayUrl: String,
    @JsonNotNull
    open var clientToken: String,
) : UTSObject()
open class GCRemoteConfigUpdateParams (
    open var miniUpdateInterval: Number? = null,
) : UTSObject()
open class GCRemoteConfigUpdateResult {
    open var success: Boolean = false
    open var platform: String = ""
    open var rawJson: String? = null
    open var errorCode: Any? = null
    open var errorMessage: String? = null
    constructor(success: Boolean, platform: String, rawJson: String?, errorCode: Any?, errorMessage: String?){
        this.success = success
        this.platform = platform
        this.rawJson = if (rawJson == null) {
            null
        } else {
            rawJson
        }
        this.errorCode = if (errorCode == null) {
            null
        } else {
            errorCode
        }
        this.errorMessage = if (errorMessage == null) {
            null
        } else {
            errorMessage
        }
    }
}
typealias GCRemoteConfigUpdateCallback = (result: GCRemoteConfigUpdateResult) -> Unit
open class GCRUMConfig (
    open var androidAppId: String? = null,
    open var iOSAppId: String? = null,
    open var harmonyAppId: String? = null,
    open var sampleRate: Number? = null,
    open var samplerate: Number? = null,
    open var sessionOnErrorSampleRate: Number? = null,
    open var enableNativeUserAction: Boolean? = null,
    open var enableNativeUserView: Boolean? = null,
    open var enableNativeUserResource: Boolean? = null,
    open var enableResourceHostIP: Boolean? = null,
    open var enableTrackNativeCrash: Boolean? = null,
    open var enableTrackNativeAppANR: Boolean? = null,
    open var enableTrackNativeFreeze: Boolean? = null,
    open var nativeFreezeDurationMs: Number? = null,
    open var errorMonitorType: Any? = null,
    open var deviceMonitorType: Any? = null,
    open var detectFrequency: String? = null,
    open var enableTraceWebView: Boolean? = null,
    open var allowWebViewHost: UTSArray<String>? = null,
    open var globalContext: Any? = null,
    open var rumCacheLimitCount: Number? = null,
    open var rumDiscardStrategy: String? = null,
) : UTSObject()
open class GCLoggerConfig (
    open var sampleRate: Number? = null,
    open var samplerate: Number? = null,
    open var enableLinkRumData: Boolean? = null,
    open var enableCustomLog: Boolean? = null,
    open var logCacheLimitCount: Number? = null,
    open var discardStrategy: String? = null,
    open var logLevelFilters: UTSArray<String>? = null,
    open var globalContext: Any? = null,
) : UTSObject()
open class GCTraceConfig (
    open var sampleRate: Number? = null,
    open var samplerate: Number? = null,
    open var traceType: String? = null,
    open var enableLinkRUMData: Boolean? = null,
    open var enableAutoTrace: Boolean? = null,
) : UTSObject()
open class GCRUMUserDataParams (
    @JsonNotNull
    open var userId: String,
    open var userName: String? = null,
    open var userEmail: String? = null,
    open var extra: Any? = null,
) : UTSObject()
open class GCRUMActionParams (
    @JsonNotNull
    open var actionName: String,
    open var actionType: String? = null,
    open var property: Any? = null,
) : UTSObject()
open class GCRUMViewParams (
    @JsonNotNull
    open var viewName: String,
    open var property: Any? = null,
) : UTSObject()
open class GCRUMCreateViewParams (
    @JsonNotNull
    open var viewName: String,
    @JsonNotNull
    open var loadTime: Number,
) : UTSObject()
open class GCRUMStopViewParams (
    open var property: Any? = null,
) : UTSObject()
open class GCRUMErrorParams (
    open var type: String? = null,
    open var errorType: String? = null,
    @JsonNotNull
    open var message: String,
    @JsonNotNull
    open var stack: String,
    open var state: String? = null,
    open var property: Any? = null,
) : UTSObject()
open class GCRUMResourceContentParams (
    @JsonNotNull
    open var url: String,
    open var httpMethod: String? = null,
    open var requestHeader: Any? = null,
    open var responseHeader: Any? = null,
    open var responseBody: String? = null,
    open var resourceStatus: Number? = null,
    open var errorMessage: String? = null,
    open var errorStack: String? = null,
    open var fetchStartTime: Number? = null,
    open var requestStartTime: Number? = null,
    open var responseStartTime: Number? = null,
    open var responseEndTime: Number? = null,
    open var tcpStartTime: Number? = null,
    open var tcpEndTime: Number? = null,
    open var dnsStartTime: Number? = null,
    open var dnsEndTime: Number? = null,
    open var sslStartTime: Number? = null,
    open var sslEndTime: Number? = null,
) : UTSObject()
open class GCRUMResourceParams (
    @JsonNotNull
    open var key: String,
    open var property: Any? = null,
) : UTSObject()
open class GCRUMAddResourceParams (
    @JsonNotNull
    open var key: String,
    @JsonNotNull
    open var content: GCRUMResourceContentParams,
    open var property: Any? = null,
) : UTSObject()
open class GCLoggerLogParams (
    @JsonNotNull
    open var content: String,
    open var status: Any? = null,
    open var property: Any? = null,
) : UTSObject()
open class GCTraceHeaderParams (
    @JsonNotNull
    open var url: String,
    open var key: String? = null,
) : UTSObject()
val GC_UTS_BRIDGE_VERSION: String = "0.2.7"
fun createDefaultBridgeContext(): UTSJSONObject {
    val context = JSON.parseObject("{\"sdk_bridge_info\":\"{\\\"uniapp\\\":\\\"" + GC_UTS_BRIDGE_VERSION + "\\\"}\"}")
    return context ?: _uO()
}
@JvmField
var bridgeContext: UTSJSONObject = createDefaultBridgeContext()
fun parseObject(text: String?): UTSJSONObject? {
    val safeText: String = text ?: ""
    if (safeText.length == 0) {
        return null
    }
    return JSON.parseObject(safeText)
}
fun cloneJSONObject(source: UTSJSONObject?): UTSJSONObject {
    if (source == null) {
        return _uO()
    }
    return parseObject(JSON.stringify(source)) ?: _uO()
}
fun toJSONObject(source: Any?): UTSJSONObject? {
    if (source == null) {
        return null
    }
    return parseObject(JSON.stringify(source))
}
fun mergeJSONObject(target: UTSJSONObject, source: UTSJSONObject?): UTSJSONObject {
    if (source == null) {
        return target
    }
    val safeSource: UTSJSONObject = source ?: _uO()
    safeSource.toMap().forEach(fun(entry){
        target[entry.key] = entry.value
    }
    )
    return target
}
fun getBridgeContext(): UTSJSONObject {
    return cloneJSONObject(bridgeContext)
}
fun appendBridgeContextState(context: Any?): UTSJSONObject {
    val nextBridgeContext = cloneJSONObject(bridgeContext)
    mergeJSONObject(nextBridgeContext, toJSONObject(context))
    bridgeContext = nextBridgeContext
    return getBridgeContext()
}
fun mergeBridgeContext(property: Any?): UTSJSONObject {
    val result = cloneJSONObject(bridgeContext)
    mergeJSONObject(result, toJSONObject(property))
    return result
}
fun cloneParams(params: Any?): UTSJSONObject {
    return cloneJSONObject(toJSONObject(params))
}
fun mergePropertyForParams(params: Any?): UTSJSONObject {
    val result = cloneParams(params)
    result["property"] = mergeBridgeContext(result.getJSON("property"))
    return result
}
fun normalizeAddResourceParams(params: Any?): UTSJSONObject {
    val result = cloneParams(params)
    val content = result.getJSON("content")
    if (content != null) {
        result["content"] = cloneJSONObject(content)
    }
    return result
}
fun normalizeSdkConfigParams(params: Any?): UTSJSONObject {
    return cloneParams(params)
}
fun normalizeRumConfigParams(params: Any?): UTSJSONObject {
    return cloneParams(params)
}
fun normalizeLoggerConfigParams(params: Any?): UTSJSONObject {
    return cloneParams(params)
}
fun normalizeTraceConfigParams(params: Any?): UTSJSONObject {
    return cloneParams(params)
}
fun normalizeLoggingParams(params: Any?): UTSJSONObject {
    return cloneParams(params)
}
fun createRemoteConfigUpdateResult(success: Boolean, platform: String, rawJson: String?, errorCode: Any?, errorMessage: String?): GCRemoteConfigUpdateResult {
    return GCRemoteConfigUpdateResult(success, platform, if (rawJson == null) {
        null
    } else {
        rawJson
    }
    , if (errorCode == null) {
        null
    } else {
        errorCode
    }
    , if (errorMessage == null) {
        null
    } else {
        errorMessage
    }
    )
}
fun parseRemoteConfigUpdateResult(result: String?, platform: String): GCRemoteConfigUpdateResult {
    val parsedValue = parseObject(result)
    if (parsedValue == null) {
        return createRemoteConfigUpdateResult(false, platform, null, "REMOTE_CONFIG_INVALID_RESULT", "Remote configuration update returned an invalid result.")
    }
    val value: UTSJSONObject = parsedValue ?: _uO()
    return createRemoteConfigUpdateResult(value.getBoolean("success") ?: false, value.getString("platform") ?: platform, value.getString("rawJson"), value["errorCode"], value.getString("errorMessage"))
}
val BLACK_RESOURCE_PATTERN = UTSRegExp("^https?:\\/\\/([a-zA-Z0-9-]+\\.)?dcloud\\.net\\.cn(:\\d+)?\\/.*", "")
fun filterBlackResource(resourceUrl: String?): Boolean {
    if (resourceUrl == null || resourceUrl.length === 0) {
        return false
    }
    return BLACK_RESOURCE_PATTERN.test(resourceUrl)
}
fun getStringValue(source: UTSJSONObject?, key: String): String? {
    if (source == null) {
        return null
    }
    return source.getString(key)
}
fun prepareAddResourceParams(params: Any?): Any {
    val result = normalizeAddResourceParams(params)
    val content = result.getJSON("content")
    val resourceUrl = getStringValue(content, "url")
    result["isBlackResource"] = filterBlackResource(resourceUrl)
    return result
}
fun stringifyParams(params: Any?): String {
    if (params == null) {
        return "{}"
    }
    return JSON.stringify(params) ?: "{}"
}
fun parseJSONResult(result: String?): Any? {
    if (result == null || result.length === 0) {
        return null
    }
    return JSON.parse(result)
}
fun debugLog(message: String) {}
fun debugError(message: String) {}
fun createBindRUMUserDataParams(userId: String, userName: String?, userEmail: String?, extra: Any?): GCRUMUserDataParams {
    return GCRUMUserDataParams(userId, if (userName == null) {
        null
    } else {
        userName
    }
    , if (userEmail == null) {
        null
    } else {
        userEmail
    }
    , if (extra == null) {
        null
    } else {
        extra
    }
    )
}
fun bindRUMUserCompat(userId: String, userName: String?, userEmail: String?, extra: Any?) {
    val json = stringifyParams(createBindRUMUserDataParams(userId, userName, userEmail, extra))
    GCUniPluginNative.bindRUMUserData(json)
}
open class mobileAgent {
    companion object {
        fun sdkConfig(params: GCMobileConfig) {
            debugLog("[FTLog] GC-UniPlugin Mobile SDK initialization requested")
            val json = stringifyParams(normalizeSdkConfigParams(params))
            val initialized = GCUniPluginNative.sdkConfig(json)
            if (initialized) {
                debugLog("[FTLog] GC-UniPlugin Mobile SDK initialized successfully")
            } else {
                debugError("[FTLog] GC-UniPlugin Mobile SDK initialization failed")
            }
        }
        fun setDatakitURL(params: GCDatakitURLParams) {
            GCUniPluginNative.setDatakitURL(stringifyParams(params))
        }
        fun setDatawayURL(params: GCDatawayURLParams) {
            GCUniPluginNative.setDatawayURL(stringifyParams(params))
        }
        fun updateRemoteConfigWithMiniUpdateInterval(params: GCRemoteConfigUpdateParams, callback: GCRemoteConfigUpdateCallback) {
            GCUniPluginNative.updateRemoteConfigWithMiniUpdateInterval(stringifyParams(params), fun(result: String?){
                callback(parseRemoteConfigUpdateResult(result, "android"))
            }
            )
        }
        fun bindRUMUserData(params: GCRUMUserDataParams) {
            if (params == null || params.userId == null) {
                return
            }
            bindRUMUserCompat(params.userId, params.userName, params.userEmail, params.extra)
        }
        fun unbindRUMUserData() {
            GCUniPluginNative.unbindRUMUserData()
        }
        fun appendGlobalContext(params: Any?) {
            val json = stringifyParams(params)
            GCUniPluginNative.appendGlobalContext(json)
        }
        fun appendRUMGlobalContext(params: Any?) {
            val json = stringifyParams(params)
            GCUniPluginNative.appendRUMGlobalContext(json)
        }
        fun appendLogGlobalContext(params: Any?) {
            val json = stringifyParams(params)
            GCUniPluginNative.appendLogGlobalContext(json)
        }
        fun appendBridgeContext(params: Any?) {
            appendBridgeContextState(params)
        }
        fun flushSyncData() {
            GCUniPluginNative.flushSyncData()
        }
        fun clearAllData() {
            GCUniPluginNative.clearAllData()
        }
        fun shutDown() {
            GCUniPluginNative.shutDown()
        }
        fun manuallySetApplicationStart() {
            GCUniPluginNative.manuallySetApplicationStart()
        }
    }
}
open class rum {
    companion object {
        fun setConfig(params: GCRUMConfig) {
            debugLog("[FTLog] GC-UniPlugin RUM initialization requested")
            val json = stringifyParams(normalizeRumConfigParams(params))
            val initialized = GCUniPluginNative.setRumConfig(json)
            if (initialized) {
                debugLog("[FTLog] GC-UniPlugin RUM initialized successfully")
            } else {
                debugError("[FTLog] GC-UniPlugin RUM initialization failed")
            }
        }
        fun startAction(params: GCRUMActionParams) {
            GCUniPluginNative.startAction(stringifyParams(mergePropertyForParams(params)))
        }
        fun addAction(params: GCRUMActionParams) {
            GCUniPluginNative.addAction(stringifyParams(mergePropertyForParams(params)))
        }
        fun onCreateView(params: GCRUMCreateViewParams) {
            GCUniPluginNative.onCreateView(stringifyParams(cloneParams(params)))
        }
        fun startView(params: GCRUMViewParams) {
            GCUniPluginNative.startView(stringifyParams(mergePropertyForParams(params)))
        }
        fun stopView(params: GCRUMStopViewParams?) {
            GCUniPluginNative.stopView(stringifyParams(cloneParams(params)))
        }
        fun addError(params: GCRUMErrorParams) {
            GCUniPluginNative.addError(stringifyParams(mergePropertyForParams(params)))
        }
        fun startResource(params: GCRUMResourceParams) {
            GCUniPluginNative.startResource(stringifyParams(mergePropertyForParams(params)))
        }
        fun stopResource(params: GCRUMResourceParams) {
            GCUniPluginNative.stopResource(stringifyParams(cloneParams(params)))
        }
        fun addResource(params: GCRUMAddResourceParams) {
            val result = prepareAddResourceParams(params)
            GCUniPluginNative.addResource(stringifyParams(result))
        }
    }
}
open class logger {
    companion object {
        fun setConfig(params: GCLoggerConfig) {
            val json = stringifyParams(normalizeLoggerConfigParams(params))
            GCUniPluginNative.setLoggerConfig(json)
        }
        fun logging(params: GCLoggerLogParams) {
            val json = stringifyParams(normalizeLoggingParams(params))
            GCUniPluginNative.logging(json)
        }
    }
}
open class tracer {
    companion object {
        fun setConfig(params: GCTraceConfig) {
            val json = stringifyParams(normalizeTraceConfigParams(params))
            GCUniPluginNative.setTraceConfig(json)
        }
        fun getTraceHeader(params: GCTraceHeaderParams): Any? {
            val json = stringifyParams(params)
            val result = GCUniPluginNative.getTraceHeader(json)
            return parseJSONResult(result)
        }
    }
}
open class GCEnv {
    companion object {
        val PROD: String = "prod"
        val GRAY: String = "gray"
        val PRE: String = "pre"
        val COMMON: String = "common"
        val LOCAL: String = "local"
    }
}
open class GCDiscardStrategy {
    companion object {
        val DISCARD: String = "discard"
        val DISCARD_OLDEST: String = "discardOldest"
    }
}
open class GCTraceType {
    companion object {
        val DDTRACE: String = "ddTrace"
        val ZIPKIN_MULTI_HEADER: String = "zipkinMultiHeader"
        val ZIPKIN_SINGLE_HEADER: String = "zipkinSingleHeader"
        val TRACEPARENT: String = "traceparent"
        val SKYWALKING: String = "skywalking"
        val JAEGER: String = "jaeger"
    }
}
open class GCMonitorFrequency {
    companion object {
        val NORMAL: String = "normal"
        val FREQUENT: String = "frequent"
        val RARE: String = "rare"
    }
}
open class GCLogStatus {
    companion object {
        val INFO: String = "info"
        val DEBUG: String = "debug"
        val WARNING: String = "warning"
        val ERROR: String = "error"
        val CRITICAL: String = "critical"
        val OK: String = "ok"
    }
}
open class GCErrorMonitorType {
    companion object {
        val BATTERY: String = "battery"
        val MEMORY: String = "memory"
        val CPU: String = "cpu"
        val ALL: String = "all"
    }
}
open class GCDeviceMonitorType {
    companion object {
        val BATTERY: String = "battery"
        val MEMORY: String = "memory"
        val CPU: String = "cpu"
        val FPS: String = "fps"
        val ALL: String = "all"
    }
}
open class GCMobileConfigJSONObject : UTSJSONObject() {
    open var datakitUrl: String? = null
    open var datawayUrl: String? = null
    open var clientToken: String? = null
    open var env: String? = null
    open var debug: Boolean? = null
    open var service: String? = null
    open var autoSync: Boolean? = null
    open var offlinePackage: Boolean? = null
    open var syncPageSize: Number? = null
    open var syncSleepTime: Number? = null
    open var enableDataIntegerCompatible: Boolean? = null
    open var compressIntakeRequests: Boolean? = null
    open var enableLimitWithDbSize: Boolean? = null
    open var dbCacheLimit: Number? = null
    open var dbDiscardStrategy: String? = null
    open var globalContext: Any? = null
    open var dataModifier: Any? = null
    open var lineDataModifier: Any? = null
    open var remoteConfiguration: Boolean? = null
    open var remoteConfigMiniUpdateInterval: Number? = null
    open var enableDataFilter: Boolean? = null
    open var dataFilters: Any? = null
}
open class GCDatakitURLParamsJSONObject : UTSJSONObject() {
    open lateinit var datakitUrl: String
}
open class GCDatawayURLParamsJSONObject : UTSJSONObject() {
    open lateinit var datawayUrl: String
    open lateinit var clientToken: String
}
open class GCRemoteConfigUpdateParamsJSONObject : UTSJSONObject() {
    open var miniUpdateInterval: Number? = null
}
open class GCRUMConfigJSONObject : UTSJSONObject() {
    open var androidAppId: String? = null
    open var iOSAppId: String? = null
    open var harmonyAppId: String? = null
    open var sampleRate: Number? = null
    open var samplerate: Number? = null
    open var sessionOnErrorSampleRate: Number? = null
    open var enableNativeUserAction: Boolean? = null
    open var enableNativeUserView: Boolean? = null
    open var enableNativeUserResource: Boolean? = null
    open var enableResourceHostIP: Boolean? = null
    open var enableTrackNativeCrash: Boolean? = null
    open var enableTrackNativeAppANR: Boolean? = null
    open var enableTrackNativeFreeze: Boolean? = null
    open var nativeFreezeDurationMs: Number? = null
    open var errorMonitorType: Any? = null
    open var deviceMonitorType: Any? = null
    open var detectFrequency: String? = null
    open var enableTraceWebView: Boolean? = null
    open var allowWebViewHost: UTSArray<String>? = null
    open var globalContext: Any? = null
    open var rumCacheLimitCount: Number? = null
    open var rumDiscardStrategy: String? = null
}
open class GCLoggerConfigJSONObject : UTSJSONObject() {
    open var sampleRate: Number? = null
    open var samplerate: Number? = null
    open var enableLinkRumData: Boolean? = null
    open var enableCustomLog: Boolean? = null
    open var logCacheLimitCount: Number? = null
    open var discardStrategy: String? = null
    open var logLevelFilters: UTSArray<String>? = null
    open var globalContext: Any? = null
}
open class GCTraceConfigJSONObject : UTSJSONObject() {
    open var sampleRate: Number? = null
    open var samplerate: Number? = null
    open var traceType: String? = null
    open var enableLinkRUMData: Boolean? = null
    open var enableAutoTrace: Boolean? = null
}
open class GCRUMUserDataParamsJSONObject : UTSJSONObject() {
    open lateinit var userId: String
    open var userName: String? = null
    open var userEmail: String? = null
    open var extra: Any? = null
}
open class GCRUMActionParamsJSONObject : UTSJSONObject() {
    open lateinit var actionName: String
    open var actionType: String? = null
    open var property: Any? = null
}
open class GCRUMViewParamsJSONObject : UTSJSONObject() {
    open lateinit var viewName: String
    open var property: Any? = null
}
open class GCRUMCreateViewParamsJSONObject : UTSJSONObject() {
    open lateinit var viewName: String
    open lateinit var loadTime: Number
}
open class GCRUMStopViewParamsJSONObject : UTSJSONObject() {
    open var property: Any? = null
}
open class GCRUMErrorParamsJSONObject : UTSJSONObject() {
    open var type: String? = null
    open var errorType: String? = null
    open lateinit var message: String
    open lateinit var stack: String
    open var state: String? = null
    open var property: Any? = null
}
open class GCRUMResourceParamsJSONObject : UTSJSONObject() {
    open lateinit var key: String
    open var property: Any? = null
}
open class GCRUMAddResourceParamsJSONObject : UTSJSONObject() {
    open lateinit var key: String
    open lateinit var content: GCRUMResourceContentParams
    open var property: Any? = null
}
open class GCLoggerLogParamsJSONObject : UTSJSONObject() {
    open lateinit var content: String
    open var status: Any? = null
    open var property: Any? = null
}
open class GCTraceHeaderParamsJSONObject : UTSJSONObject() {
    open lateinit var url: String
    open var key: String? = null
}
open class mobileAgentByJs : mobileAgent {
    constructor() : super() {}
    companion object {
        fun sdkConfigByJs(params: GCMobileConfigJSONObject) {
            return mobileAgent.sdkConfig(GCMobileConfig(datakitUrl = params.datakitUrl, datawayUrl = params.datawayUrl, clientToken = params.clientToken, env = params.env, debug = params.debug, service = params.service, autoSync = params.autoSync, offlinePackage = params.offlinePackage, syncPageSize = params.syncPageSize, syncSleepTime = params.syncSleepTime, enableDataIntegerCompatible = params.enableDataIntegerCompatible, compressIntakeRequests = params.compressIntakeRequests, enableLimitWithDbSize = params.enableLimitWithDbSize, dbCacheLimit = params.dbCacheLimit, dbDiscardStrategy = params.dbDiscardStrategy, globalContext = params.globalContext, dataModifier = params.dataModifier, lineDataModifier = params.lineDataModifier, remoteConfiguration = params.remoteConfiguration, remoteConfigMiniUpdateInterval = params.remoteConfigMiniUpdateInterval, enableDataFilter = params.enableDataFilter, dataFilters = params.dataFilters))
        }
        fun setDatakitURLByJs(params: GCDatakitURLParamsJSONObject) {
            return mobileAgent.setDatakitURL(GCDatakitURLParams(datakitUrl = params.datakitUrl))
        }
        fun setDatawayURLByJs(params: GCDatawayURLParamsJSONObject) {
            return mobileAgent.setDatawayURL(GCDatawayURLParams(datawayUrl = params.datawayUrl, clientToken = params.clientToken))
        }
        fun updateRemoteConfigWithMiniUpdateIntervalByJs(params: GCRemoteConfigUpdateParamsJSONObject, callback: UTSCallback) {
            return mobileAgent.updateRemoteConfigWithMiniUpdateInterval(GCRemoteConfigUpdateParams(miniUpdateInterval = params.miniUpdateInterval), if (callback.fnJS != null) {
                callback.fnJS
            } else {
                callback.fnJS = fun(result: GCRemoteConfigUpdateResult){
                    callback(result)
                }
                callback.fnJS
            }
             as (result: GCRemoteConfigUpdateResult) -> Unit)
        }
        fun bindRUMUserDataByJs(params: GCRUMUserDataParamsJSONObject) {
            return mobileAgent.bindRUMUserData(GCRUMUserDataParams(userId = params.userId, userName = params.userName, userEmail = params.userEmail, extra = params.extra))
        }
        fun unbindRUMUserDataByJs() {
            return mobileAgent.unbindRUMUserData()
        }
        fun appendGlobalContextByJs(params: Any?) {
            return mobileAgent.appendGlobalContext(params)
        }
        fun appendRUMGlobalContextByJs(params: Any?) {
            return mobileAgent.appendRUMGlobalContext(params)
        }
        fun appendLogGlobalContextByJs(params: Any?) {
            return mobileAgent.appendLogGlobalContext(params)
        }
        fun appendBridgeContextByJs(params: Any?) {
            return mobileAgent.appendBridgeContext(params)
        }
        fun flushSyncDataByJs() {
            return mobileAgent.flushSyncData()
        }
        fun clearAllDataByJs() {
            return mobileAgent.clearAllData()
        }
        fun shutDownByJs() {
            return mobileAgent.shutDown()
        }
        fun manuallySetApplicationStartByJs() {
            return mobileAgent.manuallySetApplicationStart()
        }
    }
}
open class rumByJs : rum {
    constructor() : super() {}
    companion object {
        fun setConfigByJs(params: GCRUMConfigJSONObject) {
            return rum.setConfig(GCRUMConfig(androidAppId = params.androidAppId, iOSAppId = params.iOSAppId, harmonyAppId = params.harmonyAppId, sampleRate = params.sampleRate, samplerate = params.samplerate, sessionOnErrorSampleRate = params.sessionOnErrorSampleRate, enableNativeUserAction = params.enableNativeUserAction, enableNativeUserView = params.enableNativeUserView, enableNativeUserResource = params.enableNativeUserResource, enableResourceHostIP = params.enableResourceHostIP, enableTrackNativeCrash = params.enableTrackNativeCrash, enableTrackNativeAppANR = params.enableTrackNativeAppANR, enableTrackNativeFreeze = params.enableTrackNativeFreeze, nativeFreezeDurationMs = params.nativeFreezeDurationMs, errorMonitorType = params.errorMonitorType, deviceMonitorType = params.deviceMonitorType, detectFrequency = params.detectFrequency, enableTraceWebView = params.enableTraceWebView, allowWebViewHost = params.allowWebViewHost, globalContext = params.globalContext, rumCacheLimitCount = params.rumCacheLimitCount, rumDiscardStrategy = params.rumDiscardStrategy))
        }
        fun startActionByJs(params: GCRUMActionParamsJSONObject) {
            return rum.startAction(GCRUMActionParams(actionName = params.actionName, actionType = params.actionType, property = params.property))
        }
        fun addActionByJs(params: GCRUMActionParamsJSONObject) {
            return rum.addAction(GCRUMActionParams(actionName = params.actionName, actionType = params.actionType, property = params.property))
        }
        fun onCreateViewByJs(params: GCRUMCreateViewParamsJSONObject) {
            return rum.onCreateView(GCRUMCreateViewParams(viewName = params.viewName, loadTime = params.loadTime))
        }
        fun startViewByJs(params: GCRUMViewParamsJSONObject) {
            return rum.startView(GCRUMViewParams(viewName = params.viewName, property = params.property))
        }
        fun stopViewByJs(params: GCRUMStopViewParamsJSONObject?) {
            return rum.stopView(if (params != null) {
                GCRUMStopViewParams(property = params!!.property)
            } else {
                null
            }
            )
        }
        fun addErrorByJs(params: GCRUMErrorParamsJSONObject) {
            return rum.addError(GCRUMErrorParams(type = params.type, errorType = params.errorType, message = params.message, stack = params.stack, state = params.state, property = params.property))
        }
        fun startResourceByJs(params: GCRUMResourceParamsJSONObject) {
            return rum.startResource(GCRUMResourceParams(key = params.key, property = params.property))
        }
        fun stopResourceByJs(params: GCRUMResourceParamsJSONObject) {
            return rum.stopResource(GCRUMResourceParams(key = params.key, property = params.property))
        }
        fun addResourceByJs(params: GCRUMAddResourceParamsJSONObject) {
            return rum.addResource(GCRUMAddResourceParams(key = params.key, content = params.content, property = params.property))
        }
    }
}
open class loggerByJs : logger {
    constructor() : super() {}
    companion object {
        fun setConfigByJs(params: GCLoggerConfigJSONObject) {
            return logger.setConfig(GCLoggerConfig(sampleRate = params.sampleRate, samplerate = params.samplerate, enableLinkRumData = params.enableLinkRumData, enableCustomLog = params.enableCustomLog, logCacheLimitCount = params.logCacheLimitCount, discardStrategy = params.discardStrategy, logLevelFilters = params.logLevelFilters, globalContext = params.globalContext))
        }
        fun loggingByJs(params: GCLoggerLogParamsJSONObject) {
            return logger.logging(GCLoggerLogParams(content = params.content, status = params.status, property = params.property))
        }
    }
}
open class tracerByJs : tracer {
    constructor() : super() {}
    companion object {
        fun setConfigByJs(params: GCTraceConfigJSONObject) {
            return tracer.setConfig(GCTraceConfig(sampleRate = params.sampleRate, samplerate = params.samplerate, traceType = params.traceType, enableLinkRUMData = params.enableLinkRUMData, enableAutoTrace = params.enableAutoTrace))
        }
        fun getTraceHeaderByJs(params: GCTraceHeaderParamsJSONObject): Any? {
            return tracer.getTraceHeader(GCTraceHeaderParams(url = params.url, key = params.key))
        }
    }
}
open class GCEnvByJs : GCEnv {
    constructor() : super() {}
    companion object {
        val PROD = GCEnv.PROD
        val GRAY = GCEnv.GRAY
        val PRE = GCEnv.PRE
        val COMMON = GCEnv.COMMON
        val LOCAL = GCEnv.LOCAL
    }
}
open class GCDiscardStrategyByJs : GCDiscardStrategy {
    constructor() : super() {}
    companion object {
        val DISCARD = GCDiscardStrategy.DISCARD
        val DISCARD_OLDEST = GCDiscardStrategy.DISCARD_OLDEST
    }
}
open class GCTraceTypeByJs : GCTraceType {
    constructor() : super() {}
    companion object {
        val DDTRACE = GCTraceType.DDTRACE
        val ZIPKIN_MULTI_HEADER = GCTraceType.ZIPKIN_MULTI_HEADER
        val ZIPKIN_SINGLE_HEADER = GCTraceType.ZIPKIN_SINGLE_HEADER
        val TRACEPARENT = GCTraceType.TRACEPARENT
        val SKYWALKING = GCTraceType.SKYWALKING
        val JAEGER = GCTraceType.JAEGER
    }
}
open class GCMonitorFrequencyByJs : GCMonitorFrequency {
    constructor() : super() {}
    companion object {
        val NORMAL = GCMonitorFrequency.NORMAL
        val FREQUENT = GCMonitorFrequency.FREQUENT
        val RARE = GCMonitorFrequency.RARE
    }
}
open class GCLogStatusByJs : GCLogStatus {
    constructor() : super() {}
    companion object {
        val INFO = GCLogStatus.INFO
        val DEBUG = GCLogStatus.DEBUG
        val WARNING = GCLogStatus.WARNING
        val ERROR = GCLogStatus.ERROR
        val CRITICAL = GCLogStatus.CRITICAL
        val OK = GCLogStatus.OK
    }
}
open class GCErrorMonitorTypeByJs : GCErrorMonitorType {
    constructor() : super() {}
    companion object {
        val BATTERY = GCErrorMonitorType.BATTERY
        val MEMORY = GCErrorMonitorType.MEMORY
        val CPU = GCErrorMonitorType.CPU
        val ALL = GCErrorMonitorType.ALL
    }
}
open class GCDeviceMonitorTypeByJs : GCDeviceMonitorType {
    constructor() : super() {}
    companion object {
        val BATTERY = GCDeviceMonitorType.BATTERY
        val MEMORY = GCDeviceMonitorType.MEMORY
        val CPU = GCDeviceMonitorType.CPU
        val FPS = GCDeviceMonitorType.FPS
        val ALL = GCDeviceMonitorType.ALL
    }
}
