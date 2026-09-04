# Apfel Park Operations

Updated 2026-09-04 for OPS-03/04. Supersedes the historical `releases/repo`
source path and the statement that promotion was unverified. The wave1 candidate
has **not been deployed** by this work.

## Boundaries and paths

- Editable clone: `/srv/apfel-park/app/source`. Isolated development worktrees:
  `/srv/apfel-park/app/worktrees/<name>`; wave1 is `audit-hardening-wave1`.
- Immutable built releases: `/srv/apfel-park/app/releases/<UTC stamp>-<short SHA>`.
  `/srv/apfel-park/app/current` selects the live release. Never edit a release,
  generated `.next/standalone`, or the current symlink during development.
- Environment: `/srv/apfel-park/app/shared/app.env`; uploads:
  `/srv/apfel-park/app/shared/uploads`. Never display or commit secrets.
- Web unit: `apfel-park-nextjs`; optional installed worker:
  `apfel-park-marketplace-worker.service`. Production listens on port 3000.
  Use `npm run dev -- --port 3100` for development, not production ports.
- One release operator at a time. The script does not serialize concurrent
  deploys; do not run concurrent deploy/rollback or release cleanup jobs.

## Before an approved deployment

1. Record `readlink -e /srv/apfel-park/app/current` and that release's
   `.deployed-sha`. Compare source and deployed histories: a clean source tree
   alone does not prove it contains all live features. Reconcile on a worktree,
   review, commit and push before deployment. Never deploy a dirty worktree.
2. Pin the full reviewed commit SHA reachable on origin. Verify the source clone
   has the reviewed deployment script; it exports the requested commit with
   `git archive`, not uncommitted source files. Do not use a floating ref in an
   approved production change record.
3. Use the versions required by `package.json`, not the shell defaults:
   ```bash
   export PATH=/root/.nvm/versions/node/v24.14.0/bin:$PATH
   node --version
   npm --version
   npm ci --no-audit --no-fund --include=dev
   npm test
   npm run lint
   npm run typecheck
   npm audit --audit-level=high
   npm run build
   python3 -m unittest discover -s deployment/vps/tests -v
   bash -n deployment/vps/scripts/deploy-app.sh
   ```
   Expected runtime line: Node 24.14.x / npm 11.12.x (see package constraints).
   Python is needed only for the isolated shell regression suite, not deployment.
4. Verify sufficient disk capacity, service status and recent errors. Secure a
   fresh DB backup, shared uploads/environment/config/unit backups, and the old
   release. Confirm a restore into a **separate disposable database**, never over
   production. Record backup locations and restore evidence in the change record.
5. Review pending migrations using `npm run db:status` with the approved DB
   environment. Do not baseline automatically or edit old migrations.

### Schema compatibility is a hard gate

`deploy-app.sh` runs the executable owner-migration helper **before**
`npm run db:migrate`, and before changing `current`. Preserve this ordering.
A failed build/test/migration leaves the old application selected; migrations
that already succeeded may still remain in the database. Transactionality of an
individual migration is not transactionality of the entire deployment.

Only additive, backwards-compatible schema/data changes belong in this automatic
rollback path. Both the old web release **and worker** must operate against the
new schema. Use expand/backfill/contract over separate releases; defer drops,
renames, type narrowing and incompatible data rewrites until the rollback window
closes. A code rollback does not undo migrations, ownership changes or external
side effects. If compatibility cannot be proven, stop and design an explicit
maintenance/recovery plan. Never restore a pre-deploy DB snapshot over new orders
as an automatic rollback.

## Approved pinned deployment

After approval, substitute the reviewed full SHA (not the placeholder):

```bash
cd /srv/apfel-park/app/source
bash deployment/vps/scripts/deploy-app.sh <FULL_REVIEWED_PUSHED_SHA>
```

The script fetches origin, archives the commit into a new release, installs dev
build/test dependencies, runs tests/lint/typecheck/audit/build, applies migrations,
copies standalone assets, preserves uploads linking and static permissions, then
atomically switches `current`. `DEPLOYMENT_VERSION` remains the commit SHA.
It restarts web and the worker if installed.

