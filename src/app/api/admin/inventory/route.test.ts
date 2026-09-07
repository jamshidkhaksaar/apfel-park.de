import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({ query: vi.fn(), canManage: vi.fn() }));
vi.mock('@/lib/db', () => ({ query: mocks.query }));
vi.mock('@/lib/admin-auth', () => ({ canManageProducts: mocks.canManage }));
vi.mock('@/lib/session', () => ({ readSessionUserFromRequest: async () => ({ role: 'admin' }) }));
import { GET } from './route';
const run = (params = '') => GET(new NextRequest(`https://apfel-park.de/api/admin/inventory?${params}`));
beforeEach(() => {
  vi.resetAllMocks(); mocks.canManage.mockReturnValue(true);
  mocks.query.mockImplementation(async (sql: string) => {
    if (sql.startsWith('SELECT count(*)')) return { rows: [{ total: 75 }] };
    if (sql.includes('product.id AS product_id')) return { rows: [{ sku: 'TEST', product_id: '1', title: 'Test phone', images: ['', '/uploads/phone.jpg'], updated_at: '2026-09-07', on_hand: 0, reserved: 0, safety_buffer: 0, available: 0, version: 0 }] };
    if (sql.includes('array_agg')) return { rows: [{ brands: ['Apple'], categories: ['smartphones'], conditions: ['used'] }] };
    return { rows: [] };
  });
});
it('rejects unauthorized requests without reading inventory', async () => {
  mocks.canManage.mockReturnValue(false); expect((await run()).status).toBe(401); expect(mocks.query).not.toHaveBeenCalled();
});
it('applies combined filters to count and rows before paging and includes images and options', async () => {
  const response = await run('q=phone&status=inventory&brand=Apple&category=smartphones&condition=used&stock=out&page=2');
  expect(response.status).toBe(200);
  const payload = await response.json();
  expect(payload.pagination).toEqual({ page: 2, pages: 2, total: 75, limit: 50 });
  expect(payload.items[0].image).toBe('/uploads/phone.jpg');
  expect(payload.filterOptions.brands).toEqual(['Apple']);
  const args = ['phone', '%phone%', 'inventory', 'Apple', 'smartphones', 'used', 'out'];
  expect(mocks.query.mock.calls[0][1]).toEqual(args);
  expect(mocks.query.mock.calls[1][1]).toEqual([...args, 50, 50]);
});
it('binds special characters as values and safely defaults invalid enum filters', async () => {
  await run('brand=' + encodeURIComponent("O'Reilly") + '&status=invalid&stock=invalid&page=999');
  expect(mocks.query.mock.calls[0][1]).toEqual(['', '%%', 'all', "O'Reilly", '', '', 'all']);
  expect(mocks.query.mock.calls[0][0]).not.toContain("O'Reilly");
  expect(mocks.query.mock.calls[1][1].slice(-2)).toEqual([50, 50]);
});
