#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import os
import re
import time
import urllib.error
import urllib.request
from pathlib import Path

BASE = os.getenv("N8N_PRODUCT_INTAKE_BASE", "http://127.0.0.1:5678/webhook")
KEY_ID = os.getenv("N8N_OWNER_KEY_ID", "owner")
SECRET = os.environ.get("N8N_OWNER_HMAC_SECRET", "")


def canonical_json(value: object) -> str:
    def normalize(entry: object) -> object:
        if isinstance(entry, float) and entry.is_integer():
            return int(entry)
        if isinstance(entry, dict):
            return {key: normalize(item) for key, item in entry.items()}
        if isinstance(entry, list):
            return [normalize(item) for item in entry]
        return entry
    return json.dumps(normalize(value), ensure_ascii=False, separators=(",", ":"))


def post(path: str, body: dict, idem: str | None = None) -> dict:
    if len(SECRET) < 32:
        raise SystemExit("N8N_OWNER_HMAC_SECRET is not configured")
    raw = canonical_json(body)
    timestamp = str(int(time.time()))
    idempotency = idem or f"hermes:{hashlib.sha256(f'{path}\n{raw}'.encode()).hexdigest()[:48]}"
    digest = hashlib.sha256(raw.encode()).hexdigest()
    canonical = "\n".join(["APFEL-PRODUCT-INTAKE-V1", KEY_ID, timestamp, "POST", f"/webhook/{path}", idempotency, digest])
    signature = hmac.new(SECRET.encode(), canonical.encode(), hashlib.sha256).hexdigest()
    request = urllib.request.Request(
        f"{BASE.rstrip('/')}/{path}", data=raw.encode(), method="POST",
        headers={
            "Content-Type": "application/json", "X-Apfel-Intake-Key-Id": KEY_ID,
            "X-Apfel-Intake-Timestamp": timestamp, "X-Apfel-Intake-Signature": signature,
            "Idempotency-Key": idempotency,
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=90) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as error:
        raise SystemExit(f"intake request failed: HTTP {error.code} {error.read().decode()[:500]}") from error


def load_json(path: str) -> dict:
    value = json.loads(Path(path).read_text())
    if not isinstance(value, dict):
        raise SystemExit("JSON input must be an object")
    serialized = json.dumps(value).lower()
    if any(key in serialized for key in ['"imei"', '"serial"', '"eid"']) or re.search(r"(^|\D)\d{15}(\D|$)|(^|\D)\d{32}(\D|$)", serialized):
        raise SystemExit("refusing sensitive device identifiers")
    return value


def main() -> None:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)
    for name in ["start", "get", "asset", "analysis", "research", "proposal", "decision"]:
        command = sub.add_parser(name)
        command.add_argument("--json", required=True)
        command.add_argument("--idempotency-key")
    args = parser.parse_args()
    paths = {
        "start": "apfel-intake-v2",
        "get": "apfel-intake-v2-run",
        "asset": "apfel-intake-v2-asset",
        "analysis": "apfel-intake-v2-analysis",
        "research": "apfel-intake-v2-research",
        "proposal": "apfel-intake-v2-proposal",
        "decision": "apfel-intake-v2-decision",
    }
    body = load_json(args.json)
    if args.command == "decision":
        body.setdefault("actorId", os.getenv("PRODUCT_INTAKE_OWNER_ACTOR_ID", "jamshid"))
    print(json.dumps(post(paths[args.command], body, args.idempotency_key), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
