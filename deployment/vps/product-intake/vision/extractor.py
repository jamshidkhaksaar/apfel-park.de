from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import cv2
import numpy as np
import pytesseract
import zxingcpp
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps
from pytesseract import Output

from identifiers import classify_numeric_identifier, ocr_gtin_candidates, valid_gtin, valid_imei

ASSET_TYPES = {"barcode_label", "about_screen", "battery_health", "condition_photo", "packaging"}
SENSITIVE_LABEL = re.compile(r"^(?:imei\d*|serial|serialnumber|serien|seriennummer|seriennr|s/?n|eid|meid)$", re.I)
SENSITIVE_INLINE = re.compile(r"\b(?:IMEI\d*|SERIAL(?:\s+(?:NO|NUMBER))?|SERIEN\s*(?:NUMMER|NR\.?)|EID|MEID)\b", re.I)
PART_PATTERN = re.compile(r"\b(?:MPN|PART(?:\s*(?:NO|NUMBER))?|MODEL\s*NUMBER)\s*[:#]?\s*([A-Z0-9][A-Z0-9./_-]{2,39})", re.I)
MODEL_PATTERN = re.compile(r"\b(A\d{4}|SM-[A-Z0-9]{4,20})\b", re.I)
MODEL_NAME_PATTERN = re.compile(r"\bMODEL\s+NAME\s*[:#]?\s*([A-Z0-9][A-Z0-9 +._/-]{2,60})", re.I)
STORAGE_PATTERN = re.compile(r"\b(\d{2,4})\s*(GB|TB)\b", re.I)
COLOR_PATTERN = re.compile(r"\b(?:COLOU?R|FARBE)\s*[:#]?\s*([A-Z][A-Z -]{2,30})", re.I)
OS_PATTERN = re.compile(r"\b(?:IOS|ANDROID|SOFTWARE\s*VERSION)\s*[:#]?\s*([A-Z0-9. -]{1,30})", re.I)
BATTERY_PATTERN = re.compile(r"\b(?:MAXIMUM\s+CAPACITY|BATTERY\s+HEALTH|BATTERIEKAPAZIT[ÄA]T)\s*[:#]?\s*(\d{1,3})\s*%", re.I)
SPACED_SENSITIVE_DIGITS = re.compile(r"(?<!\d)(?:\d[\s-]?){15}(?!\d)|(?<!\d)(?:\d[\s-]?){32}(?!\d)")
BRANDS = ("Apple", "Samsung", "Google", "Xiaomi", "Motorola", "Huawei", "Honor", "Nokia", "Sony", "OnePlus", "Oppo", "Realme", "Asus", "Lenovo")


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def normalized_image(source: Path) -> Image.Image:
    with Image.open(source) as opened:
        if opened.width <= 0 or opened.height <= 0 or opened.width * opened.height > 40_000_000:
            raise ValueError("image dimensions exceed the intake safety limit")
        image = ImageOps.exif_transpose(opened).convert("RGB")
    image.thumbnail((4000, 4000), Image.Resampling.LANCZOS)
    image = ImageOps.autocontrast(image, cutoff=0.5)
    return ImageEnhance.Sharpness(ImageEnhance.Contrast(image).enhance(1.08)).enhance(1.12)


def barcode_polygon(result: Any) -> list[tuple[int, int]]:
    position = result.position
    return [
        (int(position.top_left.x), int(position.top_left.y)),
        (int(position.top_right.x), int(position.top_right.y)),
        (int(position.bottom_right.x), int(position.bottom_right.y)),
        (int(position.bottom_left.x), int(position.bottom_left.y)),
    ]


def unrotate_polygon(points: list[tuple[int, int]], rotation: int, width: int, height: int) -> list[tuple[int, int]]:
    if rotation == 90:
        return [(y, height - 1 - x) for x, y in points]
    if rotation == 180:
        return [(width - 1 - x, height - 1 - y) for x, y in points]
    if rotation == 270:
        return [(width - 1 - y, x) for x, y in points]
    return points


