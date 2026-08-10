import Foundation

@objc(GuanceUniAppSessionReplayHostBridge)
public final class GuanceUniAppSessionReplayHostBridge: NSObject {
    @objc(handleCommand:payload:)
    public static func handleCommand(
        _ command: NSString,
        payload: NSString?
    ) -> NSString? {
        guard sessionReplayIsAvailable() else {
            return nil
        }

        switch command as String {
        case "sessionReplay.installWebViewHook":
            GCSessionReplayNative.installWebViewHook()
        case "sessionReplay.setConfig":
            GCSessionReplayNative.setConfig(payload.map { String($0) })
        default:
            NSLog("[GC-UniSessionReplay] Unsupported HostBridge command: %@", command)
        }
        return nil
    }

    private static func sessionReplayIsAvailable() -> Bool {
        let requiredClasses = [
            "FTRumSessionReplay",
            "FTSessionReplayConfig"
        ]
        let missingClasses = requiredClasses.filter { NSClassFromString($0) == nil }
        guard missingClasses.isEmpty else {
            NSLog(
                "[GC-UniSessionReplay] Session Replay classes are unavailable (%@). CocoaPods hosts must include GuanceSDK/Agent and GuanceSDK/SessionReplay; SPM and XCFramework hosts must link GuanceSessionReplay.",
                missingClasses.joined(separator: ", ")
            )
            return false
        }
        return true
    }
}
