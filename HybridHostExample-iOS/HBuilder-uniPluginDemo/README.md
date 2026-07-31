# Guance Hybrid UTS Framework Sample

This project demonstrates the iOS native-host workflow for the two Guance UTS
modules described in the DCloud [iOS UTS integration guide](https://doc.dcloud.net.cn/uni-app-x/native/use/iosuts.html).
It is intentionally separate from the `UTSPlugins` CocoaPods scanner: that
scanner builds local UTS plugins as static Pods, while this sample needs dynamic
UTS frameworks so the host app can own one shared Guance SDK binary.

## Linkage Model

```text
HBuilder app target
  -> unimoduleGCUniPlugin.framework (Embed & Sign)
  -> unimoduleGCUniSessionReplay.framework (Embed & Sign, optional)
  -> GuanceSDK.framework (Embed & Sign once)
  -> GuanceSessionReplay.framework (Embed & Sign once, optional)

Each unimodule target
  -> DCUniBase.framework and DCloudUTSFoundation.framework (link only)
  -> its required Guance dynamic XCFrameworks (link only)
```

`SharedFrameworks` contains the dynamic XCFrameworks used by every target.
Do not add `FTMobileSDK`, `FTSessionReplay`, or another Guance binary through
CocoaPods to this host. A second copy would duplicate Objective-C runtime
classes and create unsupported SDK ownership.

## Refresh and Generate

1. Export the current UniApp resource bundle with HBuilderX. This produces the
   generated iOS UTS `index.swift` files under
   `Hbuilder_Example/unpackage/resources/uni_modules`.
2. Ensure the Ruby used to run the script has the `xcodeproj` gem available.
3. From the repository root, run:

   ```bash
   ruby HybridHostExample-iOS/HBuilder-uniPluginDemo/scripts/generate_guance_uts_frameworks.rb
   ```

   The script synchronizes generated UTS Swift and Guance native Swift sources,
   regenerates both dynamic framework projects and links them into the host.
4. Open `GuanceHybrid.xcworkspace`, select the `HBuilder` scheme, and
   configure normal signing on the app target before running on a device.

Session Replay is enabled by default. To generate a smaller host without its
native module or dynamic framework, run:

```bash
GUANCE_SESSION_REPLAY=0 ruby HybridHostExample-iOS/HBuilder-uniPluginDemo/scripts/generate_guance_uts_frameworks.rb
```

Run the default command again to restore it.

The host project's cross-project references build the two framework targets.
`GuanceHybrid.xcworkspace` is a clean Host-and-Pods workspace. The legacy
DCloud template cannot reliably load regenerated cross-project framework
targets as additional workspace roots, so open an individual `unimodule`
project directly when debugging its generated UTS source. The original DCloud
workspace is left unchanged.

## Important Runtime Compatibility

This host currently records `uniapp` 5.11.0 in `Podfile.lock`, while the
checked-in UniApp resource export reports compiler version 5.15. Replace the
offline DCloud runtime in this sample with the matching 5.15 runtime before
runtime testing. The supplied framework projects build independently, but a
mismatched runtime cannot be accepted as a functional integration result.

## Validation

Build both dynamic module schemes for an iOS device and inspect the archived
app. Its `Frameworks` directory must contain exactly one `GuanceSDK.framework`
and, only when enabled, one `GuanceSessionReplay.framework`.
