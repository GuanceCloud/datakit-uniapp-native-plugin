# Guance Harmony Hybrid Host

`HybridHostExample-Harmony` is the HarmonyOS counterpart of the iOS hybrid-host
sample. It verifies the complete integration route below:

```text
UniApp demo page
  -> GC-UniPlugin UTS bridge (ArkTS)
  -> @guancecloud/ft_sdk / ft_sdk_ext / ft_native (OHPM)
  -> Guance RUM, Log and Trace services
```

Unlike the iOS sample, the native host is a **DCloud Harmony offline SDK
template opened by DevEco Studio**, not a hand-maintained `AppDelegate` or an
Xcode project. HBuilderX compiles the UTS source to ArkTS and writes the
resulting `uni_modules/GC-UniPlugin` module into the DevEco host.

## Contents

| Path | Purpose |
| --- | --- |
| `uniapp/` | Small Vue 3 UniApp that initializes the SDK and exposes verification controls. Open this folder in HBuilderX. |
| `uniapp/uni_modules/GC-UniPlugin/` | A lightweight view of the repository's shared plugin. Its source links resolve to `Hbuilder_Example/uni_modules/GC-UniPlugin`; only the Harmony dependency configuration belongs to this sample. |
| `uniapp/uni_modules/GC-UniPlugin/utssdk/app-harmony/config.json` | Pins the three Guance Harmony dependencies from OHPM. No local HAR is required. |
| `uniapp/harmony-configs/` | Versioned, credential-free baseline for the DevEco app identity and build profile. |
| `scripts/bootstrap-host.mjs` | Materializes an ignored `host/` directory from a DCloud offline SDK template. |
| `scripts/build-hap.sh` | Builds a debug HAP after HBuilderX has generated the UTS module. |

The `host/` directory, signing material, OHPM cache, HAP files and local
HBuilderX outputs are intentionally ignored. This keeps the sample
reproducible without checking in the DCloud runtime or developer certificates.

## Prerequisites

- HBuilderX 4.25 or later, with Harmony development support.
- DevEco Studio with Harmony API `6.0.2(22)` (or a compatible newer API) and a
  device/emulator. `@guancecloud/ft_sdk_ext@0.1.15` requires API 22 and
  `useNormalizedOHMUrl: true`, both set in this sample's build profile.
- A DCloud **Harmony offline SDK template** compatible with the HBuilderX
  compiler used for this project.
- Network access to the public OHPM registry, or an OHPM mirror that provides
  the three pinned `@guancecloud/*` packages.

Use a matching DCloud template: HBuilderX exports UniApp runtime and generated
UTS code into that template, so a mismatched runtime/template version cannot
be treated as an integration result. The bootstrap script writes this sample's
credential-free API 22 build profile and app identity into the extracted
template.

## Build and run

1. Get the DCloud Harmony offline SDK template that matches your HBuilderX
   version. The official download and configuration flow is documented by
   DCloud: <https://uniapp.dcloud.net.cn/tutorial/harmony/dev-v1.html>.

2. Materialize the local DevEco host. The template may be either its unpacked
   `package` directory or the downloaded `.tgz` archive:

   ```bash
   cd HybridHostExample-Harmony
   node scripts/bootstrap-host.mjs --template /absolute/path/to/template.tgz
   ```

   This creates `HybridHostExample-Harmony/host/`; it never copies signing
   configuration from another project.

3. Open `HybridHostExample-Harmony/uniapp` in HBuilderX. Its
   `manifest.json` points to `../host`. Run **Run → Run to Harmony DevEco
   Studio** once. HBuilderX compiles the UTS bridge and adds the generated
   `uni_modules/GC-UniPlugin` module to the DevEco host.

   The project is explicitly Vue 3 because the Harmony UniApp runtime requires
   it.

4. In DevEco Studio, configure a signing identity for the `host` project.
   Signing files and passwords are local-only. Then run the `entry` target on
   a Harmony device or emulator.

5. To invoke the command-line build after the HBuilderX generation step:

   ```bash
   ./scripts/build-hap.sh
   ```

   The script deliberately refuses to build before the generated
   `host/uni_modules/GC-UniPlugin` directory exists. A HAP produced directly
   from a freshly extracted DCloud template validates only the DevEco host and
   remote packages; it does **not** yet contain the UniApp-to-UTS bridge.

6. Set `datawayUrl`, `clientToken`, and `harmonyAppId` in
   `uniapp/guance-config.js`, rebuild the HAP, and use the verification page.
   Blank values deliberately make the sample skip SDK initialization instead
   of sending telemetry to an unknown destination.

## OHPM dependency model

The sample pins only remote OHPM packages:

```json
{
  "@guancecloud/ft_sdk": "0.1.15",
  "@guancecloud/ft_sdk_ext": "0.1.15",
  "@guancecloud/ft_native": "0.1.1"
}
```

This is intentional. A local HAR is useful for testing an unpublished SDK
build, but is not required for a normal integration demo. To validate an
unpublished HAR instead, replace only the `ft_sdk` version in the Harmony UTS
`config.json` with a relative HAR path; do not commit that binary or its local
path.

## Verification matrix

| UI control | SDK path being verified | Expected result |
| --- | --- | --- |
| **Send Log** | Vue → JS facade → UTS `logger` → OHPM SDK | A Log record, linked to the current RUM session. |
| **Send RUM Action** | Vue → UTS `rum.addAction` | A named `verify_harmony_hybrid_action` Action. |
| **Send RUM Error** | Vue → UTS `rum.addError` | A controlled `demo_error` error record. |
| **Run uni.request** | `gcRequest` → Harmony request interceptor → native SDK | A RUM Resource (and Trace headers when enabled). |
| **Flush Buffered Data** | `mobileAgent.flushSyncData` | Immediate attempt to upload locally buffered telemetry. |
| **WebView RUM verification** | `gcwebview` native embed → `FTWebViewHandler` | Browser/WebView RUM collected for the allow-listed URL. |

Harmony Session Replay is intentionally not included: the repository's
`GC-UniSessionReplay` implementation is iOS-only. This host verifies normal
Harmony RUM, Logs, Tracing, `uni.request` Resource collection, native crash/
ANR/freeze configuration, and WebView RUM bridging.

## Repository checks

Run the structural integration check from the repository root:

```bash
node scripts/test-hybrid-harmony-integration.js
```

It verifies the remote dependency pins, the host bootstrap/build scripts and
the complete set of telemetry controls. It does not replace a real HAP build:
that final validation requires HBuilderX, DevEco Studio, signing and a target
device/emulator.
