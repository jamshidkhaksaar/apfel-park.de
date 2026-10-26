# Apfel Park VPS deployment backup

This folder captures the production server layout needed to rebuild or migrate the VPS without committing live secrets or mailbox data.

## Runtime layout

- Git source clone (deploys build from here): `/srv/apfel-park/app/source`
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
- `systemd/apfel-park-public-surface-probe.service` and `.timer`: hourly origin-side probe of the public surface, running the same checks a deploy gates on.
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
2. Clone the repository to `/srv/apfel-park/app/source`.
3. Create `/srv/apfel-park/app/shared/app.env` from `deployment/vps/app/app.env.example`.
4. Copy `deployment/vps/nginx/apfel-park.conf` to `/etc/nginx/sites-available/apfel-park.conf` and enable it.
5. Copy `deployment/vps/systemd/apfel-park-nextjs.service`, `deployment/vps/systemd/apfel-park-marketplace-worker.service`, `deployment/vps/systemd/apfel-park-public-surface-probe.service` and `deployment/vps/systemd/apfel-park-public-surface-probe.timer` to `/etc/systemd/system/`, then run `systemctl daemon-reload`.
6. Deploy the app with `deployment/vps/scripts/deploy-app.sh` (see Deploying below), then enable and start `apfel-park-nextjs.service` and `apfel-park-marketplace-worker.service`, and `systemctl enable --now apfel-park-public-surface-probe.timer`.
7. Create `/srv/apfel-park/mail/.env` from `deployment/vps/mail/mail.env.example`.
8. Create `/srv/apfel-park/mail/roundcube.env` from `deployment/vps/mail/roundcube.env.example`.
9. Copy `deployment/vps/mail/compose.yaml` to `/srv/apfel-park/mail/compose.yaml` and start it with `docker compose up -d`.
10. Recreate mail users with docker-mailserver `setup.sh email add/update`; do not reuse committed placeholder hashes as passwords.
11. Restore latest mailbox and PostgreSQL backups separately, then verify DNS, SSL, SMTP, IMAP, Roundcube, and the app checkout flow.

## Deploying

    /srv/apfel-park/app/source/deployment/vps/scripts/deploy-app.sh <ref>

An explicit committed, pushed ref is required; omitting it fails before fetching.
The target must include the currently deployed commit (or equal it). The script
checks again before activation, so a newer live release cannot be silently overwritten
by an older or divergent build. For a deliberate operator-approved rollback only,
use `ALLOW_NON_FORWARD_DEPLOY=1 bash scripts/deploy.sh <previous-sha>`.
Automatic rollback after a failed activation health check is unchanged.
After successful verification, fast-forward the clean source checkout and its tracked
branch to the deployed commit; never reset away another contributor's changes.

The script fetches origin, exports the commit with `git archive` into a fresh
`releases/<timestamp>-<sha>` directory, runs `npm ci`, `npm test` and
`npm run build`, flips
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
- **It runs the test suite before touching the symlink.** A failing test
  aborts the deploy with production still on the previous release.
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

To stop the hourly probe: `systemctl disable --now apfel-park-public-surface-probe.timer`.

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
