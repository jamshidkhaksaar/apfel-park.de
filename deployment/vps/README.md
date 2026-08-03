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

## What is included

- `nginx/apfel-park.conf`: production nginx reverse proxy and static upload/static asset mapping.
- `systemd/apfel-park-nextjs.service`: production Next.js standalone service.
- `mail/compose.yaml`: production Roundcube and docker-mailserver compose file.
- `mail/mail.env.example`: sanitized docker-mailserver environment template.
- `mail/roundcube.env.example`: sanitized Roundcube environment template.
- `mail/config/postfix-accounts.example.cf`: mailbox account names with password hashes removed.
- `mail/config/fail2ban-jail.cf`: mail fail2ban override.
- `mail/roundcube/*`: Roundcube branding/template files.
- `app/app.env.example`: sanitized application environment template.
- `scripts/*`: backup and certificate helper scripts.
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
5. Copy `deployment/vps/systemd/apfel-park-nextjs.service` to `/etc/systemd/system/` and run `systemctl daemon-reload`.
6. Deploy the app with `deployment/vps/scripts/deploy-app.sh` (see Deploying below), then start `apfel-park-nextjs.service`.
7. Create `/srv/apfel-park/mail/.env` from `deployment/vps/mail/mail.env.example`.
8. Create `/srv/apfel-park/mail/roundcube.env` from `deployment/vps/mail/roundcube.env.example`.
9. Copy `deployment/vps/mail/compose.yaml` to `/srv/apfel-park/mail/compose.yaml` and start it with `docker compose up -d`.
10. Recreate mail users with docker-mailserver `setup.sh email add/update`; do not reuse committed placeholder hashes as passwords.
11. Restore latest mailbox and PostgreSQL backups separately, then verify DNS, SSL, SMTP, IMAP, Roundcube, and the app checkout flow.

## Deploying

    /srv/apfel-park/app/source/deployment/vps/scripts/deploy-app.sh [ref]

Defaults to `origin/<branch checked out in the source clone>`. The script
fetches origin, exports the commit with `git archive` into a fresh
`releases/<timestamp>-<sha>` directory, runs `npm ci && npm run build`, flips
the `current` symlink atomically, restarts the service, health-checks it, and
prunes all but the newest 3 releases.

Three things it enforces, each learned the hard way:

- **It refuses any commit not reachable from an origin branch.** Releases used
  to be made by copying the previous release dir and editing in place, which
  left every release a dirty git checkout. On 2026-08-03 that had stranded 141
  files of work that existed nowhere but this VPS.
- **It copies `.next/static` and `public/` into `.next/standalone/`.**
  `next build` does not do this. Skip it and the site returns 200 with no CSS
  and no JS -- there is no error anywhere, it just looks broken.
- **It health-checks and rolls back.** If `/de` does not return 200 within 40s
  the symlink is restored to the previous release and the service restarted.
  It also warns if `/xx` stops returning 404, which regressed into 500s before.

Never edit files inside a `releases/` directory. Commit, push, then deploy.

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
