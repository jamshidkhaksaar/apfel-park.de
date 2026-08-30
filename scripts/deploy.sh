#!/usr/bin/env bash
# Compatibility entry point. All deployments must use the canonical,
# commit-addressed release workflow so uncommitted files and local artifacts
# can never enter production.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec "$ROOT/deployment/vps/scripts/deploy-app.sh" "$@"
