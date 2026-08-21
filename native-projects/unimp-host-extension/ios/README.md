# iOS UniMP Host Extension example

This example combines two existing projects instead of rebuilding either one:

- `demo/` is based on DCloud's `HelloUniMPDemo` from `UniMPSDK_iOS@5.15`.
- `GCUniPlugin/GC-UniPlugin-App.xcodeproj` is the original native extension
  project and is referenced by the host as an Xcode subproject.

The extension keeps its existing names:

- Xcode target: `GC-UniPlugin-App`
- Framework product: `GC_UniPlugin_App.framework`
- Distribution archive: `GC-UniPlugin-App.xcframework`

## Prepare local dependencies

The UniMP SDK and binary dependencies are intentionally not committed. Sync
them before opening or building the project:

```sh
./native-projects/unimp-host-extension/scripts/sync_ios_dependencies.sh \
  /path/to/UniMPSDK_iOS@5.15
```

The script uses these repository artifacts by default:

- `Hbuilder_Example/uni_modules/GC-UniPlugin/utssdk/app-ios/Frameworks/GuanceSDK.xcframework`
- `native-projects/native-sdk-hybrid/ios/SDK/inc/DCUni`

Alternative GuanceSDK and DCloud header paths can be passed as the second and
third arguments.

Validate that the Xcode navigator references resolve to the synced SDK:

```sh
ruby native-projects/unimp-host-extension/scripts/verify_ios_project_references.rb
```

## Use the example

Open `demo/UniMPHostExtensionDemo.xcodeproj`. The host already contains
`GC-UniPlugin-App.xcodeproj` as a subproject, declares a target dependency, and
links its framework product. This is equivalent to dragging the original
project into the host in Xcode; the extension target is not duplicated or
renamed.

The host registers these module IDs for the bundled WGT:

- `GCUniPlugin-MobileAgent`
- `GCUniPlugin-RUM`
- `GCUniPlugin-Logger`
- `GCUniPlugin-Tracer`

The example intentionally excludes UTS modules, HostBridge, and Session Replay.

## Build the extension archive

```sh
./native-projects/unimp-host-extension/scripts/build_ios_xcframework.sh
```

The output is written to
`dist/unimp-host-extension/ios/GC-UniPlugin-App.xcframework`.
