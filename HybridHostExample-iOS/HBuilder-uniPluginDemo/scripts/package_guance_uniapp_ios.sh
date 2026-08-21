#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'USAGE'
Usage: package_guance_uniapp_ios.sh [version]

Builds a native-hybrid iOS release ZIP. The version defaults to the
GC-UniPlugin package version. Set GUANCE_SESSION_REPLAY=0 to omit the optional
unimoduleGCUniSessionReplay XCFramework. The static HostBridge always remains
in the archive and still requires the native Session Replay SDK.

Set DCLOUD_SDK_LIBS_DIR when the DCloud framework directory is not located at
HybridHostExample-iOS/HBuilder-uniPluginDemo/SDK/Libs.

Set GC_UNIAPP_USE_CHECKED_IN_UTS_SOURCES=1 only in a release CI checkout that
uses the generated hybrid UTS Swift sources committed with the release tag.
The script still regenerates the Xcode projects with the configured DCloud SDK
framework path.
USAGE
  exit 0
fi

script_dir="$(cd "$(dirname "$0")" && pwd)"
host_root="$(cd "$script_dir/.." && pwd)"
repository_root="$(cd "$host_root/../.." && pwd)"
version="${1:-$(node -p "require(process.argv[1]).version" "$repository_root/Hbuilder_Example/uni_modules/GC-UniPlugin/package.json")}"
dcloud_sdk_libs="${DCLOUD_SDK_LIBS_DIR:-$host_root/SDK/Libs}"
include_session_replay="${GUANCE_SESSION_REPLAY:-1}"
build_root="$host_root/build/GuanceUniApp-iOS"
staging_root="$build_root/staging"
package_name="GuanceUniApp-iOS-$version"
package_root="$staging_root/$package_name"
archive_path="$build_root/$package_name.zip"
host_bridge_root="$host_root/GuanceUniAppHostBridge"
host_bridge_artifact="$host_bridge_root/StaticFramework/build/GuanceUniAppHostBridge.xcframework"

case "$version" in
  *[!A-Za-z0-9._+-]*|'')
    echo "Invalid package version: $version" >&2
    exit 1
    ;;
esac

for framework in DCUniBase.framework DCloudUTSFoundation.framework; do
  if [[ ! -d "$dcloud_sdk_libs/$framework" ]]; then
    echo "Missing $framework in DCLOUD_SDK_LIBS_DIR: $dcloud_sdk_libs" >&2
    exit 1
  fi
done

if [[ "$include_session_replay" != "0" && "$include_session_replay" != "1" ]]; then
  echo "GUANCE_SESSION_REPLAY must be 0 or 1" >&2
  exit 1
fi

rm -rf "$build_root"
mkdir -p "$build_root" "$staging_root"

DCLOUD_SDK_LIBS_DIR="$dcloud_sdk_libs" \
GUANCE_SESSION_REPLAY="$include_session_replay" \
GC_UNIAPP_USE_CHECKED_IN_UTS_SOURCES="${GC_UNIAPP_USE_CHECKED_IN_UTS_SOURCES:-0}" \
ruby "$script_dir/generate_guance_uts_frameworks.rb"
bash "$script_dir/build_guance_host_bridge_xcframework.sh"

build_uts_framework() {
  local name="$1"
  local project="$host_root/UTSFrameworks/$name/$name.xcodeproj"
  local framework_build_root="$build_root/$name"
  local device_archive="$framework_build_root/ios.xcarchive"
  local simulator_archive="$framework_build_root/ios-simulator.xcarchive"
  local output="$framework_build_root/$name.xcframework"

  xcodebuild archive \
    -project "$project" \
    -scheme "$name" \
    -destination 'generic/platform=iOS' \
    -archivePath "$device_archive" \
    -derivedDataPath "$framework_build_root/DerivedData" \
    SKIP_INSTALL=NO \
    BUILD_LIBRARY_FOR_DISTRIBUTION=YES \
    CODE_SIGNING_ALLOWED=NO

  xcodebuild archive \
    -project "$project" \
    -scheme "$name" \
    -destination 'generic/platform=iOS Simulator' \
    -archivePath "$simulator_archive" \
    -derivedDataPath "$framework_build_root/DerivedData" \
    SKIP_INSTALL=NO \
    BUILD_LIBRARY_FOR_DISTRIBUTION=YES \
    CODE_SIGNING_ALLOWED=NO

  xcodebuild -create-xcframework \
    -framework "$device_archive/Products/Library/Frameworks/$name.framework" \
    -framework "$simulator_archive/Products/Library/Frameworks/$name.framework" \
    -output "$output"

  echo "Built $output"
}

build_uts_framework unimoduleGCUniPlugin
core_uts_artifact="$build_root/unimoduleGCUniPlugin/unimoduleGCUniPlugin.xcframework"
session_uts_artifact=""
if [[ "$include_session_replay" == "1" ]]; then
  build_uts_framework unimoduleGCUniSessionReplay
  session_uts_artifact="$build_root/unimoduleGCUniSessionReplay/unimoduleGCUniSessionReplay.xcframework"
fi

mkdir -p "$package_root"
cp -R "$core_uts_artifact" "$package_root/unimoduleGCUniPlugin.xcframework"
if [[ -n "$session_uts_artifact" ]]; then
  cp -R "$session_uts_artifact" "$package_root/unimoduleGCUniSessionReplay.xcframework"
fi
cp -R "$host_bridge_artifact" "$package_root/GuanceUniAppHostBridge.xcframework"

(cd "$staging_root" && /usr/bin/ditto -c -k --keepParent "$package_name" "$archive_path")

echo "Created $archive_path"
