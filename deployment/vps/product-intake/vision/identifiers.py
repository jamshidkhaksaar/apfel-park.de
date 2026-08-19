from __future__ import annotations

import re

GTIN_LABEL = re.compile(r"\b(?:GTIN|EAN|UPC)\b", re.I)
SENSITIVE_CONTEXT = re.compile(r"\b(?:IMEI\d*|SERIAL(?:\s+(?:NO|NUMBER))?|SERIEN\s*(?:NUMMER|NR\.?)|S/N|EID|MEID)\b", re.I)
NUMERIC_CANDIDATE = re.compile(r"(?<!\d)(?:\d[\s-]?){7,31}\d(?!\d)")


def digits_only(value: str) -> str:
    return re.sub(r"\D", "", value)


def valid_gtin(value: str) -> bool:
    digits = digits_only(value)
    if len(digits) not in {8, 12, 13, 14}:
        return False
    total = 0
    for offset, digit in enumerate(reversed(digits[:-1]), start=1):
        total += int(digit) * (3 if offset % 2 == 1 else 1)
    return (10 - total % 10) % 10 == int(digits[-1])


def valid_imei(value: str) -> bool:
    digits = digits_only(value)
    if len(digits) != 15:
        return False
    total = 0
    for index, digit in enumerate(digits):
        number = int(digit)
        if index % 2 == 1:
            number *= 2
            if number > 9:
                number -= 9
        total += number
    return total % 10 == 0


def classify_numeric_identifier(value: str) -> str:
    digits = digits_only(value)
    if valid_imei(digits):
        return "imei"
    if len(digits) == 32:
        return "eid"
    if valid_gtin(digits):
        return "gtin"
    return "unknown"


def ocr_gtin_candidates(text: str) -> list[dict[str, object]]:
    candidates: list[dict[str, object]] = []
    seen: set[str] = set()
    for line in text.splitlines():
        sensitive = bool(SENSITIVE_CONTEXT.search(line))
        labelled = bool(GTIN_LABEL.search(line))
        for match in NUMERIC_CANDIDATE.finditer(line):
            digits = digits_only(match.group(0))
            if digits in seen or sensitive or len(digits) in {15, 32}:
                continue
            checksum_valid = valid_gtin(digits)
            if not checksum_valid and not labelled:
                continue
            if len(digits) not in {8, 12, 13, 14}:
                continue
            seen.add(digits)
            candidates.append({
                "value": digits,
                "symbology": "OCR",
                "checksumValid": checksum_valid,
                "extractionMethod": "ocr",
                "confidence": 0.9 if checksum_valid and labelled else 0.72 if checksum_valid else 0.25,
                "autoAccept": False,
                "localDecoder": True,
            })
    return candidates
