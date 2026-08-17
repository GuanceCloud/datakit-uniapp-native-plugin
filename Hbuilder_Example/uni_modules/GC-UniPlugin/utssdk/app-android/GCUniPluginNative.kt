package gc.uniplugin.android

import com.alibaba.fastjson.JSON
import com.alibaba.fastjson.JSONArray
import com.alibaba.fastjson.JSONObject
import com.ft.sdk.DBCacheDiscard
import com.ft.sdk.DataModifier
import com.ft.sdk.DetectFrequency
import com.ft.sdk.DeviceMetricsMonitorType
import com.ft.sdk.ErrorMonitorType
import com.ft.sdk.FTActivityLifecycleCallbacks
import com.ft.sdk.FTApplication
import com.ft.sdk.FTAutoTrack
import com.ft.sdk.FTLogger
import com.ft.sdk.FTLoggerConfig
import com.ft.sdk.FTRUMGlobalManager
import com.ft.sdk.FTRUMConfig
import com.ft.sdk.FTSDKConfig
import com.ft.sdk.FTSdk
import com.ft.sdk.FTTraceConfig
import com.ft.sdk.FTTraceManager
import com.ft.sdk.LineDataModifier
import com.ft.sdk.LogCacheDiscard
import com.ft.sdk.RUMCacheDiscard
import com.ft.sdk.TraceType
import com.ft.sdk.garble.bean.AppState
import com.ft.sdk.garble.bean.NetStatusBean
import com.ft.sdk.garble.bean.ResourceParams
import com.ft.sdk.garble.bean.Status
import com.ft.sdk.garble.bean.UserData
import com.ft.sdk.garble.utils.Constants
import com.ft.sdk.garble.utils.Utils as FTUtils
import java.util.Locale

private object FTUniAppStartManager {
    private var alreadyColdLaunch = false
    private val lifecycleCallbacks = FTActivityLifecycleCallbacks()
    private var coldStartTimeLineNs = 0L
    private var coldStartDurationNs = 0L

    fun start() {
        if (!alreadyColdLaunch) {
            FTApplication.getApplication().registerActivityLifecycleCallbacks(lifecycleCallbacks)
            val appStartTimeNs = FTUtils.getAppStartTimeNs()
            val installTimeNs = System.nanoTime()
            coldStartDurationNs = (installTimeNs - appStartTimeNs).coerceAtLeast(0L)
            coldStartTimeLineNs = FTUtils.getCurrentNanoTime() - coldStartDurationNs
            alreadyColdLaunch = true
        }
    }

    fun uploadColdBootTimeWhenManualStart() {
        if (coldStartTimeLineNs > 0) {
            FTAutoTrack.putRUMLaunchPerformance(true, coldStartDurationNs, coldStartTimeLineNs)
            coldStartTimeLineNs = 0L
            coldStartDurationNs = 0L
        }
    }
}

object GCUniPluginNative {
    private const val DEFAULT_ERROR_TYPE = "uniapp_crash"

    private fun parseObject(json: String?): JSONObject {
        if (json.isNullOrBlank()) {
            return JSONObject()
        }
        return JSON.parseObject(json) ?: JSONObject()
    }

    private fun parseNullableObject(json: String?): JSONObject? {
        if (json.isNullOrBlank()) {
            return null
        }
        return JSON.parseObject(json)
    }

    private fun firstValue(params: JSONObject, vararg keys: String): Any? {
        for (key in keys) {
            if (params.containsKey(key)) {
                return params[key]
            }
        }
        return null
    }

    private fun stringValue(value: Any?): String? {
        return when (value) {
            is String -> value
            is Number -> value.toString()
            is Boolean -> value.toString()
            else -> null
        }
    }

    private fun booleanValue(value: Any?, defaultValue: Boolean = false): Boolean {
        return when (value) {
            is Boolean -> value
            is Number -> value.toInt() != 0
            is String -> {
                when (value.trim().lowercase(Locale.ROOT)) {
                    "true", "1", "yes" -> true
                    "false", "0", "no" -> false
                    else -> defaultValue
                }
            }
            else -> defaultValue
        }
    }

