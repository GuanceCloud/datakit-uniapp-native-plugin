import webview from '@ohos.web.webview';
import { NodeRenderType } from '@kit.ArkUI';
import {
  NativeEmbedBuilderOptions,
  defineNativeEmbed
} from '@dcloudio/uni-app-runtime';
import { FTSDK, FTWebViewHandler } from '@guancecloud/ft_sdk';

interface GCNativeWebViewBuilderOptions extends NativeEmbedBuilderOptions {
  controller: webview.WebviewController;
  src: string;
  viewName?: string;
  enableBridgeCompatibilityCheck?: boolean;
}

/**
 * Test-only receiver used to prove that a pre-existing JavaScript bridge and
 * FTWebViewHandler's bridge can coexist on one WebviewController.
 */
class GCNativeWebViewBaseBridge {
  ping(): string {
    return 'gc-native-webview-base-bridge';
  }
}

/**
 * Harmony-only WebView using the same controller injection and loading path as
 * UniApp's built-in WebView native component.
 */
@Component
struct GCNativeWebView {
  @Prop src: string;
  @Prop viewName: string;
  @Prop enableBridgeCompatibilityCheck: boolean;
  controller?: webview.WebviewController;
  private handler: FTWebViewHandler = new FTWebViewHandler();
  private baseBridge: GCNativeWebViewBaseBridge = new GCNativeWebViewBaseBridge();
  private didRegisterBaseBridge = false;
  private didAttachBridge = false;

  aboutToDisappear() {
    this.handler.clearWebController();
  }

  private registerBaseJavaScriptBridge(): void {
    if (!this.enableBridgeCompatibilityCheck || this.didRegisterBaseBridge) {
      return;
    }
    const controller = this.controller;
    if (controller === null || controller === undefined) {
      return;
    }
    try {
      // This deliberately uses a different name from FTWebViewHandler's
      // FTWebViewJavascriptBridge. It represents a bridge already owned by
      // the host application before RUM is attached.
      controller.registerJavaScriptProxy(
        this.baseBridge,
        '__gc_base_bridge__',
        ['ping'],
        []
      );
      this.didRegisterBaseBridge = true;
      console.info('[GC-UniPlugin] base JavaScript bridge registered');
    } catch (error) {
      console.error('[GC-UniPlugin] base JavaScript bridge registration failed:', error);
    }
  }

  private logBridgeCompatibility(): void {
    if (!this.enableBridgeCompatibilityCheck) {
      return;
    }
    const controller = this.controller;
    if (controller === null || controller === undefined) {
      return;
    }
    // The result is emitted through Web.onConsole below, so it is visible in
    // the Harmony IDE log without changing the page served by the customer.
    controller.runJavaScript(`
      (function () {
        var baseBridge = window.__gc_base_bridge__;
        var result = {
          baseMethod: typeof (baseBridge && baseBridge.ping),
          rumMethod: typeof (window.FTWebViewJavascriptBridge && window.FTWebViewJavascriptBridge.sendEvent)
        };
        try {
          var pingResult = baseBridge && baseBridge.ping ? baseBridge.ping() : null;
          if (pingResult && typeof pingResult.then === 'function') {
            pingResult.then(function (value) {
              result.baseResult = String(value);
              console.log('[GC-UniPlugin] bridge-check ' + JSON.stringify(result));
            }).catch(function (error) {
              result.baseError = String(error);
              console.log('[GC-UniPlugin] bridge-check ' + JSON.stringify(result));
            });
            return;
          }
          result.baseResult = String(pingResult);
        } catch (error) {
          result.baseError = String(error);
        }
        console.log('[GC-UniPlugin] bridge-check ' + JSON.stringify(result));
      })();
    `);
  }

  private attachRUMBridge(): void {
    if (this.didAttachBridge) {
      return;
    }
    const controller = this.controller;
    if (controller === null || controller === undefined) {
      console.error('[GC-UniPlugin] Harmony WebView controller is unavailable');
      return;
    }
    try {
      const config = FTSDK.getRumConfig();
      if (config !== null && config.isEnableTraceWebView()) {
        this.handler.setNativeViewName(this.viewName);
        // ArkWeb calls onControllerAttached before the Web component begins
        // running the document. Register the native bridge here so Browser RUM
        // sees it during DATAFLUX_RUM.init().
        this.handler.setWebView(controller, config);
        this.didAttachBridge = true;
      }
    } catch (error) {
      // A telemetry integration failure must never prevent the application
      // page itself from loading.
      console.error('[GC-UniPlugin] Harmony WebView RUM bridge failed:', error);
    }
  }

  build() {
    // The Web component owns the only target-page load. Calling loadUrl again
    // here would reload the document and duplicate Browser RUM view/resource
    // data.
    Web({ src: this.src, controller: this.controller })
      .backgroundColor(Color.Transparent)
      .metaViewport(true)
      .overScrollMode(OverScrollMode.NEVER)
      .keyboardAvoidMode(WebKeyboardAvoidMode.RESIZE_VISUAL)
      .geolocationAccess(true)
      .domStorageAccess(true)
      .fileAccess(true)
      .imageAccess(true)
      .onlineImageAccess(true)
      .darkMode(WebDarkMode.Auto)
      .mixedMode(MixedMode.All)
      .mediaPlayGestureAccess(false)
      .onConsole(event => {
        if (this.enableBridgeCompatibilityCheck && event) {
          console.info('[GC-UniPlugin] WebView console:', event.message.getMessage());
        }
        return false;
      })
      .onControllerAttached(() => {
        // Register a host-owned bridge first when the compatibility check is
        // enabled. FTWebViewHandler then registers its separate RUM bridge on
        // the very same controller.
        this.registerBaseJavaScriptBridge();
        this.attachRUMBridge();
      })
      .onPageEnd(() => {
        this.logBridgeCompatibility();
      });
  }
}

@Builder
function GCNativeWebViewBuilder(options: GCNativeWebViewBuilderOptions) {
  GCNativeWebView({
    controller: options.controller,
    src: options.src,
    viewName: options.viewName ?? 'webview',
    enableBridgeCompatibilityCheck: options.enableBridgeCompatibilityCheck === true
  })
    .width(options.width)
    .height(options.height)
    // Native embed nodes use absolute coordinates supplied by the uni-app
    // renderer.  Without these, Web can be created successfully but remain
    // outside the visible embed area, which appears as a blank page.
    .position({ x: options.x, y: options.y })
    .visibility(options.visibility);
}

defineNativeEmbed('gcwebview', {
  builder: GCNativeWebViewBuilder,
  controller: webview.WebviewController,
  nodeRenderType: NodeRenderType.RENDER_TYPE_DISPLAY
});
