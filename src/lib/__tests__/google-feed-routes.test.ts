import { beforeEach, describe, expect, it, vi } from 'vitest';

const builders = vi.hoisted(() => ({ online: vi.fn(), local: vi.fn() }));
vi.mock('@/lib/google-merchant', () => ({ buildGoogleMerchantFeed: builders.online }));
vi.mock('@/lib/google-local-inventory', () => ({ buildGoogleLocalInventoryFeed: builders.local }));
import { GET as onlineGET } from '@/app/google-merchant.xml/route';
import { GET as localGET } from '@/app/google-local-inventory.txt/route';

describe('Google feed failure responses', () => {
  beforeEach(() => vi.clearAllMocks());
  it.each(['online', 'local'] as const)('returns non-cacheable 503 for a failed %s feed', async (kind) => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    builders[kind].mockRejectedValueOnce(new Error('all selected products failed readiness'));
    const response = await (kind === 'online' ? onlineGET : localGET)();
    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('retry-after')).toBe('300');
    expect(await response.text()).not.toContain('all selected products');
    log.mockRestore();
  });
  it.each(['online', 'local'] as const)('returns the generated %s feed with a short cache', async (kind) => {
    builders[kind].mockResolvedValueOnce('valid feed');
    const response = await (kind === 'online' ? onlineGET : localGET)();
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('max-age=60');
    expect(await response.text()).toBe('valid feed');
  });
});
