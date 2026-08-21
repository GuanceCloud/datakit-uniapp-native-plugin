import Foundation

@objc(GuanceUniAppCoreHostBridge)
public final class GuanceUniAppCoreHostBridge: NSObject {
    @objc(handleCommand:payload:)
    public static func handleCommand(
        _ command: NSString,
        payload: NSString?
    ) -> NSString? {
        let json = payload.map { String($0) }

        switch command as String {
        case "mobile.sdkConfig":
            return GCUniPluginNative.sdkConfig(json) ? "true" : "false"
        case "mobile.bindRUMUser":
            bindRUMUser(json)
        case "mobile.unbindRUMUserData":
            GCUniPluginNative.unbindRUMUserData()
        case "mobile.appendGlobalContext":
            GCUniPluginNative.appendGlobalContext(json)
        case "mobile.appendRUMGlobalContext":
            GCUniPluginNative.appendRUMGlobalContext(json)
        case "mobile.appendLogGlobalContext":
            GCUniPluginNative.appendLogGlobalContext(json)
        case "mobile.appendBridgeContext":
            GCUniPluginNative.appendBridgeContext(json)
        case "mobile.flushSyncData":
            GCUniPluginNative.flushSyncData()
        case "mobile.clearAllData":
            GCUniPluginNative.clearAllData()
        case "mobile.shutDown":
            GCUniPluginNative.shutDown()
        case "rum.setConfig":
            return GCUniPluginNative.setRumConfig(json) ? "true" : "false"
        case "rum.startAction":
            GCUniPluginNative.startAction(json)
        case "rum.addAction":
            GCUniPluginNative.addAction(json)
        case "rum.onCreateView":
            GCUniPluginNative.onCreateView(json)
        case "rum.startView":
            GCUniPluginNative.startView(json)
        case "rum.stopView":
            GCUniPluginNative.stopView(json)
        case "rum.addError":
            GCUniPluginNative.addError(json)
        case "rum.startResource":
            GCUniPluginNative.startResource(json)
        case "rum.stopResource":
            GCUniPluginNative.stopResource(json)
        case "rum.addResource":
            GCUniPluginNative.addResource(json)
        case "logger.setConfig":
            GCUniPluginNative.setLoggerConfig(json)
        case "logger.logging":
            GCUniPluginNative.logging(json)
        case "tracer.setConfig":
            GCUniPluginNative.setTraceConfig(json)
        case "tracer.getTraceHeader":
            return GCUniPluginNative.getTraceHeader(json) as NSString?
        default:
            print("[GC-UniPlugin] Unsupported HostBridge command: \(command)")
        }
        return nil
    }

    private static func bindRUMUser(_ json: String?) {
        guard
            let json,
            let data = json.data(using: .utf8),
            let values = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
            let userId = values["userId"] as? String
        else {
            print("[GC-UniPlugin] HostBridge bindRUMUser requires userId")
            return
        }

        GCUniPluginNative.bindRUMUser(
            userId,
            values["userName"] as? String,
            values["userEmail"] as? String,
            values["extraJson"] as? String
        )
    }
}
