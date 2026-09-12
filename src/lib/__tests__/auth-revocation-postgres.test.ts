// Opt-in only: a NEW disposable PostgreSQL cluster on a private /tmp Unix socket.
// Never accepts DATABASE_URL or production defaults. Normal unit runs skip this suite.
import { existsSync, readFileSync } from 'node:fs';
import { beforeAll, afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { Pool } from 'pg';
import { NextRequest } from 'next/server';
import { ResponseCookies } from 'next/dist/compiled/@edge-runtime/cookies';
const f = vi.hoisted(() => ({ query: vi.fn(), token: '', cookieHeaders: new Headers() }));
vi.mock('@/lib/db', () => ({ query: f.query, createServerDbClient: (auth: unknown) => ({ auth }), createDbClient: () => {
  const filters: [string, unknown][] = [];
  const chain = { from: () => chain, select: () => chain,
    eq: (key: string, value: unknown) => { filters.push([key, value]); return chain; },
    maybeSingle: async () => ({ data: (await f.query(`SELECT * FROM users WHERE ${filters.map(([key], i) => `"${key}" = $${i + 1}`).join(' AND ')}`, filters.map(([, value]) => value))).rows[0] }),
  }; return chain;
} }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => ({ value: f.token }), set: (...args: Parameters<ResponseCookies['set']>) => new ResponseCookies(f.cookieHeaders).set(...args) }) }));
import { createPersistedSessionToken, readSessionUserFromRequest, clearSessionCookie } from '../session';
import { updateUser } from '../users';
import { isAdminUser } from '../admin-auth';
import { POST as logout } from '../../app/api/admin/logout/route';
import { GET as getAdminUsers } from '../../app/api/admin/users/route';
const host = process.env.APFEL_AUTH_TEST_SOCKET;
const migration = 'supabase/migrations/20260907_wave3_auth_session_revocation.sql';
const request = (token: string) => ({ cookies: { get: () => ({ value: token }) } }) as unknown as NextRequest;

