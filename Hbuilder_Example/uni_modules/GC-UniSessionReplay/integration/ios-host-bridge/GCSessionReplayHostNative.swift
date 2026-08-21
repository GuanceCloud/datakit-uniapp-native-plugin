import Foundation

@objc public final class GCSessionReplayHostNative: NSObject {
    private static let bridgeClassName = "GuanceUniAppSessionReplayHostBridge"
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
            "[GC-UniSessionReplay] %@ is unavailable. Link the static GuanceUniAppHostBridge before loading the UniApp module; it requires GuanceSDK/Agent and GuanceSDK/SessionReplay for CocoaPods.",
            bridgeClassName
        )
    }

    @objc public static func installWebViewHook() {
        _ = invoke("sessionReplay.installWebViewHook")
    }

    @discardableResult
    @objc public static func setConfig(_ json: String?) -> Bool {
        invoke("sessionReplay.setConfig", payload: json) == "true"
    }
}
