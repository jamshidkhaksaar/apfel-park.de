#!/usr/bin/env bash
# Pure, read-only preflight. An intentional rollback requires an explicit override.
set -euo pipefail
source_repo=$1
live_sha=$2
target_sha=$3
git -C "$source_repo" rev-parse --verify "$target_sha^{commit}" >/dev/null
if [ -n "$live_sha" ]; then
  git -C "$source_repo" rev-parse --verify "$live_sha^{commit}" >/dev/null
  if ! git -C "$source_repo" merge-base --is-ancestor "$live_sha" "$target_sha"; then
    if [ "${ALLOW_NON_FORWARD_DEPLOY:-0}" != 1 ]; then
      printf '%s\n' 'Refusing an older or divergent release. Merge the live changes first. For an intentional rollback only, set ALLOW_NON_FORWARD_DEPLOY=1.' >&2
      exit 1
    fi
  fi
fi
