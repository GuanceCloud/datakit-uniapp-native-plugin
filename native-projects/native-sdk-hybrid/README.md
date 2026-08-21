# Native SDK Hybrid

These platform workspaces are the build and integration targets for native
applications that embed HBuilderX-exported resources and UTS modules.

```text
native-sdk-hybrid/
├── android/   # Android library modules plus simpleDemo
├── ios/       # iOS framework targets plus the HBuilder host target
└── harmony/   # HarmonyOS HAR/static module plus the entry HAP target
```

The library targets produce customer-facing native artifacts. The application
targets consume those libraries and provide integration verification in the
same platform build workspace.

The platform packaging scripts write release ZIPs to
`dist/native-sdk-hybrid/`. The iOS-only archive is
`ios/GuanceUniApp-<version>.zip`; the Android-only archive is
`android/GuanceUniApp-Android-<version>.zip`.
