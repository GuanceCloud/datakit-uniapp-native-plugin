# GC-UniSessionReplay

Optional Guance Session Replay support for UniApp on iOS.

This module is separate from `GC-UniPlugin` so applications that do not use
Session Replay do not receive its native dependency or early WebView hook. It
requires HBuilderX 4.25.0 or later and `GC-UniPlugin`.

Initialize the base Mobile SDK and RUM before Session Replay. Put this code in
`main.js` (or an imported bootstrap module) before
`gcViewTracking.startTracking()`. `App.onLaunch` is too late for the first
native View's Session Replay sampling context.

Guard the import with `APP` and select iOS at runtime.

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
if (uni.getSystemInfoSync().platform === 'ios') {
  GCUniSessionReplay.setConfig({
    sampleRate: 100,
    sessionReplayOnErrorSampleRate: 0,
    touchPrivacy: GCSessionReplayTouchPrivacy.SHOW,
    textAndInputPrivacy:
      GCSessionReplayTextAndInputPrivacy.MASK_SENSITIVE_INPUTS,
    imagePrivacy: GCSessionReplayImagePrivacy.MASK_NONE,
    enableLinkRUMKeys: ['wgt_id']
  })
}
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

The native Session Replay configuration must run before the first tracked View
becomes active. The iOS hook captures only UniApp render WebViews, installs a
records-capable native bridge for future documents, and repairs the already
loaded first document without reloading it.

If a native host has already started Session Replay, `setConfig` keeps the
host-owned recorder and only prepares the UniApp WebView bridge. The supplied
configuration is not applied to an already running recorder. The host and UTS
modules must resolve one shared dynamic `GuanceSDK` 1.6.6 artifact rather than
link separate SDK binaries. This module bundles
`GuanceSDK-Dynamic.xcframework` and
`GuanceSessionReplay-Dynamic.xcframework` in its iOS `Frameworks` directory;
it does not declare a CocoaPods dependency. `GuanceSessionReplay` loads
`GuanceSDK` through `@rpath`.

Android Session Replay is not included in this delivery.
