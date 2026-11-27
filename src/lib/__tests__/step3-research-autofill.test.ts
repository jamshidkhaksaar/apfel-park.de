import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { deflateRawSync } from 'node:zlib';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveKnownEuHardwareModel } from '../eprel-catalog';
import { extractZipMember, mirrorEprelRegistrationAssets } from '../eprel-storage';
import { applyVerifiedEuComplianceFallback } from '../eu-compliance-registry';
import { buildAutoProductExperience } from '../product-experience-autofill';
import { extractOfficialImageUrlsFromHtml } from '../product-research-sources';
import { newConversation, renderConversation, transition } from '../telegram-products/model';

const buildStoredZip = (entries: Array<{ name: string; data: Buffer }>): Buffer => {
  const localChunks: Buffer[] = [];
  const cdChunks: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, 'utf8');
    const compressed = deflateRawSync(entry.data);
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(8, 8); // deflate
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(entry.data.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);

    localChunks.push(localHeader, nameBuf, compressed);

    const cdHeader = Buffer.alloc(46);
    cdHeader.writeUInt32LE(0x02014b50, 0);
    cdHeader.writeUInt16LE(20, 4);
    cdHeader.writeUInt16LE(20, 6);
    cdHeader.writeUInt16LE(8, 10);
    cdHeader.writeUInt32LE(compressed.length, 20);
    cdHeader.writeUInt32LE(entry.data.length, 24);
    cdHeader.writeUInt16LE(nameBuf.length, 28);
    cdHeader.writeUInt32LE(offset, 42);

    cdChunks.push(cdHeader, nameBuf);
    offset += localHeader.length + nameBuf.length + compressed.length;
  }

  const cdBuf = Buffer.concat(cdChunks);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(cdBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);

  return Buffer.concat([...localChunks, cdBuf, eocd]);
};

let tempDir: string | null = null;
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  if (tempDir) {
    rmSync(tempDir, { recursive: true, force: true });
    tempDir = null;
  }
});

