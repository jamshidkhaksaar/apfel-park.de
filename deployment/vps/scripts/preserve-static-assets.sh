#!/usr/bin/env bash
# Keep immutable Next assets available after current changes or releases are pruned.
set -euo pipefail
umask 022
cache=${1:?static cache directory required}
shift
mkdir -p "$cache"
for source in "$@"; do
  [ -d "$source" ] || continue
  # rsync publishes new files by rename; readers never see partially copied files.
  # Content-hashed assets already present must never be replaced.
  rsync -rt --ignore-existing --chmod=D755,F644 "$source/" "$cache/"
done
