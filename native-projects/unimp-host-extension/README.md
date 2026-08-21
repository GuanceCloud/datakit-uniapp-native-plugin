# GC UniMP Host Extension

This directory is the build workspace for native Host Extension
implementations used by applications that embed a UniMP application.

The WGT installs only `GC-JSPlugin`. The native host owns SDK initialization
and exposes the compatible `GCUniPlugin-*` module IDs through the platform
extension in this directory.

```text
unimp-host-extension/
├── android/
│   ├── GCUniPlugin/       # original uniplugin_module source
│   ├── demo/              # UniMP host app using it as a Gradle module
│   └── UniMPSDK/          # local DCloud UniMP SDK libraries
├── ios/
│   ├── GCUniPlugin/       # original GC-UniPlugin-App Xcode project
│   ├── demo/              # UniMP host app using it as a subproject
│   ├── Dependencies/      # local GuanceSDK and DCloud headers
│   └── UniMPSDK/          # local DCloud UniMP SDK
├── harmony/
│   ├── GCUniPlugin/
│   └── demo/
└── scripts/
```

Each platform workspace owns one `GCUniPlugin` release target and one demo host
target. The release targets produce an Android AAR, an iOS XCFramework, and a
HarmonyOS HAR. On iOS, the host directly references the original
`GC-UniPlugin-App.xcodeproj` as a subproject. The demo targets verify host
registration and the `GCUniPlugin-*` module contract.

Session Replay is intentionally not part of this Host Extension workspace.
