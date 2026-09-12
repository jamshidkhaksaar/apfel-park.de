# Persistent admin sessions — release and rollback

This additive release requires a usable active database-backed admin. Environment-only passwords no longer authenticate. Existing stateless cookies are rejected; users must log in again. The authorized operator provisioned the configured admin with the same password using salted scrypt and verified the persisted hash without exposing credentials.

Apply `20260907_wave3_auth_session_revocation.sql` through the pinned deployment migration runner before activation. The runtime role requires SELECT/INSERT/DELETE on admin_sessions and existing users privileges; the migration role must own users and have schema CREATE. Validate on schema-only disposable data first.

Logout revokes the current session. Password, email and active-state changes revoke previous credential versions. Current DB roles are authoritative. Session registration binds immutable verified user ID and credential version. Browser logout failure is recoverable and does not falsely navigate away.

## Rollback

Retain the additive schema. Old writers remain SQL-compatible, but old code does NOT enforce server-side revocation. A rollback is recovery of availability, not preservation of these security guarantees. If rollback is necessary, before permitting administrative use coordinate a fresh APP_SESSION_SECRET across web/worker processes and restart them; do not expose, reuse or restore the prior signing secret. This invalidates existing signed cookies but does not retrofit logout revocation into old code. Reapply the corrected release promptly. Do not restore an old database snapshot over new commerce transactions.

## Verification scope

Unit and isolated PostgreSQL tests cover replacement-account identity races, reset/deactivation/logout replay and current authorization. Real-component Chromium covers HTTP/network logout failure and keyboard retry. Full release build and deployment gates are required separately. No real customer transactions or email tests are authorized by this release.
