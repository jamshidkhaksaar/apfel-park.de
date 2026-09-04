#!/usr/bin/env python3
"""Opt-in, disposable local PostgreSQL integration; never loads application env.
Run: python3 scripts/integration/run-payment-db.py
Requires root/runuser, local postgres, and installed Node 24 dependencies.
Refuses pre-existing handles; removes only the DB/role created by this run.
SIGTERM/SIGINT request orderly child shutdown before independent cleanup attempts.
SIGKILL, host failure, or failure to reap after bounded terminate/kill waits cannot
guarantee cleanup: manually inspect the child and exact apfel_audit_wave2 handles
before recovery. Never remove pre-existing handles automatically on a later run.
"""
from pathlib import Path
import secrets
import signal
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
NAME = 'apfel_audit_wave2'
NODE = Path('/root/.nvm/versions/node/v24.14.0/bin/node')

def sql(statement):
    result = subprocess.run(
        ['runuser', '-u', 'postgres', '--', 'psql', '-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '-d', 'postgres'],
        input=statement, text=True, capture_output=True, check=False,
        env={'PATH': '/usr/sbin:/usr/bin:/bin', 'HOME': '/var/lib/postgresql'},
    )
    if result.returncode:
        # Do not emit statements or generated credentials, even on errors.
        raise RuntimeError('Local postgres command failed (details suppressed for secret safety)')
    return result.stdout.strip()

def main():
    if not NODE.is_file():
        raise RuntimeError('Pinned Node 24 binary missing')
    print(subprocess.check_output(
        [str(NODE), '--version'], text=True,
        env={'PATH': '/usr/bin:/bin', 'HOME': '/root'},
    ).strip(), flush=True)
    if sql(f"SELECT EXISTS(SELECT FROM pg_database WHERE datname='{NAME}') OR EXISTS(SELECT FROM pg_roles WHERE rolname='{NAME}');") != 'f':
        raise RuntimeError('Refusing pre-existing audit database or role')
    password = secrets.token_hex(32)
    role_created = db_created = False
    child = None
    stopped = 0
    result = 1

    def on_signal(signum, _frame):
        # Record only: do not interrupt CREATE bookkeeping or cleanup SQL.
        nonlocal stopped
        if not stopped:
            stopped = signum

    previous = {sig: signal.signal(sig, on_signal) for sig in (signal.SIGTERM, signal.SIGINT)}
    try:
        sql(f"CREATE ROLE {NAME} LOGIN PASSWORD '{password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;")
        role_created = True
        sql(f'CREATE DATABASE {NAME} OWNER {NAME} TEMPLATE template0;')
        db_created = True
        print(f'CREATED database={NAME} role={NAME}', flush=True)
        env = {
            'PATH': f'{NODE.parent}:/usr/bin:/bin', 'HOME': '/root', 'NODE_ENV': 'test',
            'DATABASE_URL': f'postgresql://{NAME}:{password}@127.0.0.1:5432/{NAME}',
            'APFEL_AUDIT_DISPOSABLE': NAME, 'PAYMENT_MODE': 'sandbox',
        }
        if not stopped:
            child = subprocess.Popen([
                str(NODE), 'node_modules/vitest/vitest.mjs', 'run', '--config',
                'scripts/integration/payment-db.config.mts', '--no-cache', '--reporter=verbose',
            ], cwd=ROOT, env=env)
            while not stopped:
                try:
                    result = child.wait(timeout=0.2)
                    break
                except subprocess.TimeoutExpired:
                    continue
    finally:
        try:
            if child is not None and child.poll() is None:
                child.terminate()
                try:
                    child.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    child.kill()
                    child.wait(timeout=5)
            steps = []
            if db_created:
                steps.append(('drop database', f'DROP DATABASE {NAME} WITH (FORCE);'))
            if role_created:
                steps.append(('drop role', f'DROP ROLE {NAME};'))
            steps.append(('verify absence', f"SELECT NOT EXISTS(SELECT FROM pg_database WHERE datname='{NAME}') AND NOT EXISTS(SELECT FROM pg_roles WHERE rolname='{NAME}');"))
            for label, statement in steps:
                try:
                    value = sql(statement)
                    if label == 'verify absence':
                        print(f'CLEANUP database_and_role_absent={value}', flush=True)
                        if value != 't':
                            raise RuntimeError('Audit handles remain')
                except Exception:
                    # Independent attempts; never expose SQL or credentials.
                    print(f'CLEANUP failed: {label}', file=sys.stderr, flush=True)
                    result = result or 1
        finally:
            for sig, handler in previous.items():
                signal.signal(sig, handler)
    return 128 + stopped if stopped else result

if __name__ == '__main__':
    sys.exit(main())