    private fun intValue(value: Any?): Int? {
        return when (value) {
            is Int -> value
            is Number -> value.toInt()
            is String -> value.trim().toIntOrNull()
            else -> null
        }
    }

    private fun longValue(value: Any?): Long? {
        return when (value) {
            is Long -> value
            is Number -> value.toLong()
            is String -> value.trim().toLongOrNull()
            else -> null
        }
    }

    private fun floatValue(value: Any?): Float? {
        return when (value) {
            is Float -> value
            is Number -> value.toFloat()
            is String -> value.trim().toFloatOrNull()
            else -> null
        }
    }

    private fun entries(value: Any?): Set<Map.Entry<*, *>>? {
        return when (value) {
            is Map<*, *> -> value.entries
            else -> null
        }
    }

    private fun stringMap(value: Any?): Map<String, String>? {
        val source = entries(value) ?: return null
        val result = LinkedHashMap<String, String>()
        for (entry in source) {
            val key = stringValue(entry.key) ?: continue
            val item = stringValue(entry.value) ?: continue
            result[key] = item
        }
        return result
    }

    private fun objectMap(value: Any?): HashMap<String, Any>? {
        val source = entries(value) ?: return null
        val result = HashMap<String, Any>()
        for (entry in source) {
            val key = stringValue(entry.key) ?: continue
            val item = entry.value ?: continue
            result[key] = item
        }
        return result
    }

    private fun nestedObjectMap(value: Any?): HashMap<String, HashMap<String, Any>>? {
        val source = entries(value) ?: return null
        val result = HashMap<String, HashMap<String, Any>>()
        for (entry in source) {
            val key = stringValue(entry.key) ?: continue
            val item = objectMap(entry.value) ?: continue
            result[key] = item
        }
        return result
    }

    private fun jsonString(value: Any?): String {
        return when (value) {
            null -> ""
            is String -> value
            else -> JSON.toJSONString(value) ?: ""
        }
    }

    private fun stringList(value: Any?): List<String>? {
        return when (value) {
            is String -> listOf(value)
            is JSONArray -> {
                val result = ArrayList<String>()
                for (index in 0 until value.size) {
                    val item = stringValue(value[index])
                    if (item != null) {
                        result.add(item)
                    }
                }
                result
            }
            is Collection<*> -> value.mapNotNull { stringValue(it) }
            is Array<*> -> value.mapNotNull { stringValue(it) }
            else -> null
        }
    }

    private fun discardOldest(value: Any?): Boolean {
        return when (value) {
            is Number -> value.toInt() == 1
            is String -> value.trim().lowercase(Locale.ROOT) == "discardoldest"
            else -> false
        }
    }

    private fun dbDiscard(value: Any?): DBCacheDiscard {
        return if (discardOldest(value)) DBCacheDiscard.DISCARD_OLDEST else DBCacheDiscard.DISCARD
    }

    private fun rumDiscard(value: Any?): RUMCacheDiscard {
        return if (discardOldest(value)) RUMCacheDiscard.DISCARD_OLDEST else RUMCacheDiscard.DISCARD
    }

    private fun logDiscard(value: Any?): LogCacheDiscard {
        return if (discardOldest(value)) LogCacheDiscard.DISCARD_OLDEST else LogCacheDiscard.DISCARD
    }

    private fun errorMonitorType(value: Any?): Int? {
        intValue(value)?.let {
            return it
        }
        val items = stringList(value) ?: return null
        var result = ErrorMonitorType.NO_SET
        for (item in items.map { it.lowercase(Locale.ROOT) }) {
            when (item) {
                "all" -> return ErrorMonitorType.ALL.getValue()
                "battery" -> result = result or ErrorMonitorType.BATTERY.getValue()
                "memory" -> result = result or ErrorMonitorType.MEMORY.getValue()
                "cpu" -> result = result or ErrorMonitorType.CPU.getValue()
            }
        }
        return result
    }

