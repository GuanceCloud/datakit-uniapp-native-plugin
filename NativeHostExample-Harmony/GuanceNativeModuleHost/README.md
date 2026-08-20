# GCUniPlugin for UniMP on HarmonyOS

`GCUniPlugin` is a HarmonyOS HAR that exposes Guance FTSDK features to a
UniApp WGT through `uni.requireNativePlugin`.

## Modules

| Native module | Purpose |
| --- | --- |
| `GCUniPlugin-MobileAgent` | SDK setup, user data, global context, and sync |
| `GCUniPlugin-RUM` | RUM configuration and view/action/resource events |
| `GCUniPlugin-Logger` | Log configuration and custom logs |
| `GCUniPlugin-Tracer` | Trace configuration and request headers |

## Build

Open `GuanceNativeModuleHost` in DevEco Studio and select **Build → Make Module
'GCUniPlugin'**. The release HAR is generated at:

```text
GCUniPlugin/build/default/outputs/default/GCUniPlugin.har
```

Or run:

```sh
hvigorw assembleHar -p module=GCUniPlugin -p product=default -p buildMode=release
```

## Host integration

1. Copy `GCUniPlugin.har` to `entry/libs/`.
2. Add the dependency and run **OHPM Install**:

```json5
{
  "dependencies": {
    "@guancecloud/gc-uniplugin": "file:./libs/GCUniPlugin.har"
  }
}
```

3. Initialize UniMP and register the modules before opening a WGT:

```ts
import { init } from '@dcloudio/uni-app-runtime';
import { registerNativeModules } from '@guancecloud/gc-uniplugin';

init(this, windowStage, { debug: false });
registerNativeModules(this.context);
```

## UniApp example

Initialize the SDK once at application startup, then configure RUM, logging, and
tracing as needed.

```js
const mobileAgent = uni.requireNativePlugin('GCUniPlugin-MobileAgent')
const rum = uni.requireNativePlugin('GCUniPlugin-RUM')
const logger = uni.requireNativePlugin('GCUniPlugin-Logger')
const tracer = uni.requireNativePlugin('GCUniPlugin-Tracer')

mobileAgent.sdkConfig({
  datawayUrl: 'https://dataway.example.com',
  clientToken: 'your-client-token',
  env: 'prod',
  serviceName: 'uniapp-demo',
})

rum.setConfig({ harmonyAppId: 'your-rum-app-id' })
logger.setConfig({ enableCustomLog: true })
logger.logging({ content: 'UniApp started', status: 'info' })

tracer.setConfig({ enableAutoTrace: true })
const headers = tracer.getTraceHeader({ url: 'https://api.example.com/orders' })
```

Use RUM view events for custom page tracking:

```js
rum.startView({ viewName: 'pages/order/detail' })
rum.addAction({ actionName: 'view_order_detail', actionType: 'click' })
rum.stopView()
```
