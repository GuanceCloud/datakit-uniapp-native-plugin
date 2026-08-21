# Guance Hybrid UTS Framework Sample

This project demonstrates the iOS native-host workflow for the Guance UTS
modules described in the DCloud [iOS UTS integration guide](https://doc.dcloud.net.cn/uni-app-x/native/use/iosuts.html).
The generated UTS modules are dynamic frameworks, while the Guance SDK remains
owned by a static HostBridge inside the application.

## Linkage Model

```text
HBuilder app target
  -> GuanceUniAppHostBridge static Pod
       -> GuanceSDK/Agent + GuanceSDK/SessionReplay static CocoaPods integration
  -> unimoduleGCUniPlugin.framework (Embed & Sign)
  -> unimoduleGCUniSessionReplay.framework (Embed & Sign, optional)

Each unimodule target
  -> DCUniBase.framework and DCloudUTSFoundation.framework (link only)
  -> WebKit.framework for Session Replay (link only)
  -> no Guance SDK framework
```

## DCloud UTS Runtime Frameworks

`SDK/UTS` contains DCloud's UTS configuration and bridge source; it is not the
directory that contains the runtime frameworks. In the DCloud native iOS
template, the required frameworks are supplied by the Host project at:

```text
HybridHostExample-iOS/SDK/Libs/
├─ DCUniBase.framework
└─ DCloudUTSFoundation.framework
```

They are DCloud runtime dependencies, not Guance artifacts. The delivered
`GuanceUniApp-iOS-<version>.zip` deliberately does not include them. A native
Host must use the matching DCloud iOS SDK, keep the frameworks in its own
`SDK/Libs` (or equivalent external SDK directory), and link them to each
`unimodule` target without embedding another copy.

The dynamic UTS frameworks use Objective-C runtime lookup only to reach the
static HostBridge. The HostBridge uses strongly typed Guance APIs and compiles
the same `GCUniPluginNative.swift` and `GCSessionReplayNative.swift` command
implementations used by a pure UniApp build.

## Why the Dynamic UTS Framework Does Not Import Guance SDK

The plugin source contains `GCUniPluginNative.swift` and
`GCSessionReplayNative.swift` below `utssdk/app-ios` for the pure UniApp
build. HBuilderX compiles those files directly into the dynamic `unimodule`,
where they import the bundled Guance dynamic XCFrameworks.

That is **not** the hybrid artifact produced by this sample's generator. In
hybrid mode the generator removes those direct native files from the generated
dynamic framework targets and rewrites the generated UTS calls to
`GCUniPluginHostNative.swift` and `GCSessionReplayHostNative.swift` instead.
Those lightweight adapters do not import `GuanceSDK` or
`GuanceSessionReplay`; they forward calls to the static HostBridge through a
runtime selector.

```text
Pure UniApp
  dynamic unimodule
    -> GCSessionReplayNative.swift
       -> import GuanceSDK / GuanceSessionReplay

Native-hybrid host
  dynamic unimodule
    -> GCSessionReplayHostNative.swift (no Guance SDK import)
       -> static GuanceUniAppHostBridge
          -> GCSessionReplayNative.swift
             -> import host-owned GuanceSDK / GuanceSessionReplay
```

Therefore, seeing `GCSessionReplayNative.swift` in the UTS source package is
expected; it is the shared direct implementation, not proof that a generated
hybrid `unimoduleGCUniSessionReplay.framework` contains it. In hybrid mode the
HostBridge is the sole owner of the native SDK linkage. This avoids a second
SDK copy, duplicate Objective-C classes, and competing SDK singletons.

## Refresh and Generate

1. Export the current UniApp resource bundle with HBuilderX. This produces the
   generated iOS UTS `index.swift` files under
   `Hbuilder_Example/unpackage/resources/uni_modules`.
2. Ensure the Ruby used to run the script has the `xcodeproj` gem available.
3. From the repository root, run:

   ```bash
   ruby HybridHostExample-iOS/HBuilder-uniPluginDemo/scripts/generate_guance_uts_frameworks.rb
   bash HybridHostExample-iOS/HBuilder-uniPluginDemo/scripts/build_guance_host_bridge_xcframework.sh
   pod install --project-directory=HybridHostExample-iOS/HBuilder-uniPluginDemo
   ```

   The generator synchronizes HostBridge sources, rewrites the generated UTS
   Swift source to the runtime-only adapter classes, regenerates both dynamic
   framework projects, and refreshes the static HostBridge project. The build
   script creates
   `GuanceUniAppHostBridge/StaticFramework/build/GuanceUniAppHostBridge.xcframework`.
   Do not edit copied HostBridge sources directly.
4. Open `GuanceHybrid.xcworkspace`, select the `HBuilder` scheme, and
   configure normal signing on the app target before running on a device.

Session Replay is enabled by default. To generate a host without the optional
Session Replay **UTS framework**, run:

```bash
GUANCE_SESSION_REPLAY=0 ruby HybridHostExample-iOS/HBuilder-uniPluginDemo/scripts/generate_guance_uts_frameworks.rb
bash HybridHostExample-iOS/HBuilder-uniPluginDemo/scripts/build_guance_host_bridge_xcframework.sh
pod install --project-directory=HybridHostExample-iOS/HBuilder-uniPluginDemo
```

Run the default commands again to restore it.

## Create the Native-Host Release ZIP

With a DCloud iOS runtime available, run:

```bash
DCLOUD_SDK_LIBS_DIR=/path/to/DCloud/SDK/Libs \
bash HybridHostExample-iOS/HBuilder-uniPluginDemo/scripts/package_guance_uniapp_ios.sh
```

The version defaults to `GC-UniPlugin/package.json`; pass a version argument to
override it. The script generates all source, builds device and simulator
XCFramework slices, and writes:

```text
HybridHostExample-iOS/HBuilder-uniPluginDemo/build/GuanceUniApp-iOS/
└─ GuanceUniApp-iOS-<version>.zip
   ├─ unimoduleGCUniPlugin.xcframework
   ├─ unimoduleGCUniSessionReplay.xcframework # omitted with GUANCE_SESSION_REPLAY=0
   ├─ GuanceUniAppHostBridge.xcframework
```

The ZIP contains no DCloud or Guance SDK binary. Refer to the official Guance
documentation for dynamic UTS framework embedding, static HostBridge linkage,
and native SDK integration through CocoaPods, SPM, or direct XCFrameworks.

## SDK Dependency Choices

The sample uses static CocoaPods because that is the easiest upgrade path for
a native host which already uses GuanceSDK. `GuanceUniAppHostBridge` is one
static Pod. It always compiles the Core and Session Replay HostBridge classes:

```ruby
pod 'GuanceUniAppHostBridge', :path => 'GuanceUniAppHostBridge'
```

The HostBridge depends on `GuanceSDK/Agent` and `GuanceSDK/SessionReplay`; the
base `GuanceSDK` pod alone is not sufficient. It receives the
`GUANCE_UNI_COCOAPODS_SESSION_REPLAY` compilation flag and checks for
`FTRumSessionReplay` and `FTSessionReplayConfig` before handling a command.
The Session Replay UTS framework remains optional, but the hybrid native
binary always includes the replay-native dependency. The HostBridge folder can
be distributed in a versioned ZIP and consumed by local CocoaPods path, so
this integration does not require GitHub access.

For a host using SPM or direct static XCFrameworks, do not use the local pod.
Use the generated static
`GuanceUniAppHostBridge/StaticFramework/build/GuanceUniAppHostBridge.xcframework`:
link it without embedding it, add `-ObjC` (or `-force_load` for its selected
slice), and
link `GuanceSDK` and the separate `GuanceSessionReplay` product or XCFramework
once. Full details are in
[GuanceUniAppHostBridge/README.md](GuanceUniAppHostBridge/README.md).

Do not link the Guance SDK directly from either `unimodule` framework in
HostBridge mode. The host owns both SDK version selection and native SDK
initialization.

## Runtime Compatibility

HostBridge calls reuse the existing Guance SDK singleton in the process. A
host that configures the SDK before mounting UniApp retains ownership of that
configuration. The optional Session Replay bridge still installs its early
WebView hook and prepares captured UniApp WebViews, so first-document bridge
repair remains available.

## Validation

Build both dynamic module schemes for an iOS device, then build the `HBuilder`
app target. The app must contain the two `unimodule` frameworks when Session
Replay is selected, but it must not embed `GuanceSDK.framework` or
`GuanceSessionReplay.framework` through the UTS framework projects. CocoaPods
links the static SDK implementation into the HostBridge/App binary.