    private fun deviceMonitorType(value: Any?): Int? {
        intValue(value)?.let {
            return it
        }
        val items = stringList(value) ?: return null
        var result = DeviceMetricsMonitorType.NO_SET
        for (item in items.map { it.lowercase(Locale.ROOT) }) {
            when (item) {
                "all" -> return DeviceMetricsMonitorType.ALL.getValue()
                "battery" -> result = result or DeviceMetricsMonitorType.BATTERY.getValue()
                "memory" -> result = result or DeviceMetricsMonitorType.MEMORY.getValue()
                "cpu" -> result = result or DeviceMetricsMonitorType.CPU.getValue()
                "fps" -> result = result or DeviceMetricsMonitorType.FPS.getValue()
            }
        }
        return result
    }

    private fun detectFrequency(value: Any?): DetectFrequency? {
        intValue(value)?.let {
            return when (it) {
                1 -> DetectFrequency.FREQUENT
                2 -> DetectFrequency.RARE
                else -> DetectFrequency.DEFAULT
            }
        }
        return when (stringValue(value)?.trim()?.lowercase(Locale.ROOT)) {
            "frequent" -> DetectFrequency.FREQUENT
            "rare" -> DetectFrequency.RARE
            "normal" -> DetectFrequency.DEFAULT
            "default" -> DetectFrequency.DEFAULT
            else -> null
        }
    }

    private fun logStatus(value: Any?): Status? {
        intValue(value)?.let {
            val index = if (it > Status.INFO.ordinal) it + 1 else it
            return Status.values().getOrNull(index)
        }
        return when (stringValue(value)?.trim()?.lowercase(Locale.ROOT)) {
            "info" -> Status.INFO
            "debug" -> Status.DEBUG
            "warning", "warn" -> Status.WARNING
            "error" -> Status.ERROR
            "critical" -> Status.CRITICAL
            "ok" -> Status.OK
            else -> null
        }
    }

    private fun logLevelFilters(value: Any?): Array<Status>? {
        val items: List<Any?> = when (value) {
            is JSONArray -> {
                val result = ArrayList<Any?>()
                for (index in 0 until value.size) {
                    result.add(value[index])
                }
                result
            }
            is Collection<*> -> value.toList()
            is Array<*> -> value.toList()
            else -> return null
        }
        val result = items.mapNotNull { logStatus(it) }
        return if (result.isEmpty()) null else result.toTypedArray()
    }

    private fun traceType(value: Any?): TraceType? {
        intValue(value)?.let {
            return when (it) {
                0 -> TraceType.DDTRACE
                1 -> TraceType.ZIPKIN_MULTI_HEADER
                2 -> TraceType.ZIPKIN_SINGLE_HEADER
                3 -> TraceType.TRACEPARENT
                4 -> TraceType.SKYWALKING
                5 -> TraceType.JAEGER
                else -> TraceType.DDTRACE
            }
        }
        return when (stringValue(value)?.trim()?.lowercase(Locale.ROOT)) {
            "ddtrace" -> TraceType.DDTRACE
            "zipkinmultiheader", "zipkinmulti" -> TraceType.ZIPKIN_MULTI_HEADER
            "zipkinsingleheader", "zipkinsingle" -> TraceType.ZIPKIN_SINGLE_HEADER
            "traceparent" -> TraceType.TRACEPARENT
            "skywalking" -> TraceType.SKYWALKING
            "jaeger" -> TraceType.JAEGER
            else -> null
        }
    }

