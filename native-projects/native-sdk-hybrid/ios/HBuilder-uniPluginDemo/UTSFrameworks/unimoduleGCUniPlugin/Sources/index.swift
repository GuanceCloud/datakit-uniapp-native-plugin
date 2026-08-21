import DCloudUTSFoundation
@objc(UTSSDKModulesGCUniPluginGCMobileConfig)
@objcMembers
public class GCMobileConfig : NSObject, UTSObject {
    public var datakitUrl: String?
    public var datawayUrl: String?
    public var clientToken: String?
    public var env: String?
    public var debug: Bool = false
    public var service: String?
    public var autoSync: Bool = false
    public var syncPageSize: NSNumber?
    public var syncSleepTime: NSNumber?
    public var enableDataIntegerCompatible: Bool = false
    public var compressIntakeRequests: Bool = false
    public var enableLimitWithDbSize: Bool = false
    public var dbCacheLimit: NSNumber?
    public var dbDiscardStrategy: String?
    public var globalContext: Any?
    public var dataModifier: Any?
    public var lineDataModifier: Any?
    public var remoteConfiguration: Bool = false
    public var remoteConfigMiniUpdateInterval: NSNumber?
    public var enableDataFilter: Bool = false
    public var dataFilters: Any?
    public subscript(_ key: String) -> Any? {
        get {
            return utsSubscriptGetValue(key)
        }
        set {
            switch(key){
                case "datakitUrl":
                    self.datakitUrl = try! utsSubscriptCheckValueIfPresent(newValue)
                case "datawayUrl":
                    self.datawayUrl = try! utsSubscriptCheckValueIfPresent(newValue)
                case "clientToken":
                    self.clientToken = try! utsSubscriptCheckValueIfPresent(newValue)
                case "env":
                    self.env = try! utsSubscriptCheckValueIfPresent(newValue)
                case "debug":
                    self.debug = try! utsSubscriptCheckValue(newValue)
                case "service":
                    self.service = try! utsSubscriptCheckValueIfPresent(newValue)
                case "autoSync":
                    self.autoSync = try! utsSubscriptCheckValue(newValue)
                case "syncPageSize":
                    self.syncPageSize = try! utsSubscriptCheckValueIfPresent(newValue)
                case "syncSleepTime":
                    self.syncSleepTime = try! utsSubscriptCheckValueIfPresent(newValue)
                case "enableDataIntegerCompatible":
                    self.enableDataIntegerCompatible = try! utsSubscriptCheckValue(newValue)
                case "compressIntakeRequests":
                    self.compressIntakeRequests = try! utsSubscriptCheckValue(newValue)
                case "enableLimitWithDbSize":
                    self.enableLimitWithDbSize = try! utsSubscriptCheckValue(newValue)
                case "dbCacheLimit":
                    self.dbCacheLimit = try! utsSubscriptCheckValueIfPresent(newValue)
                case "dbDiscardStrategy":
                    self.dbDiscardStrategy = try! utsSubscriptCheckValueIfPresent(newValue)
                case "globalContext":
                    self.globalContext = try! utsSubscriptCheckValueIfPresent(newValue)
                case "dataModifier":
                    self.dataModifier = try! utsSubscriptCheckValueIfPresent(newValue)
                case "lineDataModifier":
                    self.lineDataModifier = try! utsSubscriptCheckValueIfPresent(newValue)
                case "remoteConfiguration":
                    self.remoteConfiguration = try! utsSubscriptCheckValue(newValue)
                case "remoteConfigMiniUpdateInterval":
                    self.remoteConfigMiniUpdateInterval = try! utsSubscriptCheckValueIfPresent(newValue)
                case "enableDataFilter":
                    self.enableDataFilter = try! utsSubscriptCheckValue(newValue)
                case "dataFilters":
                    self.dataFilters = try! utsSubscriptCheckValueIfPresent(newValue)
                default:
                    break
            }
        }
    }
    public override init() {
        super.init()
    }
    public init(_ obj: UTSJSONObject) {
        self.datakitUrl = obj["datakitUrl"] as! String?
        self.datawayUrl = obj["datawayUrl"] as! String?
        self.clientToken = obj["clientToken"] as! String?
        self.env = obj["env"] as! String?
        self.debug = (obj["debug"] as? Bool) ?? false
        self.service = obj["service"] as! String?
        self.autoSync = (obj["autoSync"] as? Bool) ?? false
        self.syncPageSize = obj["syncPageSize"] as! NSNumber?
        self.syncSleepTime = obj["syncSleepTime"] as! NSNumber?
        self.enableDataIntegerCompatible = (obj["enableDataIntegerCompatible"] as? Bool) ?? false
        self.compressIntakeRequests = (obj["compressIntakeRequests"] as? Bool) ?? false
        self.enableLimitWithDbSize = (obj["enableLimitWithDbSize"] as? Bool) ?? false
        self.dbCacheLimit = obj["dbCacheLimit"] as! NSNumber?
        self.dbDiscardStrategy = obj["dbDiscardStrategy"] as! String?
        self.globalContext = obj["globalContext"] as! Any?
        self.dataModifier = obj["dataModifier"] as! Any?
        self.lineDataModifier = obj["lineDataModifier"] as! Any?
        self.remoteConfiguration = (obj["remoteConfiguration"] as? Bool) ?? false
        self.remoteConfigMiniUpdateInterval = obj["remoteConfigMiniUpdateInterval"] as! NSNumber?
        self.enableDataFilter = (obj["enableDataFilter"] as? Bool) ?? false
        self.dataFilters = obj["dataFilters"] as! Any?
    }
}
@objc(UTSSDKModulesGCUniPluginGCDatakitURLParams)
@objcMembers
public class GCDatakitURLParams : NSObject, UTSObject {
    public var datakitUrl: String!
    public subscript(_ key: String) -> Any? {
        get {
            return utsSubscriptGetValue(key)
        }
        set {
            switch(key){
                case "datakitUrl":
                    self.datakitUrl = try! utsSubscriptCheckValue(newValue)
                default:
                    break
            }
        }
    }
    public override init() {
        super.init()
    }
    public init(_ obj: UTSJSONObject) {
        self.datakitUrl = obj["datakitUrl"] as! String
    }
}
@objc(UTSSDKModulesGCUniPluginGCDatawayURLParams)
@objcMembers
public class GCDatawayURLParams : NSObject, UTSObject {
    public var datawayUrl: String!
    public var clientToken: String!
    public subscript(_ key: String) -> Any? {
        get {
            return utsSubscriptGetValue(key)
        }
        set {
            switch(key){
                case "datawayUrl":
                    self.datawayUrl = try! utsSubscriptCheckValue(newValue)
                case "clientToken":
                    self.clientToken = try! utsSubscriptCheckValue(newValue)
                default:
                    break
            }
        }
    }
    public override init() {
        super.init()
    }
    public init(_ obj: UTSJSONObject) {
        self.datawayUrl = obj["datawayUrl"] as! String
        self.clientToken = obj["clientToken"] as! String
    }
}
@objc(UTSSDKModulesGCUniPluginGCRemoteConfigUpdateParams)
@objcMembers
public class GCRemoteConfigUpdateParams : NSObject, UTSObject {
    public var miniUpdateInterval: NSNumber?
    public subscript(_ key: String) -> Any? {
        get {
            return utsSubscriptGetValue(key)
        }
        set {
            switch(key){
                case "miniUpdateInterval":
                    self.miniUpdateInterval = try! utsSubscriptCheckValueIfPresent(newValue)
                default:
                    break
            }
        }
    }
    public override init() {
        super.init()
    }
    public init(_ obj: UTSJSONObject) {
        self.miniUpdateInterval = obj["miniUpdateInterval"] as! NSNumber?
    }
}
@objc(UTSSDKModulesGCUniPluginGCRemoteConfigUpdateResult)
@objcMembers
public class GCRemoteConfigUpdateResult : NSObject {
    public var success: Bool = false
    public var platform: String = ""
    public var rawJson: String? = nil
    public var errorCode: Any? = nil
    public var errorMessage: String? = nil
    public init(_ success: Bool, _ platform: String, _ rawJson: String?, _ errorCode: Any?, _ errorMessage: String?){
        self.success = success
        self.platform = platform
        self.rawJson = rawJson == nil ? nil : rawJson
        self.errorCode = errorCode == nil ? nil : errorCode
        self.errorMessage = errorMessage == nil ? nil : errorMessage
    }
}
public typealias GCRemoteConfigUpdateCallback = (_ result: GCRemoteConfigUpdateResult) -> Void
@objc(UTSSDKModulesGCUniPluginGCRUMConfig)
@objcMembers
public class GCRUMConfig : NSObject, UTSObject {
    public var androidAppId: String?
    public var iOSAppId: String?
    public var harmonyAppId: String?
    public var sampleRate: NSNumber?
    public var samplerate: NSNumber?
    public var sessionOnErrorSampleRate: NSNumber?
    public var enableNativeUserAction: Bool = false
    public var enableNativeUserView: Bool = false
    public var enableNativeUserResource: Bool = false
    public var enableResourceHostIP: Bool = false
    public var enableTrackNativeCrash: Bool = false
    public var enableTrackNativeAppANR: Bool = false
    public var enableTrackNativeFreeze: Bool = false
    public var nativeFreezeDurationMs: NSNumber?
    public var errorMonitorType: Any?
    public var deviceMonitorType: Any?
    public var detectFrequency: String?
    public var enableTraceWebView: Bool = false
    public var allowWebViewHost: [String]?
    public var globalContext: Any?
    public var rumCacheLimitCount: NSNumber?
    public var rumDiscardStrategy: String?
    public subscript(_ key: String) -> Any? {
        get {
            return utsSubscriptGetValue(key)
        }
        set {
            switch(key){
                case "androidAppId":
                    self.androidAppId = try! utsSubscriptCheckValueIfPresent(newValue)
                case "iOSAppId":
                    self.iOSAppId = try! utsSubscriptCheckValueIfPresent(newValue)
                case "harmonyAppId":
                    self.harmonyAppId = try! utsSubscriptCheckValueIfPresent(newValue)
                case "sampleRate":
                    self.sampleRate = try! utsSubscriptCheckValueIfPresent(newValue)
                case "samplerate":
                    self.samplerate = try! utsSubscriptCheckValueIfPresent(newValue)
                case "sessionOnErrorSampleRate":
                    self.sessionOnErrorSampleRate = try! utsSubscriptCheckValueIfPresent(newValue)
                case "enableNativeUserAction":
                    self.enableNativeUserAction = try! utsSubscriptCheckValue(newValue)
                case "enableNativeUserView":
                    self.enableNativeUserView = try! utsSubscriptCheckValue(newValue)
                case "enableNativeUserResource":
                    self.enableNativeUserResource = try! utsSubscriptCheckValue(newValue)
                case "enableResourceHostIP":
                    self.enableResourceHostIP = try! utsSubscriptCheckValue(newValue)
                case "enableTrackNativeCrash":
                    self.enableTrackNativeCrash = try! utsSubscriptCheckValue(newValue)
                case "enableTrackNativeAppANR":
                    self.enableTrackNativeAppANR = try! utsSubscriptCheckValue(newValue)
                case "enableTrackNativeFreeze":
                    self.enableTrackNativeFreeze = try! utsSubscriptCheckValue(newValue)
                case "nativeFreezeDurationMs":
                    self.nativeFreezeDurationMs = try! utsSubscriptCheckValueIfPresent(newValue)
                case "errorMonitorType":
                    self.errorMonitorType = try! utsSubscriptCheckValueIfPresent(newValue)
                case "deviceMonitorType":
                    self.deviceMonitorType = try! utsSubscriptCheckValueIfPresent(newValue)
                case "detectFrequency":
                    self.detectFrequency = try! utsSubscriptCheckValueIfPresent(newValue)
                case "enableTraceWebView":
                    self.enableTraceWebView = try! utsSubscriptCheckValue(newValue)
                case "allowWebViewHost":
                    self.allowWebViewHost = try! utsSubscriptCheckValueIfPresent(newValue)
                case "globalContext":
                    self.globalContext = try! utsSubscriptCheckValueIfPresent(newValue)
                case "rumCacheLimitCount":
                    self.rumCacheLimitCount = try! utsSubscriptCheckValueIfPresent(newValue)
                case "rumDiscardStrategy":
                    self.rumDiscardStrategy = try! utsSubscriptCheckValueIfPresent(newValue)
                default:
                    break
            }
        }
    }
    public override init() {
        super.init()
    }
    public init(_ obj: UTSJSONObject) {
        self.androidAppId = obj["androidAppId"] as! String?
        self.iOSAppId = obj["iOSAppId"] as! String?
        self.harmonyAppId = obj["harmonyAppId"] as! String?
        self.sampleRate = obj["sampleRate"] as! NSNumber?
        self.samplerate = obj["samplerate"] as! NSNumber?
        self.sessionOnErrorSampleRate = obj["sessionOnErrorSampleRate"] as! NSNumber?
        self.enableNativeUserAction = (obj["enableNativeUserAction"] as? Bool) ?? false
        self.enableNativeUserView = (obj["enableNativeUserView"] as? Bool) ?? false
        self.enableNativeUserResource = (obj["enableNativeUserResource"] as? Bool) ?? false
        self.enableResourceHostIP = (obj["enableResourceHostIP"] as? Bool) ?? false
        self.enableTrackNativeCrash = (obj["enableTrackNativeCrash"] as? Bool) ?? false
        self.enableTrackNativeAppANR = (obj["enableTrackNativeAppANR"] as? Bool) ?? false
        self.enableTrackNativeFreeze = (obj["enableTrackNativeFreeze"] as? Bool) ?? false
        self.nativeFreezeDurationMs = obj["nativeFreezeDurationMs"] as! NSNumber?
        self.errorMonitorType = obj["errorMonitorType"] as! Any?
        self.deviceMonitorType = obj["deviceMonitorType"] as! Any?
        self.detectFrequency = obj["detectFrequency"] as! String?
        self.enableTraceWebView = (obj["enableTraceWebView"] as? Bool) ?? false
        self.allowWebViewHost = obj["allowWebViewHost"] as! [String]?
        self.globalContext = obj["globalContext"] as! Any?
        self.rumCacheLimitCount = obj["rumCacheLimitCount"] as! NSNumber?
        self.rumDiscardStrategy = obj["rumDiscardStrategy"] as! String?
    }
}
@objc(UTSSDKModulesGCUniPluginGCLoggerConfig)
@objcMembers
public class GCLoggerConfig : NSObject, UTSObject {
    public var sampleRate: NSNumber?
    public var samplerate: NSNumber?
    public var enableLinkRumData: Bool = false
    public var enableCustomLog: Bool = false
    public var logCacheLimitCount: NSNumber?
    public var discardStrategy: String?
    public var logLevelFilters: [String]?
    public var globalContext: Any?
    public subscript(_ key: String) -> Any? {
        get {
            return utsSubscriptGetValue(key)
        }
        set {
            switch(key){
                case "sampleRate":
                    self.sampleRate = try! utsSubscriptCheckValueIfPresent(newValue)
                case "samplerate":
                    self.samplerate = try! utsSubscriptCheckValueIfPresent(newValue)
                case "enableLinkRumData":
                    self.enableLinkRumData = try! utsSubscriptCheckValue(newValue)
                case "enableCustomLog":
                    self.enableCustomLog = try! utsSubscriptCheckValue(newValue)
                case "logCacheLimitCount":
                    self.logCacheLimitCount = try! utsSubscriptCheckValueIfPresent(newValue)
                case "discardStrategy":
                    self.discardStrategy = try! utsSubscriptCheckValueIfPresent(newValue)
                case "logLevelFilters":
                    self.logLevelFilters = try! utsSubscriptCheckValueIfPresent(newValue)
                case "globalContext":
                    self.globalContext = try! utsSubscriptCheckValueIfPresent(newValue)
                default:
                    break
            }
        }
    }
    public override init() {
        super.init()
    }
    public init(_ obj: UTSJSONObject) {
        self.sampleRate = obj["sampleRate"] as! NSNumber?
        self.samplerate = obj["samplerate"] as! NSNumber?
        self.enableLinkRumData = (obj["enableLinkRumData"] as? Bool) ?? false
        self.enableCustomLog = (obj["enableCustomLog"] as? Bool) ?? false
        self.logCacheLimitCount = obj["logCacheLimitCount"] as! NSNumber?
        self.discardStrategy = obj["discardStrategy"] as! String?
        self.logLevelFilters = obj["logLevelFilters"] as! [String]?
        self.globalContext = obj["globalContext"] as! Any?
    }
}
@objc(UTSSDKModulesGCUniPluginGCTraceConfig)
@objcMembers
public class GCTraceConfig : NSObject, UTSObject {
    public var sampleRate: NSNumber?
    public var samplerate: NSNumber?
    public var traceType: String?
    public var enableLinkRUMData: Bool = false
    public var enableAutoTrace: Bool = false
    public subscript(_ key: String) -> Any? {
        get {
            return utsSubscriptGetValue(key)
        }
        set {
            switch(key){
                case "sampleRate":
                    self.sampleRate = try! utsSubscriptCheckValueIfPresent(newValue)
                case "samplerate":
                    self.samplerate = try! utsSubscriptCheckValueIfPresent(newValue)
                case "traceType":
                    self.traceType = try! utsSubscriptCheckValueIfPresent(newValue)
                case "enableLinkRUMData":
                    self.enableLinkRUMData = try! utsSubscriptCheckValue(newValue)
                case "enableAutoTrace":
                    self.enableAutoTrace = try! utsSubscriptCheckValue(newValue)
                default:
                    break
            }
        }
    }
    public override init() {
        super.init()
    }
    public init(_ obj: UTSJSONObject) {
        self.sampleRate = obj["sampleRate"] as! NSNumber?
        self.samplerate = obj["samplerate"] as! NSNumber?
        self.traceType = obj["traceType"] as! String?
        self.enableLinkRUMData = (obj["enableLinkRUMData"] as? Bool) ?? false
        self.enableAutoTrace = (obj["enableAutoTrace"] as? Bool) ?? false
    }
}
@objc(UTSSDKModulesGCUniPluginGCRUMUserDataParams)
@objcMembers
public class GCRUMUserDataParams : NSObject, UTSObject {
    public var userId: String!
    public var userName: String?
    public var userEmail: String?
    public var extra: Any?
    public subscript(_ key: String) -> Any? {
        get {
            return utsSubscriptGetValue(key)
        }
        set {
            switch(key){
                case "userId":
                    self.userId = try! utsSubscriptCheckValue(newValue)
                case "userName":
                    self.userName = try! utsSubscriptCheckValueIfPresent(newValue)
                case "userEmail":
                    self.userEmail = try! utsSubscriptCheckValueIfPresent(newValue)
                case "extra":
                    self.extra = try! utsSubscriptCheckValueIfPresent(newValue)
                default:
                    break
            }
        }
    }
    public override init() {
        super.init()
    }
    public init(_ obj: UTSJSONObject) {
        self.userId = obj["userId"] as! String
        self.userName = obj["userName"] as! String?
        self.userEmail = obj["userEmail"] as! String?
        self.extra = obj["extra"] as! Any?
    }
}
@objc(UTSSDKModulesGCUniPluginGCRUMActionParams)
@objcMembers
public class GCRUMActionParams : NSObject, UTSObject {
    public var actionName: String!
    public var actionType: String?
    public var property: Any?
    public subscript(_ key: String) -> Any? {
        get {
            return utsSubscriptGetValue(key)
        }
        set {
            switch(key){
                case "actionName":
                    self.actionName = try! utsSubscriptCheckValue(newValue)
                case "actionType":
                    self.actionType = try! utsSubscriptCheckValueIfPresent(newValue)
                case "property":
                    self.property = try! utsSubscriptCheckValueIfPresent(newValue)
                default:
                    break
            }
        }
    }
    public override init() {
        super.init()
    }
    public init(_ obj: UTSJSONObject) {
        self.actionName = obj["actionName"] as! String
        self.actionType = obj["actionType"] as! String?
        self.property = obj["property"] as! Any?
    }
}
@objc(UTSSDKModulesGCUniPluginGCRUMViewParams)
@objcMembers
public class GCRUMViewParams : NSObject, UTSObject {
    public var viewName: String!
    public var property: Any?
    public subscript(_ key: String) -> Any? {
        get {
            return utsSubscriptGetValue(key)
        }
        set {
            switch(key){
                case "viewName":
                    self.viewName = try! utsSubscriptCheckValue(newValue)
                case "property":
                    self.property = try! utsSubscriptCheckValueIfPresent(newValue)
                default:
                    break
            }
        }
    }
    public override init() {
        super.init()
    }
    public init(_ obj: UTSJSONObject) {
        self.viewName = obj["viewName"] as! String
        self.property = obj["property"] as! Any?
    }
}
@objc(UTSSDKModulesGCUniPluginGCRUMCreateViewParams)
@objcMembers
public class GCRUMCreateViewParams : NSObject, UTSObject {
    public var viewName: String!
    public var loadTime: NSNumber!
    public subscript(_ key: String) -> Any? {
        get {
            return utsSubscriptGetValue(key)
        }
        set {
            switch(key){
                case "viewName":
                    self.viewName = try! utsSubscriptCheckValue(newValue)
                case "loadTime":
                    self.loadTime = try! utsSubscriptCheckValue(newValue)
                default:
                    break
            }
        }
    }
    public override init() {
        super.init()
    }
    public init(_ obj: UTSJSONObject) {
        self.viewName = obj["viewName"] as! String
        self.loadTime = obj["loadTime"] as! NSNumber
    }
}
@objc(UTSSDKModulesGCUniPluginGCRUMStopViewParams)
@objcMembers
public class GCRUMStopViewParams : NSObject, UTSObject {
    public var property: Any?
    public subscript(_ key: String) -> Any? {
        get {
            return utsSubscriptGetValue(key)
        }
        set {
            switch(key){
                case "property":
                    self.property = try! utsSubscriptCheckValueIfPresent(newValue)
                default:
                    break
            }
        }
    }
    public override init() {
        super.init()
    }
    public init(_ obj: UTSJSONObject) {
        self.property = obj["property"] as! Any?
    }
}
@objc(UTSSDKModulesGCUniPluginGCRUMErrorParams)
@objcMembers
public class GCRUMErrorParams : NSObject, UTSObject {
    public var type: String?
    public var errorType: String?
    public var message: String!
    public var stack: String!
    public var state: String?
    public var property: Any?
    public subscript(_ key: String) -> Any? {
        get {
            return utsSubscriptGetValue(key)
        }
        set {
            switch(key){
                case "type":
                    self.type = try! utsSubscriptCheckValueIfPresent(newValue)
                case "errorType":
                    self.errorType = try! utsSubscriptCheckValueIfPresent(newValue)
                case "message":
                    self.message = try! utsSubscriptCheckValue(newValue)
                case "stack":
                    self.stack = try! utsSubscriptCheckValue(newValue)
                case "state":
                    self.state = try! utsSubscriptCheckValueIfPresent(newValue)
                case "property":
                    self.property = try! utsSubscriptCheckValueIfPresent(newValue)
                default:
                    break
            }
        }
    }
    public override init() {
        super.init()
    }
    public init(_ obj: UTSJSONObject) {
        self.type = obj["type"] as! String?
        self.errorType = obj["errorType"] as! String?
        self.message = obj["message"] as! String
        self.stack = obj["stack"] as! String
        self.state = obj["state"] as! String?
        self.property = obj["property"] as! Any?
    }
}
@objc(UTSSDKModulesGCUniPluginGCRUMResourceContentParams)
@objcMembers
public class GCRUMResourceContentParams : NSObject, UTSObject {
    public var url: String!
    public var httpMethod: String?
    public var requestHeader: Any?
    public var responseHeader: Any?
    public var responseBody: String?
    public var resourceStatus: NSNumber?
    public var errorMessage: String?
    public var errorStack: String?
    public var fetchStartTime: NSNumber?
    public var requestStartTime: NSNumber?
    public var responseStartTime: NSNumber?
    public var responseEndTime: NSNumber?
    public var tcpStartTime: NSNumber?
    public var tcpEndTime: NSNumber?
    public var dnsStartTime: NSNumber?
    public var dnsEndTime: NSNumber?
    public var sslStartTime: NSNumber?
    public var sslEndTime: NSNumber?
    public subscript(_ key: String) -> Any? {
        get {
            return utsSubscriptGetValue(key)
        }
        set {
            switch(key){
                case "url":
                    self.url = try! utsSubscriptCheckValue(newValue)
                case "httpMethod":
                    self.httpMethod = try! utsSubscriptCheckValueIfPresent(newValue)
                case "requestHeader":
                    self.requestHeader = try! utsSubscriptCheckValueIfPresent(newValue)
                case "responseHeader":
                    self.responseHeader = try! utsSubscriptCheckValueIfPresent(newValue)
                case "responseBody":
                    self.responseBody = try! utsSubscriptCheckValueIfPresent(newValue)
                case "resourceStatus":
                    self.resourceStatus = try! utsSubscriptCheckValueIfPresent(newValue)
                case "errorMessage":
                    self.errorMessage = try! utsSubscriptCheckValueIfPresent(newValue)
                case "errorStack":
                    self.errorStack = try! utsSubscriptCheckValueIfPresent(newValue)
                case "fetchStartTime":
                    self.fetchStartTime = try! utsSubscriptCheckValueIfPresent(newValue)
                case "requestStartTime":
                    self.requestStartTime = try! utsSubscriptCheckValueIfPresent(newValue)
                case "responseStartTime":
                    self.responseStartTime = try! utsSubscriptCheckValueIfPresent(newValue)
                case "responseEndTime":
                    self.responseEndTime = try! utsSubscriptCheckValueIfPresent(newValue)
                case "tcpStartTime":
                    self.tcpStartTime = try! utsSubscriptCheckValueIfPresent(newValue)
                case "tcpEndTime":
                    self.tcpEndTime = try! utsSubscriptCheckValueIfPresent(newValue)
                case "dnsStartTime":
                    self.dnsStartTime = try! utsSubscriptCheckValueIfPresent(newValue)
                case "dnsEndTime":
                    self.dnsEndTime = try! utsSubscriptCheckValueIfPresent(newValue)
                case "sslStartTime":
                    self.sslStartTime = try! utsSubscriptCheckValueIfPresent(newValue)
                case "sslEndTime":
                    self.sslEndTime = try! utsSubscriptCheckValueIfPresent(newValue)
                default:
                    break
            }
        }
    }
    public override init() {
        super.init()
    }
    public init(_ obj: UTSJSONObject) {
        self.url = obj["url"] as! String
        self.httpMethod = obj["httpMethod"] as! String?
        self.requestHeader = obj["requestHeader"] as! Any?
        self.responseHeader = obj["responseHeader"] as! Any?
        self.responseBody = obj["responseBody"] as! String?
        self.resourceStatus = obj["resourceStatus"] as! NSNumber?
        self.errorMessage = obj["errorMessage"] as! String?
        self.errorStack = obj["errorStack"] as! String?
        self.fetchStartTime = obj["fetchStartTime"] as! NSNumber?
        self.requestStartTime = obj["requestStartTime"] as! NSNumber?
        self.responseStartTime = obj["responseStartTime"] as! NSNumber?
        self.responseEndTime = obj["responseEndTime"] as! NSNumber?
        self.tcpStartTime = obj["tcpStartTime"] as! NSNumber?
        self.tcpEndTime = obj["tcpEndTime"] as! NSNumber?
        self.dnsStartTime = obj["dnsStartTime"] as! NSNumber?
        self.dnsEndTime = obj["dnsEndTime"] as! NSNumber?
        self.sslStartTime = obj["sslStartTime"] as! NSNumber?
        self.sslEndTime = obj["sslEndTime"] as! NSNumber?
    }
}
@objc(UTSSDKModulesGCUniPluginGCRUMResourceParams)
@objcMembers
public class GCRUMResourceParams : NSObject, UTSObject {
    public var key: String!
    public var property: Any?
    public subscript(_ key: String) -> Any? {
        get {
            return utsSubscriptGetValue(key)
        }
        set {
            switch(key){
                case "key":
                    self.key = try! utsSubscriptCheckValue(newValue)
                case "property":
                    self.property = try! utsSubscriptCheckValueIfPresent(newValue)
                default:
                    break
            }
        }
    }
    public override init() {
        super.init()
    }
    public init(_ obj: UTSJSONObject) {
        self.key = obj["key"] as! String
        self.property = obj["property"] as! Any?
    }
}
@objc(UTSSDKModulesGCUniPluginGCRUMAddResourceParams)
@objcMembers
public class GCRUMAddResourceParams : NSObject, UTSObject {
    public var key: String!
    public var content: GCRUMResourceContentParams!
    public var property: Any?
    public subscript(_ key: String) -> Any? {
        get {
            return utsSubscriptGetValue(key)
        }
        set {
            switch(key){
                case "key":
                    self.key = try! utsSubscriptCheckValue(newValue)
                case "content":
                    self.content = try! utsSubscriptCheckValue(newValue)
                case "property":
                    self.property = try! utsSubscriptCheckValueIfPresent(newValue)
                default:
                    break
            }
        }
    }
    public override init() {
        super.init()
    }
    public init(_ obj: UTSJSONObject) {
        self.key = obj["key"] as! String
        self.content = obj["content"] as! GCRUMResourceContentParams
        self.property = obj["property"] as! Any?
    }
}
@objc(UTSSDKModulesGCUniPluginGCLoggerLogParams)
@objcMembers
public class GCLoggerLogParams : NSObject, UTSObject {
    public var content: String!
    public var status: Any?
    public var property: Any?
    public subscript(_ key: String) -> Any? {
        get {
            return utsSubscriptGetValue(key)
        }
        set {
            switch(key){
                case "content":
                    self.content = try! utsSubscriptCheckValue(newValue)
                case "status":
                    self.status = try! utsSubscriptCheckValueIfPresent(newValue)
                case "property":
                    self.property = try! utsSubscriptCheckValueIfPresent(newValue)
                default:
                    break
            }
        }
    }
    public override init() {
        super.init()
    }
    public init(_ obj: UTSJSONObject) {
        self.content = obj["content"] as! String
        self.status = obj["status"] as! Any?
        self.property = obj["property"] as! Any?
    }
}
@objc(UTSSDKModulesGCUniPluginGCTraceHeaderParams)
@objcMembers
public class GCTraceHeaderParams : NSObject, UTSObject {
    public var url: String!
    public var key: String?
    public subscript(_ key: String) -> Any? {
        get {
            return utsSubscriptGetValue(key)
        }
        set {
            switch(key){
                case "url":
                    self.url = try! utsSubscriptCheckValue(newValue)
                case "key":
                    self.key = try! utsSubscriptCheckValueIfPresent(newValue)
                default:
                    break
            }
        }
    }
    public override init() {
        super.init()
    }
    public init(_ obj: UTSJSONObject) {
        self.url = obj["url"] as! String
        self.key = obj["key"] as! String?
    }
}
public var GC_UTS_BRIDGE_VERSION: String = "0.2.7"
public func createDefaultBridgeContext() -> UTSJSONObject {
    var context = JSON.parseObject("{\"sdk_bridge_info\":\"{\\\"uniapp\\\":\\\"" + GC_UTS_BRIDGE_VERSION + "\\\"}\"}")
    return context ?? UTSJSONObject([:])
}
public var bridgeContext: UTSJSONObject = createDefaultBridgeContext()
public func parseObject(_ text: String?) -> UTSJSONObject? {
    var safeText: String = text ?? ""
    if (safeText.length == 0) {
        return nil
    }
    return JSON.parseObject(safeText)
}
public func cloneJSONObject(_ source: UTSJSONObject?) -> UTSJSONObject {
    if (source == nil) {
        return UTSJSONObject([:])
    }
    return parseObject(JSON.stringify(source)) ?? UTSJSONObject([:])
}
public func toJSONObject(_ source: Any?) -> UTSJSONObject? {
    if (source == nil) {
        return nil
    }
    return parseObject(JSON.stringify(source))
}
public func mergeJSONObject(_ target: UTSJSONObject, _ source: UTSJSONObject?) -> UTSJSONObject {
    if (source == nil) {
        return target
    }
    var safeSource: UTSJSONObject = source ?? UTSJSONObject([:])
    safeSource.toMap().forEach({
    (entry) -> Void in
    target[entry.key] = entry.value
    })
    return target
}
public func getBridgeContext() -> UTSJSONObject {
    return cloneJSONObject(bridgeContext)
}
public func appendBridgeContextState(_ context: Any?) -> UTSJSONObject {
    var nextBridgeContext = cloneJSONObject(bridgeContext)
    mergeJSONObject(nextBridgeContext, toJSONObject(context))
    bridgeContext = nextBridgeContext
    return getBridgeContext()
}
public func mergeBridgeContext(_ property: Any?) -> UTSJSONObject {
    var result = cloneJSONObject(bridgeContext)
    mergeJSONObject(result, toJSONObject(property))
    return result
}
public func cloneParams(_ params: Any?) -> UTSJSONObject {
    return cloneJSONObject(toJSONObject(params))
}
public func mergePropertyForParams(_ params: Any?) -> UTSJSONObject {
    var result = cloneParams(params)
    result["property"] = mergeBridgeContext(result.getJSON("property"))
    return result
}
public func normalizeAddResourceParams(_ params: Any?) -> UTSJSONObject {
    var result = cloneParams(params)
    var content = result.getJSON("content")
    if (content != nil) {
        result["content"] = cloneJSONObject(content)
    }
    return result
}
public func normalizeSdkConfigParams(_ params: Any?) -> UTSJSONObject {
    return cloneParams(params)
}
public func normalizeRumConfigParams(_ params: Any?) -> UTSJSONObject {
    return cloneParams(params)
}
public func normalizeLoggerConfigParams(_ params: Any?) -> UTSJSONObject {
    return cloneParams(params)
}
public func normalizeTraceConfigParams(_ params: Any?) -> UTSJSONObject {
    return cloneParams(params)
}
public func normalizeLoggingParams(_ params: Any?) -> UTSJSONObject {
    return cloneParams(params)
}
public func createRemoteConfigUpdateResult(_ success: Bool, _ platform: String, _ rawJson: String?, _ errorCode: Any?, _ errorMessage: String?) -> GCRemoteConfigUpdateResult {
    return GCRemoteConfigUpdateResult(success, platform, rawJson == nil ? nil : rawJson, errorCode == nil ? nil : errorCode, errorMessage == nil ? nil : errorMessage)
}
public func parseRemoteConfigUpdateResult(_ result: String?, _ platform: String) -> GCRemoteConfigUpdateResult {
    var parsedValue = parseObject(result)
    if (parsedValue == nil) {
        return createRemoteConfigUpdateResult(false, platform, nil, "REMOTE_CONFIG_INVALID_RESULT", "Remote configuration update returned an invalid result.")
    }
    var value: UTSJSONObject = parsedValue ?? UTSJSONObject([:])
    return createRemoteConfigUpdateResult(value.getBoolean("success") ?? false, value.getString("platform") ?? platform, value.getString("rawJson"), value["errorCode"], value.getString("errorMessage"))
}
public var BLACK_RESOURCE_PATTERN = UTSRegExp("^https?:\\/\\/([a-zA-Z0-9-]+\\.)?dcloud\\.net\\.cn(:\\d+)?\\/.*", "")
public func filterBlackResource(_ resourceUrl: String?) -> Bool {
    var safeResourceUrl: String = resourceUrl ?? ""
    if (safeResourceUrl.length === 0) {
        return false
    }
    return BLACK_RESOURCE_PATTERN.test(safeResourceUrl)
}
public func getStringValue(_ source: UTSJSONObject?, _ key: String) -> String? {
    if (source == nil) {
        return nil
    }
    var safeSource: UTSJSONObject = source ?? UTSJSONObject([:])
    return safeSource.getString(key)
}
public func prepareAddResourceParams(_ params: Any?) -> Any {
    var result = normalizeAddResourceParams(params)
    var content = result.getJSON("content")
    var resourceUrl = getStringValue(content, "url")
    result["isBlackResource"] = filterBlackResource(resourceUrl)
    return result
}
public func stringifyParams(_ params: Any?) -> String {
    if (params == nil) {
        return "{}"
    }
    return JSON.stringify(params) ?? "{}"
}
public func parseJSONResult(_ result: String?) -> Any? {
    var safeResult: String = result ?? ""
    if (safeResult.length === 0) {
        return nil
    }
    return JSON.parse(safeResult)
}
public func stringifyNullableParams(_ params: Any?) -> String? {
    if (params == nil) {
        return nil
    }
    return JSON.stringify(params)
}
public func bindRUMUserCompat(_ userId: String, _ userName: String?, _ userEmail: String?, _ extra: Any?) {
    GCUniPluginNative.bindRUMUser(userId, userName, userEmail, stringifyNullableParams(extra))
}
@objc(UTSSDKModulesGCUniPluginMobileAgent)
@objcMembers
public class mobileAgent : NSObject {
    public static func sdkConfig(_ params: GCMobileConfig) {
        var json = stringifyParams(normalizeSdkConfigParams(params))
        GCUniPluginNative.sdkConfig(json)
    }
    public static func setDatakitURL(_ params: GCDatakitURLParams) {
        GCUniPluginNative.setDatakitURL(stringifyParams(params))
    }
    public static func setDatawayURL(_ params: GCDatawayURLParams) {
        GCUniPluginNative.setDatawayURL(stringifyParams(params))
    }
    public static func updateRemoteConfigWithMiniUpdateInterval(_ params: GCRemoteConfigUpdateParams, _ callback: @escaping GCRemoteConfigUpdateCallback) {
        GCUniPluginNative.updateRemoteConfigWithMiniUpdateInterval(stringifyParams(params), {
        (result: String?) -> Void in
        callback(parseRemoteConfigUpdateResult(result, "ios"))
        })
    }
    public static func bindRUMUserData(_ params: GCRUMUserDataParams) {
        if (params == nil || params.userId == nil) {
            return
        }
        bindRUMUserCompat(params.userId, params.userName, params.userEmail, params.extra)
    }
    public static func unbindRUMUserData() {
        GCUniPluginNative.unbindRUMUserData()
    }
    public static func appendGlobalContext(_ params: Any?) {
        GCUniPluginNative.appendGlobalContext(stringifyParams(params))
    }
    public static func appendRUMGlobalContext(_ params: Any?) {
        GCUniPluginNative.appendRUMGlobalContext(stringifyParams(params))
    }
    public static func appendLogGlobalContext(_ params: Any?) {
        GCUniPluginNative.appendLogGlobalContext(stringifyParams(params))
    }
    public static func appendBridgeContext(_ params: Any?) {
        appendBridgeContextState(params)
    }
    public static func flushSyncData() {
        GCUniPluginNative.flushSyncData()
    }
    public static func clearAllData() {
        GCUniPluginNative.clearAllData()
    }
    public static func shutDown() {
        GCUniPluginNative.shutDown()
    }
    public static func manuallySetApplicationStart() {}
}
@objc(UTSSDKModulesGCUniPluginRum)
@objcMembers
public class rum : NSObject {
    public static func setConfig(_ params: GCRUMConfig) {
        var json = stringifyParams(normalizeRumConfigParams(params))
        GCUniPluginNative.setRumConfig(json)
    }
    public static func startAction(_ params: GCRUMActionParams) {
        GCUniPluginNative.startAction(stringifyParams(mergePropertyForParams(params)))
    }
    public static func addAction(_ params: GCRUMActionParams) {
        GCUniPluginNative.addAction(stringifyParams(mergePropertyForParams(params)))
    }
    public static func onCreateView(_ params: GCRUMCreateViewParams) {
        GCUniPluginNative.onCreateView(stringifyParams(cloneParams(params)))
    }
    public static func startView(_ params: GCRUMViewParams) {
        GCUniPluginNative.startView(stringifyParams(mergePropertyForParams(params)))
    }
    public static func stopView(_ params: GCRUMStopViewParams?) {
        GCUniPluginNative.stopView(stringifyParams(cloneParams(params)))
    }
    public static func addError(_ params: GCRUMErrorParams) {
        GCUniPluginNative.addError(stringifyParams(mergePropertyForParams(params)))
    }
    public static func startResource(_ params: GCRUMResourceParams) {
        GCUniPluginNative.startResource(stringifyParams(mergePropertyForParams(params)))
    }
    public static func stopResource(_ params: GCRUMResourceParams) {
        GCUniPluginNative.stopResource(stringifyParams(cloneParams(params)))
    }
    public static func addResource(_ params: GCRUMAddResourceParams) {
        var result = prepareAddResourceParams(params)
        GCUniPluginNative.addResource(stringifyParams(result))
    }
}
@objc(UTSSDKModulesGCUniPluginLogger)
@objcMembers
public class logger : NSObject {
    public static func setConfig(_ params: GCLoggerConfig) {
        var json = stringifyParams(normalizeLoggerConfigParams(params))
        GCUniPluginNative.setLoggerConfig(json)
    }
    public static func logging(_ params: GCLoggerLogParams) {
        GCUniPluginNative.logging(stringifyParams(normalizeLoggingParams(params)))
    }
}
@objc(UTSSDKModulesGCUniPluginTracer)
@objcMembers
public class tracer : NSObject {
    public static func setConfig(_ params: GCTraceConfig) {
        var json = stringifyParams(normalizeTraceConfigParams(params))
        GCUniPluginNative.setTraceConfig(json)
    }
    public static func getTraceHeader(_ params: GCTraceHeaderParams) -> Any? {
        var json = stringifyParams(params)
        var result = GCUniPluginNative.getTraceHeader(json)
        return parseJSONResult(result)
    }
}
@objc(UTSSDKModulesGCUniPluginGCEnv)
@objcMembers
public class GCEnv : NSObject {
    public static var PROD: String = "prod"
    public static var GRAY: String = "gray"
    public static var PRE: String = "pre"
    public static var COMMON: String = "common"
    public static var LOCAL: String = "local"
}
@objc(UTSSDKModulesGCUniPluginGCDiscardStrategy)
@objcMembers
public class GCDiscardStrategy : NSObject {
    public static var DISCARD: String = "discard"
    public static var DISCARD_OLDEST: String = "discardOldest"
}
@objc(UTSSDKModulesGCUniPluginGCTraceType)
@objcMembers
public class GCTraceType : NSObject {
    public static var DDTRACE: String = "ddTrace"
    public static var ZIPKIN_MULTI_HEADER: String = "zipkinMultiHeader"
    public static var ZIPKIN_SINGLE_HEADER: String = "zipkinSingleHeader"
    public static var TRACEPARENT: String = "traceparent"
    public static var SKYWALKING: String = "skywalking"
    public static var JAEGER: String = "jaeger"
}
@objc(UTSSDKModulesGCUniPluginGCMonitorFrequency)
@objcMembers
public class GCMonitorFrequency : NSObject {
    public static var NORMAL: String = "normal"
    public static var FREQUENT: String = "frequent"
    public static var RARE: String = "rare"
}
@objc(UTSSDKModulesGCUniPluginGCLogStatus)
@objcMembers
public class GCLogStatus : NSObject {
    public static var INFO: String = "info"
    public static var DEBUG: String = "debug"
    public static var WARNING: String = "warning"
    public static var ERROR: String = "error"
    public static var CRITICAL: String = "critical"
    public static var OK: String = "ok"
}
@objc(UTSSDKModulesGCUniPluginGCErrorMonitorType)
@objcMembers
public class GCErrorMonitorType : NSObject {
    public static var BATTERY: String = "battery"
    public static var MEMORY: String = "memory"
    public static var CPU: String = "cpu"
    public static var ALL: String = "all"
}
@objc(UTSSDKModulesGCUniPluginGCDeviceMonitorType)
@objcMembers
public class GCDeviceMonitorType : NSObject {
    public static var BATTERY: String = "battery"
    public static var MEMORY: String = "memory"
    public static var CPU: String = "cpu"
    public static var FPS: String = "fps"
    public static var ALL: String = "all"
}
@objc(UTSSDKModulesGCUniPluginGCMobileConfigJSONObject)
@objcMembers
public class GCMobileConfigJSONObject : NSObject {
    public var datakitUrl: String?
    public var datawayUrl: String?
    public var clientToken: String?
    public var env: String?
    public var debug: Bool = false
    public var service: String?
    public var autoSync: Bool = false
    public var syncPageSize: NSNumber?
    public var syncSleepTime: NSNumber?
    public var enableDataIntegerCompatible: Bool = false
    public var compressIntakeRequests: Bool = false
    public var enableLimitWithDbSize: Bool = false
    public var dbCacheLimit: NSNumber?
    public var dbDiscardStrategy: String?
    public var globalContext: Any?
    public var dataModifier: Any?
    public var lineDataModifier: Any?
    public var remoteConfiguration: Bool = false
    public var remoteConfigMiniUpdateInterval: NSNumber?
    public var enableDataFilter: Bool = false
    public var dataFilters: Any?
}
@objc(UTSSDKModulesGCUniPluginGCDatakitURLParamsJSONObject)
@objcMembers
public class GCDatakitURLParamsJSONObject : NSObject {
    public var datakitUrl: String!
}
@objc(UTSSDKModulesGCUniPluginGCDatawayURLParamsJSONObject)
@objcMembers
public class GCDatawayURLParamsJSONObject : NSObject {
    public var datawayUrl: String!
    public var clientToken: String!
}
@objc(UTSSDKModulesGCUniPluginGCRemoteConfigUpdateParamsJSONObject)
@objcMembers
public class GCRemoteConfigUpdateParamsJSONObject : NSObject {
    public var miniUpdateInterval: NSNumber?
}
@objc(UTSSDKModulesGCUniPluginGCRUMConfigJSONObject)
@objcMembers
public class GCRUMConfigJSONObject : NSObject {
    public var androidAppId: String?
    public var iOSAppId: String?
    public var harmonyAppId: String?
    public var sampleRate: NSNumber?
    public var samplerate: NSNumber?
    public var sessionOnErrorSampleRate: NSNumber?
    public var enableNativeUserAction: Bool = false
    public var enableNativeUserView: Bool = false
    public var enableNativeUserResource: Bool = false
    public var enableResourceHostIP: Bool = false
    public var enableTrackNativeCrash: Bool = false
    public var enableTrackNativeAppANR: Bool = false
    public var enableTrackNativeFreeze: Bool = false
    public var nativeFreezeDurationMs: NSNumber?
    public var errorMonitorType: Any?
    public var deviceMonitorType: Any?
    public var detectFrequency: String?
    public var enableTraceWebView: Bool = false
    public var allowWebViewHost: [String]?
    public var globalContext: Any?
    public var rumCacheLimitCount: NSNumber?
    public var rumDiscardStrategy: String?
}
@objc(UTSSDKModulesGCUniPluginGCLoggerConfigJSONObject)
@objcMembers
public class GCLoggerConfigJSONObject : NSObject {
    public var sampleRate: NSNumber?
    public var samplerate: NSNumber?
    public var enableLinkRumData: Bool = false
    public var enableCustomLog: Bool = false
    public var logCacheLimitCount: NSNumber?
    public var discardStrategy: String?
    public var logLevelFilters: [String]?
    public var globalContext: Any?
}
@objc(UTSSDKModulesGCUniPluginGCTraceConfigJSONObject)
@objcMembers
public class GCTraceConfigJSONObject : NSObject {
    public var sampleRate: NSNumber?
    public var samplerate: NSNumber?
    public var traceType: String?
    public var enableLinkRUMData: Bool = false
    public var enableAutoTrace: Bool = false
}
@objc(UTSSDKModulesGCUniPluginGCRUMUserDataParamsJSONObject)
@objcMembers
public class GCRUMUserDataParamsJSONObject : NSObject {
    public var userId: String!
    public var userName: String?
    public var userEmail: String?
    public var extra: Any?
}
@objc(UTSSDKModulesGCUniPluginGCRUMActionParamsJSONObject)
@objcMembers
public class GCRUMActionParamsJSONObject : NSObject {
    public var actionName: String!
    public var actionType: String?
    public var property: Any?
}
@objc(UTSSDKModulesGCUniPluginGCRUMViewParamsJSONObject)
@objcMembers
public class GCRUMViewParamsJSONObject : NSObject {
    public var viewName: String!
    public var property: Any?
}
@objc(UTSSDKModulesGCUniPluginGCRUMCreateViewParamsJSONObject)
@objcMembers
public class GCRUMCreateViewParamsJSONObject : NSObject {
    public var viewName: String!
    public var loadTime: NSNumber!
}
@objc(UTSSDKModulesGCUniPluginGCRUMStopViewParamsJSONObject)
@objcMembers
public class GCRUMStopViewParamsJSONObject : NSObject {
    public var property: Any?
}
@objc(UTSSDKModulesGCUniPluginGCRUMErrorParamsJSONObject)
@objcMembers
public class GCRUMErrorParamsJSONObject : NSObject {
    public var type: String?
    public var errorType: String?
    public var message: String!
    public var stack: String!
    public var state: String?
    public var property: Any?
}
@objc(UTSSDKModulesGCUniPluginGCRUMResourceParamsJSONObject)
@objcMembers
public class GCRUMResourceParamsJSONObject : NSObject {
    public var key: String!
    public var property: Any?
}
@objc(UTSSDKModulesGCUniPluginGCRUMAddResourceParamsJSONObject)
@objcMembers
public class GCRUMAddResourceParamsJSONObject : NSObject {
    public var key: String!
    public var content: GCRUMResourceContentParams!
    public var property: Any?
}
@objc(UTSSDKModulesGCUniPluginGCLoggerLogParamsJSONObject)
@objcMembers
public class GCLoggerLogParamsJSONObject : NSObject {
    public var content: String!
    public var status: Any?
    public var property: Any?
}
@objc(UTSSDKModulesGCUniPluginGCTraceHeaderParamsJSONObject)
@objcMembers
public class GCTraceHeaderParamsJSONObject : NSObject {
    public var url: String!
    public var key: String?
}
@objc(UTSSDKModulesGCUniPluginMobileAgentByJs)
@objcMembers
public class mobileAgentByJs : mobileAgent {
    public static func sdkConfigByJs(_ params: GCMobileConfigJSONObject) {
        return mobileAgent.sdkConfig(GCMobileConfig(UTSJSONObject([
            "datakitUrl": params.datakitUrl,
            "datawayUrl": params.datawayUrl,
            "clientToken": params.clientToken,
            "env": params.env,
            "debug": params.debug,
            "service": params.service,
            "autoSync": params.autoSync,
            "syncPageSize": params.syncPageSize,
            "syncSleepTime": params.syncSleepTime,
            "enableDataIntegerCompatible": params.enableDataIntegerCompatible,
            "compressIntakeRequests": params.compressIntakeRequests,
            "enableLimitWithDbSize": params.enableLimitWithDbSize,
            "dbCacheLimit": params.dbCacheLimit,
            "dbDiscardStrategy": params.dbDiscardStrategy,
            "globalContext": params.globalContext,
            "dataModifier": params.dataModifier,
            "lineDataModifier": params.lineDataModifier,
            "remoteConfiguration": params.remoteConfiguration,
            "remoteConfigMiniUpdateInterval": params.remoteConfigMiniUpdateInterval,
            "enableDataFilter": params.enableDataFilter,
            "dataFilters": params.dataFilters
        ])))
    }
    public static func setDatakitURLByJs(_ params: GCDatakitURLParamsJSONObject) {
        return mobileAgent.setDatakitURL(GCDatakitURLParams(UTSJSONObject([
            "datakitUrl": params.datakitUrl
        ])))
    }
    public static func setDatawayURLByJs(_ params: GCDatawayURLParamsJSONObject) {
        return mobileAgent.setDatawayURL(GCDatawayURLParams(UTSJSONObject([
            "datawayUrl": params.datawayUrl,
            "clientToken": params.clientToken
        ])))
    }
    public static func updateRemoteConfigWithMiniUpdateIntervalByJs(_ params: GCRemoteConfigUpdateParamsJSONObject, _ callback: UTSCallback) {
        return mobileAgent.updateRemoteConfigWithMiniUpdateInterval(GCRemoteConfigUpdateParams(UTSJSONObject([
            "miniUpdateInterval": params.miniUpdateInterval
        ])), {
        (result: GCRemoteConfigUpdateResult) -> Void in
        callback(result)
        })
    }
    public static func bindRUMUserDataByJs(_ params: GCRUMUserDataParamsJSONObject) {
        return mobileAgent.bindRUMUserData(GCRUMUserDataParams(UTSJSONObject([
            "userId": params.userId,
            "userName": params.userName,
            "userEmail": params.userEmail,
            "extra": params.extra
        ])))
    }
    public static func unbindRUMUserDataByJs() {
        return mobileAgent.unbindRUMUserData()
    }
    public static func appendGlobalContextByJs(_ params: Any?) {
        return mobileAgent.appendGlobalContext(params)
    }
    public static func appendRUMGlobalContextByJs(_ params: Any?) {
        return mobileAgent.appendRUMGlobalContext(params)
    }
    public static func appendLogGlobalContextByJs(_ params: Any?) {
        return mobileAgent.appendLogGlobalContext(params)
    }
    public static func appendBridgeContextByJs(_ params: Any?) {
        return mobileAgent.appendBridgeContext(params)
    }
    public static func flushSyncDataByJs() {
        return mobileAgent.flushSyncData()
    }
    public static func clearAllDataByJs() {
        return mobileAgent.clearAllData()
    }
    public static func shutDownByJs() {
        return mobileAgent.shutDown()
    }
    public static func manuallySetApplicationStartByJs() {
        return mobileAgent.manuallySetApplicationStart()
    }
}
@objc(UTSSDKModulesGCUniPluginRumByJs)
@objcMembers
public class rumByJs : rum {
    public static func setConfigByJs(_ params: GCRUMConfigJSONObject) {
        return rum.setConfig(GCRUMConfig(UTSJSONObject([
            "androidAppId": params.androidAppId,
            "iOSAppId": params.iOSAppId,
            "harmonyAppId": params.harmonyAppId,
            "sampleRate": params.sampleRate,
            "samplerate": params.samplerate,
            "sessionOnErrorSampleRate": params.sessionOnErrorSampleRate,
            "enableNativeUserAction": params.enableNativeUserAction,
            "enableNativeUserView": params.enableNativeUserView,
            "enableNativeUserResource": params.enableNativeUserResource,
            "enableResourceHostIP": params.enableResourceHostIP,
            "enableTrackNativeCrash": params.enableTrackNativeCrash,
            "enableTrackNativeAppANR": params.enableTrackNativeAppANR,
            "enableTrackNativeFreeze": params.enableTrackNativeFreeze,
            "nativeFreezeDurationMs": params.nativeFreezeDurationMs,
            "errorMonitorType": params.errorMonitorType,
            "deviceMonitorType": params.deviceMonitorType,
            "detectFrequency": params.detectFrequency,
            "enableTraceWebView": params.enableTraceWebView,
            "allowWebViewHost": params.allowWebViewHost,
            "globalContext": params.globalContext,
            "rumCacheLimitCount": params.rumCacheLimitCount,
            "rumDiscardStrategy": params.rumDiscardStrategy
        ])))
    }
    public static func startActionByJs(_ params: GCRUMActionParamsJSONObject) {
        return rum.startAction(GCRUMActionParams(UTSJSONObject([
            "actionName": params.actionName,
            "actionType": params.actionType,
            "property": params.property
        ])))
    }
    public static func addActionByJs(_ params: GCRUMActionParamsJSONObject) {
        return rum.addAction(GCRUMActionParams(UTSJSONObject([
            "actionName": params.actionName,
            "actionType": params.actionType,
            "property": params.property
        ])))
    }
    public static func onCreateViewByJs(_ params: GCRUMCreateViewParamsJSONObject) {
        return rum.onCreateView(GCRUMCreateViewParams(UTSJSONObject([
            "viewName": params.viewName,
            "loadTime": params.loadTime
        ])))
    }
    public static func startViewByJs(_ params: GCRUMViewParamsJSONObject) {
        return rum.startView(GCRUMViewParams(UTSJSONObject([
            "viewName": params.viewName,
            "property": params.property
        ])))
    }
    public static func stopViewByJs(_ params: GCRUMStopViewParamsJSONObject?) {
        return rum.stopView(params != nil ? GCRUMStopViewParams(UTSJSONObject([
            "property": params!.property
        ])) : nil)
    }
    public static func addErrorByJs(_ params: GCRUMErrorParamsJSONObject) {
        return rum.addError(GCRUMErrorParams(UTSJSONObject([
            "type": params.type,
            "errorType": params.errorType,
            "message": params.message,
            "stack": params.stack,
            "state": params.state,
            "property": params.property
        ])))
    }
    public static func startResourceByJs(_ params: GCRUMResourceParamsJSONObject) {
        return rum.startResource(GCRUMResourceParams(UTSJSONObject([
            "key": params.key,
            "property": params.property
        ])))
    }
    public static func stopResourceByJs(_ params: GCRUMResourceParamsJSONObject) {
        return rum.stopResource(GCRUMResourceParams(UTSJSONObject([
            "key": params.key,
            "property": params.property
        ])))
    }
    public static func addResourceByJs(_ params: GCRUMAddResourceParamsJSONObject) {
        return rum.addResource(GCRUMAddResourceParams(UTSJSONObject([
            "key": params.key,
            "content": params.content,
            "property": params.property
        ])))
    }
}
@objc(UTSSDKModulesGCUniPluginLoggerByJs)
@objcMembers
public class loggerByJs : logger {
    public static func setConfigByJs(_ params: GCLoggerConfigJSONObject) {
        return logger.setConfig(GCLoggerConfig(UTSJSONObject([
            "sampleRate": params.sampleRate,
            "samplerate": params.samplerate,
            "enableLinkRumData": params.enableLinkRumData,
            "enableCustomLog": params.enableCustomLog,
            "logCacheLimitCount": params.logCacheLimitCount,
            "discardStrategy": params.discardStrategy,
            "logLevelFilters": params.logLevelFilters,
            "globalContext": params.globalContext
        ])))
    }
    public static func loggingByJs(_ params: GCLoggerLogParamsJSONObject) {
        return logger.logging(GCLoggerLogParams(UTSJSONObject([
            "content": params.content,
            "status": params.status,
            "property": params.property
        ])))
    }
}
@objc(UTSSDKModulesGCUniPluginTracerByJs)
@objcMembers
public class tracerByJs : tracer {
    public static func setConfigByJs(_ params: GCTraceConfigJSONObject) {
        return tracer.setConfig(GCTraceConfig(UTSJSONObject([
            "sampleRate": params.sampleRate,
            "samplerate": params.samplerate,
            "traceType": params.traceType,
            "enableLinkRUMData": params.enableLinkRUMData,
            "enableAutoTrace": params.enableAutoTrace
        ])))
    }
    public static func getTraceHeaderByJs(_ params: GCTraceHeaderParamsJSONObject) -> Any? {
        return tracer.getTraceHeader(GCTraceHeaderParams(UTSJSONObject([
            "url": params.url,
            "key": params.key
        ])))
    }
}
@objc(UTSSDKModulesGCUniPluginGCEnvByJs)
@objcMembers
public class GCEnvByJs : GCEnv {
}
@objc(UTSSDKModulesGCUniPluginGCDiscardStrategyByJs)
@objcMembers
public class GCDiscardStrategyByJs : GCDiscardStrategy {
}
@objc(UTSSDKModulesGCUniPluginGCTraceTypeByJs)
@objcMembers
public class GCTraceTypeByJs : GCTraceType {
}
@objc(UTSSDKModulesGCUniPluginGCMonitorFrequencyByJs)
@objcMembers
public class GCMonitorFrequencyByJs : GCMonitorFrequency {
}
@objc(UTSSDKModulesGCUniPluginGCLogStatusByJs)
@objcMembers
public class GCLogStatusByJs : GCLogStatus {
}
@objc(UTSSDKModulesGCUniPluginGCErrorMonitorTypeByJs)
@objcMembers
public class GCErrorMonitorTypeByJs : GCErrorMonitorType {
}
@objc(UTSSDKModulesGCUniPluginGCDeviceMonitorTypeByJs)
@objcMembers
public class GCDeviceMonitorTypeByJs : GCDeviceMonitorType {
}
