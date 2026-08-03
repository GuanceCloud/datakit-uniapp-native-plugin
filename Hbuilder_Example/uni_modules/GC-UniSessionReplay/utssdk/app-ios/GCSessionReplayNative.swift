import Foundation
import DCloudUTSFoundation
import GuanceSDK
import GuanceSessionReplay
import ObjectiveC.runtime
import WebKit

@objc public final class GCSessionReplayNative: NSObject {
    private static let debugLogPrefix = "[DEBUG-SR-BRIDGE-7f81]"
    private static let bridgeScriptPrefix = "/* FTWebViewJavascriptBridge */"
    private static let bridgeReadinessCheck = "(function(){var b=window.FTWebViewJavascriptBridge;if(!b||typeof b.getCapabilities!=='function'){return false;}var c=b.getCapabilities();return typeof c==='string'&&c.indexOf('records')!==-1;})()"
    private static let capturedWebViews = NSHashTable<WKWebView>.weakObjects()
    private static var sessionReplayEnabled = false

    private static let installNativeSessionReplayStartHookOnce: Void = {
        let installed = exchange(
            on: FTRumSessionReplay.self,
            original: NSSelectorFromString("startWithSessionReplayConfig:"),
            replacement: NSSelectorFromString("gc_uniSessionReplay_startWithSessionReplayConfig:")
        )
        debugLog("FTRumSessionReplay start hook installed=\(installed)")
    }()

    private static let installNativeBridgeReceiveHookOnce: Void = {
        let installed = exchange(
            on: FTWKWebViewHandler.self,
            original: NSSelectorFromString("dealReceiveScriptMessage:slotId:info:"),
            replacement: NSSelectorFromString("gc_uniSessionReplay_dealReceiveScriptMessage:slotId:info:")
        )
        debugLog("FTWKWebViewHandler receive hook installed=\(installed)")
    }()

    private static let installHookOnce: Void = {
        debugLog("installing WKWebView load hooks")
        exchange(
            on: WKWebView.self,
            original: #selector(WKWebView.load(_:)),
            replacement: NSSelectorFromString("gc_sessionReplay_loadRequest:")
        )
        exchange(
            on: WKWebView.self,
            original: #selector(WKWebView.loadHTMLString(_:baseURL:)),
            replacement: NSSelectorFromString("gc_sessionReplay_loadHTMLString:baseURL:")
        )
        exchange(
            on: WKWebView.self,
            original: #selector(WKWebView.loadFileURL(_:allowingReadAccessTo:)),
            replacement: NSSelectorFromString("gc_sessionReplay_loadFileURL:allowingReadAccessToURL:")
        )
        debugLog("WKWebView load hooks installed")
    }()

    @objc public static func installWebViewHook() {
        debugLog("installWebViewHook invoked")
        _ = installHookOnce
        _ = installNativeSessionReplayStartHookOnce
        _ = installNativeBridgeReceiveHookOnce
    }

    @objc public static func setConfig(_ json: String?) {
        runOnMainSync {
            FTLog.sharedInstance().registerInnerLogCache(toLogsDirectory: nil, fileNamePrefix: "sessionreplay")

            precondition(Thread.isMainThread, "Session Replay must be initialized on the main thread")
            let params = parseObject(json)
            let activeBeforeStart = isNativeSessionReplayActive()
            debugLog(
                "setConfig entered; isMainThread=\(Thread.isMainThread); activeBeforeStart=\(activeBeforeStart); capturedWebViews=\(capturedWebViews.allObjects.count)"
            )
            if !activeBeforeStart {
                let baseSDKAndRUMReady = isBaseSDKAndRUMReady()
                debugLog("Session Replay prerequisites ready=\(baseSDKAndRUMReady)")
                guard baseSDKAndRUMReady else {
                    NSLog("[GC-UniSessionReplay] Initialize the Mobile SDK and RUM before Session Replay")
                    return
                }
                let config = makeSessionReplayConfig(params)
                debugLog(
                    "starting native Session Replay; sampleRate=\(config.sampleRate); sessionReplayOnErrorSampleRate=\(config.sessionReplayOnErrorSampleRate)"
                )
				let sessionReplayConfig = FTSessionReplayConfig()
				            sessionReplayConfig.sampleRate = 100
				            sessionReplayConfig.textAndInputPrivacy = .maskSensitiveInputs
				            sessionReplayConfig.touchPrivacy = .show
				            sessionReplayConfig.imagePrivacy = .maskNonBundledOnly
				FTRumSessionReplay.shared().start(with: config)
				debugLog("FTRumSessionReplay:\(FTRumSessionReplay.shared())")
                debugLog("native Session Replay start call returned")
            } else {
                debugLog("native Session Replay was already active; preserving its existing configuration")
            }

            sessionReplayEnabled = isNativeSessionReplayActive()
            debugLog(
                "setConfig completed; sessionReplayEnabled=\(sessionReplayEnabled); sessionReplayService=\(nativeSessionReplayServiceClassName()); capturedWebViews=\(capturedWebViews.allObjects.count)"
            )
            guard sessionReplayEnabled else {
                NSLog("[GC-UniSessionReplay] Native Session Replay did not start; WebView bridge preparation was skipped")
                return
            }

            for webView in capturedWebViews.allObjects {
                prepare(webView: webView, includeCurrentDocument: true)
            }
        }
    }

