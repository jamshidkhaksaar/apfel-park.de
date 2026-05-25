# Mail Server Security Audit Report

Date: 2026-05-13
Scope: `/srv/apfel-park/mail`, Docker mailserver/Roundcube deployment, nginx mail vhost, DNS mail-authentication records, and the app's admin mailbox-management API.

## Executive Summary

The mail server is running with the expected public mail ports only: SMTP `25`, SMTPS `465`, submission `587`, and IMAPS `993`. Roundcube is bound to `127.0.0.1:8081` and exposed only through nginx HTTPS at `mail.apfel-park.de`. Docker images are digest-pinned, TLS is valid, open relay testing failed as expected, fail2ban is active, and the mail queue is empty.

Three hardening changes were applied:

- Roundcube session cookies now receive `Secure` and `SameSite=Strict` at the nginx proxy.
- nginx now strips Roundcube's `X-Powered-By` response header.
- The mailbox account hash file is now `0600` instead of world-readable.
- App-side custom mailbox passwords now require at least 12 characters, and generated mailbox passwords now use 18 random bytes.

## Fixed Findings

| ID | Severity | Finding | Fix | Verification |
| --- | --- | --- | --- | --- |
| MAIL-001 | Medium | Roundcube session cookie was `HttpOnly` but lacked `Secure` and `SameSite`, despite being served over HTTPS. | Added `proxy_cookie_flags roundcube_sessid secure httponly samesite=strict` in nginx mail vhost. | `curl -skI https://mail.apfel-park.de` shows `HttpOnly; Secure; SameSite=Strict`. |
| MAIL-002 | Low | Roundcube exposed `X-Powered-By: PHP/8.4.19`. | Added `proxy_hide_header X-Powered-By` in nginx mail vhost. | `curl -skI https://mail.apfel-park.de` no longer shows `X-Powered-By`. |
| MAIL-003 | Medium | `/srv/apfel-park/mail/docker-data/config/postfix-accounts.cf` was mode `0644`, exposing mailbox password hashes to local users. | Changed permissions to `0600 root:root`. | `stat` confirms `600 root:root`. `docker exec mailserver setup email list` still works. |
| MAIL-004 | Medium | Admin mailbox creation/reset accepted weak custom passwords. | Added custom password length validation and increased generated password entropy. | `npm run lint`, `npm run build`, and production QA passed. |

## Verified Controls

- Public DNS:
  - MX: `10 mail.apfel-park.de.`
  - A: `mail.apfel-park.de -> 46.225.23.177`
  - PTR: `46.225.23.177 -> mail.apfel-park.de.`
  - SPF: `v=spf1 mx -all`
  - DKIM record exists for `mail._domainkey.apfel-park.de`
  - DMARC exists with strict alignment but monitoring policy: `p=none`
- Docker exposure:
  - `mailserver`: public `25`, `465`, `587`, `993`
  - `roundcube`: `127.0.0.1:8081` only
- TLS:
  - IMAPS `993`, submission `587`, and SMTPS `465` negotiated TLS 1.3 with valid certificate verification.
  - Certificate SAN covers `apfel-park.de`, `mail.apfel-park.de`, and `www.apfel-park.de`.
- Relay:
  - Unauthenticated external relay probe was rejected with `554 5.7.1 Relay access denied`.
- Brute-force protection:
  - fail2ban is running inside the mailserver container.
  - Active jails: `custom`, `dovecot`, `postfix`.
  - Postfix jail had active bans during the audit.
- Mail queue:
  - `postqueue -p`: empty.
- App mailbox admin API:
  - Uses `execFile`, not shell interpolation.
  - Restricts mailbox names to `apfel-park.de`.
  - Rejects unsafe mailbox local-parts.
  - Prevents deleting `postmaster@apfel-park.de`.

## Remaining Recommendations

| ID | Severity | Item | Recommendation |
| --- | --- | --- | --- |
| MAIL-RISK-001 | Medium | DMARC is monitoring-only with `p=none`. Spoofing protection at receivers is not enforced by policy. | After confirming legitimate mail alignment, move DMARC gradually to `p=quarantine`, then `p=reject`. |
| MAIL-RISK-002 | Medium | ClamAV is disabled. Rspamd is enabled, but attachment malware scanning is not provided by ClamAV. | Enable `ENABLE_CLAMAV=1` if server memory/CPU budget can support it, or document that endpoint/user-side AV is the compensating control. |
| MAIL-RISK-003 | Low/Medium | MTA-STS and TLS-RPT records were not present. | Add MTA-STS and TLS-RPT for stronger transport downgrade monitoring/protection. |
| MAIL-RISK-004 | Low | nginx global config still advertises `ssl_protocols TLSv1 TLSv1.1 TLSv1.2 TLSv1.3`, though the Let's Encrypt include may override per vhost. | Confirm effective nginx TLS protocol set with an external scanner and remove TLS 1.0/1.1 from global defaults when safe. |

## Commands Run

- `docker ps --format ...`
- `ss -ltnp`
- `docker exec mailserver postconf -n`
- `docker exec mailserver postconf -M`
- `docker exec mailserver doveconf -n`
- `docker exec mailserver fail2ban-client status`
- `docker exec mailserver fail2ban-client status dovecot`
- `docker exec mailserver fail2ban-client status postfix`
- `openssl s_client` checks for `993`, `587`, and `465`
- SMTP relay probe against port `25`
- `curl -skI https://mail.apfel-park.de`
- `dig @1.1.1.1` for MX, A, PTR, DMARC
- `nginx -t`
- `systemctl reload nginx`
- `npm run lint`
- `npm run build`
- `npm run qa:production`
