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
            return GCSessionReplayNative.setConfig(payload.map { String($0) }) ? "true" : "false"
        default:
            print("[GC-UniSessionReplay] Unsupported HostBridge command: \(command)")
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
            print(
                "[GC-UniSessionReplay] Session Replay classes are unavailable (\(missingClasses.joined(separator: ", "))). CocoaPods hosts must include GuanceSDK/Agent and GuanceSDK/SessionReplay; SPM and XCFramework hosts must link GuanceSessionReplay."
            )
            return false
        }
        return true
    }
}
