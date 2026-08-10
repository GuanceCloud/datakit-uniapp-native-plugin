# Guance UniApp HostBridge

This local static pod is used only by the iOS native-hybrid sample. It owns the
strongly typed connection from generated UTS runtime frameworks to the Guance
SDK already selected by the host application. It compiles both the Core and
Session Replay bridge classes into one static HostBridge.

## CocoaPods

The sample Podfile uses static linkage:

```ruby
use_frameworks! :linkage => :static

pod 'GuanceUniAppHostBridge', :path => 'GuanceUniAppHostBridge'
```

The HostBridge depends on GuanceSDK/Agent and GuanceSDK/SessionReplay, sets
GUANCE_UNI_COCOAPODS_SESSION_REPLAY, and checks that FTRumSessionReplay and
FTSessionReplayConfig are present at runtime. Do not add only GuanceSDK/Core. The
UniApp Session Replay module remains an optional API/framework, but this
single-bridge distribution always contains its native mapping and dependency.

The pod is consumed through a local `:path`, so it can be distributed inside a
versioned ZIP and installed without GitHub access. CocoaPods uses the supplied
source tree; the podspec source metadata is not fetched for this integration.

## Swift Package Manager or Direct XCFramework

Do not add this local pod. First run:

```bash
ruby ../scripts/generate_guance_uts_frameworks.rb
bash ../scripts/build_guance_host_bridge_xcframework.sh
```

This produces
`StaticFramework/build/GuanceUniAppHostBridge.xcframework`. Add that static
XCFramework to the host target's **Link Binary With Libraries** phase, not to
an Embed Frameworks phase. Add `-ObjC` to **Other Linker Flags** so
`GuanceUniAppCoreHostBridge` and
`GuanceUniAppSessionReplayHostBridge` survive linking; UTS discovers both
classes only through Objective-C runtime lookup. `-force_load` for the
selected static library slice is an equivalent, more targeted alternative.

The host must link exactly one SDK integration:

- SPM: GuanceSDK and GuanceSessionReplay products.
- Direct static XCFrameworks: GuanceSDK and GuanceSessionReplay
  XCFrameworks.

For the Session Replay source, define GUANCE_UNI_COCOAPODS_SESSION_REPLAY only
for the CocoaPods layout. SPM and direct XCFramework builds discover the
separate GuanceSessionReplay module automatically.

The generated unimoduleGCUniPlugin and optional unimoduleGCUniSessionReplay
frameworks must not link or embed Guance SDK frameworks in this mode.
