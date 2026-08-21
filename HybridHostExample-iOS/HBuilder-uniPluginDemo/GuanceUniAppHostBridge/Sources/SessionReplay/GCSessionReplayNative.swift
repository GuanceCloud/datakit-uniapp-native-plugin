import Foundation
#if canImport(DCloudUTSFoundation)
import DCloudUTSFoundation
#endif
#if GUANCE_UNI_COCOAPODS_SESSION_REPLAY
import GuanceSDK
#elseif canImport(GuanceSessionReplay)
import GuanceSessionReplay
#else
#error("GC-UniSessionReplay requires GuanceSessionReplay, or GuanceSDK/SessionReplay with -DGUANCE_UNI_COCOAPODS_SESSION_REPLAY.")
#endif
import ObjectiveC.runtime
import WebKit

@objc public final class GCSessionReplayNative: NSObject {
    private static let bridgeScriptPrefix = "/* FTWebViewJavascriptBridge */"
    private static let bridgeReadinessCheck = "(function(){var b=window.FTWebViewJavascriptBridge;if(!b||typeof b.getCapabilities!=='function'){return false;}var c=b.getCapabilities();return typeof c==='string'&&c.indexOf('records')!==-1;})()"
    private static let capturedWebViews = NSHashTable<WKWebView>.weakObjects()
    private static var sessionReplayEnabled = false

    private static func logInfo(_ message: String) {
#if DEBUG
#if canImport(DCloudUTSFoundation)
        console.log(message)
#else
        print(message)
#endif
#endif
    }

    private static func logError(_ message: String) {
#if canImport(DCloudUTSFoundation)
        console.error(message)
#else
        print(message)
#endif
    }

    private static let installHookOnce: Bool = {
        let results = [
            exchange(
            on: WKWebView.self,
            original: #selector(WKWebView.load(_:)),
            replacement: NSSelectorFromString("gc_sessionReplay_loadRequest:")
            ),
            exchange(
            on: WKWebView.self,
            original: #selector(WKWebView.loadHTMLString(_:baseURL:)),
            replacement: NSSelectorFromString("gc_sessionReplay_loadHTMLString:baseURL:")
            ),
            exchange(
            on: WKWebView.self,
            original: #selector(WKWebView.loadFileURL(_:allowingReadAccessTo:)),
            replacement: NSSelectorFromString("gc_sessionReplay_loadFileURL:allowingReadAccessToURL:")
            )
        ]
        let installed = results.allSatisfy { $0 }
        if installed {
            logInfo("[FTLog] GC-UniSessionReplay WebView hooks installed successfully")
        } else {
            logError("[FTLog] GC-UniSessionReplay WebView hook installation failed")
        }
        return installed
    }()

    @objc public static func installWebViewHook() {
        logInfo("[FTLog] GC-UniSessionReplay WebView hook installation requested")
        _ = installHookOnce
    }

    @discardableResult
    @objc public static func setConfig(_ json: String?) -> Bool {
        var initialized = false
        runOnMainSync {
            precondition(Thread.isMainThread, "Session Replay must be initialized on the main thread")
            logInfo("[FTLog] GC-UniSessionReplay initialization requested")
            let params = parseObject(json)
            let activeBeforeStart = isNativeSessionReplayActive()
            if !activeBeforeStart {
                let baseSDKAndRUMReady = isBaseSDKAndRUMReady()
                guard baseSDKAndRUMReady else {
                    logError("[FTLog] GC-UniSessionReplay initialization failed: Mobile SDK or RUM is not ready")
                    return
                }
                let config = makeSessionReplayConfig(params)
				FTRumSessionReplay.shared().start(with: config)
            }

            sessionReplayEnabled = isNativeSessionReplayActive()
            guard sessionReplayEnabled else {
                logError("[FTLog] GC-UniSessionReplay initialization failed: native service was not registered")
                return
            }
            initialized = true
            logInfo("[FTLog] GC-UniSessionReplay initialized successfully")

            let existingWebViews = capturedWebViews.allObjects
            logInfo("[FTLog] GC-UniSessionReplay preparing \(existingWebViews.count) previously captured WebView(s)")
            for webView in existingWebViews {
                prepare(webView: webView, includeCurrentDocument: true)
            }
        }
        return initialized
    }