    private fun createMobileConfig(params: JSONObject): FTSDKConfig? {
        val datawayUrl = stringValue(params["datawayUrl"])
        val clientToken = stringValue(params["clientToken"])
        val datakitUrl = stringValue(firstValue(params, "datakitUrl", "serverUrl", "metricsUrl"))
        val config = if (!datawayUrl.isNullOrBlank() && !clientToken.isNullOrBlank()) {
            FTSDKConfig.builder(datawayUrl, clientToken)
        } else if (!datakitUrl.isNullOrBlank()) {
            FTSDKConfig.builder(datakitUrl)
        } else {
            return null
        }

        stringValue(params["env"])?.let { config.setEnv(it) }
        config.setDebug(booleanValue(firstValue(params, "debug", "enableSDKDebugLog")))
        stringValue(firstValue(params, "service", "serviceName"))?.let { config.setServiceName(it) }
        if (params.containsKey("autoSync")) {
            config.setAutoSync(booleanValue(params["autoSync"]))
        }
        intValue(params["syncPageSize"])?.let { config.setCustomSyncPageSize(it) }
        intValue(params["syncSleepTime"])?.let { config.setSyncSleepTime(it) }
        if (booleanValue(params["enableDataIntegerCompatible"])) {
            config.enableDataIntegerCompatible()
        }
        if (params.containsKey("compressIntakeRequests")) {
            config.setCompressIntakeRequests(booleanValue(params["compressIntakeRequests"]))
        }
        val dbCacheLimit = longValue(params["dbCacheLimit"])
        if (dbCacheLimit != null) {
            config.enableLimitWithDbSize(dbCacheLimit)
        } else if (booleanValue(params["enableLimitWithDbSize"])) {
            config.enableLimitWithDbSize()
        }
        if (params.containsKey("dbDiscardStrategy")) {
            config.setDbCacheDiscard(dbDiscard(params["dbDiscardStrategy"]))
        }
        stringMap(params["globalContext"])?.forEach { (key, value) ->
            config.addGlobalContext(key, value)
        }
        objectMap(params["dataModifier"])?.let { dataModifier ->
            config.setDataModifier(object : DataModifier {
                override fun modify(key: String, value: Any?): Any? {
                    return dataModifier[key]
                }
            })
        }
        nestedObjectMap(params["lineDataModifier"])?.let { lineDataModifier ->
            config.setLineDataModifier(object : LineDataModifier {
                override fun modify(measurement: String, data: HashMap<String, Any>): MutableMap<String, Any>? {
                    return if (measurement == Constants.FT_LOG_DEFAULT_MEASUREMENT) {
                        lineDataModifier["log"]
                    } else {
                        lineDataModifier[measurement]
                    }
                }
            })
        }
        return config
    }

    private fun createRumConfig(params: JSONObject): FTRUMConfig? {
        val appId = stringValue(firstValue(params, "androidAppId", "appId")) ?: return null
        val config = FTRUMConfig().setRumAppId(appId)

        floatValue(firstValue(params, "samplerate", "sampleRate"))?.let { config.setSamplingRate(it) }
        floatValue(params["sessionOnErrorSampleRate"])?.let { config.setSessionErrorSampleRate(it) }
        if (params.containsKey("enableTraceUserAction") || params.containsKey("enableNativeUserAction")) {
            config.setEnableTraceUserAction(booleanValue(firstValue(params, "enableTraceUserAction", "enableNativeUserAction")))
        }
        if (params.containsKey("enableTraceUserView") || params.containsKey("enableNativeUserView")) {
            config.setEnableTraceUserView(booleanValue(firstValue(params, "enableTraceUserView", "enableNativeUserView")))
        }
        if (params.containsKey("enableNativeUserResource") || params.containsKey("enableTraceUserResource")) {
            config.setEnableTraceUserResource(booleanValue(firstValue(params, "enableNativeUserResource", "enableTraceUserResource")))
        }
        if (params.containsKey("enableResourceHostIP")) {
            config.setEnableResourceHostIP(booleanValue(params["enableResourceHostIP"]))
        }
        if (params.containsKey("enableTrackNativeCrash") || params.containsKey("enableTrackAppCrash")) {
            config.setEnableTrackAppCrash(booleanValue(firstValue(params, "enableTrackNativeCrash", "enableTrackAppCrash")))
        }
        if (params.containsKey("enableTrackNativeAppANR") || params.containsKey("enableTrackAppANR")) {
            config.setEnableTrackAppANR(booleanValue(firstValue(params, "enableTrackNativeAppANR", "enableTrackAppANR")))
        }
        if (params.containsKey("enableTrackNativeFreeze") || params.containsKey("enableTrackAppFreeze")) {
            val enabled = booleanValue(firstValue(params, "enableTrackNativeFreeze", "enableTrackAppFreeze"))
            val duration = longValue(firstValue(params, "nativeFreezeDurationMs", "freezeDurationMs"))
            if (duration != null) {
                config.setEnableTrackAppUIBlock(enabled, duration)
            } else {
                config.setEnableTrackAppUIBlock(enabled)
            }
        }
        errorMonitorType(params["errorMonitorType"])?.let { config.setExtraMonitorTypeWithError(it) }
        deviceMonitorType(params["deviceMonitorType"])?.let { monitorType ->
            val frequency = detectFrequency(firstValue(params, "monitorFrequency", "detectFrequency"))
            if (frequency != null) {
                config.setDeviceMetricsMonitorType(monitorType, frequency)
            } else {
                config.setDeviceMetricsMonitorType(monitorType)
            }
        }
        stringMap(params["globalContext"])?.forEach { (key, value) ->
            config.addGlobalContext(key, value)
        }
        intValue(params["rumCacheLimitCount"])?.let { config.setRumCacheLimitCount(it) }
        if (params.containsKey("rumDiscardStrategy")) {
            config.setRumCacheDiscardStrategy(rumDiscard(params["rumDiscardStrategy"]))
        }
        if (params.containsKey("enableTraceWebView")) {
            config.setEnableTraceWebView(booleanValue(params["enableTraceWebView"]))
        }
        stringList(params["allowWebViewHost"])?.let {
            config.setAllowWebViewHost(it.toTypedArray())
        }
        return config
    }

