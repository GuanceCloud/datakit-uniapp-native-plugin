#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'USAGE'
Usage: package_guance_uniapp_android.sh [version]

Creates a versioned ZIP for integrating Guance UniApp UTS modules into an
Android native-hybrid Host application. The version defaults to the
GC-UniPlugin package version.

The script packages Android Library AARs compiled from Kotlin source exported
by HBuilderX. By default it builds those libraries before packaging.

Required environment variable:
  DCLOUD_UTS_RUNTIME_VERSION  Version of the DCloud UTS runtime used to build
                              the JARs, for example 5.15.82650_20260710.

Optional environment variables:
  GUANCE_SESSION_REPLAY=0     Omit unimoduleGCUniSessionReplay.aar.
  GUANCE_BUILD_UTS_MODULES=0  Do not build the Android Library modules first.
  GC_UNIAPP_CORE_AAR=PATH     Override the core UTS AAR source path.
  GC_UNIAPP_REPLAY_AAR=PATH   Override the Session Replay UTS AAR source path.
  FT_SDK_VERSION=VERSION      Default: 1.7.5.
  FT_NATIVE_VERSION=VERSION   Default: 1.1.3.
  FT_REPLAY_VERSION=VERSION   Default: 0.1.8.
  FT_PLUGIN_VERSION=VERSION   Default: 1.3.8.
USAGE
  exit 0
fi

script_dir="$(cd "$(dirname "$0")" && pwd)"
host_root="$(cd "$script_dir/.." && pwd)"
repository_root="$(cd "$host_root/../../.." && pwd)"
version="${1:-$(node -p "require(process.argv[1]).version" "$repository_root/Hbuilder_Example/uni_modules/GC-UniPlugin/package.json")}"
runtime_version="${DCLOUD_UTS_RUNTIME_VERSION:-}"
include_session_replay="${GUANCE_SESSION_REPLAY:-1}"
build_uts_modules="${GUANCE_BUILD_UTS_MODULES:-1}"
core_aar="${GC_UNIAPP_CORE_AAR:-$host_root/unimoduleGCUniPlugin/build/outputs/aar/unimoduleGCUniPlugin-release.aar}"
replay_aar="${GC_UNIAPP_REPLAY_AAR:-$host_root/unimoduleGCUniSessionReplay/build/outputs/aar/unimoduleGCUniSessionReplay-release.aar}"
ft_sdk_version="${FT_SDK_VERSION:-1.7.5}"
ft_native_version="${FT_NATIVE_VERSION:-1.1.3}"
ft_replay_version="${FT_REPLAY_VERSION:-0.1.8}"
ft_plugin_version="${FT_PLUGIN_VERSION:-1.3.8}"
build_root="$host_root/build/GuanceUniApp-Android"
staging_root="$build_root/staging"
package_name="GuanceUniApp-Android-$version"
package_root="$staging_root/$package_name"
output_dir="$repository_root/dist/native-sdk-hybrid/android"
archive_path="$output_dir/$package_name.zip"
template_root="$host_root/distribution"

case "$version" in
  *[!A-Za-z0-9._+-]*|'')
    echo "Invalid package version: $version" >&2
    exit 1
    ;;
esac

if [[ -z "$runtime_version" ]]; then
  echo "DCLOUD_UTS_RUNTIME_VERSION is required." >&2
  exit 1
fi

if [[ "$include_session_replay" != "0" && "$include_session_replay" != "1" ]]; then
  echo "GUANCE_SESSION_REPLAY must be 0 or 1." >&2
  exit 1
fi

if [[ "$build_uts_modules" != "0" && "$build_uts_modules" != "1" ]]; then
  echo "GUANCE_BUILD_UTS_MODULES must be 0 or 1." >&2
  exit 1
fi

if [[ "$include_session_replay" == "1" ]]; then
  session_replay_included_json="true"
  session_replay_artifact_json='"unimoduleGCUniSessionReplay.aar"'
else
  session_replay_included_json="false"
  session_replay_artifact_json="null"
fi

if [[ "$build_uts_modules" == "1" ]]; then
  tasks=(":unimoduleGCUniPlugin:assembleRelease")
  if [[ "$include_session_replay" == "1" ]]; then
    tasks+=(":unimoduleGCUniSessionReplay:assembleRelease")
  fi
  "$host_root/gradlew" --project-dir "$host_root" "${tasks[@]}"
fi

for artifact in "$core_aar" "$template_root/ReleaseManifest.json.template"; do
  if [[ ! -f "$artifact" ]]; then
    echo "Missing required artifact: $artifact" >&2
    exit 1
  fi
done

if [[ "$include_session_replay" == "1" && ! -f "$replay_aar" ]]; then
  echo "Missing Session Replay UTS AAR: $replay_aar" >&2
  exit 1
fi

unzip -tqq "$core_aar"
if [[ "$include_session_replay" == "1" ]]; then
  unzip -tqq "$replay_aar"
fi

rm -rf "$build_root"
mkdir -p "$package_root" "$output_dir"

cp "$core_aar" "$package_root/unimoduleGCUniPlugin.aar"
if [[ "$include_session_replay" == "1" ]]; then
  cp "$replay_aar" "$package_root/unimoduleGCUniSessionReplay.aar"
fi

render_template() {
  local source="$1"
  local destination="$2"

  sed \
    -e "s/__VERSION__/$version/g" \
    -e "s/__DCLOUD_UTS_RUNTIME_VERSION__/$runtime_version/g" \
    -e "s/__FT_SDK_VERSION__/$ft_sdk_version/g" \
    -e "s/__FT_NATIVE_VERSION__/$ft_native_version/g" \
    -e "s/__FT_REPLAY_VERSION__/$ft_replay_version/g" \
    -e "s/__FT_PLUGIN_VERSION__/$ft_plugin_version/g" \
    -e "s/__SESSION_REPLAY_INCLUDED__/$session_replay_included_json/g" \
    -e "s/__CORE_MODULE_ARTIFACT__/unimoduleGCUniPlugin.aar/g" \
    -e "s/__SESSION_REPLAY_MODULE_ARTIFACT__/$session_replay_artifact_json/g" \
    "$source" > "$destination"
}

render_template "$template_root/ReleaseManifest.json.template" "$package_root/ReleaseManifest.json"

(
  cd "$package_root"
  shasum -a 256 ./*.aar > checksums.txt
)

rm -f "$archive_path"
(cd "$staging_root" && /usr/bin/zip -X -r "$archive_path" "$package_name" >/dev/null)

echo "Created $archive_path"
