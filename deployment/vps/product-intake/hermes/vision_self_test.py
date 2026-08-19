#!/usr/bin/env python3
from __future__ import annotations

import asyncio
import json

from tools.vision_tools import vision_analyze_tool


def has_visible_true(value: object) -> bool:
    if isinstance(value, dict):
        return value.get("visible") is True or any(has_visible_true(item) for item in value.values())
    if isinstance(value, list):
        return any(has_visible_true(item) for item in value)
    if isinstance(value, str):
        try:
            return has_visible_true(json.loads(value))
        except (json.JSONDecodeError, TypeError):
            return '"visible"' in value.lower() and "true" in value.lower()
    return False


async def main() -> None:
    result = await vision_analyze_tool(
        image_url="https://apfel-park.de/apple-icon.png",
        user_prompt="Return only JSON with key visible and boolean true if an image is visible. Do not identify people or infer hidden text.",
    )
    text = json.dumps(result, ensure_ascii=False).lower()
    if not result or "error" in text or not has_visible_true(result):
        raise SystemExit("Hermes Sol vision self-test failed")
    print("Hermes Sol vision self-test passed")


if __name__ == "__main__":
    asyncio.run(main())
