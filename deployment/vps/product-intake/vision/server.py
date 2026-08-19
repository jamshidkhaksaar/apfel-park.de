from __future__ import annotations

import hmac
import os
import re
import tempfile
from pathlib import Path

from fastapi import Body, FastAPI, File, Form, Header, HTTPException, UploadFile

from extractor import ASSET_TYPES, extract
from merge_results import merge_results

SENSITIVE_ROOT = Path(os.getenv("APFEL_INTAKE_SENSITIVE_ROOT", "/srv/apfel-intake/private/sensitive"))
ORDINARY_ROOT = Path(os.getenv("APFEL_INTAKE_ORDINARY_ROOT", "/srv/apfel-intake/private/ordinary"))
REDACTED_ROOT = Path(os.getenv("APFEL_INTAKE_REDACTED_ROOT", "/srv/n8n/media/intake"))
AUTH_TOKEN = os.environ.get("APFEL_INTAKE_VISION_TOKEN", "")
MAX_BYTES = 25 * 1024 * 1024
SAFE_RUN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_-]{7,80}$")

app = FastAPI(title="Apfel Intake Vision", docs_url=None, redoc_url=None, openapi_url=None)


def authorize(token: str | None) -> None:
    if len(AUTH_TOKEN) < 32 or not token or not hmac.compare_digest(token, AUTH_TOKEN):
        raise HTTPException(status_code=401, detail="unauthorized")


@app.get("/health")
def health() -> dict[str, object]:
    return {"ok": True, "solVision": "required-after-redaction", "assetTypes": sorted(ASSET_TYPES)}


@app.post("/extract")
async def extract_asset(
    run_id: str = Form(...),
    asset_type: str = Form(...),
    image: UploadFile = File(...),
    x_vision_token: str | None = Header(default=None),
) -> dict[str, object]:
    authorize(x_vision_token)
    if not SAFE_RUN.fullmatch(run_id):
        raise HTTPException(status_code=400, detail="invalid run id")
    if asset_type not in ASSET_TYPES:
        raise HTTPException(status_code=400, detail="invalid asset type")
    data = await image.read(MAX_BYTES + 1)
    if not data or len(data) > MAX_BYTES:
        raise HTTPException(status_code=400, detail="invalid image size")
    suffix = Path(image.filename or "image.jpg").suffix.lower()
    if suffix not in {".jpg", ".jpeg", ".png", ".webp"}:
        raise HTTPException(status_code=400, detail="unsupported image extension")

    private_root = SENSITIVE_ROOT if asset_type in {"barcode_label", "about_screen", "battery_health"} else ORDINARY_ROOT
    raw_dir = private_root / run_id
    raw_dir.mkdir(parents=True, exist_ok=True, mode=0o700)
    redacted_dir = REDACTED_ROOT / run_id
    redacted_dir.mkdir(parents=True, exist_ok=True, mode=0o750)
    with tempfile.NamedTemporaryFile(dir=raw_dir, suffix=suffix, delete=False) as temporary:
        temporary.write(data)
        raw_path = Path(temporary.name)
    raw_path.chmod(0o600)
    redacted_path = redacted_dir / f"{asset_type}-{raw_path.stem}.webp"
    try:
        result = extract(raw_path, asset_type, redacted_path)
    except Exception as error:
        raw_path.unlink(missing_ok=True)
        redacted_path.unlink(missing_ok=True)
        raise HTTPException(status_code=422, detail=f"extraction failed: {type(error).__name__}") from error
    return {
        "success": True,
        "runId": run_id,
        "assetId": redacted_path.stem,
        **result,
    }


@app.post("/merge")
def merge_asset_results(
    payload: dict[str, object] = Body(...),
    x_vision_token: str | None = Header(default=None),
) -> dict[str, object]:
    authorize(x_vision_token)
    results = payload.get("results")
    if not isinstance(results, list) or not 1 <= len(results) <= 20 or not all(isinstance(item, dict) for item in results):
        raise HTTPException(status_code=400, detail="results must contain 1-20 structured vision objects")
    try:
        merged = merge_results(results)
    except ValueError as error:
        raise HTTPException(status_code=422, detail="merged result contains prohibited sensitive data") from error
    return {"success": True, "result": merged}