describe('Step 3 research, EPREL mirroring, photos & experience autofill', () => {
  it('resolves exact EU hardware models and avoids inheriting across variants', () => {
    expect(resolveKnownEuHardwareModel('Apple', 'iPhone 16')).toBe('A3287');
    expect(resolveKnownEuHardwareModel('Apple', 'iPhone 16 Pro Max')).toBe('A3296');
    expect(resolveKnownEuHardwareModel('Apple', 'iPhone 15 Pro')).toBeNull();
    expect(resolveKnownEuHardwareModel('Samsung', 'Galaxy S25 Ultra')).toBe('SM-S938B');
    expect(resolveKnownEuHardwareModel('Samsung', 'Galaxy S25')).toBe('SM-S931B');
  });

  it('extracts ZIP members and mirrors missing EPREL labels & fiches to disk', async () => {
    tempDir = mkdtempSync(path.join(tmpdir(), 'eprel-test-'));
    vi.stubEnv('EPREL_ASSETS_DIR', tempDir);
    const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from('test-png')]);
    const pdfDe = Buffer.from('%PDF-1.4 DE');
    const pdfEn = Buffer.from('%PDF-1.4 EN');

    const labelsZip = buildStoredZip([{ name: 'Label_9999001.png', data: png }]);
    const fichesZip = buildStoredZip([
      { name: 'Fiche_9999001_DE.pdf', data: pdfDe },
      { name: 'Fiche_9999001_EN.pdf', data: pdfEn },
    ]);

    expect(extractZipMember(labelsZip, 'Label_9999001.png')?.equals(png)).toBe(true);

    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.endsWith('/labels')) return new Response(new Uint8Array(labelsZip), { status: 200 });
      if (url.endsWith('/fiches')) return new Response(new Uint8Array(fichesZip), { status: 200 });
      return new Response(null, { status: 404 });
    }));

    const routes = await mirrorEprelRegistrationAssets('9999001');
    expect(routes).toEqual({
      labelImage: '/energy-labels/Label_9999001.png',
      ficheDe: '/energy-labels/Fiche_9999001_DE.pdf',
      ficheEn: '/energy-labels/Fiche_9999001_EN.pdf',
    });
    expect(existsSync(path.join(tempDir, 'Label_9999001.png'))).toBe(true);
    expect(readFileSync(path.join(tempDir, 'Fiche_9999001_DE.pdf')).toString()).toBe('%PDF-1.4 DE');
  });

  it('fills verified EU compliance, USB-PD charging tags, and battery details when omitted', () => {
    const out = applyVerifiedEuComplianceFallback(
      {
        brand: 'Apple',
        model: 'iPhone 16',
        category: 'smartphones',
        specs: [
          { label: 'Laden', value: 'USB-C Power Delivery bis zu 25 W' },
          { label: 'Batterie', value: 'Li-Ion 13,8 Wh' },
        ],
        researchSources: [{ url: 'https://www.apple.com/de/iphone-16/specs/', title: 'Apple', retrievedAt: '2026-11-27' }],
      },
      { condition: 'new' },
    );
    expect(out.manufacturer?.name).toBe('Apple Inc.');
    expect(out.euResponsiblePerson?.name).toContain('Apple Distribution International');
    expect(out.chargerIncluded).toBe(false);
    expect(out.usbPdSupported).toBe(true);
    expect(out.chargingPowerMaxW).toBe(25);
    expect(out.chargingPowerMinW).toBe(5);
    expect(out.batteryDetails?.wattHours).toBe(13.8);
  });

  it('auto-builds & enables localized product experience sections without clobbering existing fields', () => {
    const profile = buildAutoProductExperience({
      category: 'smartphones',
      brand: 'Samsung',
      model: 'Galaxy S25',
      condition: 'open_box',
      specs: [
        { label: 'Abmessungen', value: '146,9 x 70,5 x 7,2 mm' },
        { label: 'Gewicht', value: '162 g' },
        { label: 'Display', value: '6,2 Zoll AMOLED' },
      ],
      chargerIncluded: false,
      chargingPowerMaxW: 25,
      usbPdSupported: true,
      comparisonProductIds: ['11111111-1111-4111-8111-111111111111'],
    });

    expect(profile.dimensions).toMatchObject({ heightMm: 146.9, widthMm: 70.5, depthMm: 7.2, weightG: 162, screenInches: 6.2 });
    expect(profile.enabledSections.sizeComparison).toBe(true);
    expect(profile.enabledSections.packageContents).toBe(true);
    expect(profile.enabledSections.conditionGuide).toBe(true);
    expect(profile.enabledSections.refurbishment).toBe(true);
    expect(profile.enabledSections.modelComparison).toBe(true);
    expect(profile.trustPoints.length).toBeGreaterThanOrEqual(3);
  });

  it('extracts official CDN gallery URLs from HTML and ignores favicons/beacons', () => {
    const html = `
      <meta property="og:image" content="https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-16-ultramarine?wid=1200">
      <img src="/beacon.png">
      <img src="https://evil.example/track.jpg">
      <img src="https://www.apple.com/v/iphone-16/h/images/specs/camera.jpg">
    `;
    const urls = extractOfficialImageUrlsFromHtml(html, 'https://www.apple.com/de/iphone-16/');
    expect(urls).toContain('https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-16-ultramarine?wid=1200');
    expect(urls).toContain('https://www.apple.com/v/iphone-16/h/images/specs/camera.jpg');
    expect(urls.some(u => u.includes('beacon.png') || u.includes('evil.example'))).toBe(false);
  });

  it('offers one-tap official photos acceptance in Telegram guided flow for sealed new products', () => {
    let { state, document } = newConversation('de');
    document.shared.brand = 'Apple';
    document.shared.model = 'iPhone 16';
    document.researchGallery = [
      '/uploads/products/a1.webp',
      '/uploads/products/a2.webp',
      '/uploads/products/a3.webp',
      '/uploads/products/a4.webp',
    ];
    state.stage = 'photos';
    state.guided = true;
    state.condition = 'new';
    document.entries[0].condition = 'new';

    const rendered = renderConversation(state, document, 1);
    expect(rendered.buttons.flat().some(btn => btn.action === 'useResearchPhotos')).toBe(true);

    ({ state, document } = transition(state, document, { action: 'useResearchPhotos' }));
    expect(state.stage).toBe('review');
    expect(document.entries[0].photos.map(p => p.url)).toEqual(document.researchGallery);
  });
});
