# Apfel Park VPS deployment backup

This folder captures the production server layout needed to rebuild or migrate the VPS without committing live secrets or mailbox data.

## Runtime layout

- Git source clone (deploys build from here): `/srv/apfel-park/app/source`
- Deploy tooling checkout (runs the deploy, detached at `origin/main`): `/srv/apfel-park/app/deploy`
- Built releases: `/srv/apfel-park/app/releases/<timestamp>-<sha>`
- Active app symlink: `/srv/apfel-park/app/current`
- Shared app env/uploads: `/srv/apfel-park/app/shared`
- Mail stack: `/srv/apfel-park/mail`
- Mail backups: `/srv/apfel-park/backups/mail`
- PostgreSQL backups: `/srv/apfel-park/backups/postgres`
- Nginx site: `/etc/nginx/sites-available/apfel-park.conf`
- App service: `/etc/systemd/system/apfel-park-nextjs.service`
- Omnichannel worker: `/etc/systemd/system/apfel-park-marketplace-worker.service`

## What is included

- `nginx/apfel-park.conf`: production nginx reverse proxy and static upload/static asset mapping.
- `systemd/apfel-park-nextjs.service`: production Next.js standalone service.
- `systemd/apfel-park-public-surface-probe.service`, `.timer` and `-alert@.service`: hourly origin-side probe of the public surface (the same checks a deploy gates on) and an emailed alert when it fails.
- `mail/compose.yaml`: production Roundcube and docker-mailserver compose file.
- `mail/mail.env.example`: sanitized docker-mailserver environment template.
- `mail/roundcube.env.example`: sanitized Roundcube environment template.
- `mail/config/postfix-accounts.example.cf`: mailbox account names with password hashes removed.
- `mail/config/fail2ban-jail.cf`: mail fail2ban override.
- `mail/roundcube/*`: Roundcube branding/template files.
- `app/app.env.example`: sanitized application environment template.
- `scripts/*`: backup and certificate helper scripts, plus `probe-public-surface.sh` (see Public surface probe).
- `postgres/*`: database initialization SQL from the VPS infra folder.
- `dns-checklist.txt`: DNS records/checklist used for mail and web setup.

## Secrets intentionally excluded

Do not commit these files directly:

- `/srv/apfel-park/app/shared/app.env`
- `/srv/apfel-park/mail/.env`
- `/srv/apfel-park/mail/roundcube.env`
- `/srv/apfel-park/mail/docker-data/config/postfix-accounts.cf`
- TLS private keys under `/etc/letsencrypt`
- Mailbox data, logs, PostgreSQL dumps, and backup archives

Create replacement values from the `.example` files during migration, then restore mailbox/database backups out of band.

## Migration outline

1. Provision an Ubuntu VPS with Docker, Nginx, Node.js 24.x, PostgreSQL if used locally, and Certbot.
2. Clone the repository to `/srv/apfel-park/app/source`, then create the deploy tooling checkout with `git -C /srv/apfel-park/app/source worktree add --detach /srv/apfel-park/app/deploy origin/main`.
3. Create `/srv/apfel-park/app/shared/app.env` from `deployment/vps/app/app.env.example`.
4. Copy `deployment/vps/nginx/apfel-park.conf` to `/etc/nginx/sites-available/apfel-park.conf` and enable it.
5. Copy `deployment/vps/systemd/apfel-park-nextjs.service`, `deployment/vps/systemd/apfel-park-marketplace-worker.service`, `deployment/vps/systemd/apfel-park-public-surface-probe.service`, `deployment/vps/systemd/apfel-park-public-surface-probe.timer` and `deployment/vps/systemd/apfel-park-public-surface-probe-alert@.service` to `/etc/systemd/system/`, then run `systemctl daemon-reload`.
6. Deploy the app with `deployment/vps/scripts/deploy-app.sh` (see Deploying below), then enable and start `apfel-park-nextjs.service` and `apfel-park-marketplace-worker.service`, and `systemctl enable --now apfel-park-public-surface-probe.timer`.
7. Create `/srv/apfel-park/mail/.env` from `deployment/vps/mail/mail.env.example`.
8. Create `/srv/apfel-park/mail/roundcube.env` from `deployment/vps/mail/roundcube.env.example`.
9. Copy `deployment/vps/mail/compose.yaml` to `/srv/apfel-park/mail/compose.yaml` and start it with `docker compose up -d`.
10. Recreate mail users with docker-mailserver `setup.sh email add/update`; do not reuse committed placeholder hashes as passwords.
11. Restore latest mailbox and PostgreSQL backups separately, then verify DNS, SSL, SMTP, IMAP, Roundcube, and the app checkout flow.