    fileprivate static func capture(
        _ webView: WKWebView,
        isUniAppLoad: Bool,
        loadTarget: String
    ) {
        runOnMainSync {
            let wasCaptured = capturedWebViews.contains(webView)
            guard wasCaptured || isUniAppLoad else {
                logInfo("[FTLog] GC-UniSessionReplay WebView load ignored: id=\(webView.hash), target=\(loadTarget), reason=not-UniApp")
                return
            }
            enableSafariWebInspector(for: webView)
            capturedWebViews.add(webView)
            let reason = wasCaptured ? "previously-captured" : "UniApp-load"
            logInfo("[FTLog] GC-UniSessionReplay WebView load captured: id=\(webView.hash), target=\(loadTarget), reason=\(reason)")
            if sessionReplayEnabled {
                prepare(webView: webView, includeCurrentDocument: false)
            } else {
                logInfo("[FTLog] GC-UniSessionReplay WebView bridge preparation deferred until initialization: id=\(webView.hash)")
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
            logError("[FTLog] GC-UniSessionReplay unable to install hook for \(NSStringFromSelector(original))")
            return false
        }
        method_exchangeImplementations(originalMethod, replacementMethod)
        logInfo("[FTLog] GC-UniSessionReplay installed WebView hook: \(NSStringFromSelector(original))")
        return true
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
        logInfo("[FTLog] GC-UniSessionReplay preparing WebView bridge: id=\(webView.hash), includeCurrentDocument=\(includeCurrentDocument)")
        guard let handler = webViewHandler() else {
            logError("[FTLog] GC-UniSessionReplay FTWKWebViewHandler is unavailable; initialize GC-UniPlugin before Session Replay")
            return
        }
        let existingBridgeSource = ftBridgeSource(in: webView)
        if existingBridgeSource != nil && existingBridgeSource?.contains("records") == false {
            replaceBridgeWithoutSessionReplayCapability(handler: handler, webView: webView)
        }
        enableBridge(handler: handler, webView: webView)

        let bridgeSource = ftBridgeSource(in: webView)
        guard let bridgeSource, bridgeSource.contains("records") else {
            logError("[FTLog] GC-UniSessionReplay no records-capable bridge script was found for WebView \(webView.hash)")
            return
        }

        guard includeCurrentDocument else {
            logInfo("[FTLog] GC-UniSessionReplay records bridge registered for next WebView document: id=\(webView.hash)")
            return
        }

        webView.evaluateJavaScript(bridgeReadinessCheck) { result, error in
            if let error {
                logError("[FTLog] GC-UniSessionReplay current document bridge check failed: id=\(webView.hash), error=\(error.localizedDescription)")
            }
            let bridgeReady = (result as? Bool) == true
            if bridgeReady {
                logInfo("[FTLog] GC-UniSessionReplay records bridge already active in current WebView document: id=\(webView.hash)")
                return
            }
            webView.evaluateJavaScript(bridgeSource) { _, error in
                if let error {
                    logError("[FTLog] GC-UniSessionReplay failed to inject the bridge into the current document: \(error.localizedDescription)")
                } else {
                    logInfo("[FTLog] GC-UniSessionReplay records bridge injected into current WebView document: id=\(webView.hash)")
                }
            }
        }
    }

    private static func ftBridgeSource(in webView: WKWebView) -> String? {
        webView.configuration.userContentController.userScripts
            .last(where: { $0.source.hasPrefix(bridgeScriptPrefix) })?
            .source
    }

    private static func webViewHandler() -> NSObject? {
        guard
            let handlerClass = NSClassFromString("FTWKWebViewHandler"),
            let handler = (handlerClass as AnyObject)
                .perform(NSSelectorFromString("sharedInstance"))?
                .takeUnretainedValue() as? NSObject
        else {
            return nil
        }
        return handler
    }

    private static func enableBridge(handler: NSObject, webView: WKWebView) {
        let enableSelector = NSSelectorFromString("enableWebView:")
        guard handler.responds(to: enableSelector) else {
            logError("[FTLog] GC-UniSessionReplay FTWKWebViewHandler cannot enable the UniApp WebView")
            return
        }
        handler.perform(enableSelector, with: webView)
    }

    private static func replaceBridgeWithoutSessionReplayCapability(
        handler: NSObject,
        webView: WKWebView
    ) {
        let disableSelector = NSSelectorFromString("disableWebView:")
        guard handler.responds(to: disableSelector) else {
            logError("[FTLog] GC-UniSessionReplay existing WebView bridge cannot be refreshed")
            return
        }
        handler.perform(disableSelector, with: webView)
    }
}

private extension WKWebView {
    @objc(gc_sessionReplay_loadRequest:)
    dynamic func gc_sessionReplay_loadRequest(_ request: URLRequest) -> WKNavigation? {
        GCSessionReplayNative.capture(
            self,
            isUniAppLoad: GCSessionReplayNative.isUniAppURL(request.url),
            loadTarget: request.url?.absoluteString ?? "request-without-URL"
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
            loadTarget: baseURL?.absoluteString ?? "HTML-string"
        )
        return gc_sessionReplay_loadHTMLString(string, baseURL: baseURL)
    }

    @objc(gc_sessionReplay_loadFileURL:allowingReadAccessToURL:)
    dynamic func gc_sessionReplay_loadFileURL(_ url: URL, allowingReadAccessTo readAccessURL: URL) -> WKNavigation? {
        GCSessionReplayNative.capture(
            self,
            isUniAppLoad: GCSessionReplayNative.isUniAppURL(url),
            loadTarget: url.absoluteString
        )
        return gc_sessionReplay_loadFileURL(url, allowingReadAccessTo: readAccessURL)
    }
}
