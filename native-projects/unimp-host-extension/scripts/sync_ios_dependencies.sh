#!/bin/sh

set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
workspace_root=$(CDPATH= cd -- "$script_dir/.." && pwd)
repo_root=$(CDPATH= cd -- "$workspace_root/../.." && pwd)
ios_root="$workspace_root/ios"

unimp_sdk_root=${1:-${UNIMP_IOS_SDK_ROOT:-}}
if [ -z "$unimp_sdk_root" ]; then
  echo "Usage: $0 /path/to/UniMPSDK_iOS@5.15 [GuanceSDK.xcframework] [DCloud-native-SDK/inc]" >&2
  exit 1
fi

unimp_core="$unimp_sdk_root/UniMPSDK/Core"
if [ ! -d "$unimp_core" ]; then
  echo "UniMP Core not found: $unimp_core" >&2
  exit 1
fi

guance_sdk=${2:-${GUANCE_SDK_XCFRAMEWORK:-$repo_root/Hbuilder_Example/uni_modules/GC-UniPlugin/utssdk/app-ios/Frameworks/GuanceSDK.xcframework}}
if [ ! -d "$guance_sdk" ]; then
  echo "GuanceSDK.xcframework not found: $guance_sdk" >&2
  exit 1
fi

dcloud_headers=${3:-${DCLOUD_NATIVE_SDK_HEADERS:-$repo_root/native-projects/native-sdk-hybrid/ios/SDK/inc}}
if [ ! -f "$dcloud_headers/DCUni/DCUniModule.h" ]; then
  echo "DCloud native extension headers not found: $dcloud_headers" >&2
  exit 1
fi

mkdir -p "$ios_root/UniMPSDK/Core" "$ios_root/Dependencies/GuanceSDK.xcframework" "$ios_root/Dependencies/DCloudHeaders/DCUni"
rsync -a --exclude '.DS_Store' "$unimp_core/" "$ios_root/UniMPSDK/Core/"
rsync -a --exclude '.DS_Store' "$guance_sdk/" "$ios_root/Dependencies/GuanceSDK.xcframework/"
rsync -a --exclude '.DS_Store' "$dcloud_headers/DCUni/" "$ios_root/Dependencies/DCloudHeaders/DCUni/"

echo "Synced UniMP Core, GuanceSDK, and DCloud extension headers into $ios_root"
