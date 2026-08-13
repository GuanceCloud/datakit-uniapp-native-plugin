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
}

/**
 * Harmony-only WebView using the same controller injection and loading path as
 * UniApp's built-in WebView native component.
 */
@Component
struct GCNativeWebView {
  @Prop src: string;
  @Prop viewName: string;
  controller?: webview.WebviewController;
  private handler: FTWebViewHandler = new FTWebViewHandler();
  private didAttachBridge = false;

  aboutToDisappear() {
    this.handler.clearWebController();
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
      .onControllerAttached(() => {
        this.attachRUMBridge();
      });
  }
}

@Builder
function GCNativeWebViewBuilder(options: GCNativeWebViewBuilderOptions) {
  GCNativeWebView({
    controller: options.controller,
    src: options.src,
    viewName: options.viewName ?? 'webview'
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
