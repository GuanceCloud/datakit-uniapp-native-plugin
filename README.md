# Guance UniApp Plugin

## Introduction
Guance application plugin for UniApp, supporting Android, iOS, and HarmonyOS.

Requires HBuilderX 4.25.0 or later because the plugin uses UTS native hybrid files and Android custom Maven repositories.

`GC-JSPlugin` is the stable JavaScript collector and compatibility package.
It exports the view/error/resource/action collectors and retains
`mobileAgent`, `rum`, `logger`, and `tracer` for UniMP/WGT and existing
customers.

`GC-UniPlugin` is the Android/iOS/HarmonyOS UTS implementation. A normal
UniApp application imports its setup entry once, imports typed SDK APIs from
the package root, and keeps JavaScript collectors owned by `GC-JSPlugin`:

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

Direct SDK imports from `GC-UniPlugin` are recommended in a normal UniApp
application because HBuilderX can expose the UTS interfaces and parameter
types. `setup.js` connects JavaScript collectors to those same UTS objects;
application code does not call the internal bridge installer directly.

A UniMP WGT installs only `GC-JSPlugin`. It must not import the UTS setup
entry; the same public objects lazily call the native host's existing
`GCUniPlugin-MobileAgent`, `GCUniPlugin-RUM`, `GCUniPlugin-Logger`, and
`GCUniPlugin-Tracer` modules. This preserves the 0.2.6 WGT integration while
keeping the optional UTS package out of the WGT bundle.

iOS Session Replay is provided by the separate optional
`GC-UniSessionReplay` module. Initialize `mobileAgent` and `rum` first, then
import and configure `GCUniSessionReplay` from that module before
`gcViewTracking.startTracking()` in `main.js`. Applications that do not
install it keep the base plugin dependency set and startup behavior unchanged.

Use `gcResourceTracking` to collect `uni.request` Resources on Android, iOS,
and HarmonyOS. When iOS native Resource collection is enabled, disable the JS
interceptor so URLSession requests are not collected twice:

```js
import {
  gcResourceTracking
} from '@/uni_modules/GC-JSPlugin'

gcResourceTracking.startTracking({
  enableIOS: false
})
```

The iOS option defaults to `true`. Disabling it also prevents `gcRequest` from
falling back to manual JS Resource collection on iOS. Only the first
`startTracking()` call takes effect, so configure it before any later calls.

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
