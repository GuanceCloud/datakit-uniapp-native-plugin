# Scripts
## update-version.js

Use `.version` as the canonical release version and synchronize package
metadata, the UTS bridge marker, checked-in Android/iOS UTS generated sources,
and native-host release metadata. Pass a version to update `.version` and
every target, or omit it to resynchronize from `.version`.

```bash
node scripts/update-version.js <version>
```

The matching changelog section must already be the first section in
`CHANGELOG.md`; otherwise the command fails before writing files.

## check-version-consistency.js

Verify that `.version`, package metadata, runtime bridge markers, and checked-in
generated release sources use the same version. Passing the expected Git tag
also requires the first changelog section to use that release version.

```bash
node scripts/check-version-consistency.js
node scripts/check-version-consistency.js <tag>
```

## test-session-replay-feature.js

Run focused source-level regression checks for the optional Session Replay
module, iOS bridge repair, Android Application-hook/Gradle pre-load bridge
wiring, the local Android AAR ownership boundary, native-host duplicate
protection, and Browser SDK readiness gate.

```bash
node test-session-replay-feature.js
```

## test-view-tracking.js

Run focused View Tracking state-machine checks for Vue 2/Vue 3 mixin
installation, initial `onReady - onLoad` timing, repeated visibility,
foreground/background transitions, `reLaunch` and unavailable load times,
URL query properties, route failure cleanup, and Session Replay injection.

```bash
node test-view-tracking.js
```

Detailed View Tracking lifecycle logs are disabled by default. Enable them
temporarily while validating Vue 2/Vue 3 runtime behavior:

```js
gcViewTracking.setDebugEnabled(true)
// Disable again after validation.
gcViewTracking.setDebugEnabled(false)
```

Debug entries use the `[FTLog][ViewTracking][Debug]` prefix and include the
event, page path, millisecond timestamp, and the reason for actual
`startView`/`stopView` calls.

## test-uts-proxy-exports.js

Verify the public root UTS proxy API, its legacy constant groups, and the
root-import smoke patterns used by the app entry and request helper.

```bash
node test-uts-proxy-exports.js
```

## test-harmony-webview-rum-bridge.js

Verify the Harmony normal WebView RUM bridge: native controller attachment,
JavaScriptProxy registration before the target URL loads, and Harmony-only
native component selection while Android/iOS retain the standard `<web-view>`.

```bash
node test-harmony-webview-rum-bridge.js
```

## test-uni-request-tracking.js

Verify cross-platform `uni.request` Resource tracking, the iOS collection
switch, HarmonyOS interceptor installation, `gcRequest` fallback behavior, and
one-to-one correlation when concurrent requests complete out of order.

```bash
node test-uni-request-tracking.js
```

## test-hybrid-ios-uts-integration.js

Verify the checked-in DCloud hybrid iOS HostBridge wiring: dynamic UTS runtime
framework projects, unique configuration loaders, one static HostBridge Pod
and XCFramework build path, always-linked hybrid Session Replay dependency,
and the absence of Guance SDK links from generated UTS frameworks.

```bash
node test-hybrid-ios-uts-integration.js
```

## package_guance_uniapp_ios.sh

Build a versioned iOS native-host ZIP containing dynamic UTS XCFrameworks and
one static HostBridge XCFramework. The script requires a DCloud SDK framework
directory through
`DCLOUD_SDK_LIBS_DIR` or the ignored hybrid sample `SDK/Libs` folder.

```bash
DCLOUD_SDK_LIBS_DIR=/path/to/DCloud/SDK/Libs \
bash HybridHostExample-iOS/HBuilder-uniPluginDemo/scripts/package_guance_uniapp_ios.sh
```

## package_guance_uniapp_android.sh

Create a versioned Android native-host ZIP containing Android Library AARs
compiled from HBuilderX-exported UTS Kotlin sources, the locked Maven
dependency versions, and checksums. The script builds the libraries by default.

```bash
DCLOUD_UTS_RUNTIME_VERSION=5.15.82650_20260710 \
bash HybridHostExample-Android/scripts/package_guance_uniapp_android.sh
```

Set `GUANCE_SESSION_REPLAY=0` to omit the optional Session Replay UTS AAR.
Use `GUANCE_BUILD_UTS_MODULES=0` only when supplying already-built AARs through
`GC_UNIAPP_CORE_AAR` and `GC_UNIAPP_REPLAY_AAR`.

## package_guance_uniapp_release.sh

Combine the built iOS and Android platform ZIPs into the single GitHub Release
asset. Its contents are grouped under `iOS/` and `Android/`, so future
platforms can be added without changing the download entry point.

```bash
bash scripts/package_guance_uniapp_release.sh 0.3.0-alpha.1 \
  HybridHostExample-iOS/HBuilder-uniPluginDemo/build/GuanceUniApp-iOS/GuanceUniApp-iOS-0.3.0-alpha.1.zip \
  HybridHostExample-Android/build/GuanceUniApp-Android/GuanceUniApp-Android-0.3.0-alpha.1.zip
```

## publish_github_release.sh

Create or reuse a GitHub Release for an existing tag and upload one or more
assets. The command requires `GH_TOKEN`; Jenkins supplies it through the
`github-release-token` secret credential instead of storing it in the repo.
Tags containing `-` are published as GitHub prereleases.

```bash
GH_TOKEN=... \
GITHUB_RELEASE_REPOSITORY=GuanceCloud/datakit-uniapp-native-plugin \
bash scripts/publish_github_release.sh 0.3.0-alpha.1 release-a.zip release-b.zip
```

## test-tagged-release-automation.js

Verify the tag-triggered Jenkins and GitHub Actions release workflows,
asset-publishing safeguards, and CI iOS packaging mode.

```bash
node scripts/test-tagged-release-automation.js
```