    fileprivate static func capture(
        _ webView: WKWebView,
        isUniAppLoad: Bool,
        loadDescription: String
    ) {
        runOnMainSync {
            let wasCaptured = capturedWebViews.contains(webView)
            debugLog(
                "load observed; webView=\(webViewIdentifier(webView)); \(loadDescription); matchesUniApp=\(isUniAppLoad); wasCaptured=\(wasCaptured); sessionReplayEnabled=\(sessionReplayEnabled)"
            )
            guard wasCaptured || isUniAppLoad else {
                debugLog("load ignored because it does not match a UniApp WebView")
                return
            }
            enableSafariWebInspector(for: webView)
            capturedWebViews.add(webView)
            debugLog(
                "WebView captured; webView=\(webViewIdentifier(webView)); capturedWebViews=\(capturedWebViews.allObjects.count)"
            )
            if sessionReplayEnabled {
                prepare(webView: webView, includeCurrentDocument: false)
            }
        }
    }

    fileprivate static func isUniAppURL(_ url: URL?) -> Bool {
        guard let url else {
            return false
        }
        let path = url.path.lowercased()
        return path.hasSuffix("/__uniappview.html") ||
            path.hasSuffix("/__uniapptabbar.html")
    }

    fileprivate static func isUniAppHTML(_ html: String) -> Bool {
        let markers = [
            "__UniViewStartTime__",
            "/*__uniConfig*/",
            "uni-app-view.umd.js",
            "__uniappes6.js",
            "uniapp://ready"
        ]
        return markers.contains(where: html.contains)
    }

    private static func exchange(
        on type: AnyClass,
        original: Selector,
        replacement: Selector
    ) -> Bool {
        guard
            let originalMethod = class_getInstanceMethod(type, original),
            let replacementMethod = class_getInstanceMethod(type, replacement)
        else {
            NSLog("[GC-UniSessionReplay] Unable to install hook for %@", NSStringFromSelector(original))
            return false
        }
        method_exchangeImplementations(originalMethod, replacementMethod)
        return true
    }

    fileprivate static func debugLog(_ message: String) {
        console.log(debugLogPrefix + " " + message)
    }

    fileprivate static func bridgeEventName(_ message: AnyObject?) -> String? {
        if let dictionary = message as? [String: Any] {
            return dictionary["name"] as? String
        }
        guard
            let json = message as? String,
            let data = json.data(using: .utf8),
            let dictionary = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else {
            return nil
        }
        return dictionary["name"] as? String
    }

    private static func webViewIdentifier(_ webView: WKWebView) -> String {
        String(describing: ObjectIdentifier(webView))
    }

    private static func runOnMainSync(_ block: () -> Void) {
        if Thread.isMainThread {
            block()
        } else {
            DispatchQueue.main.sync(execute: block)
        }
    }

