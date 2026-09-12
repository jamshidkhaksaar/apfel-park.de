import { afterEach, describe, expect, it, vi } from 'vitest';
import { approvedResearchUrl, fetchOfficialResearchSource, officialPageText, sourceMatchesModel, germanManufacturerUrl } from '../product-research-sources';
import { finalizeResearchedProduct, retainZoomQualifier } from '../product-research-policy';
import { eprelResearchFields, selectExactEprelMatch } from '../product-research-eprel';
import { selectLicensedResearchAssets } from '../product-research-assets';
import { researchOfferPatch, mergeResearchGallery } from '../product-research-prefill';
import { sanitizeResearchResult } from '../product-research-core';
import { knownResearchModelConflict, researchProductFromOfficialPages } from '../product-research-service';

const source = { url: 'https://www.apple.com/de/iphone-17-pro/specs/', title: 'Apple technical specifications', retrievedAt: '2026-09-08T12:00:00Z', text: 'Apple iPhone 17 Pro Max. '.repeat(20) };
const raw = () => ({ title: 'Apple iPhone 17 Pro Max', description: 'Das iPhone bietet ein Display und eine Kamera für den Alltag.', brand: 'Apple', model: 'iPhone 17 Pro Max', category: 'smartphones' });

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('official research evidence gates', () => {
  it('retains an optical-quality qualification backed by the source', () => {
    const optics = { ...source, text: '8x Tele-Zoom in optischer Qualität. 4x optischer Zoom.' };
    expect(retainZoomQualifier('Mit bis zu 8x optischem Zoom.', [optics])).toBe('Mit bis zu 8x Zoom in optischer Qualität.');
    expect(retainZoomQualifier('4x optischer Zoom.', [optics])).toBe('4x optischer Zoom.');
    expect(retainZoomQualifier('4x optischer Zoom.', [{ ...optics, text: '4x optischer Zoom und 8x Tele in optischer Qualität' }])).toBe('4x optischer Zoom.');
  });
  it('uses German Apple routes without guessing other manufacturers regional SKU URLs', () => {
    expect(germanManufacturerUrl('https://www.apple.com/iphone-17-pro/specs/')).toBe(source.url);
    expect(germanManufacturerUrl('https://support.apple.com/en-us/125135')).toBe('https://support.apple.com/de-de/125135');
    expect(germanManufacturerUrl('https://www.samsung.com/us/model-us/')).toBe('https://www.samsung.com/us/model-us/');
  });
  it.each(['37 Std.', '37 h', '37 hrs', '233 g'])('withholds abbreviated regional claims (%s) without removing ordinary display/charging specs', value => {
    const draft = finalizeResearchedProduct({ ...raw(), subtitle: `Modell mit ${value}`, title: `iPhone 17 Pro Max ${value}`, specs: [{ label: 'Batterielaufzeit', value }, { label: 'Leistung', value }, { label: 'Display', value: '120 Hz' }, { label: 'Laden', value: '25 W' }], features: [`Bis zu ${value}`] }, [source], {});
    expect(draft.specs).toEqual([{ label: 'Display', value: '120 Hz' }, { label: 'Laden', value: '25 W' }]);
    expect(draft.subtitle).toBeUndefined();
    expect(draft.title).not.toContain(value);
    expect(draft.features).toEqual([]);
  });
  it('retains regional claims when the supplied hardware model has explicit cited evidence', () => {
    const proven = { ...source, text: source.text + ' Hardware A3525: 37 Std. Videowiedergabe.' };
    const draft = finalizeResearchedProduct({ ...raw(), specs: [{ label: 'Batterielaufzeit', value: '37 Std.' }], evidence: [{ field: 'regionalSpecifications', sourceUrl: proven.url }] }, [proven], { hardwareModel: 'A3525' });
    expect(draft.specs).toEqual([{ label: 'Batterielaufzeit', value: '37 Std.' }]);
  });
  it('normalizes category values and withholds region-dependent claims without hardware evidence', () => {
    const draft = finalizeResearchedProduct({ ...raw(), category: 'Smartphones', description: 'Das iPhone hat ein OLED-Display. Es bietet bis zu 39 Stunden Videowiedergabe.', specs: [{ label: 'SIM-Karte', value: 'Dual eSIM' }, { label: 'Display', value: 'OLED' }], dimensions: { heightMm: 163.4, weightG: 233 } }, [source], {});
    expect(draft.category).toBe('smartphones');
    expect(draft.description).not.toContain('39');
    expect(draft.specs).toEqual([{ label: 'Display', value: 'OLED' }]);
    expect(draft.dimensions?.weightG).toBeUndefined();
  });
  it('accepts official HTTPS sources and rejects credentials, lookalikes, nonstandard ports and forums', () => {
    expect(approvedResearchUrl(source.url)?.hostname).toBe('www.apple.com');
    for (const url of ['http://apple.com/specs','https://apple.com.evil.example/specs','https://secret@apple.com/specs','https://apple.com:8443/specs','https://127.0.0.1/specs','https://docs.google.com/file','https://support.google.com/pixelphone/thread/123']) expect(approvedResearchUrl(url)).toBeNull();
  });
  it('does not follow a manufacturer redirect to an unapproved destination', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/private' } }));
    expect(await fetchOfficialResearchSource(source.url, 'iPhone 17 Pro Max', fetcher)).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('requires model evidence in retrieved main content, not an unrelated navigation link', async () => {
    const html = '<nav>iPhone 17 Pro Max</nav><main><h1>iPhone 12</h1>' + 'Old product information. '.repeat(20) + '</main>';
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(html, { headers: { 'content-type': 'text/html' } }));
    expect(await fetchOfficialResearchSource(source.url, 'iPhone 17 Pro Max', fetcher)).toBeNull();
  });
  it('reads public Product JSON-LD without executing page scripts or importing prices/reviews', () => {
    const html = '<main>Technical details</main><script>secretInstruction()</script><script type="application/ld+json">' + JSON.stringify({ '@type': 'Product', name: 'iPhone 17 Pro Max', description: 'Model facts', offers: { price: 1 }, review: { author: 'Do not import' } }) + '</script>';
    const text = officialPageText(html);
    expect(text).toContain('iPhone 17 Pro Max');
    expect(text).not.toContain('secretInstruction');
    expect(text).not.toContain('Do not import');
    expect(text).not.toContain('price');
    expect(sourceMatchesModel(text, 'iPhone 17 Pro Max')).toBe(true);
  });
  it('returns a source only after an actual successful bounded fetch', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(`<title>Specs</title><main>${source.text}</main>`, { headers: { 'content-type': 'text/html' } }));
    const fetched = await fetchOfficialResearchSource(source.url, 'iPhone 17 Pro Max', fetcher);
    expect(fetched?.url).toBe(source.url);
    expect(fetched?.text).toContain('iPhone 17 Pro Max');
    expect(fetched?.retrievedAt).toBeTruthy();
  });
  it('rejects oversized or non-text source bodies', async () => {
    const cases: Array<Record<string, string>> = [{ 'content-type': 'text/html', 'content-length': '2000001' }, { 'content-type': 'application/pdf' }];
    for (const headers of cases) {
      const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('not evidence', { headers }));
      expect(await fetchOfficialResearchSource(source.url, 'iPhone 17 Pro Max', fetcher)).toBeNull();
    }
  });
  it('removes generated identifiers, stock variants, images, EPREL and shop inspection claims', () => {
    const draft = finalizeResearchedProduct({ ...raw(), gtin: '4006381333931', mpn: 'GUESSED', sku: 'GUESSED', eprelId: '123', energyLabel: { efficiencyClass: 'A', batteryCycles: 1000 }, gallery: ['https://example.com/unlicensed.webp'], variants: [{ color: 'Blau', storage: '256 GB' }], countryOfOrigin: 'CN', refurbishmentSteps: [{ title: 'Certified', description: 'Inspected by shop' }] }, [source], { condition: 'new' });
    expect(draft.gtinSuggestion).toBeNull(); expect(draft.mpnSuggestion).toBeNull();
    expect(draft.variants).toBeUndefined(); expect(draft.variantSuggestions).toEqual([{ color: 'Blau', storage: '256 GB' }]);
    expect(draft.gallery).toEqual([]); expect(draft.eprelId).toBeNull(); expect(draft.energyLabel).toBeUndefined();
    expect(draft.countryOfOrigin).toBeUndefined(); expect(draft.refurbishmentSteps).toBeUndefined();
  });
  it('exposes a decoded retail barcode only as a manual suggestion', () => {
    const draft = finalizeResearchedProduct(raw(), [source], { hints: { gtinCandidates: [{ value: '4006381333931', checksumValid: true, extractionMethod: 'barcode', autoAccept: true }], manufacturerPartNumber: 'MTEST1/A' } });
    expect(draft.gtinSuggestion).toBe('4006381333931');
    expect(draft.mpnSuggestion).toBe('MTEST1/A');
    expect((draft as Record<string, unknown>).gtin).toBeUndefined();
  });
  it('does not fill legal parties from a generic sales/privacy address', () => {
    const party = { name: 'Apple Test', address: 'A public address', email: 'test@example.invalid' };
    const draft = finalizeResearchedProduct({ ...raw(), manufacturer: party, euResponsiblePerson: party, evidence: [{ field: 'manufacturer', sourceUrl: source.url }] }, [{ ...source, text: source.text + 'Privacy controller Apple Test A public address test@example.invalid' }], { condition: 'new' });
    expect(draft.manufacturer).toBeUndefined(); expect(draft.euResponsiblePerson).toBeUndefined();
  });
  it('requires a source and German factual output, while harmless German words remain allowed', () => {
    expect(() => finalizeResearchedProduct(raw(), [], {})).toThrow('official_sources_unavailable');
    expect(() => finalizeResearchedProduct({ ...raw(), description: 'The phone is a great device.' }, [source], {})).toThrow('research_not_german');
    expect(() => finalizeResearchedProduct({ ...raw(), description: 'Das hypothetical future device ist nicht verfügbar.' }, [source], {})).toThrow('research_unverified_model');
    expect(sanitizeResearchResult({ description: 'Beide Anschlüsse sind verfügbar. Feuchtigkeit vermeiden.' }).description).toBeTruthy();
  });
  it('keeps explicit phone-model conflicts out of the draft', () => {
    expect(knownResearchModelConflict('iPhone 17 Pro Max', 'iPhone 17 Pro')).toBe(true);
    expect(knownResearchModelConflict('Galaxy S23 FE', 'Galaxy S23 Ultra')).toBe(true);
    expect(knownResearchModelConflict('iPhone 17 Air', 'iPhone Air')).toBe(false);
  });
});