## Deploying

    /srv/apfel-park/app/deploy/deployment/vps/scripts/deploy-app.sh <ref>

The script runs from its own checkout, detached at `origin/main`, so what
deploys cannot be an older copy of the tooling from a branch that happens to be
checked out in the source clone. Refresh that checkout before deploying:

    git -C /srv/apfel-park/app/deploy fetch origin main
    git -C /srv/apfel-park/app/deploy checkout --detach origin/main

An explicit committed, pushed ref is required; omitting it fails before fetching.
A branch ref resolves from `origin`, so `main` means the pushed `main` even when
the source clone's local branch has fallen behind; a tag or a full sha resolves
as itself.
The target must include the currently deployed commit (or equal it). The script
checks again before activation, so a newer live release cannot be silently overwritten
by an older or divergent build. For a deliberate operator-approved rollback only,
use `ALLOW_NON_FORWARD_DEPLOY=1 bash scripts/deploy.sh <previous-sha>`.
Automatic rollback after a failed activation health check is unchanged.
After successful verification, fast-forward the clean source checkout and its tracked
branch to the deployed commit; never reset away another contributor's changes.

The script fetches origin, exports the commit with `git archive` into a fresh
`releases/<timestamp>-<sha>` directory, runs `npm ci` and then the shared check
gate (`npm run ci:check`), flips
the `current` symlink atomically, restarts the service, health-checks it, and
prunes all but the newest 3 releases.

Seven things it enforces, each learned the hard way:

- **It refuses any commit not reachable from an origin branch.** Releases used
  to be made by copying the previous release dir and editing in place, which
  left every release a dirty git checkout. On 2026-08-03 that had stranded 141
  files of work that existed nowhere but this VPS.
- **It copies `.next/static` and `public/` into `.next/standalone/`.**
  `next build` does not do this. Skip it and the site returns 200 with no CSS
  and no JS -- there is no error anywhere, it just looks broken.
- **It runs the shared check gate before touching the symlink.** A failing
  lint, typecheck, unused-source audit, test, dependency audit or production
  build aborts the deploy with production still on the previous release.
- **It symlinks `shared/uploads` into `.next/standalone/public/`.** Uploads
  live outside releases and are served by nginx via `alias`, but `next/image`
  resolves local paths inside Next. The symlink covers existing files;
  `src/app/uploads/[...path]/route.ts` serves raster images added after startup,
  because Next snapshots `public/` at boot. The release also runs
  `npm run test:image-uploads` against an isolated standalone process, creating
  WebP, PNG and JPEG images after startup and checking four optimizer widths.
- **It submits changed URLs to IndexNow.** Bing, Yandex, Seznam and Naver get
  told within minutes instead of waiting for a crawl. The verification key had
  been served since July with nothing ever submitting to it. Skips
  automatically when the sitemap is unchanged; never fails a deploy.
- **It health-checks and rolls back.** If `/de` does not return 200 within 40s
  the symlink is restored to the previous release and the service restarted.
  It also warns if `/xx` stops returning 404, which regressed into 500s before.
- **It probes the public surface on the origin.** `scripts/probe-public-surface.sh`
  checks that older builds' assets still resolve, that a missing asset or
  markdown twin is not served with long-lived caching, that the markdown twins
  answer and negotiate correctly and do not leak the internal rewrite target,
  and that any response a shared cache may keep varies on `Accept`. A failure
  rolls this release back, exactly like the health check.