def decode_barcodes(
    image: Image.Image,
) -> tuple[list[dict[str, Any]], list[list[tuple[int, int]]], list[list[tuple[int, int]]]]:
    rgb = np.array(image)
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(gray)
    sharpened = cv2.filter2D(clahe, -1, np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]]))
    candidates: list[dict[str, Any]] = []
    masks: list[list[tuple[int, int]]] = []
    gtin_polygons: list[list[tuple[int, int]]] = []
    seen: set[tuple[str, str]] = set()
    masked_polygons: set[tuple[tuple[int, int], ...]] = set()
    height, width = gray.shape
    for processed in (gray, clahe, sharpened):
        for rotation in (0, 90, 180, 270):
            rotated = processed if rotation == 0 else cv2.rotate(
                processed,
                {90: cv2.ROTATE_90_CLOCKWISE, 180: cv2.ROTATE_180, 270: cv2.ROTATE_90_COUNTERCLOCKWISE}[rotation],
            )
            for item in zxingcpp.read_barcodes(rotated):
                raw = str(item.text).strip()
                digits = re.sub(r"\D", "", raw)
                classification = classify_numeric_identifier(digits)
                format_name = str(item.format).split(".")[-1]
                gtin_symbology = any(name in format_name.upper() for name in ("EAN", "UPC", "ITF"))
                key = (raw, format_name)
                if classification == "gtin":
                    if key not in seen:
                        candidates.append({
                            "value": digits,
                            "symbology": format_name,
                            "checksumValid": True,
                            "extractionMethod": "barcode",
                            "confidence": 1.0,
                            "autoAccept": gtin_symbology,
                            "localDecoder": True,
                        })
                        safe_polygon = unrotate_polygon(barcode_polygon(item), rotation, width, height)
                        if gtin_symbology:
                            gtin_polygons.append(safe_polygon)
                        seen.add(key)
                    if gtin_symbology:
                        continue
                if gtin_symbology and len(digits) in {8, 12, 13, 14} and not valid_gtin(digits) and key not in seen:
                    candidates.append({
                        "value": digits,
                        "symbology": format_name,
                        "checksumValid": False,
                        "extractionMethod": "barcode",
                        "confidence": 1.0,
                        "autoAccept": False,
                        "localDecoder": True,
                    })
                    seen.add(key)
                polygon = tuple(unrotate_polygon(barcode_polygon(item), rotation, width, height))
                if polygon not in masked_polygons:
                    masks.append(list(polygon))
                    masked_polygons.add(polygon)
    return candidates, masks, gtin_polygons


@dataclass
class OcrToken:
    text: str
    left: int
    top: int
    width: int
    height: int
    line: tuple[int, int, int]


def ocr_tokens(image: Image.Image) -> list[OcrToken]:
    data = pytesseract.image_to_data(image, output_type=Output.DICT, config="--psm 6", lang="eng+deu")
    tokens: list[OcrToken] = []
    for index, raw in enumerate(data.get("text", [])):
        token_text = str(raw).strip()
        if not token_text:
            continue
        tokens.append(OcrToken(
            text=token_text,
            left=int(data["left"][index]),
            top=int(data["top"][index]),
            width=int(data["width"][index]),
            height=int(data["height"][index]),
            line=(int(data["block_num"][index]), int(data["par_num"][index]), int(data["line_num"][index])),
        ))
    return tokens


def ocr_text(tokens: list[OcrToken]) -> str:
    lines: dict[tuple[int, int, int], list[str]] = {}
    for token in tokens:
        lines.setdefault(token.line, []).append(token.text)
    return "\n".join(" ".join(parts) for parts in lines.values())