    private fun createLoggerConfig(params: JSONObject): FTLoggerConfig {
        val config = FTLoggerConfig()

        floatValue(firstValue(params, "samplerate", "sampleRate"))?.let { config.setSamplingRate(it) }
        if (params.containsKey("enableLinkRumData") || params.containsKey("enableLinkRUMData")) {
            config.setEnableLinkRumData(booleanValue(firstValue(params, "enableLinkRumData", "enableLinkRUMData")))
        }
        if (params.containsKey("enableCustomLog")) {
            config.setEnableCustomLog(booleanValue(params["enableCustomLog"]))
        }
        if (params.containsKey("printCustomLogToConsole")) {
            config.setPrintCustomLogToConsole(booleanValue(params["printCustomLogToConsole"]))
        }
        intValue(params["logCacheLimitCount"])?.let { config.setLogCacheLimitCount(it) }
        if (params.containsKey("discardStrategy")) {
            config.setLogCacheDiscardStrategy(logDiscard(params["discardStrategy"]))
        }
        logLevelFilters(params["logLevelFilters"])?.let { config.setLogLevelFilters(it) }
        stringMap(params["globalContext"])?.forEach { (key, value) ->
            config.addGlobalContext(key, value)
        }
        return config
    }

    private fun createTraceConfig(params: JSONObject): FTTraceConfig {
        val config = FTTraceConfig()

        floatValue(firstValue(params, "samplerate", "sampleRate"))?.let { config.setSamplingRate(it) }
        traceType(params["traceType"])?.let { config.setTraceType(it) }
        if (params.containsKey("enableLinkRUMData") || params.containsKey("enableLinkRumData")) {
            config.setEnableLinkRUMData(booleanValue(firstValue(params, "enableLinkRUMData", "enableLinkRumData")))
        }
        if (params.containsKey("enableAutoTrace") || params.containsKey("enableNativeAutoTrace")) {
            config.setEnableAutoTrace(booleanValue(firstValue(params, "enableAutoTrace", "enableNativeAutoTrace")))
        }
        return config
    }

    private fun appState(value: Any?): AppState {
        return stringValue(value)?.let { AppState.getValueFrom(it) } ?: AppState.UNKNOWN
    }

    private fun resourceContent(value: Any?): ResourceParams? {
        val content = value as? JSONObject ?: return null
        val params = ResourceParams()
        params.url = stringValue(content["url"]) ?: ""
        params.resourceMethod = stringValue(content["httpMethod"]) ?: "GET"
        params.requestHeader = jsonString(content["requestHeader"])
        params.responseHeader = jsonString(content["responseHeader"])
        params.responseBody = stringValue(content["responseBody"]) ?: ""
        params.resourceStatus = intValue(content["resourceStatus"]) ?: 0
        params.requestErrorMsg = stringValue(content["errorMessage"]) ?: ""
        params.requestErrorStack = stringValue(content["errorStack"]) ?: ""
        return params
    }