### The shared check gate

    npm ci          # once, in the checkout being checked
    npm run ci:check

`scripts/ci-check.mjs` runs lint, typecheck, the unused-source audit, the test
suite, the dependency audit and the production build, in that order, and stops
at the first gate that fails with that gate's own exit code. `deploy-app.sh`
calls it and so does `.github/workflows/ci.yml`, so a check added for one
applies to both, and it runs anywhere node runs -- a laptop or this VPS --
without waiting on CI to be able to start a job.

Every gate except the build runs with the ambient environment, exactly as it
does in CI. Only the build reads the release environment: the deploy passes
`CI_CHECK_BUILD_ENV_FILE` and the script sources that file for the build step
alone. Sourcing it for the whole gate is what made a test that asserts on an
unset webhook key pass everywhere but here, where the release env has one.

`deploy-app.sh` then sources `shared/app.env` in its own shell right after the
gate (`set -a; . shared/app.env; set +a`), so its remaining steps keep the
environment they had when the build sourced it in this shell. The owner
migration and `db:migrate` read `DATABASE_URL`; without it the first deploy of
the extracted gate stopped with `DATABASE_URL is not exported`.

The deploy keeps its environment-specific steps after it: assembling
`.next/standalone`, database migrations, the image-upload regression against a
standalone server, the activation health check, and the origin-side surface
probe. Those need a release directory, so they are not part of the shared list.

Never edit files inside a `releases/` directory. Commit, push, then deploy.

## Public surface probe

    /srv/apfel-park/app/current/deployment/vps/scripts/probe-public-surface.sh \
      /srv/apfel-park/app "$(date -u +%H%M%S)"

Probes `apfel-park.de` on the origin (`--resolve ... 127.0.0.1`), never through
the CDN: a warm edge answers 200 for an asset the origin no longer has, which is
how a broken `/_next/static` alias stayed invisible. It exits non-zero with the
first failure on stderr and prints one line per check.

`deploy-app.sh` runs it after activation, so a failure rolls the release back.
`apfel-park-public-surface-probe.timer` runs it hourly, so a vhost or header
change between deploys is noticed within the hour instead of at the next release:

    systemctl list-timers apfel-park-public-surface-probe.timer
    systemctl start apfel-park-public-surface-probe.service   # run it now
    journalctl -u apfel-park-public-surface-probe.service -n 40

The second argument is a probe token. It names the throwaway URLs the checks
request (`/_next/static/deploy-probe-<token>-missing.js`, `/de/no-twin-<token>.md`)
so a probe can never collide with a real page; the deploy passes the commit sha.

The service has `ConditionPathExists=` on the probe in `current`, so enabling the
timer before the first release containing the script is deployed skips the run
instead of failing hourly. Once such a release is live it runs every hour and
fails only on a real regression.

### Alerting

A failed hourly run is emailed to the owner. The probe service declares
`OnFailure=apfel-park-public-surface-probe-alert@%n.service`, and that unit runs
`scripts/notify-surface-probe-failure.ts`, which reads the failing run out of the
journal and sends it through the application's own mail configuration (`SMTP_*`,
`ADMIN_EMAILS` in `shared/app.env`). The mail names the failed check, quotes the
journal tail, and prints the command that shows the rest.

The same failure is not emailed more than once every six hours
(`SURFACE_PROBE_ALERT_WINDOW_MS`), recorded in
`shared/public-surface-alert-state.json`; deleting that file forces a re-send. A
failure that never named a check -- a crash, a missing script -- is fingerprinted
from the journal tail instead, so it is suppressed only when that tail repeats
unchanged; the mail itself then reports the newest line about the failure, never
a line that only says an invocation was skipped.

To check the alert path without mailing anyone:

    cd /srv/apfel-park/app/current
    set -a; . /srv/apfel-park/app/shared/app.env; set +a
    node --import=tsx scripts/notify-surface-probe-failure.ts \
      apfel-park-public-surface-probe.service --dry-run

