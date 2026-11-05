"""Run only against a newly created disposable database. Never loads app.env."""
from importlib.util import spec_from_file_location, module_from_spec
from pathlib import Path
import sys

spec = spec_from_file_location('apfel_disposable_runner', Path(__file__).with_name('run-payment-db.py'))
runner = module_from_spec(spec)
spec.loader.exec_module(runner)
runner.NAME = 'apfel_telegram_test'

if __name__ == '__main__':
    sys.exit(runner.main(config='scripts/integration/telegram-db.config.mts'))