describe('EPREL and offer boundaries', () => {
  const row = { registration_number: '123', supplier: 'Apple Distribution International', model_identifier: 'A3090', energy_class: null, battery_endurance_cycles: null };
  it('does not use partial model or brand-only matches and blocks ambiguity', () => {
    expect(selectExactEprelMatch([row], { brand: 'Apple', model: 'iPhone 15 Pro' })).toBeNull();
    expect(selectExactEprelMatch([row], { brand: 'Apple', model: '', hardwareModel: 'A309' })).toBeNull();
    expect(selectExactEprelMatch([row], { brand: 'Samsung', model: '', hardwareModel: 'A3090' })).toBeNull();
    expect(selectExactEprelMatch([row, { ...row, registration_number: '456' }], { brand: 'Apple', model: '', hardwareModel: 'A3090' })).toBeNull();
    expect(selectExactEprelMatch([row], { brand: 'Apple', model: '', hardwareModel: 'A3090' })?.registration_number).toBe('123');
  });
  it('never defaults to energy A or 1000 cycles, and preserves the register units', () => {
    expect(eprelResearchFields(row).energyLabel?.efficiencyClass).toBeUndefined();
    expect(eprelResearchFields(row).energyLabel?.batteryCycles).toBeUndefined();
    expect(eprelResearchFields({ ...row, energy_class: 'B', battery_endurance_cycles: 10 }).energyLabel).toMatchObject({ efficiencyClass: 'B', batteryCycles: 1000 });
  });
  it('accepts only operator-licensed assets for an exact sealed model and requested colour', () => {
    const asset = { brand: 'Apple', model: 'iPhone 17 Pro Max', color: 'Tiefblau', localUrl: '/uploads/products/licensed.webp', sha256: 'a'.repeat(64), sourceUrl: source.url, licenseReference: 'operator-record', rightsStatus: 'licensed' };
    const input = { brand: 'Apple', model: 'iPhone 17 Pro Max', color: 'Tiefblau', condition: 'new' };
    expect(selectLicensedResearchAssets([asset], input)).toHaveLength(1);
    for (const changed of [{ condition: 'used' }, { condition: 'open_box' }, { color: 'Silber' }, { model: 'iPhone 17 Pro' }]) expect(selectLicensedResearchAssets([asset], { ...input, ...changed })).toEqual([]);
    expect(selectLicensedResearchAssets([{ ...asset, licenseReference: '' }], input)).toEqual([]);
    expect(selectLicensedResearchAssets([{ ...asset, localUrl: '/uploads/products/../private.webp' }], input)).toEqual([]);
  });
  it('never overwrites identifiers, SKU, quantity, active state or existing variants from research', () => {
    const current = { sku: 'OWN-SKU', gtin: 'manual', mpn: 'manual-mpn', stock: 2, price: 10, isActive: false, variants: [{ color: 'White', sku: 'VARIANT', stock: 1 }] };
    const next = { ...current, ...researchOfferPatch(current, { skuSuggestion: 'NEW', gtinSuggestion: 'guess', mpnSuggestion: 'guess', variants: [{ color: 'Blue', storage: '512 GB' }] }) };
    expect(next).toEqual(current);
    expect(next.variants).toBe(current.variants);
    expect(researchOfferPatch({ sku: '', variants: [] }, { skuSuggestion: 'AP-NEW' }).sku).toBe('AP-NEW');
  });
  it('keeps the original cover and variant indices ahead of licensed extra images', () => {
    expect(mergeResearchGallery(['cover','variant-photo'], ['licensed','cover'], 'new')).toEqual(['cover','variant-photo','licensed']);
    expect(mergeResearchGallery(['cover'], ['licensed'], 'used')).toEqual(['cover']);
  });
});

