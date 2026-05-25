# Server Security Audit Report

Date: 2026-05-13
Scope: Ubuntu host, firewall, SSH, nginx, Docker, systemd services, backups, exposed ports, update/reboot status, and operational health.

## Executive Summary

The server is a Hetzner Ubuntu 24.04.4 LTS VM. Firewall default-deny is active, exposed ports match the app/mail role, no failed systemd units were present, package upgrades are currently applied, fail2ban is active, and core services are running. The main remaining security issue is SSH: password authentication and direct root login are enabled, while `/root/.ssh/authorized_keys` is empty. That cannot be safely fixed without first adding a non-root sudo user and an SSH public key, otherwise access could be lost.

Safe hardening was applied during this audit:

- Existing mail and database backup artifacts were restricted from `0644` to `0600`.
- Backup scripts now use `umask 077` so new backups are root-only.
- nginx now has `server_tokens off`.
- nginx hides upstream `X-Powered-By` from the public app and Roundcube proxies.

## Fixed Findings

| ID | Severity | Finding | Fix | Verification |
| --- | --- | --- | --- | --- |
| SRV-001 | High | Database and mail backup archives were mode `0644`, exposing sensitive dumps/mail archives to any local user. | Added `umask 077` to backup scripts and changed existing backup files to `0600`. | `find /srv/apfel-park/backups ... stat` confirms `600 root:root`; `bash -n` passes for backup scripts. |
| SRV-002 | Low | nginx default `server_tokens` was not disabled. | Set `server_tokens off` in `/etc/nginx/nginx.conf`. | `nginx -T` confirms `server_tokens off`; `nginx -t` passes. |
| SRV-003 | Low | Public app proxy exposed upstream `X-Powered-By: Next.js`. | Added `proxy_hide_header X-Powered-By` to the app nginx proxy. | `curl -skI https://apfel-park.de/de` no longer shows `X-Powered-By`. |

## Critical/High Remaining Findings

| ID | Severity | Finding | Evidence | Recommendation |
| --- | --- | --- | --- | --- |
| SRV-RISK-001 | High | SSH allows direct root login and password authentication. This is heavily attacked on public port 22. | `sshd -T`: `permitrootlogin yes`, `passwordauthentication yes`; host fail2ban `sshd` jail has thousands of failures and active bans; `/root/.ssh/authorized_keys` has 0 lines. | Create a non-root sudo user, install SSH keys, verify login in a second session, then set `PasswordAuthentication no` and `PermitRootLogin prohibit-password` or `no`. |
| SRV-RISK-002 | Medium/High | Server reboot is required to activate installed kernel updates. | `/var/run/reboot-required` exists; `needrestart` reports running kernel `6.8.0-107-generic` while expected kernel is `6.8.0-111-generic`. | Schedule a maintenance reboot, then verify app, nginx, Docker, PostgreSQL, mailserver, and QA after boot. |
| SRV-RISK-003 | Medium/High | `apfel-park-nextjs.service` runs as `root` with almost no systemd sandboxing. A remote app compromise would have host-root impact. | Unit has `User=root`; `systemd-analyze security apfel-park-nextjs.service` reports exposure `9.6 UNSAFE`. | Create a dedicated `apfel-app` service user, make uploads/log write paths explicit, protect env file with a service-readable group, and add systemd sandboxing (`NoNewPrivileges`, `PrivateTmp`, `ProtectSystem`, `ReadWritePaths`, restricted capabilities). |

## Verified Controls

- OS: Ubuntu 24.04.4 LTS, kernel `6.8.0-107-generic`.
- Firewall: UFW active, default deny incoming, allow outgoing.
- Public listening ports:
  - `22` SSH
  - `80`, `443` nginx
  - `25`, `465`, `587`, `993` mail
- Local-only services:
  - Next.js: `127.0.0.1:3000`
  - PostgreSQL: `127.0.0.1:5432`, `[::1]:5432`
  - Roundcube backend: `127.0.0.1:8081`
- fail2ban:
  - Host jail: `sshd`, active with current bans.
  - Mailserver jails checked separately in the mail audit.
- Package state:
  - `apt-get -s upgrade`: `0 upgraded, 0 newly installed, 0 to remove`.
  - Reboot still required for kernel activation.
- Docker:
  - Docker daemon active with AppArmor and seccomp enabled.
  - Containers are not privileged.
  - `mailserver` has `CAP_NET_ADMIN` for fail2ban/mail networking.
  - Docker disk usage is low; no reclaimable image/build-cache bloat.
- TLS/headers:
  - Public app HTTPS works.
  - nginx config validates after changes.
  - Public app no longer exposes upstream `X-Powered-By`.
- Backups:
  - Daily PostgreSQL and mail backup timers exist and recently ran.
  - Backup artifacts are now root-only.
- Service health:
  - `apfel-park-nextjs.service`, nginx, Docker, PostgreSQL, SSH, fail2ban, and UFW are active.
  - `npm run qa:production`: 20/20 passed after nginx changes.

## Additional Recommendations

| ID | Severity | Item | Recommendation |
| --- | --- | --- | --- |
| SRV-REC-001 | Medium | SSH is open to the whole internet. | After key-based login is configured, consider moving SSH behind a restricted IP allowlist, VPN, or Cloudflare/Zero Trust access path if operationally feasible. |
| SRV-REC-002 | Medium | No CSP is enforced for the app. | Roll out CSP in report-only mode first due to GA4/Meta/TikTok/Stripe/PayPal script requirements. |
| SRV-REC-003 | Medium | Duplicate security headers are visible through Cloudflare/nginx/app layering. | Consolidate security headers at one layer after CSP planning to reduce ambiguity. |
| SRV-REC-004 | Low | nginx global config still lists TLS 1.0/1.1, but the Let's Encrypt include sets `ssl_protocols TLSv1.2 TLSv1.3`; local OpenSSL could not negotiate TLS 1.0/1.1. | Keep the effective TLS 1.2/1.3 configuration and clean up the global comment/default at the next nginx maintenance pass. |

## Commands Run

- `hostnamectl`
- `ss -ltnp`
- `ufw status verbose`
- `systemctl --failed --no-pager`
- `sshd -T`
- `fail2ban-client status`, `fail2ban-client status sshd`
- `apt-get -s upgrade`
- `needrestart -b`
- `systemctl is-enabled ...`, `systemctl is-active ...`
- `docker ps`, `docker inspect`, `docker images`, `docker info`, `docker system df`
- `systemd-analyze security apfel-park-nextjs.service`
- `find/stat` checks for env, backup, and config permissions
- `nginx -t`, `nginx -T`, `systemctl reload nginx`
- `curl -skI https://apfel-park.de/de`
- `openssl s_client` TLS checks
- `npm run qa:production`
