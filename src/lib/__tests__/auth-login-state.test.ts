import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const f = vi.hoisted(() => ({ verify: vi.fn(), persist: vi.fn(), set: vi.fn() }));
vi.mock('@/lib/users', () => ({ verifyUserCredentials: f.verify }));
vi.mock('@/lib/session', () => ({ ADMIN_SESSION_COOKIE: 'apfel_admin_session', createSessionToken: f.persist,
  createPersistedSessionToken: f.persist, getSessionCookieOptions: () => ({}), setSessionCookie: f.set,
  readSessionUser: vi.fn(), clearSessionCookie: vi.fn() }));
vi.mock('@/lib/admin-csrf', () => ({ rejectCrossSiteAdminMutation: () => null }));
vi.mock('@/lib/login-rate-limit', () => ({ clearLoginFailures: vi.fn(), isLoginBlocked: () => false, recordLoginFailure: vi.fn() }));
vi.mock('@/lib/recaptcha', () => ({ verifyReCaptcha: async () => ({ success: true }) }));
vi.mock('@/lib/db', () => ({ createServerDbClient: (auth: unknown) => auth }));
import { POST } from '../../app/api/admin/login/route';
import { createAdminServerClient } from '../admin-auth-server';

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('ADMIN_EMAILS', 'owner@example.invalid');
  vi.stubEnv('ADMIN_PASSWORD', 'fixture-password');
  f.verify.mockResolvedValue({ valid: false });
  f.persist.mockReturnValue('fixture-token');
});
const login = () => {
  const body = new FormData(); body.set('email', 'owner@example.invalid'); body.set('password', 'fixture-password');
  return POST(new NextRequest('https://example.invalid/api/admin/login', { method: 'POST', body }));
};
it('binds successful HTTP login to the credential security version', async () => {
  f.verify.mockResolvedValue({ valid: true, userId: 'verified-uuid', role: 'manager', securityVersion: 7 });
  const response = await login();
  expect(response.headers.get('location')).toBe('/admin');
  expect(f.persist).toHaveBeenCalledWith('owner@example.invalid', 'manager', 7, 'verified-uuid');
});
it('binds successful adapter login to the credential security version', async () => {
  f.verify.mockResolvedValue({ valid: true, userId: 'verified-uuid', role: 'manager', securityVersion: 7 });
  const auth = await createAdminServerClient() as unknown as { signInWithPassword: (p: {email: string; password: string}) => Promise<{ error: unknown }> };
  await auth.signInWithPassword({ email: 'owner@example.invalid', password: 'fixture-password' });
  expect(f.set).toHaveBeenCalledWith('owner@example.invalid', 'manager', 7, 'verified-uuid');
});
it('configured password cannot bypass a disabled or missing DB account in HTTP login', async () => {
  const response = await login();
  expect(response.headers.get('location')).toBe('/login?error=invalid');
  expect(f.persist).not.toHaveBeenCalled();
});
it('configured password cannot bypass DB credentials in the server auth adapter', async () => {
  const auth = await createAdminServerClient() as unknown as { signInWithPassword: (p: {email: string; password: string}) => Promise<{ error: unknown }> };
  expect((await auth.signInWithPassword({ email: 'owner@example.invalid', password: 'fixture-password' })).error).not.toBeNull();
  expect(f.set).not.toHaveBeenCalled();
});
