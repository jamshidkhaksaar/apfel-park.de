import { beforeEach, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const fixture = vi.hoisted(() => ({ token: '', query: vi.fn(), getUser: vi.fn(), set: vi.fn() }));
vi.mock('@/lib/db', () => ({ query: fixture.query }));
vi.mock('@/lib/users', () => ({ getUserByEmail: fixture.getUser }));
vi.mock('next/headers', () => ({ cookies: async () => ({
  get: () => ({ value: fixture.token }), set: fixture.set,
}) }));
import { clearSessionCookie, createSessionToken, readSessionUserFromRequest, setSessionCookie } from '../session';

const request = (token: string) => ({ cookies: { get: () => ({ value: token }) } }) as unknown as NextRequest;

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('APP_SESSION_SECRET', 'test-only-secret'.repeat(4));
  vi.stubEnv('ADMIN_EMAILS', 'owner@example.invalid');
  fixture.getUser.mockResolvedValue({ email: 'owner@example.invalid', role: 'admin', is_active: true });
});

it('revokes the copied current token on logout without revoking another session', async () => {
  const current = createSessionToken('owner@example.invalid');
  const other = createSessionToken('owner@example.invalid');
  fixture.token = current;
  let revoked = '';
  fixture.query.mockImplementation(async (sql: string, values: string[]) => {
    if (sql.startsWith('DELETE')) { revoked = values[0]; return { rows: [] }; }
    return { rows: values[0] === revoked ? [] : [{ email: 'owner@example.invalid', role: 'admin' }] };
  });
  expect(await readSessionUserFromRequest(request(current))).not.toBeNull();
  await clearSessionCookie();
  expect(await readSessionUserFromRequest(request(current))).toBeNull();
  expect(await readSessionUserFromRequest(request(other))).not.toBeNull();
  expect(fixture.set).toHaveBeenCalled();
});

it('does not publish a cookie when credential-version checked registration fails', async () => {
  fixture.query.mockResolvedValue({ rows: [] });
  await expect(setSessionCookie('owner@example.invalid', 'admin', 0, 'verified-uuid')).rejects.toThrow();
  expect(fixture.set).not.toHaveBeenCalled();
});

it('does not acknowledge logout or authorize when persistence is unavailable', async () => {
  fixture.token = createSessionToken('owner@example.invalid');
  fixture.query.mockRejectedValue(new Error('fixture persistence outage'));
  await expect(clearSessionCookie()).rejects.toThrow('fixture persistence outage');
  expect(fixture.set).not.toHaveBeenCalled();
  await expect(readSessionUserFromRequest(request(fixture.token))).rejects.toThrow('fixture persistence outage');
});

it('rejects a legacy signed token without a server-side session record', async () => {
  fixture.query.mockResolvedValue({ rows: [] });
  expect(await readSessionUserFromRequest(request(createSessionToken('owner@example.invalid')))).toBeNull();
});
