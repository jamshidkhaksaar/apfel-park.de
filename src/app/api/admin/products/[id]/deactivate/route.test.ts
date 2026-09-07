import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
const mocks = vi.hoisted(() => ({ query: vi.fn(), canManage: vi.fn(), csrf: vi.fn() }));
vi.mock('@/lib/admin-auth', () => ({ canManageProducts: mocks.canManage }));
vi.mock('@/lib/admin-auth-server', () => ({ createAdminServerClient: async () => ({ auth: { getUser: async () => ({ data: { user: {} } }) } }) }));
vi.mock('@/lib/admin-csrf', () => ({ rejectCrossSiteAdminMutation: mocks.csrf }));
vi.mock('@/lib/db', () => ({ withTransaction: async (fn: (db: { query: typeof mocks.query }) => unknown) => fn({ query: mocks.query }) }));
import { POST } from './route';
const id = '00000000-0000-4000-8000-000000000001';
const run = (productId = id) => POST(new NextRequest('https://apfel-park.de/api/admin/products/' + productId + '/deactivate', { method: 'POST' }), { params: Promise.resolve({ id: productId }) });
beforeEach(() => { vi.resetAllMocks(); mocks.canManage.mockReturnValue(true); mocks.csrf.mockReturnValue(null); });
describe('product deactivation', () => {
  it('rejects unauthorized users without writes', async () => { mocks.canManage.mockReturnValue(false); expect((await run()).status).toBe(401); expect(mocks.query).not.toHaveBeenCalled(); });
  it('rejects cross-site writes', async () => { mocks.csrf.mockReturnValue(NextResponse.json({}, { status: 403 })); expect((await run()).status).toBe(403); expect(mocks.query).not.toHaveBeenCalled(); });
  it('rejects malformed IDs', async () => { expect((await run('bad')).status).toBe(400); expect(mocks.query).not.toHaveBeenCalled(); });
  it('reports missing products', async () => { mocks.query.mockResolvedValue({ rows: [] }); expect((await run()).status).toBe(404); expect(mocks.query).toHaveBeenCalledTimes(1); });
  it('deactivates without overwriting stock or other catalog fields and invalidates pending intake', async () => {
    mocks.query.mockResolvedValue({ rows: [{ id }] });
    expect((await run()).status).toBe(200);
    expect(mocks.query.mock.calls[0]).toEqual(['UPDATE products SET is_active = false, updated_at = now() WHERE id = $1 RETURNING id', [id]]);
    expect(mocks.query.mock.calls[1][0]).toContain("dispatch_status = 'stale'");
  });
});
