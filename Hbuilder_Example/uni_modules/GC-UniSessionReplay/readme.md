# GC-UniSessionReplay

Optional Guance Session Replay support for UniApp on iOS and Android.

This module is separate from `GC-UniPlugin` so applications that do not use
Session Replay do not receive its native dependency or early WebView hook. It
requires HBuilderX 4.25.0 or later and `GC-UniPlugin`.

Initialize the base Mobile SDK and RUM before Session Replay. Put this code in
`main.js` (or an imported bootstrap module) before
`gcViewTracking.startTracking()`. `App.onLaunch` is too late for the first
native View's Session Replay sampling context.

Guard the import with `APP`. The same root API and privacy constants work on
both native platforms.

```js
import {
  mobileAgent,
  rum
} from '@/uni_modules/GC-UniPlugin'

// #ifdef APP
import {
  GCUniSessionReplay,
  GCSessionReplayImagePrivacy,
  GCSessionReplayTextAndInputPrivacy,
  GCSessionReplayTouchPrivacy
} from '@/uni_modules/GC-UniSessionReplay'
// #endif

mobileAgent.sdkConfig({
  datakitUrl: 'https://your-datakit.example.com'
})

rum.setConfig({
  iOSAppId: 'your-rum-app-id'
})

// #ifdef APP
GCUniSessionReplay.setConfig({
  sampleRate: 100,
  sessionReplayOnErrorSampleRate: 0,
  touchPrivacy: GCSessionReplayTouchPrivacy.SHOW,
  textAndInputPrivacy:
    GCSessionReplayTextAndInputPrivacy.MASK_SENSITIVE_INPUTS,
  imagePrivacy: GCSessionReplayImagePrivacy.MASK_NONE,
  enableLinkRUMKeys: ['wgt_id']
})
// #endif
```

The Browser SDK remains connected to UniApp View Tracking through the base
module:

```js
import {
  gcViewTracking
} from '@/uni_modules/GC-UniPlugin/js_sdk'

gcViewTracking.evalSessionReplayJS(browserSdkBootstrapCode)
```

The public sample rates are percentages from `0` through `100`. Android
converts them to the Native SDK's `0` through `1` range. `enableSwiftUI` is
iOS-only and is ignored on Android. Android maps
`GCSessionReplayImagePrivacy.MASK_NON_BUNDLED_ONLY` to its closest available
native behavior, `MASK_LARGE_ONLY`, because it has no bundled-image privacy
mode.

Browser SDK injection is performed directly against each active page WebView
and does not depend on the Native bridge. Native Session Replay configuration
and first-view bridge preparation must finish in time only when Browser replay
records need to be forwarded to and linked with Native Session Replay. The iOS
hook captures only UniApp render WebViews, installs a records-capable native
bridge for future documents, and repairs the already loaded first document
without reloading it.

If a native host has already started Session Replay, `setConfig` keeps the
host-owned recorder and only prepares the UniApp WebView bridge. The supplied
configuration is not applied to an already running recorder. The host and UTS
modules must resolve one shared dynamic `GuanceSDK` 1.6.6 artifact rather than
link separate SDK binaries. This module bundles
`GuanceSDK-Dynamic.xcframework` and
`GuanceSessionReplay-Dynamic.xcframework` in its iOS `Frameworks` directory;
it does not declare a CocoaPods dependency. `GuanceSessionReplay` loads
`GuanceSDK` through `@rpath`.

For local custom-base verification, `GC-UniPlugin` bundles the single patched
`ft-sdk` AAR and its `ft-native` AAR in `utssdk/app-android/libs`; the optional
module bundles only `ft-session-replay` in its own `libs` directory. This avoids
two copies of the Core SDK in the final app. The optional module calls the
Native APIs through reflection for the same reason.

Its `UTSAndroidHookProxy.onCreate` calls
`FTUniAppWebViewBridge.enableFirstViewBridge()` before UniApp creates the first
render WebView. The existing `ft-plugin` then instruments DCloud `load*` calls:
immediately before the original load call, the patched Native SDK installs
`FTWebViewJavascriptBridge` with `addJavascriptInterface`. After Mobile SDK,
RUM WebView tracing, and Session Replay are configured, the same bridge
dynamically reports `records` and accepts Browser Replay records. No page
reload or `evaluateJavascript` repair is involved.

The local AAR is a test-only integration arrangement. Do not switch back to a
published Maven `ft-sdk` coordinate until that artifact exposes the same
first-view bridge behavior; otherwise the first document cannot be repaired.
