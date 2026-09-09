import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const state = vi.hoisted(() => ({ allowed: true, prepare: vi.fn(), research: vi.fn(), eprel: vi.fn(), images: vi.fn() }));
vi.mock('../session', () => ({ readSessionUserFromRequest: async () => state.allowed ? { id: 'test-staff' } : null }));
vi.mock('../admin-auth', () => ({ canManageProducts: () => state.allowed }));
vi.mock('../product-research-photo', () => ({ prepareResearchPhoto: state.prepare }));
vi.mock('../product-research-service', () => ({ researchProductFromOfficialPages: state.research }));
vi.mock('../product-research-eprel', () => ({ researchExactEprel: state.eprel }));
vi.mock('../product-research-assets', () => ({ licensedResearchImages: state.images }));
import { POST } from '../../app/api/admin/products/research/route';

const request = (body: unknown, origin = 'https://apfel-park.de') => new NextRequest('https://apfel-park.de/api/admin/products/research', {
  method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify(body),
});
beforeEach(() => {
  vi.stubEnv('LEGACY_PRODUCT_RESEARCH_ENABLED', 'true');
  state.allowed = true;
  Object.values(state).forEach(value => { if (typeof value === 'function' && 'mockReset' in value) value.mockReset(); });
  state.research.mockImplementation(async () => ({ title: 'Apple iPhone', description: 'Das Gerät ist ein Smartphone.', brand: 'Apple', model: 'iPhone', researchSources: [{ url: 'https://www.apple.com/de/', title: 'Apple', retrievedAt: '2026-09-08' }], researchWarnings: [] }));
  state.eprel.mockResolvedValue(null); state.images.mockResolvedValue([]);
});
afterEach(() => vi.unstubAllEnvs());

describe('research route safety boundaries', () => {
  it('rejects unauthenticated and cross-site calls before expensive processing', async () => {
    state.allowed = false;
    expect((await POST(request({ query: 'iPhone' }))).status).toBe(401);
    state.allowed = true;
    expect((await POST(request({ query: 'iPhone' }, 'https://evil.example'))).status).toBe(403);
    expect(state.research).not.toHaveBeenCalled();
  });
  it('preserves the research feature flag', async () => {
    vi.stubEnv('LEGACY_PRODUCT_RESEARCH_ENABLED', 'false');
    expect((await POST(request({ query: 'iPhone' }))).status).toBe(410);
    expect(state.research).not.toHaveBeenCalled();
  });
  it('rejects private identifiers and invalid conditions before research', async () => {
    expect((await POST(request({ query: 'IMEI 000000000000000' }))).status).toBe(400);
    expect((await POST(request({ query: 'iPhone', condition: 'invented' }))).status).toBe(400);
    expect(state.research).not.toHaveBeenCalled();
  });
  it('uses only the checked derivative for photo research', async () => {
    const safe = { mime: 'image/webp', data: 'CHECKED-DERIVATIVE', hints: { modelName: 'iPhone' } };
    state.prepare.mockResolvedValue(safe);
    const form = new FormData(); form.set('query', 'iPhone'); form.set('assetType', 'about_screen'); form.set('photo', new File(['RAW-LOCAL-ONLY'], 'about.png', { type: 'image/png' }));
    const response = await POST(new NextRequest('https://apfel-park.de/api/admin/products/research', { method: 'POST', headers: { Origin: 'https://apfel-park.de' }, body: form }));
    expect(response.status).toBe(200);
    expect(state.prepare).toHaveBeenCalledOnce();
    expect(state.research.mock.calls[0][0].photo).toBe(safe);
    expect(JSON.stringify(state.research.mock.calls)).not.toContain('RAW-LOCAL-ONLY');
  });
  it('does not fall back to raw photos or query-only research when redaction fails', async () => {
    state.prepare.mockRejectedValue(new Error('photo_privacy_failed'));
    const form = new FormData(); form.set('query', 'iPhone'); form.set('photo', new File(['raw'], 'about.png'));
    const response = await POST(new NextRequest('https://apfel-park.de/api/admin/products/research', { method: 'POST', headers: { Origin: 'https://apfel-park.de' }, body: form }));
    expect(response.status).toBe(422); expect(state.research).not.toHaveBeenCalled();
  });
  it('uses staff-supplied hardware for EPREL and preserves manufacturer sources', async () => {
    state.eprel.mockResolvedValue({ eprelId: '123', energyLabel: { efficiencyClass: 'B' }, source: { url: 'https://eprel.ec.europa.eu/123', title: 'EPREL', retrievedAt: '2026-09-08' } });
    const response = await POST(request({ query: 'iPhone', condition: 'new', hardwareModel: 'A3090', eprelId: '123' }));
    const data = await response.json();
    expect(state.eprel.mock.calls[0][0].hardwareModel).toBe('A3090');
    expect(data.research.researchSources).toHaveLength(2);
    expect(data.research.energyLabel.efficiencyClass).toBe('B');
    expect(data.research.skuSuggestion).toMatch(/^AP-[A-F0-9]{16}$/);
  });
  it('reports source failure without returning guessed content', async () => {
    state.research.mockRejectedValue(new Error('official_sources_unavailable'));
    const response = await POST(request({ query: 'unknown product' }));
    const data = await response.json();
    expect(response.status).toBe(503); expect(data.research).toBeUndefined(); expect(data.code).toBe('official_sources_unavailable');
  });
});