    private static func enableSafariWebInspector(for webView: WKWebView) {
        if #available(iOS 16.4, *) {
            webView.isInspectable = true
        }
    }

    private static func parseObject(_ json: String?) -> [String: Any] {
        guard
            let json,
            let data = json.data(using: .utf8),
            let result = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else {
            return [:]
        }
        return result
    }

    private static func number(_ value: Any?) -> Int? {
        switch value {
        case let number as NSNumber:
            return number.intValue
        case let string as String:
            return Int(string)
        default:
            return nil
        }
    }

    private static func boolean(_ value: Any?, default defaultValue: Bool) -> Bool {
        switch value {
        case let bool as Bool:
            return bool
        case let number as NSNumber:
            return number.boolValue
        case let string as String:
            switch string.lowercased() {
            case "true", "1", "yes":
                return true
            case "false", "0", "no":
                return false
            default:
                return defaultValue
            }
        default:
            return defaultValue
        }
    }

    private static func strings(_ value: Any?) -> [String]? {
        if let values = value as? [String] {
            return values
        }
        if let values = value as? [Any] {
            return values.compactMap { $0 as? String }
        }
        return nil
    }

    private static func normalized(_ value: Any?) -> String? {
        (value as? String)?
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .lowercased()
    }

    private static func makeSessionReplayConfig(_ params: [String: Any]) -> FTSessionReplayConfig {
        let config = FTSessionReplayConfig()

        if let sampleRate = number(params["sampleRate"]) {
            config.sampleRate = Int32(max(0, min(100, sampleRate)))
        }
        if let errorSampleRate = number(params["sessionReplayOnErrorSampleRate"]) {
            config.sessionReplayOnErrorSampleRate = Int32(max(0, min(100, errorSampleRate)))
        }

        switch normalized(params["touchPrivacy"]) {
        case "show":
            config.touchPrivacy = FTTouchPrivacyLevel(rawValue: 0)!
        case "hide":
            config.touchPrivacy = FTTouchPrivacyLevel(rawValue: 1)!
        default:
            break
        }

        switch normalized(params["textAndInputPrivacy"]) {
        case "masksensitiveinputs":
            config.textAndInputPrivacy = FTTextAndInputPrivacyLevel(rawValue: 0)!
        case "maskallinputs":
            config.textAndInputPrivacy = FTTextAndInputPrivacyLevel(rawValue: 1)!
        case "maskall":
            config.textAndInputPrivacy = FTTextAndInputPrivacyLevel(rawValue: 2)!
        default:
            break
        }

        switch normalized(params["imagePrivacy"]) {
        case "masknonbundledonly":
            config.imagePrivacy = FTImagePrivacyLevel(rawValue: 0)!
        case "maskall":
            config.imagePrivacy = FTImagePrivacyLevel(rawValue: 1)!
        case "masknone":
            config.imagePrivacy = FTImagePrivacyLevel(rawValue: 2)!
        default:
            break
        }

        config.enableSwiftUI = boolean(params["enableSwiftUI"], default: config.enableSwiftUI)
        if let keys = strings(params["enableLinkRUMKeys"]) {
            config.enableLinkRUMKeys = keys
        }
        return config
    }

    private static func isNativeSessionReplayActive() -> Bool {
        nativeSessionReplayService() != nil
    }

    private static func nativeSessionReplayService() -> AnyObject? {
        guard
            let managerClass = NSClassFromString("FTModuleManager"),
            let manager = (managerClass as AnyObject)
                .perform(NSSelectorFromString("sharedInstance"))?
                .takeUnretainedValue(),
            let replayProtocol = objc_getProtocol("FTSRWebTrackingProtocol")
        else {
            return nil
        }
        return (manager as AnyObject)
            .perform(NSSelectorFromString("getRegisterService:"), with: replayProtocol)?
            .takeUnretainedValue()
    }

    private static func nativeSessionReplayServiceClassName() -> String {
        guard let service = nativeSessionReplayService() else {
            return "none"
        }
        return String(describing: type(of: service))
    }

    private static func isBaseSDKAndRUMReady() -> Bool {
        guard let agentClass = NSClassFromString("FTMobileAgent") else {
            return false
        }

        let installStateSelector = NSSelectorFromString("checkInstallState")
        guard let installStateMethod = class_getClassMethod(agentClass, installStateSelector) else {
            return false
        }
        typealias InstallStateFunction = @convention(c) (AnyClass, Selector) -> Bool
        let installState = unsafeBitCast(
            method_getImplementation(installStateMethod),
            to: InstallStateFunction.self
        )
        guard installState(agentClass, installStateSelector) else {
            return false
        }

        guard
            let agent = (agentClass as AnyObject)
                .perform(NSSelectorFromString("sharedInstance"))?
                .takeUnretainedValue(),
            (agent as AnyObject)
                .perform(NSSelectorFromString("rumConfig"))?
                .takeUnretainedValue() != nil
        else {
            return false
        }
        return true
    }

    private static func prepare(webView: WKWebView, includeCurrentDocument: Bool) {
        let handler = FTWKWebViewHandler.sharedInstance()
        let existingBridgeSource = ftBridgeSource(in: webView)
        let existingBridgeHasRecords = existingBridgeSource?.contains("records") ?? false
        debugLog(
            "prepare; webView=\(webViewIdentifier(webView)); includeCurrentDocument=\(includeCurrentDocument); existingBridge=\(existingBridgeSource != nil); existingBridgeHasRecords=\(existingBridgeHasRecords)"
        )
        if existingBridgeSource != nil && existingBridgeSource?.contains("records") == false {
            debugLog("refreshing an existing bridge without records capability")
            replaceBridgeWithoutSessionReplayCapability(handler: handler, webView: webView)
        }
        handler.enable(webView)

        let bridgeSource = ftBridgeSource(in: webView)
        debugLog(
            "bridge enabled; webView=\(webViewIdentifier(webView)); recordsCapableUserScript=\(bridgeSource?.contains("records") ?? false)"
        )

        guard includeCurrentDocument else {
            return
        }

        guard let bridgeSource, bridgeSource.contains("records") else {
            NSLog("[GC-UniSessionReplay] No records-capable bridge script was found for WebView %llu", webView.hash)
            return
        }

        webView.evaluateJavaScript(bridgeReadinessCheck) { result, error in
            let bridgeReady = (result as? Bool) == true
            debugLog(
                "current document bridge readiness; webView=\(webViewIdentifier(webView)); ready=\(bridgeReady); error=\(error?.localizedDescription ?? "none")"
            )
            if bridgeReady {
                return
            }
            debugLog("injecting records-capable bridge into the current document")
            webView.evaluateJavaScript(bridgeSource) { _, error in
                if let error {
                    NSLog("[GC-UniSessionReplay] Failed to inject the bridge into the current document: %@", error.localizedDescription)
                } else {
                    debugLog("current document bridge injection completed; webView=\(webViewIdentifier(webView))")
                }
            }
        }
    }

    private static func ftBridgeSource(in webView: WKWebView) -> String? {
        webView.configuration.userContentController.userScripts
            .last(where: { $0.source.hasPrefix(bridgeScriptPrefix) })?
            .source
    }

    private static func replaceBridgeWithoutSessionReplayCapability(
        handler: FTWKWebViewHandler,
        webView: WKWebView
    ) {
        let disableSelector = NSSelectorFromString("disableWebView:")
        guard handler.responds(to: disableSelector) else {
            NSLog("[GC-UniSessionReplay] The existing WebView bridge cannot be refreshed")
            return
        }
        debugLog("removing the existing bridge before records-capable replacement; webView=\(webViewIdentifier(webView))")
        handler.perform(disableSelector, with: webView)
    }
}

