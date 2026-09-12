"""Runner lifecycle tests: subprocess/SQL doubles, no PostgreSQL or providers."""
import json

from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

RUNNER = Path(__file__).resolve().parents[1] / 'run-payment-db.py'
HARNESS = r'''
import importlib.util, json, os, signal, subprocess, sys
from pathlib import Path
spec = importlib.util.spec_from_file_location('runner', sys.argv[1])
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
log = Path(sys.argv[2])
scenario = sys.argv[3]
def event(value):
    with log.open('a') as f: f.write(json.dumps(value) + '\n')
def sql(statement):
    if statement.startswith('CREATE ROLE'): event('create_role')
    elif statement.startswith('CREATE DATABASE'): event('create_db')
    elif statement.startswith('DROP DATABASE'): event('drop_db')
    elif statement.startswith('DROP ROLE'): event('drop_role')
    else: event('verify' if 'NOT EXISTS' in statement else 'preflight')
    if ((statement.startswith('DROP DATABASE') and scenario in ('drop_db_error', 'drop_db_success_error')) or
        (statement.startswith('DROP ROLE') and scenario == 'drop_role_error') or
        ('NOT EXISTS' in statement and scenario == 'verify_error')):
        raise RuntimeError('synthetic-secret-must-not-be-printed')
    if 'NOT EXISTS' in statement and scenario == 'verify_remaining': return 'f'
    if 'SELECT EXISTS' in statement and scenario == 'preexisting': return 't'
    return 't' if 'NOT EXISTS' in statement else 'f'
class Child:
    returncode = None
    sent = False
    def __init__(self, *args, **kwargs):
        event('spawn')
        env = kwargs['env']
        assert set(env) == {'PATH','HOME','NODE_ENV','DATABASE_URL','APFEL_AUDIT_DISPOSABLE','PAYMENT_MODE'}
        assert env['APFEL_AUDIT_DISPOSABLE'] == 'apfel_audit_wave2'
        assert '@127.0.0.1:5432/apfel_audit_wave2' in env['DATABASE_URL']
        assert env['DATABASE_URL'].startswith('postgresql://apfel_audit_wave2:')
    def poll(self): return self.returncode
    def wait(self, timeout=None):
        if scenario in ('child_failure', 'drop_db_error', 'drop_db_success_error',
                        'drop_role_error', 'verify_error', 'verify_remaining', 'success'):
            self.returncode = 7 if scenario in ('child_failure', 'drop_db_error') else 0
            event('reaped')
            return self.returncode
        if not self.sent:
            self.sent = True
            event('sigterm')
            os.kill(os.getpid(), signal.SIGINT if scenario == 'sigint' else signal.SIGTERM)
            raise subprocess.TimeoutExpired('fake-vitest', timeout)
        assert timeout is not None and 0 < timeout <= 10
        if scenario == 'stubborn' and not getattr(self, 'killed', False):
            event('terminate_timeout')
            raise subprocess.TimeoutExpired('fake-vitest', timeout)
        self.returncode = -15
        event('reaped')
        return self.returncode
    def terminate(self): event('terminate')
    def kill(self):
        self.killed = True
        event('kill')
def legacy_run(*args, **kwargs):
    child = Child(*args, **kwargs)
    child.wait()
    return child
m.sql = sql
m.NODE = Path(sys.executable)
def version(*args, **kwargs):
    assert kwargs.get('env') == {'PATH': '/usr/bin:/bin', 'HOME': '/root'}
    return 'fake-node\n'
m.subprocess.check_output = version
m.subprocess.Popen = Child
m.subprocess.run = legacy_run
old_handler = signal.getsignal(signal.SIGTERM)
result = m.main()
assert signal.getsignal(signal.SIGTERM) == old_handler
event({'result': result})
sys.exit(result)
'''


class RunnerTests(unittest.TestCase):
    def run_fake(self, scenario):
        with tempfile.TemporaryDirectory() as temp:
            log = Path(temp) / 'events.jsonl'
            result = subprocess.run(
                [sys.executable, '-B', '-c', HARNESS, str(RUNNER), str(log), scenario],
                text=True, capture_output=True, timeout=15,
                env={'PATH': '/usr/bin:/bin', 'PRODUCTION_SECRET_SENTINEL': 'must-not-inherit'},
            )
            events = [json.loads(line) for line in log.read_text().splitlines()] if log.exists() else []
            return result, events

    def test_child_nonzero_retained_after_cleanup(self):
        result, events = self.run_fake('child_failure')
        self.assertEqual(result.returncode, 7, result.stderr)
        self.assertEqual(events[-5:], ['reaped', 'drop_db', 'drop_role', 'verify', {'result': 7}])

    def test_success(self):
        result, events = self.run_fake('success')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(events[-5:], ['reaped', 'drop_db', 'drop_role', 'verify', {'result': 0}])

    def test_each_cleanup_error_fails_successful_child(self):
        for scenario, label in [('drop_db_success_error', 'drop database'),
                                ('drop_role_error', 'drop role'),
                                ('verify_error', 'verify absence'),
                                ('verify_remaining', 'verify absence')]:
            with self.subTest(scenario=scenario):
                result, events = self.run_fake(scenario)
                self.assertEqual(result.returncode, 1, result.stderr)
                self.assertEqual(events[-5:], ['reaped', 'drop_db', 'drop_role', 'verify', {'result': 1}])
                self.assertIn('CLEANUP failed: ' + label, result.stderr)
                self.assertNotIn('synthetic-secret', result.stderr)

    def test_preexisting_handles_are_never_mutated(self):
        result, events = self.run_fake('preexisting')
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(events, ['preflight'])

    def test_sigint_also_reaps_before_cleanup(self):
        result, events = self.run_fake('sigint')
        self.assertEqual(result.returncode, 130, result.stderr)
        self.assertEqual(events[-5:], ['reaped', 'drop_db', 'drop_role', 'verify', {'result': 130}])

    def test_db_drop_error_still_attempts_role_and_verification(self):
        result, events = self.run_fake('drop_db_error')
        self.assertEqual(events[-5:], ['reaped', 'drop_db', 'drop_role', 'verify', {'result': 7}])
        self.assertEqual(result.returncode, 7, result.stderr)
        self.assertIn('CLEANUP failed: drop database', result.stderr)
        self.assertNotIn('synthetic-secret', result.stderr)

    def test_stubborn_child_killed_and_reaped_before_cleanup(self):
        result, events = self.run_fake('stubborn')
        self.assertEqual(result.returncode, 143, result.stderr)
        self.assertEqual(events[5:], ['terminate', 'terminate_timeout', 'kill', 'reaped',
                                      'drop_db', 'drop_role', 'verify', {'result': 143}])

    def test_sigterm_reaps_child_before_independent_cleanup(self):
        result, events = self.run_fake('sigterm')
        self.assertEqual(result.returncode, 143, result.stderr)
        self.assertEqual(events, ['preflight', 'create_role', 'create_db', 'spawn',
                                 'sigterm', 'terminate', 'reaped', 'drop_db',
                                 'drop_role', 'verify', {'result': 143}])


if __name__ == '__main__':
    unittest.main()
