#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "$0")" && pwd)"
host_root="$(cd "$script_dir/.." && pwd)"
bridge_root="$host_root/GuanceUniAppHostBridge"
project="$bridge_root/StaticFramework/GuanceUniAppHostBridge.xcodeproj"
build_root="$bridge_root/StaticFramework/build"
device_archive="$build_root/archives/ios.xcarchive"
simulator_archive="$build_root/archives/ios-simulator.xcarchive"
output="$build_root/GuanceUniAppHostBridge.xcframework"

if [[ ! -d "$project" ]]; then
  echo "Missing static HostBridge project. Run generate_guance_uts_frameworks.rb first." >&2
  exit 1
fi

rm -rf "$device_archive" "$simulator_archive" "$output"

xcodebuild archive \
  -project "$project" \
  -scheme GuanceUniAppHostBridge \
  -destination 'generic/platform=iOS' \
  -archivePath "$device_archive" \
  -derivedDataPath "$build_root/DerivedData" \
  SKIP_INSTALL=NO \
  BUILD_LIBRARY_FOR_DISTRIBUTION=YES \
  CODE_SIGNING_ALLOWED=NO

xcodebuild archive \
  -project "$project" \
  -scheme GuanceUniAppHostBridge \
  -destination 'generic/platform=iOS Simulator' \
  -archivePath "$simulator_archive" \
  -derivedDataPath "$build_root/DerivedData" \
  SKIP_INSTALL=NO \
  BUILD_LIBRARY_FOR_DISTRIBUTION=YES \
  CODE_SIGNING_ALLOWED=NO

xcodebuild -create-xcframework \
  -framework "$device_archive/Products/Library/Frameworks/GuanceUniAppHostBridge.framework" \
  -framework "$simulator_archive/Products/Library/Frameworks/GuanceUniAppHostBridge.framework" \
  -output "$output"

echo "Created $output"