private extension WKWebView {
    @objc(gc_sessionReplay_loadRequest:)
    dynamic func gc_sessionReplay_loadRequest(_ request: URLRequest) -> WKNavigation? {
        GCSessionReplayNative.capture(
            self,
            isUniAppLoad: GCSessionReplayNative.isUniAppURL(request.url),
            loadDescription: "request path=\(request.url?.path ?? "nil")"
        )
        return gc_sessionReplay_loadRequest(request)
    }

    @objc(gc_sessionReplay_loadHTMLString:baseURL:)
    dynamic func gc_sessionReplay_loadHTMLString(_ string: String, baseURL: URL?) -> WKNavigation? {
        let matchedHTML = GCSessionReplayNative.isUniAppHTML(string)
        let matchedURL = GCSessionReplayNative.isUniAppURL(baseURL)
        GCSessionReplayNative.capture(
            self,
            isUniAppLoad: matchedHTML || matchedURL,
            loadDescription: "HTML length=\(string.utf8.count); basePath=\(baseURL?.path ?? "nil"); matchedHTML=\(matchedHTML); matchedURL=\(matchedURL)"
        )
        return gc_sessionReplay_loadHTMLString(string, baseURL: baseURL)
    }

    @objc(gc_sessionReplay_loadFileURL:allowingReadAccessToURL:)
    dynamic func gc_sessionReplay_loadFileURL(_ url: URL, allowingReadAccessTo readAccessURL: URL) -> WKNavigation? {
        GCSessionReplayNative.capture(
            self,
            isUniAppLoad: GCSessionReplayNative.isUniAppURL(url),
            loadDescription: "file URL path=\(url.path)"
        )
        return gc_sessionReplay_loadFileURL(url, allowingReadAccessTo: readAccessURL)
    }
}

private extension FTRumSessionReplay {
    @objc(gc_uniSessionReplay_startWithSessionReplayConfig:)
    dynamic func gc_uniSessionReplay_startWithSessionReplayConfig(
        _ config: FTSessionReplayConfig
    ) {
        GCSessionReplayNative.debugLog(
            "FTRumSessionReplay.startWithSessionReplayConfig entered; sampleRate=\(config.sampleRate); sessionReplayOnErrorSampleRate=\(config.sessionReplayOnErrorSampleRate)"
        )
        gc_uniSessionReplay_startWithSessionReplayConfig(config)
        GCSessionReplayNative.debugLog(
            "FTRumSessionReplay.startWithSessionReplayConfig returned"
        )
    }
}

private extension FTWKWebViewHandler {
    @objc(gc_uniSessionReplay_dealReceiveScriptMessage:slotId:info:)
    dynamic func gc_uniSessionReplay_dealReceiveScriptMessage(
        _ message: AnyObject?,
        slotId: Int64,
        info: AnyObject?
    ) {
        if GCSessionReplayNative.bridgeEventName(message) == "session_replay" {
            GCSessionReplayNative.debugLog(
                "FTWKWebViewHandler received session_replay; slotId=\(slotId)"
            )
        }
        gc_uniSessionReplay_dealReceiveScriptMessage(
            message,
            slotId: slotId,
            info: info
        )
    }
}
