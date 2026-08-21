import Foundation

@objc public final class GCUniPluginHostNative: NSObject {
    private static let bridgeClassName = "GuanceUniAppCoreHostBridge"
    private static let commandSelector = NSSelectorFromString("handleCommand:payload:")
    private static var loggedUnavailableBridge = false

    private static func invoke(_ command: String, payload: String? = nil) -> String? {
        guard let bridge = NSClassFromString(bridgeClassName) as? NSObject.Type else {
            logUnavailableBridge()
            return nil
        }
        guard bridge.responds(to: commandSelector) else {
            logUnavailableBridge()
            return nil
        }

        let value = bridge
            .perform(
                commandSelector,
                with: command as NSString,
                with: payload.map { $0 as NSString }
            )?
            .takeUnretainedValue()
        return value as? String
    }

    private static func logUnavailableBridge() {
        guard !loggedUnavailableBridge else {
            return
        }
        loggedUnavailableBridge = true
        NSLog(
            "[GC-UniPlugin] %@ is unavailable. Link the static GuanceUniAppHostBridge before loading the UniApp module.",
            bridgeClassName
        )
    }

    private static func stringify(_ value: Any) -> String? {
        guard JSONSerialization.isValidJSONObject(value) else {
            return nil
        }
        guard let data = try? JSONSerialization.data(withJSONObject: value) else {
            return nil
        }
        return String(data: data, encoding: .utf8)
    }

    @discardableResult
    @objc public static func sdkConfig(_ json: String?) -> Bool {
        invoke("mobile.sdkConfig", payload: json) == "true"
    }

    @objc public static func bindRUMUser(
        _ userId: String,
        _ userName: String?,
        _ userEmail: String?,
        _ extraJson: String?
    ) {
        var payload: [String: Any] = ["userId": userId]
        if let userName {
            payload["userName"] = userName
        }
        if let userEmail {
            payload["userEmail"] = userEmail
        }
        if let extraJson {
            payload["extraJson"] = extraJson
        }
        _ = invoke("mobile.bindRUMUser", payload: stringify(payload))
    }

    @objc public static func unbindRUMUserData() {
        _ = invoke("mobile.unbindRUMUserData")
    }

    @objc public static func appendGlobalContext(_ json: String?) {
        _ = invoke("mobile.appendGlobalContext", payload: json)
    }

    @objc public static func appendRUMGlobalContext(_ json: String?) {
        _ = invoke("mobile.appendRUMGlobalContext", payload: json)
    }

    @objc public static func appendLogGlobalContext(_ json: String?) {
        _ = invoke("mobile.appendLogGlobalContext", payload: json)
    }

    @objc public static func appendBridgeContext(_ json: String?) {
        _ = invoke("mobile.appendBridgeContext", payload: json)
    }

    @objc public static func flushSyncData() {
        _ = invoke("mobile.flushSyncData")
    }

    @objc public static func clearAllData() {
        _ = invoke("mobile.clearAllData")
    }

    @objc public static func shutDown() {
        _ = invoke("mobile.shutDown")
    }

    @discardableResult
    @objc public static func setRumConfig(_ json: String?) -> Bool {
        invoke("rum.setConfig", payload: json) == "true"
    }

    @objc public static func startAction(_ json: String?) {
        _ = invoke("rum.startAction", payload: json)
    }

    @objc public static func addAction(_ json: String?) {
        _ = invoke("rum.addAction", payload: json)
    }

    @objc public static func onCreateView(_ json: String?) {
        _ = invoke("rum.onCreateView", payload: json)
    }

    @objc public static func startView(_ json: String?) {
        _ = invoke("rum.startView", payload: json)
    }

    @objc public static func stopView(_ json: String?) {
        _ = invoke("rum.stopView", payload: json)
    }

    @objc public static func addError(_ json: String?) {
        _ = invoke("rum.addError", payload: json)
    }

    @objc public static func startResource(_ json: String?) {
        _ = invoke("rum.startResource", payload: json)
    }

    @objc public static func stopResource(_ json: String?) {
        _ = invoke("rum.stopResource", payload: json)
    }

    @objc public static func addResource(_ json: String?) {
        _ = invoke("rum.addResource", payload: json)
    }

    @objc public static func setLoggerConfig(_ json: String?) {
        _ = invoke("logger.setConfig", payload: json)
    }

    @objc public static func logging(_ json: String?) {
        _ = invoke("logger.logging", payload: json)
    }

    @objc public static func setTraceConfig(_ json: String?) {
        _ = invoke("tracer.setConfig", payload: json)
    }

    @objc public static func getTraceHeader(_ json: String?) -> String? {
        invoke("tracer.getTraceHeader", payload: json)
    }
}
