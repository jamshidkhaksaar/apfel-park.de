#!/usr/bin/env python3
from __future__ import annotations

import shutil
import time
from pathlib import Path

import yaml

CONFIG = Path("/root/.hermes/config.yaml")


def main() -> None:
    config = yaml.safe_load(CONFIG.read_text()) or {}
    backup = CONFIG.with_name(f"config.yaml.bak.product-intake-{int(time.time())}")
    shutil.copy2(CONFIG, backup)
    auxiliary = config.setdefault("auxiliary", {})
    vision = auxiliary.setdefault("vision", {})
    vision["provider"] = "openai-codex"
    vision["model"] = "gpt-5.6-sol"
    vision.setdefault("timeout", 180)
    vision.setdefault("max_concurrency", 2)
    CONFIG.write_text(yaml.safe_dump(config, sort_keys=False, allow_unicode=True))
    CONFIG.chmod(0o600)
    print("Hermes auxiliary vision configured for openai-codex/gpt-5.6-sol")


if __name__ == "__main__":
    main()
