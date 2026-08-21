# GC-UniPlugin

Guance UniApp UTS plugin package.

This package provides the Android, iOS, and HarmonyOS UTS implementation. Its
`setup.js` entry binds the UTS objects to the collectors owned by
`GC-JSPlugin`.

Requires HBuilderX 4.25.0 or later because the plugin uses UTS native hybrid files and Android custom Maven repositories.

```js
import '@/uni_modules/GC-UniPlugin/setup.js'
import {
  mobileAgent,
  rum,
  logger,
  tracer
} from '@/uni_modules/GC-UniPlugin'
import {
  gcErrorTracking
} from '@/uni_modules/GC-JSPlugin'

gcErrorTracking.startTracking()
```

Keep existing method names and parameter objects unchanged, such as `mobileAgent.sdkConfig(...)`, `rum.setConfig(...)`, `logger.logging(...)`, and `tracer.getTraceHeader(...)`.

Import SDK APIs directly from this package to retain UTS interfaces and
parameter types in HBuilderX. Import `setup.js` once in the application entry
before the first collector call; application code does not call
`installNativeBridge()` directly.
`GC-JSPlugin` deliberately does not import this package, so a UniMP WGT can
omit UTS without a compile-time missing-module error.

iOS Session Replay is distributed separately as the optional
`GC-UniSessionReplay` module. Configure the base Mobile SDK and RUM before
calling its `GCUniSessionReplay.setConfig(...)` API, and do so before
`gcViewTracking.startTracking()` in `main.js`. Browser SDK bootstrap code
continues to use `gcViewTracking.evalSessionReplayJS(...)` from
`GC-JSPlugin`.

On iOS, this module links the bundled dynamic
`utssdk/app-ios/Frameworks/GuanceSDK-Dynamic.xcframework` artifact. It does
not declare a CocoaPods dependency. The dynamic artifact is version 1.6.6 and
must remain aligned with the optional Session Replay module.
