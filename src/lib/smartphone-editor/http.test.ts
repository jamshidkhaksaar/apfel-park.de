import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const user = vi.hoisted(() => ({
  current: null as null | { id: string; app_metadata: { role: string } },
}));
vi.mock('@/lib/admin-auth-server', () => ({
  createAdminServerClient: async () => ({
    auth: { getUser: async () => ({ data: { user: user.current } }) },
  }),
}));
import { phoneHandler } from './http';
describe('smartphone draft authentication and rollout gate', () => {
  beforeEach(() => {
    vi.stubEnv('SMARTPHONE_EDITOR_ENABLED', 'true');
    user.current = null;
  });
  it('hides all draft operations when the feature is disabled', async () => {
    vi.stubEnv('SMARTPHONE_EDITOR_ENABLED', 'false');
    const work = vi.fn();
    expect(
      (
        await phoneHandler(
          new NextRequest('https://apfel-park.de/api/admin/smartphone-drafts'),
          work,
        )
      ).status,
    ).toBe(404);
    expect(work).not.toHaveBeenCalled();
  });
  it('requires a product-management session', async () => {
    const work = vi.fn();
    expect(
      (
        await phoneHandler(
          new NextRequest('https://apfel-park.de/api/admin/smartphone-drafts'),
          work,
        )
      ).status,
    ).toBe(401);
    expect(work).not.toHaveBeenCalled();
  });
  it('rejects cross-site mutations before writing', async () => {
    user.current = { id: 'editor', app_metadata: { role: 'product_editor' } };
    const work = vi.fn();
    const request = new NextRequest(
      'https://apfel-park.de/api/admin/smartphone-drafts',
      {
        method: 'POST',
        headers: {
          origin: 'https://evil.invalid',
          'sec-fetch-site': 'cross-site',
        },
      },
    );
    expect((await phoneHandler(request, work)).status).toBe(403);
    expect(work).not.toHaveBeenCalled();
  });
  it('allows editors to draft without marketplace owner approval', async () => {
    user.current = { id: 'editor', app_metadata: { role: 'product_editor' } };
    const work = vi.fn().mockResolvedValue({ ok: true });
    const request = new NextRequest(
      'https://apfel-park.de/api/admin/smartphone-drafts',
      {
        method: 'POST',
        headers: {
          origin: 'https://apfel-park.de',
          'sec-fetch-site': 'same-origin',
        },
      },
    );
    expect((await phoneHandler(request, work)).status).toBe(200);
    expect(work).toHaveBeenCalledWith('editor', false);
  });
});
