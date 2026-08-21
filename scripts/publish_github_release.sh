#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'USAGE'
Usage: publish_github_release.sh <tag> <asset> [<asset> ...]

Creates or reuses the GitHub Release for an existing GitHub tag, then uploads
the supplied assets. GH_TOKEN must contain a GitHub token with contents:write
permission. Set GITHUB_RELEASE_REPOSITORY to owner/repository when the local
checkout does not have a GITHUB remote.
USAGE
  exit 0
fi

if [[ "$#" -lt 2 ]]; then
  echo "Expected a tag and at least one release asset." >&2
  exit 1
fi

tag="$1"
shift

case "$tag" in
  *[!A-Za-z0-9._+-]*|'')
    echo "Invalid release tag: $tag" >&2
    exit 1
    ;;
esac

if [[ -z "${GH_TOKEN:-}" ]]; then
  echo "GH_TOKEN is required." >&2
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) is required." >&2
  exit 1
fi

for asset in "$@"; do
  if [[ ! -f "$asset" ]]; then
    echo "Missing release asset: $asset" >&2
    exit 1
  fi
done

repository="${GITHUB_RELEASE_REPOSITORY:-}"
if [[ -z "$repository" ]]; then
  remote_url="$(git config --get remote.GITHUB.url || true)"
  case "$remote_url" in
    git@github.com:*.git)
      repository="${remote_url#git@github.com:}"
      repository="${repository%.git}"
      ;;
    https://github.com/*.git)
      repository="${remote_url#https://github.com/}"
      repository="${repository%.git}"
      ;;
    ssh://git@github.com/*/*.git)
      repository="${remote_url#ssh://git@github.com/}"
      repository="${repository%.git}"
      ;;
  esac
fi

if [[ -z "$repository" ]]; then
  echo "Set GITHUB_RELEASE_REPOSITORY to the target owner/repository." >&2
  exit 1
fi

if gh release view "$tag" --repo "$repository" >/dev/null 2>&1; then
  echo "Reusing GitHub Release $repository@$tag"
else
  release_args=(
    --repo "$repository"
    --verify-tag
    --title "$tag"
    --notes "Guance UniApp native-hybrid release assets for $tag"
  )
  if [[ "$tag" == *-* ]]; then
    release_args+=(--prerelease)
  fi
  gh release create "$tag" "${release_args[@]}"
fi

gh release upload "$tag" "$@" --repo "$repository" --clobber
echo "Published $(($#)) asset(s) to GitHub Release $repository@$tag"
