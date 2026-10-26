"""Run the real deployment shell in a disposable tree; never contact production.
Run: python3 -m unittest discover -s deployment/vps/tests -v
"""
import os
from pathlib import Path
import subprocess
import shutil
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / 'scripts/deploy-app.sh'


class DeployTests(unittest.TestCase):
    def run_deploy(self, failure='', previous=True, previous_telegram=False):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        root = Path(temp.name)
        for directory in ['source/.git', 'shared', 'releases/previous', 'bin']:
            (root / directory).mkdir(parents=True)
        (root / 'shared/app.env').write_text('')
        if previous:
            (root / 'current').symlink_to(root / 'releases/previous')
            # A retained previous release with real assets, so the older-asset
            # continuity probe has something to check.
            fixture_assets = root / 'releases/previous/.next/static/build-fixture'
            fixture_assets.mkdir(parents=True)
            (fixture_assets / '_buildManifest.js').write_text('manifest')
        if previous_telegram:
            (root / 'releases/previous/scripts').mkdir()
            (root / 'releases/previous/scripts/telegram-product-worker.ts').write_text('export {};')
        if failure == 'retention':
            for index in range(5):
                (root / f'releases/newer-{index}').mkdir()
            (root / 'releases/failed-evidence').mkdir()
            (root / 'releases/failed-evidence/.deploy-failed').touch()
            os.utime(root / 'releases/previous', (1, 1))
            os.utime(root / 'releases/failed-evidence', (1, 1))
        # Rewrite only fixed deployment root and Node PATH on a fixture copy.
        text = SCRIPT.read_text().replace('APP_ROOT=/srv/apfel-park/app', f'APP_ROOT={root}')
        text = text.replace('export PATH=/root/.nvm/versions/node/v24.14.0/bin:$PATH', ': # fixture PATH')
        (root / 'deploy.sh').write_text(text)
        shutil.copyfile(SCRIPT.with_name('check-deploy-target.sh'), root / 'check-deploy-target.sh')
        mock = r'''#!/usr/bin/env python3
import os, sys, pathlib, tarfile, io
root = pathlib.Path(os.environ['FIXTURE_ROOT'])
cmd = pathlib.Path(sys.argv[0]).name
args = sys.argv[1:]
phase = 'old' if (root/'current').resolve().name == 'previous' else 'new'
failure = os.environ['FAILURE']
with (root/'calls').open('a') as f: f.write(f'{phase} {cmd} {" ".join(args)}\n')
if cmd == 'git':
    if 'archive' in args:
        with tarfile.open(fileobj=sys.stdout.buffer, mode='w|') as t:
            content = b'#!/usr/bin/env bash\nprintf "owner-migration\\n" >> "$FIXTURE_ROOT/calls"\n'
            info = tarfile.TarInfo('deployment/vps/product-intake/apply-owner-migration.sh')
            info.size = len(content); info.mode = 0o755; t.addfile(info, io.BytesIO(content))
            t.add(pathlib.Path(os.environ['FIXTURE_SCRIPT_DIR'])/'preserve-static-assets.sh', arcname='deployment/vps/scripts/preserve-static-assets.sh')
            routes = b"export const markdownRoutes = [\n  { pattern: '', kind: 'content', id: 'home' },\n  { pattern: '/about', kind: 'content', id: 'about' },\n];\n"
            info = tarfile.TarInfo('src/lib/md/routes.ts')
            info.size = len(routes); t.addfile(info, io.BytesIO(routes))
            if failure.startswith('telegram-'):
                info = tarfile.TarInfo('scripts/telegram-product-worker.ts')
                content = b'export {};'
                info.size = len(content); t.addfile(info, io.BytesIO(content))
    elif '--abbrev-ref' in args: print('main')
    elif '--short' in args: print('abcdef12')
    elif 'rev-parse' in args: print('abcdef1234567890')
    elif 'branch' in args: print('origin/main')
elif cmd == 'npm':
    if failure == 'migration' and args == ['run', 'db:migrate']: sys.exit(12)
    if failure == 'build' and args == ['run', 'build']: sys.exit(12)
    if args == ['run', 'build']:
        for p in ['.next/static/chunks', '.next/standalone/.next', '.next/standalone/public', 'public']:
            pathlib.Path(p).mkdir(parents=True, exist_ok=True)
        pathlib.Path('.next/static/chunks/test.js').write_text('js')
        pathlib.Path('.next/static/chunks/test.css').write_text('css')
elif cmd == 'systemctl':
    worker = 'marketplace' in args[-1]
    telegram = 'telegram-worker' in args[-1]
    if args[0] == 'cat' and telegram and not failure.startswith('telegram-'): sys.exit(1)
    if args[0] == 'cat' and failure == 'no-worker': sys.exit(1)
    key = ('telegram-' if telegram else 'worker-' if worker else 'web-') + args[0]
    if phase == 'new' and failure == key: sys.exit(13)
    if phase == 'old' and failure == 'rollback-restart' and args[0] == 'restart': sys.exit(14)
elif cmd == 'curl':
    url = args[-1]
    code = '404' if url.endswith('/xx') else '308' if url.endswith(':3000/') else '307' if url.endswith('/admin') else '200'
    if phase == 'new' and failure in ['http', 'rollback-health', 'rollback-restart']: code = '500'
    if phase == 'old' and failure == 'rollback-health': code = '500'
    if phase == 'new' and failure == 'asset' and '/_next/static/' in url: code = '404'
    if phase == 'new' and failure == 'redirect' and url.endswith(':3000/'): code = '307'
    if phase == 'new' and failure == 'locale' and url.endswith('/xx'): code = '500'
    targets = {'db': '/api/public/product-route/', 'product': '/de/store/fixture-product', 'cart': '/en/cart', 'checkout': '/de/checkout', 'auth': '/admin', 'public-asset': 'https://apfel-park.de/_next/static/'}
    if phase == 'new' and failure in targets and targets[failure] in url: code = '500'
    if 'deploy-probe-' in url: code = '404'
    if '/no-twin-' in url: code = '200' if failure == 'no-twin-200' else '404'
    if phase == 'new' and failure == 'stale-asset' and '/_next/static/build-fixture/' in url: code = '404'
    if '-D' in args:
        # Header probe: status line plus the headers the guards inspect.
        if '/no-twin-' in url:
            print('HTTP/2 404')
            print('content-type: text/html; charset=utf-8' if failure == 'html-404'
                  else 'content-type: text/markdown; charset=utf-8')
            print('cache-control: public, max-age=2592000' if failure == 'cached-404'
                  else 'cache-control: no-store')
        elif 'deploy-probe-' in url:
            print('HTTP/2 404')
            if failure == 'immutable-404':
                print('cache-control: public, max-age=2592000, immutable')
        else:
            accept = ''
            for index, arg in enumerate(args):
                if arg == '-H' and index + 1 < len(args): accept = args[index + 1].lower()
            wants_markdown = 'text/markdown' in accept
            is_markdown_url = url.endswith('.md')
            markdown = is_markdown_url or wants_markdown
            if failure == 'md-not-markdown' and is_markdown_url: markdown = False
            if failure == 'no-negotiation' and wants_markdown: markdown = False
            print('HTTP/2 200')
            print('content-type: text/markdown; charset=utf-8' if markdown
                  else 'content-type: text/html; charset=utf-8')
            if markdown:
                print('cache-control: public, s-maxage=3600, stale-while-revalidate=86400')
                print('vary: rsc, next-router-state-tree, Accept-Encoding' if failure == 'vary-missing'
                      else 'vary: rsc, next-router-state-tree, Accept, Accept-Encoding')
            else:
                print('cache-control: private, no-cache, no-store, max-age=0, must-revalidate')
                print('vary: rsc, next-router-state-tree, Accept-Encoding')
            if failure == 'rewrite-leak' and markdown:
                print('x-middleware-rewrite: http://localhost:3000/api/md/de/about')
    elif '-w' not in args:
        print('<a href="/de/store/fixture-product">Product</a>')
    else:
        print(code, end='')
elif cmd == 'node' and '-e' in args:
    os.execv(os.environ['REAL_NODE'], ['node'] + args)
'''
        for cmd in ['git', 'npm', 'systemctl', 'curl', 'sleep', 'node']:
            p = root / 'bin' / cmd
            p.write_text(mock)
            p.chmod(0o755)
        result = subprocess.run(['bash', str(root/'deploy.sh'), 'abcdef1234567890'], env={**os.environ, 'PATH': f'{root}/bin:/usr/bin:/bin', 'FIXTURE_ROOT': str(root), 'FIXTURE_SCRIPT_DIR': str(SCRIPT.parent), 'FAILURE': failure, 'REAL_NODE': shutil.which('node') or ''}, capture_output=True, text=True, timeout=30)
        return root, result, (root/'calls').read_text()

    def test_telegram_worker_activation_and_legacy_rollback(self):
        root, result, calls = self.run_deploy('telegram-ok')
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn('new systemctl restart apfel-park-telegram-worker.service', calls)
        self.assertIn('new systemctl is-active --quiet apfel-park-telegram-worker.service', calls)
        for failure in ['telegram-restart', 'telegram-is-active']:
            with self.subTest(failure=failure):
                root, result, calls = self.run_deploy(failure)
                self.assertNotEqual(result.returncode, 0)
                self.assertEqual((root/'current').resolve(), root/'releases/previous')
                self.assertIn('old systemctl stop apfel-park-telegram-worker.service', calls)
                self.assertIn('rollback verified healthy', result.stdout)
        root, result, calls = self.run_deploy('telegram-is-active', previous_telegram=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('old systemctl restart apfel-park-telegram-worker.service', calls)
        self.assertIn('old systemctl is-active --quiet apfel-park-telegram-worker.service', calls)

    def test_retention_protects_previous_and_failed_evidence(self):
        root, result, calls = self.run_deploy('retention')
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertTrue((root/'releases/previous').is_dir())
        self.assertTrue((root/'releases/failed-evidence').is_dir())

    def test_critical_smoke_failures_roll_back(self):
        for failure in ['asset', 'redirect', 'locale', 'db', 'product', 'cart', 'checkout', 'auth', 'public-asset']:
            with self.subTest(failure=failure):
                root, result, calls = self.run_deploy(failure)
                self.assertNotEqual(result.returncode, 0)
                self.assertEqual((root/'current').resolve(), root/'releases/previous')
                self.assertIn('rollback verified healthy', result.stdout)
                self.assertNotIn('could not discover a product', result.stderr)
                if failure == 'product':
                    self.assertIn('/de/store/fixture-product returned 500', result.stderr)

    def test_pre_switch_failures_do_not_restart(self):
        for failure in ['migration', 'build']:
            with self.subTest(failure=failure):
                root, result, calls = self.run_deploy(failure)
                self.assertNotEqual(result.returncode, 0)
                self.assertEqual((root/'current').resolve(), root/'releases/previous')
                self.assertNotIn('systemctl restart', calls)
                self.assertNotIn('rolling back', result.stdout)

    def test_failed_rollback_is_not_reported_healthy(self):
        for failure in ['rollback-health', 'rollback-restart']:
            with self.subTest(failure=failure):
                root, result, calls = self.run_deploy(failure)
                self.assertNotEqual(result.returncode, 0)
                self.assertEqual((root/'current').resolve(), root/'releases/previous')
                self.assertIn('manual recovery required', result.stdout)
                self.assertNotIn('rollback verified healthy', result.stdout)
                self.assertIn('old curl ', calls)

    def test_first_deploy_failure_is_explicit(self):
        root, result, calls = self.run_deploy('http', previous=False)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('no previous release', result.stdout)

    def test_success_preserves_assets_and_owner_migration(self):
        for failure in ['', 'no-worker']:
            with self.subTest(failure=failure):
                root, result, calls = self.run_deploy(failure)
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                self.assertNotEqual((root/'current').resolve(), root/'releases/previous')
                self.assertIn('owner-migration', calls)
                self.assertLess(calls.index('owner-migration'), calls.index('npm run db:migrate'))
                self.assertTrue((root/'current/.next/standalone/.next/static/chunks/test.js').is_file())
                self.assertTrue((root/'current/.next/standalone/public/uploads').is_symlink())
                self.assertIn('/_next/static/chunks/test.js?dpl=abcdef1234567890', calls)
                self.assertIn('/_next/static/chunks/test.css?dpl=abcdef1234567890', calls)

    def test_older_asset_continuity_and_uncached_404_are_enforced(self):
        # Happy path: the probe runs, finds the retained release, and the 404 is
        # served without long-lived caching.
        root, result, calls = self.run_deploy('')
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn('older release asset continuity', result.stdout)
        self.assertIn('-> /_next/static/build-fixture/_buildManifest.js 200', result.stdout)
        self.assertIn('/_next/static/deploy-probe-abcdef12-missing.js -> 404', result.stdout)
        # Both probes must hit the origin, not the CDN, or a cached answer hides it.
        self.assertIn('--resolve apfel-park.de:443:127.0.0.1', calls)

        for failure, expected in [
            ('stale-asset', 'no longer serves'),
            ('immutable-404', 'served as immutable'),
        ]:
            with self.subTest(failure=failure):
                root, result, calls = self.run_deploy(failure)
                self.assertNotEqual(result.returncode, 0)
                self.assertIn(expected, result.stderr)
                self.assertEqual((root/'current').resolve(), root/'releases/previous')
                self.assertIn('rollback verified healthy', result.stdout)

    def test_markdown_twins_and_no_rewrite_leak_are_enforced(self):
        # Happy path: a .md URL is markdown, the HTML URL negotiates, no leak.
        root, result, calls = self.run_deploy('')
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn('markdown twins', result.stdout)
        self.assertIn('/de/about.md -> text/markdown; charset=utf-8', result.stdout)
        self.assertIn('/de/about -> text/html; charset=utf-8, and text/markdown; charset=utf-8 for Accept: text/markdown', result.stdout)
        self.assertIn('expose no x-middleware-rewrite', result.stdout)
        # The plain HTML response is no-store, so only the two markdown
        # responses are held to the Vary rule.
        self.assertIn('2 shared-cacheable response(s) list Accept in Vary', result.stdout)
        self.assertIn('/de/no-twin-abcdef12.md -> 404 markdown, no-store', result.stdout)

        for failure, expected in [
            ('md-not-markdown', 'is not markdown'),
            ('no-negotiation', 'did not negotiate to markdown'),
            ('rewrite-leak', 'leaks the internal rewrite target'),
            ('vary-missing', 'Vary does not list Accept'),
            ('no-twin-200', 'expected 404'),
            ('html-404', 'is not a markdown response'),
            ('cached-404', 'is cacheable'),
        ]:
            with self.subTest(failure=failure):
                root, result, calls = self.run_deploy(failure)
                self.assertNotEqual(result.returncode, 0)
                self.assertIn(expected, result.stderr)
                self.assertEqual((root/'current').resolve(), root/'releases/previous')
                self.assertIn('rollback verified healthy', result.stdout)

    def test_post_switch_failures_restore_previous_and_verify_health(self):
        for failure in ['web-restart', 'worker-restart', 'web-is-active', 'worker-is-active', 'http']:
            with self.subTest(failure=failure):
                root, result, calls = self.run_deploy(failure)
                self.assertNotEqual(result.returncode, 0)
                self.assertEqual((root/'current').resolve(), root/'releases/previous', result.stdout + result.stderr)
                self.assertIn('old systemctl restart apfel-park-nextjs', calls)
                self.assertIn('old curl ', calls)
                self.assertIn('old systemctl is-active', calls)
                self.assertEqual(len(list((root/'releases').iterdir())), 2)


if __name__ == '__main__':
    unittest.main()
