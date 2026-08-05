# GC-UniPlugin

Guance UniApp UTS plugin package.

This package provides the Android, iOS, and HarmonyOS UTS implementation and the customer-facing SDK entry.

Requires HBuilderX 4.25.0 or later because the plugin uses UTS native hybrid files and Android custom Maven repositories.

```js
import {
  mobileAgent,
  rum,
  logger,
  tracer
} from '@/uni_modules/GC-UniPlugin'
import {
  gcErrorTracking
} from '@/uni_modules/GC-UniPlugin/js_sdk'

gcErrorTracking.startTracking()
```

Keep existing method names and parameter objects unchanged, such as `mobileAgent.sdkConfig(...)`, `rum.setConfig(...)`, `logger.logging(...)`, and `tracer.getTraceHeader(...)`.

The root UTS entry preserves the existing public API: `mobileAgent`, `rum`,
`logger`, `tracer`, and the `GC*` constant groups can be imported directly.
They are same-named UTS proxy classes with static APIs, so calls such as
`rum.setConfig(...)` and `GCEnv.PROD` remain unchanged. The `js_sdk` entry
re-exports this core API and provides optional JS enhancements.

iOS Session Replay is distributed separately as the optional
`GC-UniSessionReplay` module. Configure the base Mobile SDK and RUM before
calling its `GCUniSessionReplay.setConfig(...)` API, and do so before
`gcViewTracking.startTracking()` in `main.js`. Browser SDK bootstrap code
continues to use `gcViewTracking.evalSessionReplayJS(...)` from this base
module's `js_sdk` entry.

On iOS, this module links the bundled dynamic
`utssdk/app-ios/Frameworks/GuanceSDK-Dynamic.xcframework` artifact. It does
not declare a CocoaPods dependency. The dynamic artifact is version 1.6.6 and
must remain aligned with the optional Session Replay module.
