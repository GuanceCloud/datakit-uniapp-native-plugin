#!/bin/sh

set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
workspace_root=$(CDPATH= cd -- "$script_dir/.." && pwd)
android_root="$workspace_root/android"

sdk_root=${1:-${UNIMP_ANDROID_SDK_ROOT:-}}
if [ -z "$sdk_root" ]; then
  echo "Usage: $0 /path/to/SDK-Android@5.14-20260706" >&2
  exit 1
fi

source_dir="$sdk_root/SDK/libs"
destination_dir="$android_root/UniMPSDK/libs"
required_libraries="
android-gif-drawable-1.2.29.aar
base_oaid_sdk.aar
breakpad-build-release.aar
DCUniMPSDK-V2-release.aar
uniapp-v8-release.aar
"

for library in $required_libraries; do
  if [ ! -f "$source_dir/$library" ]; then
    echo "Required UniMP library not found: $source_dir/$library" >&2
    exit 1
  fi
done

mkdir -p "$destination_dir"
for library in $required_libraries; do
  cp "$source_dir/$library" "$destination_dir/$library"
done

echo "Synced UniMP Android core libraries into $destination_dir"