    private fun netStatus(value: Any?): NetStatusBean {
        val content = value as? JSONObject
        val bean = NetStatusBean()
        if (content != null) {
            longValue(content["fetchStartTime"])?.let { bean.fetchStartTime = it }
            longValue(content["requestStartTime"])?.let { bean.requestStartTime = it }
            longValue(content["responseStartTime"])?.let { bean.responseStartTime = it }
            longValue(content["responseEndTime"])?.let { bean.responseEndTime = it }
            longValue(content["callStartTime"])?.let { bean.callStartTime = it }
            longValue(content["headerStartTime"])?.let { bean.headerStartTime = it }
            longValue(content["headerEndTime"])?.let { bean.headerEndTime = it }
            longValue(content["tcpStartTime"])?.let { bean.tcpStartTime = it }
            longValue(content["tcpEndTime"])?.let { bean.tcpEndTime = it }
            longValue(content["dnsStartTime"])?.let { bean.dnsStartTime = it }
            longValue(content["dnsEndTime"])?.let { bean.dnsEndTime = it }
            longValue(content["bodyStartTime"])?.let { bean.bodyStartTime = it }
            longValue(content["bodyEndTime"])?.let { bean.bodyEndTime = it }
            longValue(content["sslStartTime"])?.let { bean.sslStartTime = it }
            longValue(content["sslEndTime"])?.let { bean.sslEndTime = it }
            stringValue(content["resourceHostIP"])?.let { bean.resourceHostIP = it }
            stringValue(content["requestHost"])?.let { bean.requestHost = it }
        }
        return bean
    }

    @JvmStatic
    fun sdkConfig(json: String?): Boolean {
        val params = parseObject(json)
        val config = createMobileConfig(params)
        if (config == null) {
            return false
        }
        FTSdk.install(config)
        if (!booleanValue(firstValue(params, "offlinePackage", "offlinePakcage"))) {
            FTUniAppStartManager.start()
        }
        return true
    }

    @JvmStatic
    fun bindRUMUserData(json: String?) {
        val params = parseObject(json)
        val userId = stringValue(params["userId"]) ?: return
        val userData = UserData()
        userData.setId(userId)
        stringValue(params["userName"])?.let { userData.setName(it) }
        stringValue(params["userEmail"])?.let { userData.setEmail(it) }
        stringMap(params["extra"])?.let { userData.setExts(HashMap(it)) }
        FTSdk.bindRumUserData(userData)
    }

    @JvmStatic
    fun unbindRUMUserData() {
        FTSdk.unbindRumUserData()
    }

    @JvmStatic
    fun appendGlobalContext(json: String?) {
        objectMap(parseObject(json))?.let { FTSdk.appendGlobalContext(it) }
    }

    @JvmStatic
    fun appendRUMGlobalContext(json: String?) {
        objectMap(parseObject(json))?.let { FTSdk.appendRUMGlobalContext(it) }
    }

    @JvmStatic
    fun appendLogGlobalContext(json: String?) {
        objectMap(parseObject(json))?.let { FTSdk.appendLogGlobalContext(it) }
    }

    @JvmStatic
    fun flushSyncData() {
        FTSdk.flushSyncData()
    }

    @JvmStatic
    fun clearAllData() {
        FTSdk.clearAllData()
    }

    @JvmStatic
    fun shutDown() {
        FTSdk.shutDown()
    }

    @JvmStatic
    fun manuallySetApplicationStart() {
        FTUniAppStartManager.start()
    }

    @JvmStatic
    fun setRumConfig(json: String?): Boolean {
        val params = parseObject(json)
        val config = createRumConfig(params)
        if (config == null) {
            return false
        }
        FTSdk.initRUMWithConfig(config)
        FTUniAppStartManager.uploadColdBootTimeWhenManualStart()
        return true
    }

