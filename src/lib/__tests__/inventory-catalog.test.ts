import { beforeEach, describe, expect, it, vi } from 'vitest';
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock('@/lib/db', () => ({ withTransaction: async (work: (db: { query: typeof query }) => unknown) => work({ query }) }));
import { setInventoryCatalogEnabled } from '../inventory-catalog';
beforeEach(() => vi.resetAllMocks());
describe('inventory to Products workflow', () => {
  it('enables an unpublished product as a draft without publishing or changing stock', async () => {
    query.mockResolvedValueOnce({ rows: [{ catalog_enabled: false, is_active: false }] }).mockResolvedValue({ rows: [] });
    expect(await setInventoryCatalogEnabled('product', true)).toEqual({ catalogEnabled: true, active: false });
    expect(query.mock.calls[1]).toEqual(['UPDATE products SET catalog_enabled = $2, is_active = false, updated_at = now() WHERE id = $1', ['product', true]]);
    expect(query.mock.calls[2][0]).toContain("dispatch_status = 'stale'");
  });
  it('removing a published product also unpublishes it', async () => {
    query.mockResolvedValueOnce({ rows: [{ catalog_enabled: true, is_active: true }] }).mockResolvedValue({ rows: [] });
    expect(await setInventoryCatalogEnabled('product', false)).toEqual({ catalogEnabled: false, active: false });
    expect(query.mock.calls[1][1]).toEqual(['product', false]);
  });
  it('retrying enable on an already published product preserves its published state', async () => {
    query.mockResolvedValue({ rows: [{ catalog_enabled: true, is_active: true }] });
    expect(await setInventoryCatalogEnabled('product', true)).toEqual({ catalogEnabled: true, active: true });
    expect(query).toHaveBeenCalledTimes(1);
  });
  it('returns not found without writes', async () => {
    query.mockResolvedValue({ rows: [] }); expect(await setInventoryCatalogEnabled('missing', true)).toBeNull(); expect(query).toHaveBeenCalledTimes(1);
  });
});
