#!/usr/bin/env python3
"""Reuse the guarded disposable-DB runner for product-text persistence tests.
Never loads app.env. Refuses existing DB/role handles and cleans only its own.
"""
from importlib.util import spec_from_file_location, module_from_spec
from pathlib import Path
import sys

spec = spec_from_file_location('apfel_disposable_runner', Path(__file__).with_name('run-payment-db.py'))
runner = module_from_spec(spec)
spec.loader.exec_module(runner)
runner.NAME = 'apfel_text_write_test'

if __name__ == '__main__':
    sys.exit(runner.main(config='scripts/integration/product-text-db.config.mts'))
