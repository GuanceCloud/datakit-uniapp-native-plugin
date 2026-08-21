import DCloudUTSFoundation
@objc(UTSSDKModulesGCUniSessionReplayGCSessionReplayConfig)
@objcMembers
public class GCSessionReplayConfig : NSObject, UTSObject {
    public var sampleRate: NSNumber?
    public var sessionReplayOnErrorSampleRate: NSNumber?
    public var touchPrivacy: String?
    public var textAndInputPrivacy: String?
    public var imagePrivacy: String?
    public var enableSwiftUI: Bool = false
    public var enableLinkRUMKeys: [String]?
    public subscript(_ key: String) -> Any? {
        get {
            return utsSubscriptGetValue(key)
        }
        set {
            switch(key){
                case "sampleRate":
                    self.sampleRate = try! utsSubscriptCheckValueIfPresent(newValue)
                case "sessionReplayOnErrorSampleRate":
                    self.sessionReplayOnErrorSampleRate = try! utsSubscriptCheckValueIfPresent(newValue)
                case "touchPrivacy":
                    self.touchPrivacy = try! utsSubscriptCheckValueIfPresent(newValue)
                case "textAndInputPrivacy":
                    self.textAndInputPrivacy = try! utsSubscriptCheckValueIfPresent(newValue)
                case "imagePrivacy":
                    self.imagePrivacy = try! utsSubscriptCheckValueIfPresent(newValue)
                case "enableSwiftUI":
                    self.enableSwiftUI = try! utsSubscriptCheckValue(newValue)
                case "enableLinkRUMKeys":
                    self.enableLinkRUMKeys = try! utsSubscriptCheckValueIfPresent(newValue)
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
        self.sessionReplayOnErrorSampleRate = obj["sessionReplayOnErrorSampleRate"] as! NSNumber?
        self.touchPrivacy = obj["touchPrivacy"] as! String?
        self.textAndInputPrivacy = obj["textAndInputPrivacy"] as! String?
        self.imagePrivacy = obj["imagePrivacy"] as! String?
        self.enableSwiftUI = (obj["enableSwiftUI"] as? Bool) ?? false
        self.enableLinkRUMKeys = obj["enableLinkRUMKeys"] as! [String]?
    }
}
public func stringifyParams(_ params: GCSessionReplayConfig) -> String {
    return JSON.stringify(params) ?? "{}"
}
@objc(UTSSDKModulesGCUniSessionReplayGCUniSessionReplay)
@objcMembers
public class GCUniSessionReplay : NSObject {
    public static func setConfig(_ params: GCSessionReplayConfig) {
        GCSessionReplayNative.setConfig(stringifyParams(params))
    }
}
@objc(UTSSDKModulesGCUniSessionReplayGCSessionReplayTouchPrivacy)
@objcMembers
public class GCSessionReplayTouchPrivacy : NSObject {
    public static var SHOW: String = "show"
    public static var HIDE: String = "hide"
}
@objc(UTSSDKModulesGCUniSessionReplayGCSessionReplayTextAndInputPrivacy)
@objcMembers
public class GCSessionReplayTextAndInputPrivacy : NSObject {
    public static var MASK_SENSITIVE_INPUTS: String = "maskSensitiveInputs"
    public static var MASK_ALL_INPUTS: String = "maskAllInputs"
    public static var MASK_ALL: String = "maskAll"
}
@objc(UTSSDKModulesGCUniSessionReplayGCSessionReplayImagePrivacy)
@objcMembers
public class GCSessionReplayImagePrivacy : NSObject {
    public static var MASK_NON_BUNDLED_ONLY: String = "maskNonBundledOnly"
    public static var MASK_ALL: String = "maskAll"
    public static var MASK_NONE: String = "maskNone"
}
@objc(UTSSDKModulesGCUniSessionReplayGCSessionReplayIOSHook)
@objcMembers
public class GCSessionReplayIOSHook : NSObject, UTSiOSHookProxy {
    public func onCreate() {
        GCSessionReplayNative.installWebViewHook()
    }
}
@objc(UTSSDKModulesGCUniSessionReplayGCSessionReplayConfigJSONObject)
@objcMembers
public class GCSessionReplayConfigJSONObject : NSObject {
    public var sampleRate: NSNumber?
    public var sessionReplayOnErrorSampleRate: NSNumber?
    public var touchPrivacy: String?
    public var textAndInputPrivacy: String?
    public var imagePrivacy: String?
    public var enableSwiftUI: Bool = false
    public var enableLinkRUMKeys: [String]?
}
@objc(UTSSDKModulesGCUniSessionReplayGCUniSessionReplayByJs)
@objcMembers
public class GCUniSessionReplayByJs : GCUniSessionReplay {
    public static func setConfigByJs(_ params: GCSessionReplayConfigJSONObject) {
        return GCUniSessionReplay.setConfig(GCSessionReplayConfig(UTSJSONObject([
            "sampleRate": params.sampleRate,
            "sessionReplayOnErrorSampleRate": params.sessionReplayOnErrorSampleRate,
            "touchPrivacy": params.touchPrivacy,
            "textAndInputPrivacy": params.textAndInputPrivacy,
            "imagePrivacy": params.imagePrivacy,
            "enableSwiftUI": params.enableSwiftUI,
            "enableLinkRUMKeys": params.enableLinkRUMKeys
        ])))
    }
}
@objc(UTSSDKModulesGCUniSessionReplayGCSessionReplayTouchPrivacyByJs)
@objcMembers
public class GCSessionReplayTouchPrivacyByJs : GCSessionReplayTouchPrivacy {
}
@objc(UTSSDKModulesGCUniSessionReplayGCSessionReplayTextAndInputPrivacyByJs)
@objcMembers
public class GCSessionReplayTextAndInputPrivacyByJs : GCSessionReplayTextAndInputPrivacy {
}
@objc(UTSSDKModulesGCUniSessionReplayGCSessionReplayImagePrivacyByJs)
@objcMembers
public class GCSessionReplayImagePrivacyByJs : GCSessionReplayImagePrivacy {
}
@objc(UTSSDKModulesGCUniSessionReplayGCSessionReplayIOSHookByJs)
@objcMembers
public class GCSessionReplayIOSHookByJs : GCSessionReplayIOSHook {
    public func onCreateByJs() {
        return self.onCreate()
    }
}