describe('fresh source generation pipeline', () => {
  it('discards ungrounded discovery facts and generates only after fetching an official page', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'synthetic-test-key');
    const requests: Array<{ url: string; body?: string }> = [];
    let generations = 0;
    vi.stubGlobal('fetch', vi.fn(async (url: string, options?: RequestInit) => {
      requests.push({ url: String(url), body: typeof options?.body === 'string' ? options.body : undefined });
      if (String(url).startsWith('https://generativelanguage.googleapis.com/')) {
        generations += 1;
        const value = generations === 1 ? { brand: 'Apple', model: 'iPhone 17 Pro Max', urls: [source.url], description: 'Discard invented discovery facts' } : raw();
        return Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(value) }] } }] });
      }
      return new Response(`<main>${source.text}</main>`, { headers: { 'content-type': 'text/html' } });
    }));
    const result = await researchProductFromOfficialPages({ query: 'iPhone 17 Pro Max', condition: 'new' });
    expect(generations).toBe(2);
    expect(requests[1].url).toBe(source.url);
    expect(requests[2].body).toContain('sourcePages');
    expect(requests[2].body).not.toContain('Discard invented discovery facts');
    expect(JSON.parse(requests[2].body!).tools).toBeUndefined();
    expect(result.description).toBe(raw().description);
    expect(result.researchSources?.[0].url).toBe(source.url);
    expect(requests.every(request => !request.url.includes('synthetic-test-key'))).toBe(true);
  });
  it('fails closed without generating a final draft if official pages cannot be read', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'synthetic-test-key');
    const fetcher = vi.fn(async (url: string) => String(url).includes('generativelanguage.googleapis.com')
      ? Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify({ brand: 'Apple', model: 'iPhone 17 Pro Max', urls: ['https://example.com/specs'] }) }] } }] })
      : new Response('', { status: 404 }));
    vi.stubGlobal('fetch', fetcher);
    await expect(researchProductFromOfficialPages({ query: 'iPhone 17 Pro Max' })).rejects.toThrow('official_sources_unavailable');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