def redact_sensitive(image: Image.Image, tokens: list[OcrToken], barcode_masks: list[list[tuple[int, int]]]) -> Image.Image:
    redacted = image.copy()
    draw = ImageDraw.Draw(redacted)
    redact_indexes: set[int] = set()
    for index, token in enumerate(tokens):
        compact = re.sub(r"[^A-Za-z0-9]", "", token.text)
        sensitive = (
            bool(SENSITIVE_LABEL.match(compact))
            or bool(SENSITIVE_INLINE.search(token.text))
            or valid_imei(compact)
            or (len(compact) == 32 and compact.isdigit())
        )
        if sensitive:
            redact_indexes.add(index)
            found_value_same_line = False
            for following in range(index + 1, len(tokens)):
                if tokens[following].line != token.line:
                    break
                redact_indexes.add(following)
                following_compact = re.sub(r"[^A-Za-z0-9]", "", tokens[following].text).lower()
                if following_compact not in {"nr", "nummer", "number", "no"}:
                    found_value_same_line = True
            if not found_value_same_line:
                next_lines = [candidate.line for candidate in tokens[index + 1:] if candidate.line != token.line]
                if next_lines:
                    next_line = next_lines[0]
                    for following, candidate in enumerate(tokens):
                        if candidate.line == next_line and candidate.top <= token.top + max(120, token.height * 5):
                            redact_indexes.add(following)
    for line in {token.line for token in tokens}:
        indexes = [index for index, token in enumerate(tokens) if token.line == line]
        digits = "".join(re.sub(r"\D", "", tokens[index].text) for index in indexes)
        if len(digits) in {15, 32}:
            redact_indexes.update(indexes)
    for index in redact_indexes:
        token = tokens[index]
        pad = 5
        draw.rectangle((token.left - pad, token.top - pad, token.left + token.width + pad, token.top + token.height + pad), fill="black")
    for polygon in barcode_masks:
        draw.polygon(polygon, fill="black")
    return redacted


def first(pattern: re.Pattern[str], text: str) -> str | None:
    match = pattern.search(text)
    return match.group(1).strip() if match else None


def safe_ocr_fields(text: str) -> dict[str, Any]:
    hardware_model = first(MODEL_PATTERN, text)
    part_number = first(PART_PATTERN, text)
    storage_match = STORAGE_PATTERN.search(text)
    battery = first(BATTERY_PATTERN, text)
    brand = next((brand for brand in BRANDS if re.search(rf"\b{re.escape(brand)}\b", text, re.I)), None)
    return {
        "brand": brand,
        "modelName": first(MODEL_NAME_PATTERN, text),
        "hardwareModel": hardware_model.upper() if hardware_model else None,
        "manufacturerPartNumber": part_number.upper() if part_number else None,
        "storage": f"{storage_match.group(1)} {storage_match.group(2).upper()}" if storage_match else None,
        "color": first(COLOR_PATTERN, text),
        "osVersion": first(OS_PATTERN, text),
        "batteryHealth": int(battery) if battery and int(battery) <= 100 else None,
    }


