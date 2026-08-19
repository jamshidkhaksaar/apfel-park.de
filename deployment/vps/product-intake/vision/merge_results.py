from __future__ import annotations

import re
from typing import Any

from identifiers import valid_gtin

SENSITIVE_TEXT = re.compile(r"\b(?:imei|eid|serial|seriennummer)\b|(^|\D)\d{15}(\D|$)|(^|\D)\d{32}(\D|$)", re.I)

PUBLIC_FIELDS = (
    "brand",
    "modelName",
    "hardwareModel",
    "manufacturerPartNumber",
    "storage",
    "color",
    "osVersion",
    "batteryHealth",
)


def normalized(value: Any) -> str:
    return re.sub(r"[^a-z0-9]+", "", str(value).lower())


def merge_results(results: list[dict[str, Any]]) -> dict[str, Any]:
    merged: dict[str, Any] = {}
    conflicts: list[str] = []
    requirements: list[str] = []
    for field in PUBLIC_FIELDS:
        values = [
            (item.get("assetType", "asset"), item.get(field))
            for item in results
            if isinstance(item.get(field), (str, int, float, bool)) and item.get(field) != ""
        ]
        unique = {normalized(value) for _, value in values}
        if len(unique) == 1 and values:
            merged[field] = values[0][1]
        elif len(unique) > 1:
            conflicts.append(f"{field} differs across assets: " + ", ".join(f"{kind}={value}" for kind, value in values))
            merged[field] = None
        else:
            merged[field] = None

    candidates: list[dict[str, Any]] = []
    for item in results:
        for candidate in item.get("gtinCandidates", []):
            if not isinstance(candidate, dict):
                continue
            value = re.sub(r"\D", "", str(candidate.get("value", "")))
            method = str(candidate.get("extractionMethod", ""))
            if len(value) in {15, 32}:
                continue
            if len(value) not in {8, 12, 13, 14}:
                continue
            checksum_valid = valid_gtin(value)
            try:
                confidence = max(0.0, min(1.0, float(candidate.get("confidence", 0))))
            except (TypeError, ValueError):
                confidence = 0.0
            candidates.append({
                "value": value,
                "symbology": str(candidate.get("symbology", "unknown")),
                "checksumValid": checksum_valid,
                "extractionMethod": method,
                "confidence": confidence,
                "autoAccept": bool(candidate.get("autoAccept", False)),
                "localDecoder": bool(candidate.get("localDecoder", False)),
            })
    corroborated = {
        candidate["value"] for candidate in candidates
        if candidate["checksumValid"] and (
            candidate["extractionMethod"] == "barcode" and candidate["localDecoder"] is True and candidate["autoAccept"] is True
            or candidate["extractionMethod"] == "ocr" and any(
                other.get("value") == candidate["value"] and other.get("extractionMethod") == "vision"
                for other in candidates
            )
        )
    }
    if any(candidate["extractionMethod"] == "vision" and candidate["value"] not in corroborated for candidate in candidates):
        requirements.append("A Sol-only numeric identifier requires owner confirmation and cannot be accepted automatically.")
    if any(not candidate["checksumValid"] for candidate in candidates):
        requirements.append("A GTIN-like value failed checksum validation.")
    if len(corroborated) > 1:
        conflicts.append("Different checksum-valid GTIN values were found across the submitted assets.")

    for item in results:
        conflicts.extend(str(value) for value in item.get("conflicts", []) if value)
        requirements.extend(str(value) for value in item.get("requiresConfirmation", []) if value)
    deduplicated_candidates = list({
        (entry["value"], entry["extractionMethod"], entry["symbology"]): entry for entry in candidates
    }.values())
    output = {
        **merged,
        "gtinCandidates": deduplicated_candidates,
        "conflicts": list(dict.fromkeys(conflicts)),
        "requiresConfirmation": list(dict.fromkeys(requirements)),
    }
    if SENSITIVE_TEXT.search(str(output)):
        raise ValueError("sensitive identifier detected in merged vision output")
    return output
