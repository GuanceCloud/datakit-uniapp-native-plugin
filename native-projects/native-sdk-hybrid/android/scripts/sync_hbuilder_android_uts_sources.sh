#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'USAGE'
Usage: sync_hbuilder_android_uts_sources.sh

Copies Kotlin source exported by HBuilderX into the checked-in Android Library
modules. Export the Android native resources from HBuilderX before running the
script. Set HBUILDER_ANDROID_UTS_EXPORT_DIR to override the default export
directory.
USAGE
  exit 0
fi

script_dir="$(cd "$(dirname "$0")" && pwd)"
host_root="$(cd "$script_dir/.." && pwd)"
repository_root="$(cd "$host_root/../../.." && pwd)"
export_root="${HBUILDER_ANDROID_UTS_EXPORT_DIR:-$repository_root/Hbuilder_Example/unpackage/resources/uni_modules}"

sync_module() {
  local plugin_name="$1"
  local module_name="$2"
  local source_root="$export_root/$plugin_name/utssdk/app-android/src"
  local destination_root="$host_root/$module_name/src/main/kotlin"

  if [[ ! -d "$source_root" ]]; then
    echo "Missing HBuilderX Android UTS export: $source_root" >&2
    exit 1
  fi

  rm -rf "$destination_root"
  mkdir -p "$destination_root"
  cp -R "$source_root/." "$destination_root/"
  echo "Synchronized $plugin_name into $module_name"
}

sync_module 'GC-UniPlugin' 'unimoduleGCUniPlugin'
sync_module 'GC-UniSessionReplay' 'unimoduleGCUniSessionReplay'
