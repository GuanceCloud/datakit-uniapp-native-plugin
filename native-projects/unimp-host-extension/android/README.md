# Android UniMP Host Extension example

This example combines two existing projects:

- `demo/` reuses DCloud's `SDK-Android@5.14-20260706/DEMO/UniMPDemo/app`
  host page, UniMP initialization, and WGT installation flow. Its optional
  payment, sharing, map, and vendor test-module integrations are omitted.
- `GCUniPlugin/` contains the original `uniplugin_module` Java sources and is
  consumed directly as a Gradle project dependency.

The original module identity and output naming are retained:

- Gradle project: `:uniplugin_module`
- Java package: `com.ft.sdk.uniapp`
- AAR: `gc-uniplugin-<version>.aar`

`settings.gradle` maps `:uniplugin_module` to the `GCUniPlugin/` directory, so
the standardized repository layout does not rename the original Gradle module.

## Prepare the local UniMP SDK

DCloud binaries are intentionally not committed. Copy the five core UniMP
libraries from the supplied SDK before opening or building the project:

```sh
./native-projects/unimp-host-extension/scripts/sync_android_dependencies.sh \
  /path/to/SDK-Android@5.14-20260706
```

## Use the example

Open `native-projects/unimp-host-extension/android` in Android Studio, or build
the demo from the command line:

```sh
./native-projects/unimp-host-extension/android/gradlew \
  -p native-projects/unimp-host-extension/android \
  :demo:assembleDebug
```

The host registers these module IDs before initializing UniMP:

- `GCUniPlugin-MobileAgent`
- `GCUniPlugin-RUM`
- `GCUniPlugin-Logger`
- `GCUniPlugin-Tracer`

The bundled `__UNI__EDA429D.wgt` is installed through
`releaseWgtToRunPath`. Start with **安装并启动内置 WGT**; the other host-page
buttons then demonstrate opening the app and navigating directly to the
RUM/Logging/Tracing pages. The example intentionally excludes UTS modules,
Session Replay, and DCloud's separate `原生扩展及宿主小程序通信  hx示例工程`.

## Build the extension AAR

```sh
./native-projects/unimp-host-extension/scripts/build_android_aar.sh
```

The versioned AAR is written to `dist/unimp-host-extension/android/`.
