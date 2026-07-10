# Apfel Park Operations

## Boundaries

- Edit source only in `/srv/apfel-park/app/releases/repo`.
- The live service runs the built standalone application in
  `/srv/apfel-park/app/current/.next/standalone`; do not edit this generated
  output by hand.
- Secrets are loaded from `/srv/apfel-park/app/shared/app.env` and must not be
  committed or displayed.

## Verify

```bash
systemctl status apfel-park-nextjs --no-pager
journalctl -u apfel-park-nextjs -n 100 --no-pager
curl -skI https://apfel-park.de/
```

## Build and deploy policy

Run `npm run lint` and `npm run build` in the source repository before a
deployment.  The source-to-`app/current` promotion command has not been
verified in this runbook; do not copy files or restart the service until the
release owner confirms that command and rollback target.

## Rollback policy

Use the preceding known-good release already present under `app/releases` and
the verified release procedure.  Never reconstruct a rollback by editing the
`.next` output manually.
