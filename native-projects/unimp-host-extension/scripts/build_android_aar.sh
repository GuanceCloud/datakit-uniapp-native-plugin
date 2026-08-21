#!/bin/sh

set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
workspace_root=$(CDPATH= cd -- "$script_dir/.." && pwd)
repo_root=$(CDPATH= cd -- "$workspace_root/../.." && pwd)
android_root="$workspace_root/android"

sdk_version=$(sed -n 's/^SDK_VERSION=//p' "$repo_root/.version" | sed -n '1p')
if [ -z "$sdk_version" ]; then
  echo "SDK_VERSION was not found in $repo_root/.version" >&2
  exit 1
fi

"$android_root/gradlew" -p "$android_root" :uniplugin_module:assembleRelease

source_aar="$android_root/GCUniPlugin/build/outputs/aar/gc-uniplugin-$sdk_version.aar"
output_dir="$repo_root/dist/unimp-host-extension/android"
output_aar="$output_dir/gc-uniplugin-$sdk_version.aar"

if [ ! -f "$source_aar" ]; then
  echo "Expected AAR was not generated: $source_aar" >&2
  exit 1
fi

mkdir -p "$output_dir"
cp "$source_aar" "$output_aar"
echo "Created $output_aar"
