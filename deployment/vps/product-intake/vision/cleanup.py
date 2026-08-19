from __future__ import annotations

import os
import time
from pathlib import Path

SENSITIVE_ROOT = Path(os.getenv("APFEL_INTAKE_SENSITIVE_ROOT", "/srv/apfel-intake/private/sensitive"))
ORDINARY_ROOT = Path(os.getenv("APFEL_INTAKE_ORDINARY_ROOT", "/srv/apfel-intake/private/ordinary"))
REDACTED_ROOT = Path(os.getenv("APFEL_INTAKE_REDACTED_ROOT", "/srv/n8n/media/intake"))
SUBMISSIONS_ROOT = Path(os.getenv("APFEL_INTAKE_SUBMISSIONS_ROOT", "/srv/apfel-intake/submissions"))


def prune(root: Path, max_age_hours: int) -> int:
    cutoff = time.time() - max_age_hours * 3600
    removed = 0
    if not root.exists():
        return removed
    for path in sorted(root.rglob("*"), reverse=True):
        if path.is_file() and path.stat().st_mtime < cutoff:
            path.unlink(missing_ok=True)
            removed += 1
        elif path.is_dir():
            try:
                path.rmdir()
            except OSError:
                pass
    return removed


if __name__ == "__main__":
    print({
        "sensitiveRemoved": prune(SENSITIVE_ROOT, 24),
        "ordinaryRemoved": prune(ORDINARY_ROOT, 72),
        "derivativesRemoved": prune(REDACTED_ROOT, 72),
        "submissionCopiesRemoved": prune(SUBMISSIONS_ROOT, 1),
    })
