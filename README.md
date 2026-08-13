# Guance UniApp Plugin

## Introduction
Guance application plugin for UniApp, supporting Android, iOS, and HarmonyOS through a UTS plugin.

Requires HBuilderX 4.25.0 or later because the plugin uses UTS native hybrid files and Android custom Maven repositories.

The current integration uses `GC-UniPlugin` as the Android/iOS/HarmonyOS UTS implementation. Existing customers should keep their method calls and parameter objects unchanged, and replace native module acquisition such as `uni.requireNativePlugin("GCUniPlugin-RUM")` with named imports such as `rum`, `logger`, `tracer`, and `mobileAgent` from `GC-UniPlugin`. The root entry also exports the existing `GC*` constant groups, for example `GCEnv.PROD`.

JS helpers such as request, route, page, view tracking, and JS error tracking live under `GC-UniPlugin/js_sdk` as optional enhancements. It also provides the native SDK facade objects.

iOS Session Replay is provided by the separate optional
`GC-UniSessionReplay` module. Initialize `mobileAgent` and `rum` first, then
import and configure `GCUniSessionReplay` from that module before
`gcViewTracking.startTracking()` in `main.js`. Applications that do not
install it keep the base plugin dependency set and startup behavior unchanged.

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

```js
// #ifdef APP
import {
  GCUniSessionReplay
} from '@/uni_modules/GC-UniSessionReplay'

if (uni.getSystemInfoSync().platform === 'ios') {
  GCUniSessionReplay.setConfig({
    sampleRate: 100,
    sessionReplayOnErrorSampleRate: 0
  })
}
// #endif
```

## Example
 [Guance UniApp Plugin Demo](https://github.com/GuanceCloud/datakit-uniapp-native-plugin/tree/develop/Hbuilder_Example)

## Documentation

For integration documentation, please refer to [Official Documentation](https://docs.guance.com/real-user-monitoring/uni-app/app-access/)
