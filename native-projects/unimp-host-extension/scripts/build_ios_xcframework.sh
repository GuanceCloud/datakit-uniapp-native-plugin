#!/bin/sh

set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
workspace_root=$(CDPATH= cd -- "$script_dir/.." && pwd)
repo_root=$(CDPATH= cd -- "$workspace_root/../.." && pwd)
project="$workspace_root/ios/GCUniPlugin/GC-UniPlugin-App.xcodeproj"
output="$repo_root/dist/unimp-host-extension/ios/GC-UniPlugin-App.xcframework"
build_root=$(mktemp -d "${TMPDIR:-/tmp}/gc-unimp-ios.XXXXXX")

cleanup() {
  rm -rf "$build_root"
}
trap cleanup EXIT INT TERM

xcodebuild -quiet archive \
  -project "$project" \
  -scheme Guance-UniPlugin-App \
  -configuration Release \
  -destination "generic/platform=iOS" \
  -derivedDataPath "$build_root/DerivedData-iOS" \
  -archivePath "$build_root/ios" \
  SKIP_INSTALL=NO \
  BUILD_LIBRARY_FOR_DISTRIBUTION=YES \
  CODE_SIGNING_ALLOWED=NO

xcodebuild -quiet archive \
  -project "$project" \
  -scheme Guance-UniPlugin-App \
  -configuration Release \
  -destination "generic/platform=iOS Simulator" \
  -derivedDataPath "$build_root/DerivedData-Simulator" \
  -archivePath "$build_root/simulator" \
  SKIP_INSTALL=NO \
  BUILD_LIBRARY_FOR_DISTRIBUTION=YES \
  CODE_SIGNING_ALLOWED=NO

mkdir -p "$(dirname "$output")"
rm -rf "$output"
xcodebuild -create-xcframework \
  -framework "$build_root/ios.xcarchive/Products/Library/Frameworks/GC_UniPlugin_App.framework" \
  -framework "$build_root/simulator.xcarchive/Products/Library/Frameworks/GC_UniPlugin_App.framework" \
  -output "$output"

echo "Created $output"