def publish_derivative(image: Image.Image, target: Path) -> dict[str, Any]:
    corrected = ImageOps.autocontrast(image.filter(ImageFilter.UnsharpMask(radius=1.2, percent=110, threshold=3)), cutoff=0.5)
    contained = ImageOps.contain(corrected, (1440, 1440), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (1500, 1500), "white")
    canvas.paste(contained, ((1500 - contained.width) // 2, (1500 - contained.height) // 2))
    target.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(target, format="WEBP", quality=88, method=6)
    data = target.read_bytes()
    return {"publishPath": str(target), "publishSha256": sha256(data), "publishBytes": len(data)}


def extract(source: Path, asset_type: str, redacted_target: Path) -> dict[str, Any]:
    if asset_type not in ASSET_TYPES:
        raise ValueError(f"Unsupported asset type: {asset_type}")
    image = normalized_image(source)
    barcode_candidates, barcode_masks, gtin_polygons = decode_barcodes(image)
    tokens = ocr_tokens(image)
    full_text = ocr_text(tokens)
    ocr_candidates = ocr_gtin_candidates(full_text)
    gtin_candidates = barcode_candidates + [
        candidate for candidate in ocr_candidates
        if not any(existing["value"] == candidate["value"] and existing["extractionMethod"] == candidate["extractionMethod"] for existing in barcode_candidates)
    ]
    redacted = redact_sensitive(image, tokens, barcode_masks)
    redacted_target.parent.mkdir(parents=True, exist_ok=True)
    redacted.save(redacted_target, format="WEBP", quality=92, method=6)
    redacted_data = redacted_target.read_bytes()
    redacted_tokens = ocr_tokens(redacted)
    redacted_text = ocr_text(redacted_tokens)
    privacy_scan_passed = (
        not SENSITIVE_INLINE.search(redacted_text)
        and not SPACED_SENSITIVE_DIGITS.search(redacted_text)
        and (asset_type not in {"barcode_label", "about_screen", "battery_health"} or len(redacted_tokens) >= 2)
    )
    safe_fields = safe_ocr_fields(full_text)
    requires_confirmation: list[str] = []
    conflicts: list[str] = []
    valid_values = {
        str(item["value"]) for item in gtin_candidates
        if item["checksumValid"] is True and item.get("autoAccept") is True
    }
    if any(item["checksumValid"] is False for item in gtin_candidates):
        requires_confirmation.append("A GTIN-like value has an invalid checksum; do not use it.")
    if any(item["checksumValid"] is True and item.get("autoAccept") is False for item in gtin_candidates):
        requires_confirmation.append("A checksum-valid number came from OCR or a non-retail barcode and requires confirmation.")
    if asset_type == "barcode_label" and not valid_values:
        requires_confirmation.append("No checksum-valid GTIN was decoded; request a sharper barcode photo.")
    if len(valid_values) > 1:
        conflicts.append("Multiple different checksum-valid GTIN values were found on one asset.")
    if not safe_fields["hardwareModel"] and asset_type in {"barcode_label", "about_screen"}:
        requires_confirmation.append("Hardware model was not read confidently.")
    if not privacy_scan_passed:
        requires_confirmation.append("Privacy verification failed; crop sensitive fields or send a clearer image before Sol analysis.")
    result: dict[str, Any] = {
        "assetType": asset_type,
        **safe_fields,
        "gtinCandidates": gtin_candidates,
        "conflicts": conflicts,
        "requiresConfirmation": requires_confirmation,
        "redactedPath": str(redacted_target),
        "redactedSha256": sha256(redacted_data),
        "redactedBytes": len(redacted_data),
        "redactedWidth": redacted.width,
        "redactedHeight": redacted.height,
        "solVisionRequired": asset_type in {"barcode_label", "about_screen", "battery_health"},
        "privacyScanPassed": privacy_scan_passed,
        "solVisionPrompt": (
            "Read only visible public product facts from this redacted device image. Associate labels with brand, model name, hardware model, "
            "manufacturer part number, storage, colour, OS version and battery health. Ignore an editable device Name and use Model Name. "
            "Never reconstruct masked values, never guess a digit, and return conflicts and unreadable fields explicitly as JSON."
        ),
    }
    if asset_type == "barcode_label" and gtin_polygons:
        points = [point for polygon in gtin_polygons for point in polygon]
        left = max(0, min(point[0] for point in points) - 80)
        top = max(0, min(point[1] for point in points) - 80)
        right = min(redacted.width, max(point[0] for point in points) + 80)
        bottom = min(redacted.height, max(point[1] for point in points) + 80)
        crop = redacted.crop((left, top, right, bottom))
        crop_target = redacted_target.parent / "crops" / f"{redacted_target.stem}-barcode.webp"
        crop_target.parent.mkdir(parents=True, exist_ok=True)
        crop.save(crop_target, format="WEBP", quality=92, method=6)
        crop_data = crop_target.read_bytes()
        result.update({
            "barcodeCropPath": str(crop_target),
            "barcodeCropSha256": sha256(crop_data),
            "barcodeCropBytes": len(crop_data),
            "barcodeCropWidth": crop.width,
            "barcodeCropHeight": crop.height,
        })
    if asset_type in {"condition_photo", "packaging"}:
        publish_target = redacted_target.parent / "publish" / f"{redacted_target.stem}-1500.webp"
        result.update(publish_derivative(redacted, publish_target))
    return result
