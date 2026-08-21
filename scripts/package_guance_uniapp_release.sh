#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'USAGE'
Usage: package_guance_uniapp_release.sh <version> <ios-zip> <android-zip>

Combines the platform-specific native-hybrid release ZIPs into one customer
download. The resulting archive has iOS/ and Android/ directories, leaving a
stable location for future platforms such as HarmonyOS.
USAGE
  exit 0
fi

if [[ "$#" -ne 3 ]]; then
  echo "Expected a version, iOS ZIP, and Android ZIP." >&2
  exit 1
fi

version="$1"
ios_archive="$2"
android_archive="$3"

case "$version" in
  *[!A-Za-z0-9._+-]*|'')
    echo "Invalid package version: $version" >&2
    exit 1
    ;;
esac

for archive in "$ios_archive" "$android_archive"; do
  if [[ ! -f "$archive" ]]; then
    echo "Missing platform archive: $archive" >&2
    exit 1
  fi
  unzip -tqq "$archive"
done

script_dir="$(cd "$(dirname "$0")" && pwd)"
repository_root="$(cd "$script_dir/.." && pwd)"
build_root="$repository_root/build/GuanceUniApp"
staging_root="$build_root/staging"
package_name="GuanceUniApp-$version"
package_root="$staging_root/$package_name"
archive_path="$build_root/$package_name.zip"

rm -rf "$build_root"
mkdir -p "$package_root/iOS" "$package_root/Android"

unzip -q "$ios_archive" -d "$package_root/iOS"
unzip -q "$android_archive" -d "$package_root/Android"

if [[ ! -d "$package_root/iOS/GuanceUniApp-iOS-$version" ]]; then
  echo "Unexpected iOS archive layout; missing GuanceUniApp-iOS-$version." >&2
  exit 1
fi

if [[ ! -d "$package_root/Android/GuanceUniApp-Android-$version" ]]; then
  echo "Unexpected Android archive layout; missing GuanceUniApp-Android-$version." >&2
  exit 1
fi

printf '{\n  "version": "%s",\n  "platforms": ["iOS", "Android"]\n}\n' "$version" \
  > "$package_root/ReleaseManifest.json"

(
  cd "$package_root"
  {
    find iOS Android -type f -print
    printf '%s\n' ReleaseManifest.json
  } | LC_ALL=C sort | while IFS= read -r artifact; do
    shasum -a 256 "$artifact"
  done
) > "$package_root/checksums.txt"

(cd "$staging_root" && /usr/bin/zip -X -r "$archive_path" "$package_name" >/dev/null)

echo "Created $archive_path"
