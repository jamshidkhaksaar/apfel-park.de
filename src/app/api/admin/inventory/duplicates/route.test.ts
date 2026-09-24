import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({ query: vi.fn(), canManage: vi.fn() }));
vi.mock('@/lib/db', () => ({ query: mocks.query }));
vi.mock('@/lib/admin-auth', () => ({ canManageProducts: mocks.canManage }));
vi.mock('@/lib/session', () => ({ readSessionUserFromRequest: async () => ({ role: 'admin' }) }));

import { GET } from './route';

const productId = '11111111-1111-4111-8111-111111111111';
const run = (id = productId) => GET(new NextRequest(`https://apfel-park.de/api/admin/inventory/duplicates?productId=${id}`));

beforeEach(() => {
  vi.resetAllMocks();
  mocks.canManage.mockReturnValue(true);
  mocks.query.mockResolvedValue({ rows: [
    { id: 'a', title: 'Active version', sku: 'A', stock: 2, is_active: true, catalog_enabled: true, images: [], reason: 'model' },
    { id: 'b', title: 'Draft version', sku: 'B', stock: 0, is_active: false, catalog_enabled: true, images: [], reason: 'title' },
  ] });
});

it('includes both active and inactive matches', async () => {
  const response = await run();
  expect(response.status).toBe(200);
  const payload = await response.json();
  expect(payload.items.map((item: { active: boolean }) => item.active)).toEqual([true, false]);
  expect(mocks.query.mock.calls[0][0]).not.toMatch(/candidate\.is_active\s*=/);
  expect(mocks.query.mock.calls[0][1]).toEqual([productId]);
});

it('rejects unauthorized and invalid requests before reading products', async () => {
  mocks.canManage.mockReturnValue(false);
  expect((await run()).status).toBe(401);
  expect(mocks.query).not.toHaveBeenCalled();
  mocks.canManage.mockReturnValue(true);
  expect((await run('bad-id')).status).toBe(400);
  expect(mocks.query).not.toHaveBeenCalled();
});