To send one real test through the same path -- how to check that delivery
itself works, after a migration for instance:

    node --import=tsx scripts/notify-surface-probe-failure.ts \
      apfel-park-public-surface-probe.service --test

The mail is prefixed `[TEST]` and opens by saying nothing is broken. A test send
neither reads nor writes the suppression state, so it cannot hide the first real
failure.

To stop the hourly probe: `systemctl disable --now apfel-park-public-surface-probe.timer`.

## AEO markdown twins

`/de/about.md`, and `Accept: text/markdown` on `/de/about`, are served by the app:
`src/proxy.ts` rewrites to the markdown handler and `src/lib/md/` renders it.
Content negotiation, bot detection and the response headers follow the AEO
Specification v1.0 through `@dualmark/core`, and `probe-public-surface.sh`
checks the twins on every deploy and every hour.

One header the spec requires on the **HTML** response is set by nginx rather
than by the app: `Vary`. Next.js writes its own `Vary` on page responses,
without `Accept`, replacing whatever the middleware set -- verified at the
origin, not through the CDN. `nginx/apfel-park.conf` therefore carries one
`map` block that produces single-valued `Vary: Accept, Accept-Encoding`.

That vhost is not applied by `deploy-app.sh`; after editing it:

    cp deployment/vps/nginx/apfel-park.conf /etc/nginx/sites-available/apfel-park.conf
    nginx -t && systemctl reload nginx

The `Link` alternate is the app's: `src/proxy.ts` advertises the twin on every
page that has one, and Next appends its preload links as separate header lines
without replacing that header, so it reaches the client as written. nginx used
to add a second copy from a path map whose exclusions mirrored
`PRIVATE_PREFIXES` and `markdownSkips` in `src/lib/md/routes.ts` and had to be
kept in sync by hand; that map made every response advertise its twin twice,
once absolute and once relative. It is gone, and the app is the single source.

A twin selected by the User-Agent alone -- a registry bot that did not ask for
markdown -- is served `Cache-Control: private, no-store` instead of the
`public, s-maxage=3600` every other twin gets. That representation depends on a
header no cache key on this stack carries: Next drops `User-Agent` from `Vary`,
and the edge rewrites `Vary` to `Accept, Accept-Encoding`, so a shared cache
could store the markdown and later hand it to a browser sending `Accept: */*`.
Markdown selected by `Accept` stays cacheable, because there the representation
depends only on `Accept`, which is in the key. The markdown handler applies the
policy, not `src/proxy.ts`: a `Cache-Control` set on the middleware's rewrite is
discarded, because the rewritten response sets that header itself.

## Database migrations

`supabase/migrations/*.sql` are plain SQL applied by `scripts/migrate.mjs`.
(The directory name is leftover -- this project uses plain PostgreSQL via `pg`,
not Supabase.)

    npm run db:status     # list applied / pending
    npm run db:migrate    # apply pending, each in a transaction
    npm run db:baseline   # record all as applied WITHOUT running them

Applied migrations are recorded in `public.schema_migrations` with a checksum,
so an edit to an already-applied file shows up as `CHANGED` in `db:status`.
Before 2026-08-03 there was no tracking at all and migrations were applied by
hand; the existing ten were baselined rather than re-run.

Use `db:baseline` only when standing up tracking against a database whose
migrations were already applied manually. On a fresh database use `db:migrate`.

## IndexNow

    npm run seo:indexnow              # submit sitemap URLs (skips if unchanged)
    node scripts/indexnow.mjs --force # submit anyway
    node scripts/indexnow.mjs <url>   # submit specific URLs

The key is auto-discovered from the 32-hex `.txt` file in `public/`; the script
refuses to run if its contents do not match its filename, which is what
IndexNow validates. One POST to `api.indexnow.org` reaches every participating
engine. Google does not participate and schedules its own crawling.

State lives at `/srv/apfel-park/app/shared/indexnow-state.json` so the
fingerprint survives releases.
