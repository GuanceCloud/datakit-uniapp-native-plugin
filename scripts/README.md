# Scripts
## update-version.js

Modify the version in `GC-UniPlugin/package.json`,
`GC-UniSessionReplay/package.json`, JS helper version markers, and the UTS
bridge version markers.

```bash
node update-version.js
```

## test-session-replay-feature.js

Run focused source-level regression checks for the optional Session Replay
module, iOS early WebView hook, current-document bridge repair, native-host
duplicate protection, and Browser SDK readiness gate.

```bash
node test-session-replay-feature.js
```

## test-uts-proxy-exports.js

Verify the public root UTS proxy API, its legacy constant groups, and the
root-import smoke patterns used by the app entry and request helper.

```bash
node test-uts-proxy-exports.js
```

## test-hybrid-ios-uts-integration.js

Verify the checked-in DCloud hybrid iOS host wiring: dynamic UTS framework
projects, unique configuration loaders, shared Guance dynamic XCFrameworks,
and host embedding ownership.

```bash
node test-hybrid-ios-uts-integration.js
```
