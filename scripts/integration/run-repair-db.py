from pathlib import Path
import runpy
import sys
runner = runpy.run_path(str(Path(__file__).with_name('run-payment-db.py')))
sys.exit(runner['main']('scripts/integration/repair-db.config.mts'))
