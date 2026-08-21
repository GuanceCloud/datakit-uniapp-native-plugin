#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'USAGE'
Usage: package_guance_uniapp_ios.sh [version]

Builds a native-hybrid iOS release ZIP. The version defaults to the
GC-UniPlugin package version. Set GUANCE_SESSION_REPLAY=0 to omit the optional
unimoduleGCUniSessionReplay and GuanceSessionReplay XCFrameworks. The UTS
modules directly depend on the bundled local dynamic Guance XCFrameworks.

Set DCLOUD_SDK_LIBS_DIR when the DCloud framework directory is not located at
native-projects/native-sdk-hybrid/ios/SDK/Libs.

Set GC_UNIAPP_USE_CHECKED_IN_UTS_SOURCES=1 only in a release CI checkout that
uses the generated hybrid UTS Swift sources committed with the release tag.
The script still regenerates the Xcode projects with the configured DCloud SDK
framework path.
USAGE
  exit 0
fi

script_dir="$(cd "$(dirname "$0")" && pwd)"
host_root="$(cd "$script_dir/.." && pwd)"
repository_root="$(cd "$host_root/../../../.." && pwd)"
version="${1:-$(node -p "require(process.argv[1]).version" "$repository_root/Hbuilder_Example/uni_modules/GC-UniPlugin/package.json")}"
dcloud_sdk_libs="${DCLOUD_SDK_LIBS_DIR:-$host_root/../SDK/Libs}"
include_session_replay="${GUANCE_SESSION_REPLAY:-1}"
build_root="$host_root/build/GuanceUniApp-iOS"
staging_root="$build_root/staging"
package_name="GuanceUniApp-$version"
package_root="$staging_root/$package_name"
output_dir="$repository_root/dist/native-sdk-hybrid/ios"
archive_path="$output_dir/$package_name.zip"
core_sdk_artifact="$repository_root/Hbuilder_Example/uni_modules/GC-UniPlugin/utssdk/app-ios/Frameworks/GuanceSDK.xcframework"
session_replay_artifact="$repository_root/Hbuilder_Example/uni_modules/GC-UniSessionReplay/utssdk/app-ios/Frameworks/GuanceSessionReplay.xcframework"

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

if [[ ! -d "$core_sdk_artifact" ]]; then
  echo "Missing local Guance SDK XCFramework: $core_sdk_artifact" >&2
  exit 1
fi

if [[ "$include_session_replay" == "1" && ! -d "$session_replay_artifact" ]]; then
  echo "Missing local Guance Session Replay XCFramework: $session_replay_artifact" >&2
  exit 1
fi

if [[ "$include_session_replay" != "0" && "$include_session_replay" != "1" ]]; then
  echo "GUANCE_SESSION_REPLAY must be 0 or 1" >&2
  exit 1
fi

rm -rf "$build_root"
mkdir -p "$build_root" "$staging_root" "$output_dir"

DCLOUD_SDK_LIBS_DIR="$dcloud_sdk_libs" \
GUANCE_SESSION_REPLAY="$include_session_replay" \
GC_UNIAPP_USE_CHECKED_IN_UTS_SOURCES="${GC_UNIAPP_USE_CHECKED_IN_UTS_SOURCES:-0}" \
ruby "$script_dir/generate_guance_uts_frameworks.rb"

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
cp -R "$core_sdk_artifact" "$package_root/GuanceSDK.xcframework"
if [[ -n "$session_uts_artifact" ]]; then
  cp -R "$session_uts_artifact" "$package_root/unimoduleGCUniSessionReplay.xcframework"
  cp -R "$session_replay_artifact" "$package_root/GuanceSessionReplay.xcframework"
fi

find "$package_root" -name '.DS_Store' -delete
rm -f "$archive_path"
(cd "$staging_root" && COPYFILE_DISABLE=1 /usr/bin/ditto -c -k --keepParent --norsrc "$package_name" "$archive_path")

echo "Created $archive_path"
