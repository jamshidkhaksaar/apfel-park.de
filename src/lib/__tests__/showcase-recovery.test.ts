import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { showcasePages, showcaseDescription, buildShowcaseSchema, type ShowcaseSlug } from '../showcase-pages';
import { buildDefaultSeoSettings } from '../seo-shared';

describe('showcase preservation and truthful editorial schema', () => {
  it('keeps the registered SEO defaults consistent with corrected editorial copy', () => {
    const settings = buildDefaultSeoSettings();
    for (const id of ['iphone18Pro', 'iphone18ProMax', 'iphoneDuo', 'galaxyZFold8', 'galaxyZFold8Ultra', 'pixel11', 'pixel11ProFold'] as const) {
      for (const locale of ['de', 'en'] as const) {
        const copy = settings.pages[id].locales[locale];
        expect(copy.title).not.toMatch(/Tensor G5|3nm|Titanium/);
        expect(copy.description).not.toMatch(/Tensor G5|5[.,]567|ab sofort|available immediately|pre-orders/i);
      }
    }
  });
  it.each(Object.keys(showcasePages) as ShowcaseSlug[])('retains %s with real local artwork and no fabricated sales offer', slug => {
    expect(existsSync(path.join(process.cwd(), 'public', showcasePages[slug].image))).toBe(true);
    for (const locale of ['de', 'en'] as const) {
      const schema = buildShowcaseSchema(slug, locale);
      expect(schema['@type']).toBe('WebPage');
      expect(schema.url).toBe(`https://apfel-park.de/${locale}/${slug}`);
      expect(JSON.stringify(schema)).not.toMatch(/AggregateOffer|offerCount|lowPrice|highPrice|InStock|PreOrder/);
      expect(showcaseDescription(slug, locale)).toContain(showcasePages[slug].name);
    }
    const route = readFileSync(path.join(process.cwd(), 'src/app/(site)/[lang]', slug, 'page.tsx'), 'utf8');
    expect(route).toContain('ShowcaseDisclosure');
    expect(route).toContain('initialModel=');
    expect(route).not.toContain('AggregateOffer');
  });

  it('keeps all three homepage banners and the original discovery cards', () => {
    const read = (file: string) => readFileSync(path.join(process.cwd(), file), 'utf8');
    const home = read('src/app/(site)/[lang]/page.tsx');
    for (const banner of ['IPhoneBanner', 'GalaxyFoldBanner', 'PixelBanner']) expect(home).toContain(`<${banner}`);
    expect(read('src/app/(site)/[lang]/accessories/page.tsx')).toContain('<AccessoryCategoryCards');
    expect(read('src/app/(site)/[lang]/smartphones/page.tsx')).toContain('<StoreBrandCards');
    for (const category of ['cases', 'audio', 'charging', 'protection']) expect(existsSync(path.join(process.cwd(), `public/images/categories/${category}-lifestyle-v1.webp`))).toBe(true);
  });

  it('does not restore known wrong processor, camera, frame or stock claims', () => {
    const read = (file: string) => readFileSync(path.join(process.cwd(), 'src/components', file), 'utf8');
    const pixel = read('google-pixel/PixelShowcase.tsx');
    expect(pixel).toContain('Tensor G6');
    expect(pixel).not.toContain('Tensor G5');
    expect(pixel).not.toContain('5.1 mm slim');
    const iphone = read('iphone-18/IPhone18Showcase.tsx');
    expect(iphone).toContain('Aluminium-Unibody');
    expect(iphone).not.toMatch(/5[.,]567|10x lossless|12 GB RAM|45W \/ 25W/);
    const galaxy = read('samsung-fold/GalaxyFoldShowcase.tsx');
    expect(galaxy).not.toMatch(/Grade 5 Titanium|S-Pen digitizer|45 TOPS|300,000 folds|ab sofort lieferbar/);
  });
});
