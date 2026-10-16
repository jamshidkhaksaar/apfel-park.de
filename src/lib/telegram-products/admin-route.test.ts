import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const auth = vi.hoisted(() => ({
  user: null as null | {
    id: string;
    email: string;
    app_metadata: { role: string };
  },
  verify: vi.fn(),
  query: vi.fn(),
  saveKey: vi.fn(),
  status: vi.fn(),
}));
vi.mock('@/lib/session', () => ({
  readSessionUserFromRequest: async () => auth.user,
}));
vi.mock('@/lib/users', () => ({ verifyUserCredentials: auth.verify }));
vi.mock('@/lib/public-rate-limit', () => ({
  consumePublicRateLimit: async () => ({ allowed: true }),
}));
vi.mock('@/lib/db', () => ({ query: auth.query, withTransaction: vi.fn() }));
vi.mock('@/lib/ai-provider-credentials', () => ({
  aiCredentialStatus: auth.status,
  saveAiCredential: auth.saveKey,
}));
const { GET, POST } = await import('@/app/api/admin/telegram-products/route');
const request = (
  body: Record<string, unknown>,
  origin = 'https://apfel-park.de',
) =>
  new NextRequest('https://apfel-park.de/api/admin/telegram-products', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
beforeEach(() => {
  vi.clearAllMocks();
  auth.user = null;
  vi.stubEnv('TELEGRAM_PRODUCTS_ENABLED', 'true');
  vi.stubEnv('PRODUCT_INTAKE_OWNER_EMAILS', 'owner@example.invalid');
  auth.verify.mockResolvedValue({ valid: true });
});
afterEach(() => vi.unstubAllEnvs());
describe('Telegram member and provider settings authorization', () => {
  it('does not expose members or key metadata to anonymous users or another administrator', async () => {
    const get = () =>
      GET(new NextRequest('https://apfel-park.de/api/admin/telegram-products'));
    expect((await get()).status).toBe(403);
    auth.user = {
      id: 'other',
      email: 'other@example.invalid',
      app_metadata: { role: 'admin' },
    };
    expect((await get()).status).toBe(403);
    expect(auth.query).not.toHaveBeenCalled();
    expect(auth.status).not.toHaveBeenCalled();
  });
  it('rejects cross-site settings mutations before checking passwords or calling Gemini', async () => {
    auth.user = {
      id: 'owner',
      email: 'owner@example.invalid',
      app_metadata: { role: 'admin' },
    };
    expect(
      (
        await POST(
          request(
            {
              action: 'save_key',
              slot: 'primary',
              key: 'synthetic-provider-key',
              password: 'secret',
              label: 'Primary',
            },
            'https://evil.invalid',
          ),
        )
      ).status,
    ).toBe(403);
    expect(auth.verify).not.toHaveBeenCalled();
    expect(auth.saveKey).not.toHaveBeenCalled();
  });
  it('requires password confirmation even for an authenticated owner', async () => {
    auth.user = {
      id: 'owner',
      email: 'owner@example.invalid',
      app_metadata: { role: 'admin' },
    };
    auth.verify.mockResolvedValue({ valid: false });
    const response = await POST(
      request({
        action: 'save_key',
        slot: 'primary',
        key: 'synthetic-provider-key',
        label: 'Primary',
      }),
    );
    expect(await response.json()).toEqual({ error: 'reauthentication_failed' });
    expect(auth.saveKey).not.toHaveBeenCalled();
  });
  it('accepts a confirmed owner key replacement without echoing credentials', async () => {
    auth.user = {
      id: 'owner',
      email: 'owner@example.invalid',
      app_metadata: { role: 'admin' },
    };
    auth.saveKey.mockResolvedValue(undefined);
    const response = await POST(
      request({
        action: 'save_key',
        slot: 'backup',
        key: 'synthetic-provider-key',
        password: 'synthetic-password',
        label: 'Backup',
      }),
    );
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('{"success":true}');
    expect(auth.saveKey).toHaveBeenCalledWith(
      'backup',
      'synthetic-provider-key',
      'Backup',
      'owner',
    );
    expect(response.headers.get('Cache-Control')).toContain('no-store');
  });
});
