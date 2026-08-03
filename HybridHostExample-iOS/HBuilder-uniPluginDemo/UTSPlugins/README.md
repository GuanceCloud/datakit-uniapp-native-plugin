# UTSPlugins

Put exported UTS plugin iOS folders here, then run `pod install`.

Expected structure:

```text
UTSPlugins/<plugin-name>/app-ios
```

Example:

```text
UTSPlugins/uni-getbatteryinfo/app-ios
```

The Podfile scans this directory and generates local Pods for each plugin. Unused plugins can be removed from this directory; previously written Info.plist, feature.plist, or entitlements values are not deleted automatically.
