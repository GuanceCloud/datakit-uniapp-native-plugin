# Native Projects

Native build workspaces are grouped by delivery scenario. Each platform
workspace may contain both a release library target and a host application
target that verifies the packaged library in a real integration.

```text
native-projects/
├── native-sdk-hybrid/
│   ├── android/
│   ├── ios/
│   └── harmony/
└── unimp-host-extension/
    ├── android/
    ├── ios/
    └── harmony/
```

- `native-sdk-hybrid` integrates HBuilderX-exported application resources and
  UTS native modules into Android, iOS, and HarmonyOS native hosts.
- `unimp-host-extension` builds the native extensions consumed by a host that
  embeds a UniMP application. Its demo targets validate the release targets;
  they are not separate sources of the extension implementation.

The HBuilderX development project remains in `Hbuilder_Example`. Generated
release archives belong in `dist` and are not committed.