Critical checks now cause rollback, not warnings:
- web readiness (up to 20 bounded GET attempts), web/installed-worker active;
- German and English home/store/cart/checkout GET 200;
- one current product link discovered from German store HTML, product GET 200;
- uncached public product-route lookup GET 200 (DB errors return 503);
- anonymous `/admin` redirects (307), `/` is permanent (308), `/xx` is 404;
- one generated JS and CSS asset GET 200 locally **and through public HTTPS**,
  with the `?dpl=<SHA>` deployment-version query preserved.

Smoke never logs in, creates a cart/order/payment, sends customer mail or invokes
admin mutations. An empty catalog fails product discovery. HTTP statuses and a
single asset per type are smoke, not full rendering/auth/payment certification.
The public asset gate intentionally treats CDN/DNS/TLS failure as deployment
failure; TLS validation is not disabled. The production domain is fixed in the
script: use only the mocked fixture below for isolated automated testing, or
review staging-specific endpoints in a staging copy before a real staging run.

## Rollback and verification

During activation an EXIT trap restores the previous symlink on web/worker
restart failure, inactive service, failed critical HTTP/asset check, or handled
INT/TERM. Failures before the symlink changes do not restart or roll back the old
service. The original failure status is retained. Rollback restarts both installed
services and verifies old `/de` readiness and service active states; failures are
reported as **manual recovery required**, never as healthy rollback. No previous
release is an explicit unrecoverable automatic-rollback condition.

After all critical gates pass, activation is committed. IndexNow is non-fatal;
subsequent retention failures do not undo the healthy deployment. Retention keeps
at least the newest three releases, plus current/previous and any release marked
`.deploy-failed`. Inspect failed releases before manually clearing markers; watch
disk usage. SIGKILL, host loss and simultaneous deploys cannot be recovered by a
shell trap.

For an approved manual code rollback, first verify the recorded previous release
still exists and is schema-compatible. In an operator shell with errors enabled:

```bash
set -euo pipefail
APP_ROOT=/srv/apfel-park/app
PREVIOUS=/srv/apfel-park/app/releases/<RECORDED_KNOWN_GOOD_RELEASE>
test -d "$PREVIOUS/.next/standalone"
ln -sfn "$PREVIOUS" "$APP_ROOT/current.tmp"
mv -Tf "$APP_ROOT/current.tmp" "$APP_ROOT/current"
systemctl restart apfel-park-nextjs
if systemctl cat apfel-park-marketplace-worker.service >/dev/null 2>&1; then
  systemctl restart apfel-park-marketplace-worker.service
fi
systemctl is-active --quiet apfel-park-nextjs
if systemctl cat apfel-park-marketplace-worker.service >/dev/null 2>&1; then
  systemctl is-active --quiet apfel-park-marketplace-worker.service
fi
curl --fail --silent --show-error --connect-timeout 3 --max-time 10 http://127.0.0.1:3000/de >/dev/null
```

Repeat the GET-only critical checks above against the restored release, including
its own JS/CSS URLs and SHA; allow startup readiness time. Confirm `current` and
`.deployed-sha`, inspect `journalctl -u apfel-park-nextjs -n 100 --no-pager` and worker
logs without publishing secrets. On any failure stop, preserve evidence and
escalate; do not guess another schema or restore production data automatically.

## Wave1 evidence and limits

- Regression staging is a temporary filesystem fixture running the real shell
  script with mocked git/npm/systemctl/curl and no network or live service calls.
  It covers activation faults, rollback health failures, pre-switch failures,
  first deployment, optional worker and retention. It is not a live systemd drill.
- The coordinating operator reports a successful targeted DB backup/restore and
  protected uploads/config/Git/unit backups in
  `/srv/apfel-park/backups/audit-wave1`. Details belong in that change record;
  this does not establish offsite durability or a full disaster recovery drill.
- Wave1 result notes: `/root/apfel-audit/wave1-deploy-results.md` (local audit
  artifact, not a repository dependency). Candidate deployment, real staging
  service fault injection, authenticated workflows and payment tests remain
  separate approval-gated activities.