describe.skipIf(!host)('isolated PostgreSQL auth revocation', () => {
  let pool: Pool;
  beforeAll(async () => {
    if (!host || !/^\/tmp\/apfel-auth-[a-zA-Z0-9]+$/.test(host)) throw new Error('Unsafe test socket');
    pool = new Pool({ host, port: 55439, user: 'nobody', database: 'postgres', password: '', ssl: false });
    f.query.mockImplementation((sql, values) => pool.query(sql, values));
    await pool.query(`CREATE TABLE users (id uuid PRIMARY KEY, email text UNIQUE NOT NULL,
      password_hash text NOT NULL, role text NOT NULL, is_active boolean NOT NULL DEFAULT true,
      created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now())`);
    if (existsSync(migration)) await pool.query(readFileSync(migration, 'utf8'));
    vi.stubEnv('APP_SESSION_SECRET', 'isolated-fixture-only'.repeat(4));
    vi.stubEnv('ADMIN_EMAILS', 'owner@example.invalid');
  });
  afterAll(async () => { if (pool) { await pool.query('DROP TABLE IF EXISTS admin_sessions; DROP TABLE users CASCADE; DROP FUNCTION IF EXISTS wave3_auth_advance_security_version()'); await pool.end(); } });
  beforeEach(async () => {
    f.cookieHeaders = new Headers();
    await pool.query('DELETE FROM users');
    if (existsSync(migration)) await pool.query('DELETE FROM admin_sessions');
    await pool.query(`INSERT INTO users(id,email,password_hash,role) VALUES ('11111111-1111-4111-8111-111111111111','owner@example.invalid','old-hash','admin')`);
  });
  it('rejects credentials observed before replacement by another UUID at the same email and version', async () => {
    const oldId = '11111111-1111-4111-8111-111111111111';
    const replacementId = '22222222-2222-4222-8222-222222222222';
    // The second connection commits the replacement after password verification.
    await updateUser(oldId, { password: 'old-fixture-password', role: 'manager' });
    await pool.query('UPDATE users SET security_version = 0');
    const { verifyUserCredentials } = await import('../users');
    const verified = await verifyUserCredentials('owner@example.invalid', 'old-fixture-password');
    expect(verified.valid).toBe(true);
    if (!verified.valid) throw new Error('fixture verification failed');
    const writer = await pool.connect();
    try {
      await writer.query('BEGIN');
      await writer.query('DELETE FROM users WHERE id = $1', [oldId]);
      await writer.query('INSERT INTO users(id,email,password_hash,role) VALUES ($1,$2,$3,$4)',
        [replacementId, 'owner@example.invalid', 'different-password-hash', 'admin']);
      await writer.query('COMMIT');
    } finally { writer.release(); }
    await expect(createPersistedSessionToken('owner@example.invalid', verified.role, verified.securityVersion,
      verified.userId)).rejects.toThrow('Session registration rejected');
    expect((await pool.query('SELECT * FROM admin_sessions')).rows).toEqual([]);
  });
  it('keeps a configured-admin token revoked after deactivation and reactivation', async () => {
    const token = await createPersistedSessionToken('owner@example.invalid', 'admin', 0, '11111111-1111-4111-8111-111111111111');
    expect(await readSessionUserFromRequest(request(token))).not.toBeNull();
    await updateUser('11111111-1111-4111-8111-111111111111', { isActive: false });
    expect(await readSessionUserFromRequest(request(token))).toBeNull();
    await updateUser('11111111-1111-4111-8111-111111111111', { isActive: true });
    expect(await readSessionUserFromRequest(request(token))).toBeNull();
  });
  it('does not revive sessions if an account email is changed back', async () => {
    const token = await createPersistedSessionToken('owner@example.invalid', 'admin', 0, '11111111-1111-4111-8111-111111111111');
    await updateUser('11111111-1111-4111-8111-111111111111', { email: 'new@example.invalid' });
    await updateUser('11111111-1111-4111-8111-111111111111', { email: 'owner@example.invalid' });
    expect(await readSessionUserFromRequest(request(token))).toBeNull();
  });
  it('rejects both copied sessions after password reset and permits a fresh version', async () => {
    const first = await createPersistedSessionToken('owner@example.invalid', 'admin', 0, '11111111-1111-4111-8111-111111111111');
    const second = await createPersistedSessionToken('owner@example.invalid', 'admin', 0, '11111111-1111-4111-8111-111111111111');
    await updateUser('11111111-1111-4111-8111-111111111111', { password: 'fixture-new-password' });
    expect(await readSessionUserFromRequest(request(first))).toBeNull();
    expect(await readSessionUserFromRequest(request(second))).toBeNull();
    await expect(createPersistedSessionToken('owner@example.invalid', 'admin', 0, '11111111-1111-4111-8111-111111111111')).rejects.toThrow('Session registration rejected');
    const fresh = await createPersistedSessionToken('owner@example.invalid', 'admin', 1, '11111111-1111-4111-8111-111111111111');
    expect(await readSessionUserFromRequest(request(fresh))).not.toBeNull();
  });
  it('revokes only the current session on real database logout', async () => {
    const first = await createPersistedSessionToken('owner@example.invalid', 'admin', 0, '11111111-1111-4111-8111-111111111111');
    const other = await createPersistedSessionToken('owner@example.invalid', 'admin', 0, '11111111-1111-4111-8111-111111111111');
    f.token = first;
    await clearSessionCookie();
    expect(await readSessionUserFromRequest(request(first))).toBeNull();
    expect(await readSessionUserFromRequest(request(other))).not.toBeNull();
    expect((await pool.query('SELECT token_hash FROM admin_sessions')).rows[0].token_hash).toMatch(/^[a-f0-9]{64}$/);
  });
  it('uses current DB role for a demoted configured admin immediately', async () => {
    const token = await createPersistedSessionToken('owner@example.invalid', 'admin', 0, '11111111-1111-4111-8111-111111111111');
    await updateUser('11111111-1111-4111-8111-111111111111', { role: 'manager' });
    const user = await readSessionUserFromRequest(request(token));
    expect(user?.app_metadata?.role).toBe('manager');
    expect(isAdminUser(user)).toBe(false);
  });
  it('supports previous-release SQL writes while enforcing revocation', async () => {
    const token = await createPersistedSessionToken('owner@example.invalid', 'admin', 0, '11111111-1111-4111-8111-111111111111');
    await pool.query(`UPDATE users SET password_hash = 'legacy-writer-new-hash', updated_at = now() WHERE email = 'owner@example.invalid' RETURNING *`);
    expect(await readSessionUserFromRequest(request(token))).toBeNull();
    expect((await pool.query('SELECT security_version FROM users')).rows[0].security_version).toBe(1);
  });
  it('rejects expired, tampered and deleted-account records', async () => {
    const token = await createPersistedSessionToken('owner@example.invalid', 'admin', 0, '11111111-1111-4111-8111-111111111111');
    expect(await readSessionUserFromRequest(request(token + 'x'))).toBeNull();
    await pool.query(`UPDATE admin_sessions SET expires_at = now() - interval '1 second'`);
    expect(await readSessionUserFromRequest(request(token))).toBeNull();
    const fresh = await createPersistedSessionToken('owner@example.invalid', 'admin', 0, '11111111-1111-4111-8111-111111111111');
    await pool.query('DELETE FROM users');
    expect(await readSessionUserFromRequest(request(fresh))).toBeNull();
  });
  it.each(['logout', 'password-reset', 'deactivation'] as const)('returns actual admin-handler 401 when replayed after %s', async (event) => {
    f.token = await createPersistedSessionToken('owner@example.invalid', 'admin', 0, '11111111-1111-4111-8111-111111111111');
    if (event === 'logout') await clearSessionCookie();
    if (event === 'password-reset') await updateUser('11111111-1111-4111-8111-111111111111', { password: 'new-fixture-password' });
    if (event === 'deactivation') await updateUser('11111111-1111-4111-8111-111111111111', { isActive: false });
    const response = await getAdminUsers(request(f.token));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Unauthorized' });
  });
  it('logout route emits matching cookie expiry only after persistent revocation', async () => {
    f.token = await createPersistedSessionToken('owner@example.invalid', 'admin', 0, '11111111-1111-4111-8111-111111111111');
    const req = new NextRequest('https://example.invalid/api/admin/logout', { method: 'POST', headers: { origin: 'https://example.invalid' } });
    // Real missing-schema failure, not a fabricated SQL rejection.
    await pool.query('ALTER TABLE admin_sessions RENAME TO fixture_unavailable_sessions');
    try {
      await expect(logout(req)).rejects.toThrow();
      expect(f.cookieHeaders.get('set-cookie')).toBeNull();
    } finally { await pool.query('ALTER TABLE fixture_unavailable_sessions RENAME TO admin_sessions'); }
    expect(await readSessionUserFromRequest(request(f.token))).not.toBeNull();
    vi.stubEnv('APP_SECURE_COOKIES', 'true');
    try {
      const response = await logout(req);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ success: true });
      const header = f.cookieHeaders.get('set-cookie');
      expect(header).toContain('apfel_admin_session=;');
      expect(header).toContain('Path=/');
      expect(header).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
      expect(header).toContain('HttpOnly');
      expect(header).toContain('Secure');
      expect(header).toContain('SameSite=lax');
      expect(header).not.toContain('Domain=');
      expect(await readSessionUserFromRequest(request(f.token))).toBeNull();
    } finally { vi.stubEnv('APP_SECURE_COOKIES', 'false'); }
  });
  it('atomically advances security version when the real user password reset runs', async () => {
    await updateUser('11111111-1111-4111-8111-111111111111', { password: 'fixture-new-password' });
    expect((await pool.query('SELECT * FROM users')).rows[0].security_version).toBe(1);
  });
});
