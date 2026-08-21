# Guance Hybrid UTS Framework Sample

This project demonstrates the iOS native-host workflow for the Guance UTS
modules described in the DCloud [iOS UTS integration guide](https://doc.dcloud.net.cn/uni-app-x/native/use/iosuts.html).
It follows the same dependency model as the UTS plugins: generated UTS modules
compile the native Swift implementation directly and link the local dynamic
Guance XCFrameworks bundled with each plugin.

## Linkage Model

```text
HBuilder app target
  -> unimoduleGCUniPlugin.framework (Embed & Sign)
  -> unimoduleGCUniSessionReplay.framework (Embed & Sign, optional)
  -> GuanceSDK.framework (Embed & Sign once)
  -> GuanceSessionReplay.framework (Embed & Sign once, optional)

unimoduleGCUniPlugin
  -> GCUniPluginNative.swift
  -> GuanceSDK.xcframework (link only)

unimoduleGCUniSessionReplay
  -> GCSessionReplayNative.swift
  -> GuanceSDK.xcframework + GuanceSessionReplay.xcframework (link only)

Each unimodule target
  -> DCUniBase.framework + DCloudUTSFoundation.framework (link only)
```

There is no HostBridge or runtime selector forwarding layer. The host embeds
one copy of each selected dynamic Guance framework so both UTS modules resolve
the same SDK instance at runtime.

## Local Dependencies

The Guance frameworks are consumed directly from the UTS plugin directories:

```text
Hbuilder_Example/uni_modules/GC-UniPlugin/utssdk/app-ios/Frameworks/
└─ GuanceSDK.xcframework

Hbuilder_Example/uni_modules/GC-UniSessionReplay/utssdk/app-ios/Frameworks/
└─ GuanceSessionReplay.xcframework
```

`SDK/UTS` contains DCloud's UTS configuration and bridge source; it is not the
directory containing the DCloud runtime frameworks. The matching DCloud iOS
offline SDK must provide:

```text
HybridHostExample-iOS/SDK/Libs/
├─ DCUniBase.framework
└─ DCloudUTSFoundation.framework
```

Set `DCLOUD_SDK_LIBS_DIR` when those frameworks are located elsewhere.

Do not add another Guance SDK through CocoaPods or SPM to this sample. Mixing a
second SDK binary with the local dynamic frameworks can duplicate Objective-C
classes and SDK singletons.

## Refresh and Generate

1. Export the current UniApp resource bundle with HBuilderX. This produces the
   generated iOS UTS `index.swift` files under
   `Hbuilder_Example/unpackage/resources/uni_modules`.
2. Ensure the Ruby used by the script has the `xcodeproj` gem available.
3. From the repository root, run:

   ```bash
   ruby HybridHostExample-iOS/HBuilder-uniPluginDemo/scripts/generate_guance_uts_frameworks.rb
   pod install --project-directory=HybridHostExample-iOS/HBuilder-uniPluginDemo
   ```

   The generator copies the generated `index.swift` and the plugin's native
   Swift source into each dynamic UTS module, links the local Guance
   XCFrameworks, and refreshes the host project's Link/Embed phases.
4. Open `GuanceHybrid.xcworkspace`, select the `HBuilder` scheme, configure app
   signing, and run on a device or simulator.

Session Replay is enabled by default. To omit its UTS module and local dynamic
framework, run:

```bash
GUANCE_SESSION_REPLAY=0 \
ruby HybridHostExample-iOS/HBuilder-uniPluginDemo/scripts/generate_guance_uts_frameworks.rb
pod install --project-directory=HybridHostExample-iOS/HBuilder-uniPluginDemo
```

Run the default command again to restore Session Replay.

For release CI only, `GC_UNIAPP_USE_CHECKED_IN_UTS_SOURCES=1` allows the
generator to use the checked-in generated Swift sources when the HBuilderX
export directory is unavailable.

## Create the Native-Host Release ZIP

With a DCloud iOS runtime available, run:

```bash
DCLOUD_SDK_LIBS_DIR=/path/to/DCloud/SDK/Libs \
bash HybridHostExample-iOS/HBuilder-uniPluginDemo/scripts/package_guance_uniapp_ios.sh
```

The version defaults to `GC-UniPlugin/package.json`; pass a version argument to
override it. The package contains:

```text
GuanceUniApp-<version>.zip
├─ unimoduleGCUniPlugin.xcframework
├─ GuanceSDK.xcframework
├─ unimoduleGCUniSessionReplay.xcframework # omitted when disabled
└─ GuanceSessionReplay.xcframework          # omitted when disabled
```

The ZIP is written to
`dist/native-sdk-hybrid/ios/GuanceUniApp-<version>.zip`.

The package does not contain DCloud runtime frameworks. The host must use the
matching DCloud offline SDK and link its own `DCUniBase.framework` and
`DCloudUTSFoundation.framework`.

## Validation

Build both dynamic UTS module schemes and then the `HBuilder` scheme. The app's
`Frameworks` directory must contain exactly one `GuanceSDK.framework` and,
when Session Replay is selected, exactly one `GuanceSessionReplay.framework`.
No `GuanceUniAppHostBridge` product or CocoaPods dependency is required.
