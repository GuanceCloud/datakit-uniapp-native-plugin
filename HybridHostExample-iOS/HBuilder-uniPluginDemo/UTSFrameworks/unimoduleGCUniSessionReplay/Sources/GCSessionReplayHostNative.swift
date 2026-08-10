import Foundation

@objc public final class GCSessionReplayHostNative: NSObject {
    private static let bridgeClassName = "GuanceUniAppSessionReplayHostBridge"
    private static let commandSelector = NSSelectorFromString("handleCommand:payload:")
    private static var loggedUnavailableBridge = false

    private static func invoke(_ command: String, payload: String? = nil) {
        guard let bridge = NSClassFromString(bridgeClassName) as? NSObject.Type else {
            logUnavailableBridge()
            return
        }
        guard bridge.responds(to: commandSelector) else {
            logUnavailableBridge()
            return
        }

        _ = bridge.perform(
            commandSelector,
            with: command as NSString,
            with: payload.map { $0 as NSString }
        )
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
        invoke("sessionReplay.installWebViewHook")
    }

    @objc public static func setConfig(_ json: String?) {
        invoke("sessionReplay.setConfig", payload: json)
    }
}
