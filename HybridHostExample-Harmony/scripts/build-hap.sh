#!/usr/bin/env bash
set -euo pipefail

sample_root="$(cd "$(dirname "$0")/.." && pwd)"
host_root="$sample_root/host"

if [[ ! -d "$host_root/uni_modules/GC-UniPlugin" ]]; then
  echo "The UTS module has not been generated in the DevEco host." >&2
  echo "Open $sample_root/uniapp in HBuilderX and run it to Harmony DevEco Studio before building." >&2
  exit 1
fi

if [[ -n "${HVIGORW:-}" ]]; then
  hvigorw="$HVIGORW"
elif command -v hvigorw >/dev/null 2>&1; then
  hvigorw="$(command -v hvigorw)"
elif [[ -x "/Applications/DevEco-Studio.app/Contents/tools/hvigor/bin/hvigorw" ]]; then
  # DevEco Studio's standard macOS installation path. Set HVIGORW on other
  # systems or when DevEco Studio is installed elsewhere.
  hvigorw="/Applications/DevEco-Studio.app/Contents/tools/hvigor/bin/hvigorw"
else
  echo "Cannot find hvigorw. Set HVIGORW to DevEco Studio's hvigorw executable." >&2
  exit 1
fi

# DevEco Studio bundles a JBR on macOS, but its Java path is not always
# inherited by a terminal-launched Hvigor daemon.
if [[ -z "${JAVA_HOME:-}" && -x "/Applications/DevEco-Studio.app/Contents/jbr/Contents/Home/bin/java" ]]; then
  export JAVA_HOME="/Applications/DevEco-Studio.app/Contents/jbr/Contents/Home"
fi
if [[ -n "${JAVA_HOME:-}" && -x "$JAVA_HOME/bin/java" ]]; then
  export PATH="$JAVA_HOME/bin:$PATH"
fi

cd "$host_root"
"$hvigorw" --mode module -p module=entry@default -p product=default -p buildMode=debug assembleHap
