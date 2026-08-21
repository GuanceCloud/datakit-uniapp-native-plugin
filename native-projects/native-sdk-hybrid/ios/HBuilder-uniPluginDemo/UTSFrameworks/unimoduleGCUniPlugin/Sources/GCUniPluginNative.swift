import Foundation
#if canImport(DCloudUTSFoundation)
import DCloudUTSFoundation
#endif
import GuanceSDK

@objc public class GCUniPluginNative: NSObject {
    private static func logInfo(_ message: String) {
#if canImport(DCloudUTSFoundation)
        console.log(message)
#else
        print(message)
#endif
    }

    private static func logError(_ message: String) {
#if canImport(DCloudUTSFoundation)
        console.error(message)
#else
        print(message)
#endif
    }

    private static func runOnMainSync(_ block: () -> Void) {
        if Thread.isMainThread {
            block()
        } else {
            DispatchQueue.main.sync(execute: block)
        }
    }

    private static func parseObject(_ json: String?) -> [String: Any] {
        guard let json = json, let data = json.data(using: .utf8) else {
            return [:]
        }
        guard let result = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return [:]
        }
        return result
    }

    private static func parseNullableObject(_ json: String?) -> [String: Any]? {
        guard let json = json, let data = json.data(using: .utf8) else {
            return nil
        }
        return try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    }

    private static func stringify(_ value: Any?) -> String? {
        guard let value = value else {
            return nil
        }
        guard JSONSerialization.isValidJSONObject(value) else {
            return nil
        }
        guard let data = try? JSONSerialization.data(withJSONObject: value) else {
            return nil
        }
        return String(data: data, encoding: .utf8)
    }

    private static func boolValue(_ value: Any?, default defaultValue: Bool = false) -> Bool {
        switch value {
        case let bool as Bool:
            return bool
        case let number as NSNumber:
            return number.boolValue
        case let string as String:
            let normalized = string.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
            if normalized == "true" || normalized == "1" || normalized == "yes" {
                return true
            }
            if normalized == "false" || normalized == "0" || normalized == "no" {
                return false
            }
            return defaultValue
        default:
            return defaultValue
        }
    }

    private static func intValue(_ value: Any?) -> Int? {
        switch value {
        case let int as Int:
            return int
        case let number as NSNumber:
            return number.intValue
        case let string as String:
            return Int(string)
        default:
            return nil
        }
    }

    private static func longLongValue(_ value: Any?) -> Int64? {
        switch value {
        case let int as Int64:
            return int
        case let int as Int:
            return Int64(int)
        case let number as NSNumber:
            return number.int64Value
        case let string as String:
            return Int64(string)
        default:
            return nil
        }
    }

    private static func stringValue(_ value: Any?) -> String? {
        switch value {
        case let string as String:
            return string
        case let number as NSNumber:
            return number.stringValue
        default:
            return nil
        }
    }

    private static func firstValue(_ params: [String: Any], _ keys: String...) -> Any? {
        for key in keys {
            if let value = params[key], !(value is NSNull) {
                return value
            }
        }
        return nil
    }

    private static func dictionaryValue(_ value: Any?) -> [String: Any]? {
        return value as? [String: Any]
    }

    private static func stringDictionary(_ value: Any?) -> [String: String]? {
        guard let dict = value as? [String: Any] else {
            return nil
        }
        var result: [String: String] = [:]
        for (key, item) in dict {
            if let string = stringValue(item) {
                result[key] = string
            }
        }
        return result
    }

    private static func stringArray(_ value: Any?) -> [String]? {
        if let array = value as? [String] {
            return array
        }
        if let array = value as? [Any] {
            return array.compactMap { stringValue($0) }
        }
        return nil
    }

    private static func stringArrayDictionary(_ value: Any?) -> [String: [String]]? {
        guard let dictionary = value as? [String: Any] else {
            return nil
        }
        var result: [String: [String]] = [:]
        for (key, item) in dictionary {
            guard let values = stringArray(item) else {
                continue
            }
            result[key] = values
        }
        return result
    }

    private static func dbDiscardType(_ value: Any?) -> FTDBCacheDiscard {
        let rawValue = stringValue(value)?.lowercased() == "discardoldest" ? 1 : 0
        return FTDBCacheDiscard(rawValue: rawValue) ?? FTDBCacheDiscard(rawValue: 0)!
    }

    private static func rumDiscardType(_ value: Any?) -> FTRUMCacheDiscard {
        let rawValue = stringValue(value)?.lowercased() == "discardoldest" ? 1 : 0
        return FTRUMCacheDiscard(rawValue: rawValue) ?? FTRUMCacheDiscard(rawValue: 0)!
    }

    private static func logDiscardType(_ value: Any?) -> FTLogCacheDiscard {
        let rawValue = stringValue(value)?.lowercased() == "discardoldest" ? 1 : 0
        return FTLogCacheDiscard(rawValue: rawValue) ?? FTLogCacheDiscard(rawValue: 0)!
    }

    private static func registerSDKInternalLogCache() {
        FTLog.sharedInstance().registerInnerLogCache(toLogsDirectory: nil, fileNamePrefix: nil)
    }

    private static func createMobileConfig(_ params: [String: Any]) -> FTSDKConfig {
        registerSDKInternalLogCache()
        let config: FTSDKConfig
        if let datawayUrl = stringValue(params["datawayUrl"]),
           let clientToken = stringValue(params["clientToken"]) {
            config = FTSDKConfig(datawayUrl: datawayUrl, clientToken: clientToken)
        } else if let datakitUrl = stringValue(firstValue(params, "datakitUrl", "serverUrl")) {
            config = FTSDKConfig(datakitUrl: datakitUrl)
        } else if let metricsUrl = stringValue(params["metricsUrl"]) {
            config = FTSDKConfig(metricsUrl: metricsUrl)
        } else {
            config = FTSDKConfig()
        }
        config.env = stringValue(params["env"]) ?? config.env
        config.enableSDKDebugLog = boolValue(params["debug"], default: boolValue(params["enableSDKDebugLog"]))
        if let service = stringValue(firstValue(params, "service", "serviceName")) {
            config.service = service
        }
        if let autoSync = params["autoSync"] {
            config.autoSync = boolValue(autoSync, default: config.autoSync)
        }
        if let syncPageSize = intValue(params["syncPageSize"]) {
            config.syncPageSize = Int32(syncPageSize)
        }
        if let syncSleepTime = intValue(params["syncSleepTime"]) {
            config.syncSleepTime = Int32(syncSleepTime)
        }
        if let enableDataIntegerCompatible = params["enableDataIntegerCompatible"] {
            config.enableDataIntegerCompatible = boolValue(enableDataIntegerCompatible, default: config.enableDataIntegerCompatible)
        }
        if let compressIntakeRequests = params["compressIntakeRequests"] {
            config.compressIntakeRequests = boolValue(compressIntakeRequests, default: config.compressIntakeRequests)
        }
        if let enableLimitWithDbSize = params["enableLimitWithDbSize"] {
            config.enableLimitWithDbSize = boolValue(enableLimitWithDbSize, default: config.enableLimitWithDbSize)
        }
        if let dbCacheLimit = longLongValue(params["dbCacheLimit"]) {
            config.dbCacheLimit = Int(dbCacheLimit)
        }
        if params["dbDiscardStrategy"] != nil {
            config.dbDiscardType = dbDiscardType(params["dbDiscardStrategy"])
        }
        if let globalContext = stringDictionary(params["globalContext"]) {
            config.globalContext = globalContext
        }
        if let remoteConfiguration = params["remoteConfiguration"] {
            config.remoteConfiguration = boolValue(remoteConfiguration, default: config.remoteConfiguration)
        }
        if let interval = intValue(params["remoteConfigMiniUpdateInterval"]) {
            config.remoteConfigMiniUpdateInterval = Int32(max(0, interval))
        }
        if let enableDataFilter = params["enableDataFilter"] {
            config.enableDataFilter = boolValue(enableDataFilter, default: config.enableDataFilter)
        }
        if let dataFilters = stringArrayDictionary(params["dataFilters"]) {
            config.dataFilters = dataFilters
        }
        return config
    }

    private static func errorMonitorType(_ value: Any?) -> FTErrorMonitorType {
        guard let items = stringArray(value) else {
            return FTErrorMonitorType(rawValue: 0)
        }
        var rawValue: UInt = 0
        for item in items.map({ $0.lowercased() }) {
            switch item {
            case "all":
                return FTErrorMonitorType(rawValue: UInt.max)
            case "battery":
                rawValue |= 1 << 1
            case "memory":
                rawValue |= 1 << 2
            case "cpu":
                rawValue |= 1 << 3
            default:
                break
            }
        }
        return FTErrorMonitorType(rawValue: rawValue)
    }

    private static func deviceMonitorType(_ value: Any?) -> FTDeviceMetricsMonitorType {
        if let string = stringValue(value)?.lowercased() {
            switch string {
            case "all":
                return FTDeviceMetricsMonitorType(rawValue: UInt.max)
            case "memory":
                return FTDeviceMetricsMonitorType(rawValue: 1 << 2)
            case "cpu":
                return FTDeviceMetricsMonitorType(rawValue: 1 << 3)
            case "fps":
                return FTDeviceMetricsMonitorType(rawValue: 1 << 4)
            default:
                break
            }
        }
        guard let items = stringArray(value) else {
            return FTDeviceMetricsMonitorType(rawValue: 0)
        }
        var rawValue: UInt = 0
        for item in items.map({ $0.lowercased() }) {
            switch item {
            case "all":
                return FTDeviceMetricsMonitorType(rawValue: UInt.max)
            case "memory":
                rawValue |= 1 << 2
            case "cpu":
                rawValue |= 1 << 3
            case "fps":
                rawValue |= 1 << 4
            default:
                break
            }
        }
        return FTDeviceMetricsMonitorType(rawValue: rawValue)
    }

    private static func monitorFrequency(_ value: Any?) -> FTMonitorFrequency {
        switch stringValue(value)?.lowercased() {
        case "frequent":
            return FTMonitorFrequency(rawValue: 1) ?? FTMonitorFrequency(rawValue: 0)!
        case "rare":
            return FTMonitorFrequency(rawValue: 2) ?? FTMonitorFrequency(rawValue: 0)!
        default:
            return FTMonitorFrequency(rawValue: 0) ?? FTMonitorFrequency(rawValue: 0)!
        }
    }

    private static func createRumConfig(_ params: [String: Any]) -> FTRumConfig? {
        guard let appId = stringValue(params["iOSAppId"] ?? params["appId"]) else {
            return nil
        }
        let config = FTRumConfig(appid: appId)
        if let sampleRate = intValue(firstValue(params, "sampleRate", "samplerate")) {
            config.sampleRate = Int32(sampleRate)
        }
        if let sessionOnErrorSampleRate = intValue(params["sessionOnErrorSampleRate"]) {
            config.sessionOnErrorSampleRate = Int32(sessionOnErrorSampleRate)
        }
        if let globalContext = stringDictionary(params["globalContext"]) {
            config.globalContext = globalContext
        }
        if let rumCacheLimitCount = intValue(params["rumCacheLimitCount"]) {
            config.rumCacheLimitCount = Int32(rumCacheLimitCount)
        }
        if params["rumDiscardStrategy"] != nil {
            config.rumDiscardType = rumDiscardType(params["rumDiscardStrategy"])
        }
        if let enableTraceUserAction = firstValue(params, "enableTraceUserAction", "enableNativeUserAction") {
            config.enableTraceUserAction = boolValue(enableTraceUserAction, default: config.enableTraceUserAction)
        }
        if let enableTraceUserView = firstValue(params, "enableTraceUserView", "enableNativeUserView") {
            config.enableTraceUserView = boolValue(enableTraceUserView, default: config.enableTraceUserView)
        }
        config.enableTraceUserResource = boolValue(params["enableNativeUserResource"], default: boolValue(params["enableTraceUserResource"], default: config.enableTraceUserResource))
        if let enableResourceHostIP = params["enableResourceHostIP"] {
            config.enableResourceHostIP = boolValue(enableResourceHostIP, default: config.enableResourceHostIP)
        }
        config.enableTrackAppCrash = boolValue(params["enableTrackNativeCrash"], default: boolValue(params["enableTrackAppCrash"], default: config.enableTrackAppCrash))
        config.enableTrackAppANR = boolValue(params["enableTrackNativeAppANR"], default: boolValue(params["enableTrackAppANR"], default: config.enableTrackAppANR))
        let freezeEnabled = boolValue(params["enableTrackNativeFreeze"], default: boolValue(params["enableTrackAppFreeze"], default: config.enableTrackAppFreeze))
        let freezeDuration = longLongValue(params["nativeFreezeDurationMs"] ?? params["freezeDurationMs"]) ?? Int64(config.freezeDurationMs)
        config.setEnableTrackAppFreeze(freezeEnabled, freezeDurationMs: Int(freezeDuration))
        config.errorMonitorType = errorMonitorType(params["errorMonitorType"])
        config.deviceMetricsMonitorType = deviceMonitorType(params["deviceMonitorType"])
        config.monitorFrequency = monitorFrequency(firstValue(params, "monitorFrequency", "detectFrequency"))
        if let enableTraceWebView = params["enableTraceWebView"] {
            config.enableTraceWebView = boolValue(enableTraceWebView, default: config.enableTraceWebView)
        }
        if let allowWebViewHost = stringArray(params["allowWebViewHost"]) {
            config.allowWebViewHost = allowWebViewHost
        }
        return config
    }

    private static func loggerStatus(_ value: Any?) -> FTLogStatus {
        switch stringValue(value)?.lowercased() {
        case "warning":
            return FTLogStatus(rawValue: 1) ?? FTLogStatus(rawValue: 0)!
        case "error":
            return FTLogStatus(rawValue: 2) ?? FTLogStatus(rawValue: 0)!
        case "critical":
            return FTLogStatus(rawValue: 3) ?? FTLogStatus(rawValue: 0)!
        case "ok":
            return FTLogStatus(rawValue: 4) ?? FTLogStatus(rawValue: 0)!
        default:
            return FTLogStatus(rawValue: 0) ?? FTLogStatus(rawValue: 0)!
        }
    }

    private static func logLevelFilters(_ value: Any?) -> [Any]? {
        guard let items = value as? [Any] else {
            return nil
        }
        return items.compactMap { item in
            if let string = stringValue(item) {
                switch string.lowercased() {
                case "info":
                    return NSNumber(value: 0)
                case "warning":
                    return NSNumber(value: 1)
                case "error":
                    return NSNumber(value: 2)
                case "critical":
                    return NSNumber(value: 3)
                case "ok":
                    return NSNumber(value: 4)
                default:
                    return string
                }
            }
            return item
        }
    }

    private static func createLoggerConfig(_ params: [String: Any]) -> FTLoggerConfig {
        let config = FTLoggerConfig()
        if let sampleRate = intValue(firstValue(params, "sampleRate", "samplerate")) {
            config.sampleRate = Int32(sampleRate)
        }
        config.enableLinkRumData = boolValue(params["enableLinkRumData"], default: boolValue(params["enableLinkRUMData"], default: config.enableLinkRumData))
        if let enableCustomLog = params["enableCustomLog"] {
            config.enableCustomLog = boolValue(enableCustomLog, default: config.enableCustomLog)
        }
        if let printCustomLogToConsole = params["printCustomLogToConsole"] {
            config.printCustomLogToConsole = boolValue(printCustomLogToConsole, default: config.printCustomLogToConsole)
        }
        if let logCacheLimitCount = intValue(params["logCacheLimitCount"]) {
            config.logCacheLimitCount = Int32(logCacheLimitCount)
        }
        if params["discardStrategy"] != nil {
            config.discardType = logDiscardType(params["discardStrategy"])
        }
        if let logLevelFilter = logLevelFilters(params["logLevelFilters"]) {
            config.logLevelFilter = logLevelFilter
        }
        if let globalContext = stringDictionary(params["globalContext"]) {
            config.globalContext = globalContext
        }
        return config
    }

    private static func traceType(_ value: Any?) -> FTNetworkTraceType {
        switch stringValue(value)?.lowercased() {
        case "zipkinmultiheader", "zipkinmulti":
            return FTNetworkTraceType(rawValue: 1) ?? FTNetworkTraceType(rawValue: 0)!
        case "zipkinsingleheader", "zipkinsingle":
            return FTNetworkTraceType(rawValue: 2) ?? FTNetworkTraceType(rawValue: 0)!
        case "traceparent":
            return FTNetworkTraceType(rawValue: 3) ?? FTNetworkTraceType(rawValue: 0)!
        case "skywalking":
            return FTNetworkTraceType(rawValue: 4) ?? FTNetworkTraceType(rawValue: 0)!
        case "jaeger":
            return FTNetworkTraceType(rawValue: 5) ?? FTNetworkTraceType(rawValue: 0)!
        default:
            return FTNetworkTraceType(rawValue: 0) ?? FTNetworkTraceType(rawValue: 0)!
        }
    }

    private static func createTraceConfig(_ params: [String: Any]) -> FTTraceConfig {
        let config = FTTraceConfig()
        if let sampleRate = intValue(firstValue(params, "sampleRate", "samplerate")) {
            config.sampleRate = Int32(sampleRate)
        }
        config.networkTraceType = traceType(params["traceType"])
        config.enableLinkRumData = boolValue(params["enableLinkRUMData"], default: boolValue(params["enableLinkRumData"], default: config.enableLinkRumData))
        if let enableAutoTrace = firstValue(params, "enableAutoTrace", "enableNativeAutoTrace") {
            config.enableAutoTrace = boolValue(enableAutoTrace, default: config.enableAutoTrace)
        }
        return config
    }

    private static func appState(_ value: Any?) -> FTAppState {
        switch stringValue(value)?.lowercased() {
        case "startup":
            return FTAppState(rawValue: 1) ?? FTAppState(rawValue: 0)!
        case "run":
            return FTAppState(rawValue: 2) ?? FTAppState(rawValue: 0)!
        default:
            return FTAppState(rawValue: 0) ?? FTAppState(rawValue: 0)!
        }
    }

    private static func resourceContent(_ value: Any?) -> FTResourceContentModel? {
        guard let content = value as? [String: Any],
              let urlString = stringValue(content["url"]),
              let url = URL(string: urlString) else {
            return nil
        }
        let model = FTResourceContentModel()
        model.url = url
        model.requestHeader = dictionaryValue(content["requestHeader"]) ?? [:]
        model.responseHeader = dictionaryValue(content["responseHeader"]) ?? [:]
        model.httpMethod = stringValue(content["httpMethod"]) ?? "GET"
        model.httpStatusCode = intValue(content["resourceStatus"]) ?? 0
        model.errorMessage = stringValue(content["errorMessage"]) ?? ""
        model.responseBody = stringValue(content["responseBody"]) ?? ""
        return model
    }

    @discardableResult
    @objc public static func sdkConfig(_ json: String?) -> Bool {
        logInfo("[FTLog] GC-UniPlugin Mobile SDK initialization requested")
        let params = parseObject(json)
        let config = createMobileConfig(params)
        runOnMainSync {
            FTSDKAgent.start(withConfigOptions: config)
        }
        logInfo("[FTLog] GC-UniPlugin Mobile SDK initialized successfully")
        return true
    }

    @objc public static func setDatakitURL(_ json: String?) {
        let params = parseObject(json)
        guard let datakitUrl = stringValue(params["datakitUrl"]), !datakitUrl.isEmpty else {
            return
        }
        FTSDKAgent.setDatakitURL(datakitUrl)
    }

    @objc public static func setDatawayURL(_ json: String?) {
        let params = parseObject(json)
        guard let datawayUrl = stringValue(params["datawayUrl"]), !datawayUrl.isEmpty,
              let clientToken = stringValue(params["clientToken"]), !clientToken.isEmpty else {
            return
        }
        FTSDKAgent.setDatawayURL(datawayUrl, clientToken: clientToken)
    }

    @objc public static func updateRemoteConfigWithMiniUpdateInterval(
        _ json: String?,
        _ callback: @escaping (String?) -> Void
    ) {
        let params = parseObject(json)
        let interval = max(0, intValue(params["miniUpdateInterval"]) ?? 0)
        FTSDKAgent.updateRemoteConfig(withMiniUpdateInterval: interval) { success, error, _, content in
            var result: [String: Any] = [
                "success": success,
                "platform": "ios"
            ]
            if let content, let rawJson = stringify(content) {
                result["rawJson"] = rawJson
            }
            if let error {
                let nsError = error as NSError
                result["errorCode"] = nsError.code
                result["errorMessage"] = nsError.localizedDescription
            }
            let resultJson = stringify(result)
            DispatchQueue.main.async {
                callback(resultJson)
            }
            return nil
        }
    }

    @objc public static func bindRUMUser(_ userId: String,
                                         _ userName: String?,
                                         _ userEmail: String?,
                                         _ extraJson: String?) {
        FTSDKAgent.sharedInstance().bindUser(withUserID: userId,
                                                userName: userName,
                                                userEmail: userEmail,
                                                extra: parseNullableObject(extraJson))
    }

    @objc public static func unbindRUMUserData() {
        FTSDKAgent.sharedInstance().unbindUser()
    }

    @objc public static func appendGlobalContext(_ json: String?) {
        if let context = stringDictionary(parseObject(json)) {
            FTSDKAgent.appendGlobalContext(context)
        }
    }

    @objc public static func appendRUMGlobalContext(_ json: String?) {
        if let context = stringDictionary(parseObject(json)) {
            FTSDKAgent.appendRUMGlobalContext(context)
        }
    }

    @objc public static func appendLogGlobalContext(_ json: String?) {
        if let context = stringDictionary(parseObject(json)) {
            FTSDKAgent.appendLogGlobalContext(context)
        }
    }

    @objc public static func appendBridgeContext(_ json: String?) {
        _ = parseObject(json)
    }

    @objc public static func flushSyncData() {
        FTSDKAgent.sharedInstance().flushSyncData()
    }

    @objc public static func clearAllData() {
        FTSDKAgent.clearAllData()
    }

    @objc public static func shutDown() {
        FTSDKAgent.shutDown()
    }

    @discardableResult
    @objc public static func setRumConfig(_ json: String?) -> Bool {
        logInfo("[FTLog] GC-UniPlugin RUM initialization requested")
        let params = parseObject(json)
        guard let config = createRumConfig(params) else {
            logError("[FTLog] GC-UniPlugin RUM initialization failed: invalid configuration")
            return false
        }
        runOnMainSync {
            FTSDKAgent.sharedInstance().startRum(withConfigOptions: config)
        }
        logInfo("[FTLog] GC-UniPlugin RUM initialized successfully")
        return true
    }

    @objc public static func startAction(_ json: String?) {
        let params = parseObject(json)
        guard let actionName = stringValue(params["actionName"]) else {
            return
        }
        FTExternalDataManager.shared().startAction(actionName,
                                                   actionType: stringValue(params["actionType"]) ?? "click",
                                                   property: dictionaryValue(params["property"]))
    }

    @objc public static func addAction(_ json: String?) {
        let params = parseObject(json)
        guard let actionName = stringValue(params["actionName"]) else {
            return
        }
        FTExternalDataManager.shared().addAction(actionName,
                                                 actionType: stringValue(params["actionType"]) ?? "click",
                                                 property: dictionaryValue(params["property"]))
    }

    @objc public static func onCreateView(_ json: String?) {
        let params = parseObject(json)
        guard let viewName = stringValue(params["viewName"]),
              let loadTime = longLongValue(params["loadTime"]) else {
            return
        }
        FTExternalDataManager.shared().onCreateView(viewName, loadTime: NSNumber(value: loadTime))
    }

    @objc public static func startView(_ json: String?) {
        let params = parseObject(json)
        guard let viewName = stringValue(params["viewName"]) else {
            return
        }
        let property = dictionaryValue(params["property"])
        if property == nil {
            FTExternalDataManager.shared().startView(withName: viewName)
        } else {
            FTExternalDataManager.shared().startView(withName: viewName, property: property)
        }
    }

    @objc public static func stopView(_ json: String?) {
        let params = parseObject(json)
        if let property = dictionaryValue(params["property"]) {
            FTExternalDataManager.shared().stopView(withProperty: property)
        } else {
            FTExternalDataManager.shared().stopView()
        }
    }

    @objc public static func addError(_ json: String?) {
        let params = parseObject(json)
        let type = stringValue(firstValue(params, "type", "errorType")) ?? "error"
        let message = stringValue(params["message"]) ?? ""
        let stack = stringValue(params["stack"]) ?? ""
        let property = dictionaryValue(params["property"])
        if params["state"] != nil {
            FTExternalDataManager.shared().addError(withType: type,
                                                    state: appState(params["state"]),
                                                    message: message,
                                                    stack: stack,
                                                    property: property)
        } else if property != nil {
            FTExternalDataManager.shared().addError(withType: type,
                                                    message: message,
                                                    stack: stack,
                                                    property: property)
        } else {
            FTExternalDataManager.shared().addError(withType: type,
                                                    message: message,
                                                    stack: stack)
        }
    }

    @objc public static func startResource(_ json: String?) {
        let params = parseObject(json)
        guard let key = stringValue(params["key"]) else {
            return
        }
        if let property = dictionaryValue(params["property"]) {
            FTExternalDataManager.shared().startResource(withKey: key, property: property)
        } else {
            FTExternalDataManager.shared().startResource(withKey: key)
        }
    }

    @objc public static func stopResource(_ json: String?) {
        let params = parseObject(json)
        guard let key = stringValue(params["key"]) else {
            return
        }
        if let property = dictionaryValue(params["property"]) {
            FTExternalDataManager.shared().stopResource(withKey: key, property: property)
        } else {
            FTExternalDataManager.shared().stopResource(withKey: key)
        }
    }

    @objc public static func addResource(_ json: String?) {
        let params = parseObject(json)
        guard let key = stringValue(params["key"]),
              let content = resourceContent(params["content"]) else {
            return
        }
        FTExternalDataManager.shared().addResource(withKey: key, metrics: nil, content: content)
    }

    @objc public static func setLoggerConfig(_ json: String?) {
        let config = createLoggerConfig(parseObject(json))
        runOnMainSync {
            FTSDKAgent.sharedInstance().startLogger(withConfigOptions: config)
        }
    }

    @objc public static func logging(_ json: String?) {
        let params = parseObject(json)
        guard let content = stringValue(params["content"]) else {
            return
        }
        FTSDKAgent.sharedInstance().logging(content,
                                               status: loggerStatus(params["status"]),
                                               property: dictionaryValue(params["property"]))
    }

    @objc public static func setTraceConfig(_ json: String?) {
        let config = createTraceConfig(parseObject(json))
        runOnMainSync {
            FTSDKAgent.sharedInstance().startTrace(withConfigOptions: config)
        }
    }

    @objc public static func getTraceHeader(_ json: String?) -> String? {
        guard let params = parseNullableObject(json),
              let urlString = stringValue(params["url"]),
              let url = URL(string: urlString) else {
            return nil
        }
        let result: NSDictionary?
        if let key = stringValue(params["key"]) {
            result = FTExternalDataManager.shared().getTraceHeader(withKey: key, url: url) as NSDictionary?
        } else {
            result = FTExternalDataManager.shared().getTraceHeader(with: url) as NSDictionary?
        }
        return stringify(result)
    }
}