    @JvmStatic
    fun startAction(json: String?) {
        val params = parseObject(json)
        val actionName = stringValue(params["actionName"]) ?: return
        val actionType = stringValue(params["actionType"]) ?: "click"
        FTRUMGlobalManager.get().startAction(actionName, actionType, objectMap(params["property"]) ?: HashMap())
    }

    @JvmStatic
    fun addAction(json: String?) {
        val params = parseObject(json)
        val actionName = stringValue(params["actionName"]) ?: return
        val actionType = stringValue(params["actionType"]) ?: "click"
        FTRUMGlobalManager.get().addAction(actionName, actionType, objectMap(params["property"]) ?: HashMap())
    }

    @JvmStatic
    fun onCreateView(json: String?) {
        val params = parseObject(json)
        val viewName = stringValue(params["viewName"]) ?: return
        val loadTime = longValue(params["loadTime"]) ?: return
        FTRUMGlobalManager.get().onCreateView(viewName, loadTime)
    }

    @JvmStatic
    fun startView(json: String?) {
        val params = parseObject(json)
        val viewName = stringValue(params["viewName"]) ?: return
        FTRUMGlobalManager.get().startView(viewName, objectMap(params["property"]) ?: HashMap())
    }

    @JvmStatic
    fun stopView(json: String?) {
        val params = parseObject(json)
        val property = params["property"]
        if (property == null) {
            FTRUMGlobalManager.get().stopView()
        } else {
            FTRUMGlobalManager.get().stopView(objectMap(property) ?: HashMap())
        }
    }

    @JvmStatic
    fun addError(json: String?) {
        val params = parseObject(json)
        val message = stringValue(params["message"]) ?: ""
        val stack = stringValue(params["stack"]) ?: ""
        val type = stringValue(firstValue(params, "type", "errorType")) ?: DEFAULT_ERROR_TYPE
        FTRUMGlobalManager.get().addError(stack, message, type, appState(params["state"]), objectMap(params["property"]) ?: HashMap())
    }

    @JvmStatic
    fun startResource(json: String?) {
        val params = parseObject(json)
        val key = stringValue(params["key"]) ?: return
        FTRUMGlobalManager.get().startResource(key, objectMap(params["property"]) ?: HashMap())
    }

    @JvmStatic
    fun stopResource(json: String?) {
        val params = parseObject(json)
        val key = stringValue(params["key"]) ?: return
        val property = params["property"]
        if (property == null) {
            FTRUMGlobalManager.get().stopResource(key)
        } else {
            FTRUMGlobalManager.get().stopResource(key, objectMap(property) ?: HashMap())
        }
    }

    @JvmStatic
    fun addResource(json: String?) {
        val params = parseObject(json)
        val key = stringValue(params["key"]) ?: return
        val content = resourceContent(params["content"]) ?: return
        content.property = objectMap(params["property"]) ?: HashMap()
        val status = netStatus(params["content"])
        status.property = objectMap(params["property"]) ?: HashMap()
        FTRUMGlobalManager.get().addResource(key, content, status)
    }

    @JvmStatic
    fun setLoggerConfig(json: String?) {
        FTSdk.initLogWithConfig(createLoggerConfig(parseObject(json)))
    }

    @JvmStatic
    fun logging(json: String?) {
        val params = parseObject(json)
        val content = stringValue(params["content"]) ?: return
        val status = logStatus(params["status"])
        val property = objectMap(params["property"]) ?: HashMap()
        if (status != null) {
            FTLogger.getInstance().logBackground(content, status, property)
        } else {
            FTLogger.getInstance().logBackground(content, stringValue(params["status"]) ?: "info", property)
        }
    }

    @JvmStatic
    fun setTraceConfig(json: String?) {
        FTSdk.initTraceWithConfig(createTraceConfig(parseObject(json)))
    }

    @JvmStatic
    fun getTraceHeader(json: String?): String? {
        val params = parseNullableObject(json) ?: return null
        val url = stringValue(params["url"]) ?: return null
        val key = stringValue(params["key"])
        val result = if (key == null) {
            FTTraceManager.get().getTraceHeader(url)
        } else {
            FTTraceManager.get().getTraceHeader(key, url)
        }
        return JSON.toJSONString(result)
    }
}
