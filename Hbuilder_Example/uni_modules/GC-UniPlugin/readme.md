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

Remote configuration and runtime endpoint updates are available through the
same typed UTS API on Android and iOS:

```js
mobileAgent.sdkConfig({
  remoteConfiguration: true,
  remoteConfigMiniUpdateInterval: 600,
  enableDataFilter: true,
  dataFilters: {
    logging: ['message'],
    rum: ['view_name']
  }
})

mobileAgent.setDatakitURL({ datakitUrl: 'https://datakit.example.com' })
mobileAgent.setDatawayURL({
  datawayUrl: 'https://dataway.example.com',
  clientToken: 'client-token'
})
mobileAgent.updateRemoteConfigWithMiniUpdateInterval(
  { miniUpdateInterval: 60 },
  result => console.log(result)
)
```

HarmonyOS keeps these methods in the shared interface for cross-platform
source compatibility, but currently reports `UNSUPPORTED_PLATFORM` from the
remote-update callback and logs a warning for endpoint or configuration calls.

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
`utssdk/app-ios/Frameworks/GuanceSDK.xcframework` artifact. It does
not declare a CocoaPods dependency. The dynamic artifact is version 1.6.6 and
must remain aligned with the optional Session Replay module.
