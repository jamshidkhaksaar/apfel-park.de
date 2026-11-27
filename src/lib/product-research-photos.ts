import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import sharp from 'sharp';
import { resolveUploadPath, uploadProductImage } from '@/lib/blob';
import { query } from '@/lib/db';
import { normalizedColor } from '@/lib/product-experience';
import { fetchOfficialResearchSource, getCachedResearchSources, isApprovedOfficialImageUrl, type ResearchSource } from '@/lib/product-research-sources';

const COLOR_SYNONYMS: Record<string, string[]> = {
  schwarz: ['black', 'midnight', 'mitternacht', 'space black', 'onyx', 'obsidian', 'graphite', 'titan schwarz', 'titanium black'],
  weiss: ['white', 'starlight', 'polarstern', 'silver', 'silber', 'porcelain', 'titanium white', 'titan weiß', 'titan weiss'],
  blau: ['blue', 'ultramarine', 'ultramarin', 'navy', 'bay', 'teal', 'bluetitanium', 'titan blau', 'icy blue', 'blueblack'],
  gruen: ['green', 'mint', 'sage', 'olive', 'emerald', 'teal', 'blaugrün'],
  pink: ['pink', 'rose', 'rosÃ©', 'magenta', 'berry', 'peony', 'coral'],
  lila: ['purple', 'violet', 'lavender', 'lilac', 'ultraviolet'],
  rot: ['red', 'productred', 'coral', 'crimson'],
  gelb: ['yellow', 'gold', 'amber', 'champagne', 'desert', 'wüstensand', 'sand'],
  grau: ['gray', 'grey', 'graphite', 'titanium', 'natur', 'natural', 'titan natur', 'jetblack', 'silver'],
  orange: ['orange', 'copper', 'terracotta', 'cosmic orange'],
};

const tokensFor = (value?: string): string[] =>
  (value ?? '')
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .split(/[^a-z0-9]+/)
    .filter(token => token.length >= 2);

const colorTokensFor = (color?: string): string[] => {
  const base = tokensFor(color);
  if (!base.length) return [];
  const expanded = new Set(base);
  for (const [key, list] of Object.entries(COLOR_SYNONYMS)) {
    const all = [key, ...list.flatMap(tokensFor)];
    if (base.some(t => all.includes(t))) all.forEach(t => expanded.add(t));
  }
  return Array.from(expanded);
};

const scoreImageCandidate = (url: string, model: string, color?: string): number => {
  const lower = url.toLowerCase();
  let score = 0;
  for (const token of tokensFor(model)) {
    if (lower.includes(token)) score += 3;
  }
  const colorTokens = colorTokensFor(color);
  if (colorTokens.length) {
    if (colorTokens.some(t => lower.includes(t))) score += 6;
    else {
      // Penalize URLs clearly naming a different color finish.
      const allKnownColors = Object.values(COLOR_SYNONYMS).flat().flatMap(tokensFor);
      if (allKnownColors.some(c => c.length >= 4 && lower.includes(c) && !colorTokens.includes(c))) score -= 5;
    }
  }
  if (/wid=1[0-9]{3}|w=1[0-9]{3}|large|_og|finish-select|av[1-9]|p6pim|cdsassets|gallery|hero/i.test(lower)) score += 2;
  if (/small|thumb|icon|avatar/i.test(lower)) score -= 4;
  return score;
};

const localUploadExists = async (url: string): Promise<boolean> => {
  const filePath = resolveUploadPath(url);
  if (!filePath || !existsSync(/*turbopackIgnore: true*/ filePath)) return false;
  try {
    const info = await stat(/*turbopackIgnore: true*/ filePath);
    return info.isFile() && info.size > 0;
  } catch {
    return false;
  }
};

const findVerifiedCatalogPhotos = async (brand: string, model: string, color?: string, maxPhotos = 4): Promise<string[]> => {
  if (!brand.trim() || !model.trim() || !process.env.DATABASE_URL) return [];
  try {
    const rows = (
      await query(
        `SELECT model, images, variants
           FROM products
          WHERE lower(trim(brand)) = lower(trim($1))
            AND coalesce(array_length(images, 1), 0) > 0
            AND lower(regexp_replace(coalesce(model, title), '[^a-z0-9]+', '', 'g')) = regexp_replace(lower($2), '[^a-z0-9]+', '', 'g')
          ORDER BY (condition = 'new') DESC, is_active DESC, array_length(images, 1) DESC, updated_at DESC
          LIMIT 25`,
        [brand, model],
      )
    ).rows as Array<{ model: string; images: string[]; variants?: Array<{ color?: string; images?: string[] }> }>;

    const targetColor = color?.trim() ? normalizedColor(color) : '';
    const ordered: string[] = [];

    for (const row of rows) {
      const variants = Array.isArray(row.variants) ? row.variants : [];
      if (targetColor) {
        const matchedVariant = variants.find(v => v.color && normalizedColor(v.color) === targetColor);
        if (!matchedVariant) continue;
        for (const img of matchedVariant.images ?? row.images ?? []) {
          if (typeof img === 'string' && !ordered.includes(img) && await localUploadExists(img)) {
            ordered.push(img);
            if (ordered.length >= maxPhotos) return ordered;
          }
        }
      }
    }

    if (!targetColor) {
      for (const row of rows) {
        for (const img of row.images ?? []) {
          if (typeof img === 'string' && !ordered.includes(img) && await localUploadExists(img)) {
            ordered.push(img);
            if (ordered.length >= maxPhotos) return ordered;
          }
        }
      }
    }
    return ordered;
  } catch {
    return [];
  }
};

const extraBrandShopUrls = (brand: string, model: string): string[] => {
  const b = brand.trim().toLowerCase();
  const slug = model
    .toLowerCase()
    .replace(/\b5g\b/g, '')
    .replace(/\+/g, '-plus')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  if (!slug || !/\d/.test(slug)) return [];
  if (b === 'apple' && slug.startsWith('iphone')) {
    return [`https://www.apple.com/de/shop/buy-iphone/${slug}`, `https://www.apple.com/de/${slug}/`];
  }
  if (b === 'apple' && slug.startsWith('ipad')) {
    return [`https://www.apple.com/de/${slug}/specs/`];
  }
  if (b === 'samsung' && slug.startsWith('galaxy')) {
    return [`https://www.samsung.com/de/smartphones/${slug}/`, `https://www.samsung.com/de/smartphones/${slug}/specs/`];
  }
  if (b === 'google' && slug.startsWith('pixel')) {
    const py = slug.replace(/-/g, '_');
    return [`https://store.google.com/de/product/${py}?hl=de`];
  }
  return [];
};

const downloadCandidate = async (
  url: string,
  signal?: AbortSignal,
): Promise<{ buffer: Buffer; ext: string; mime: string; fingerprint: string; sha256: string; previewBase64: string } | null> => {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36',
        Accept: 'image/webp,image/png,image/jpeg,image/*;q=0.8',
      },
      redirect: 'follow',
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(5_000)]) : AbortSignal.timeout(5_000),
    });
    if (!res.ok) return null;
    if (!isApprovedOfficialImageUrl(res.url || url)) return null;
    const ct = (res.headers.get('content-type') ?? '').toLowerCase();
    if (ct && !ct.startsWith('image/') && !ct.includes('octet-stream')) return null;

    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length < 4096 || bytes.length > 8 * 1024 * 1024) return null;

    const meta = await sharp(bytes, { limitInputPixels: 25_000_000 }).metadata();
    if (!meta.width || !meta.height || meta.width < 280 || meta.height < 280) return null;
    if (!['jpeg', 'png', 'webp'].includes(meta.format ?? '')) return null;

    const thumbRaw = await sharp(bytes).resize(16, 16, { fit: 'fill' }).greyscale().raw().toBuffer();
    const fingerprint = createHash('sha1').update(thumbRaw).digest('hex');
    const preview = await sharp(bytes)
      .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    const format = meta.format === 'png' ? { ext: 'png', mime: 'image/png' }
      : meta.format === 'webp' ? { ext: 'webp', mime: 'image/webp' }
      : { ext: 'jpg', mime: 'image/jpeg' };

    return {
      buffer: bytes,
      ...format,
      fingerprint,
      sha256: createHash('sha256').update(bytes).digest('hex'),
      previewBase64: preview.toString('base64'),
    };
  } catch {
    return null;
  }
};

type VisionVerdict = {
  index: number;
  isCleanProductPhoto: boolean;
  matchesBrandModel: boolean;
  matchesColor: boolean;
  isBannerOrAccessoryOnly: boolean;
  angle: string;
  score: number;
};

const verifyWithGeminiVision = async (
  candidates: Array<{ previewBase64: string }>,
  input: { brand: string; model: string; color?: string },
  signal?: AbortSignal,
): Promise<VisionVerdict[] | null> => {
  const { resolveGeminiKey } = await import('@/lib/ai-provider-credentials');
  const apiKey = await resolveGeminiKey();
  if (!apiKey || !candidates.length) return null;
  const geminiModel = process.env.GEMINI_RESEARCH_MODEL?.trim() || 'gemini-3.8-flash';
  const prompt = [
    `You inspect ${candidates.length} candidate product photos (indexed 0 to ${candidates.length - 1}) for:`,
    `Brand: ${input.brand}`,
    `Exact Model: ${input.model}`,
    `Target Color: ${input.color?.trim() || 'any official launch finish for this model'}`,
    '',
    'For EACH image index in order, return strict JSON array of objects:',
    '{"index":number,"isCleanProductPhoto":boolean,"matchesBrandModel":boolean,"matchesColor":boolean,"isBannerOrAccessoryOnly":boolean,"angle":"front"|"back"|"side"|"detail"|"group"|"other","score":1..10}',
    'Rules:',
    '- Reject lifestyle collages, large overlaid marketing text banners, icons, boxes-only, or cables-only (set isCleanProductPhoto=false or isBannerOrAccessoryOnly=true).',
    '- matchesBrandModel=true ONLY if camera layout, chassis and design genuinely match that exact model.',
    input.color?.trim()
      ? `- matchesColor=true ONLY if the visible device body matches color "${input.color.trim()}" (allow subtle lighting variations).`
      : '- matchesColor=true if the device shows an authentic official colorway for that model.',
  ].join('\n');

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(18_000)]) : AbortSignal.timeout(18_000),
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [
              { text: prompt },
              ...candidates.flatMap((item, idx) => [
                { text: `Image ${idx}:` },
                { inlineData: { mimeType: 'image/jpeg', data: item.previewBase64 } },
              ]),
            ],
          }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0 },
        }),
      },
    );
    if (!response.ok) return null;
    const payload = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const raw = payload.candidates?.[0]?.content?.parts?.find(p => p.text)?.text ?? '';
    const parsed = JSON.parse(raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''));
    return Array.isArray(parsed) ? parsed as VisionVerdict[] : null;
  } catch {
    return null;
  }
};

export const resolveVerifiedResearchPhotos = async (input: {
  brand: string;
  model: string;
  color?: string;
  condition?: string;
  sources?: ResearchSource[];
  maxPhotos?: number;
  signal?: AbortSignal;
}): Promise<string[]> => {
  const maxPhotos = Math.max(1, Math.min(4, input.maxPhotos ?? 4));
  const brand = input.brand.trim();
  const model = input.model.trim();
  if (!brand || !model) return [];

  try {
    const selected = await findVerifiedCatalogPhotos(brand, model, input.color, maxPhotos);
    if (selected.length >= maxPhotos) return selected.slice(0, maxPhotos);

    const pool = new Set<string>();
    const effectiveSources = (input.sources && input.sources.length) ? input.sources : getCachedResearchSources(`${brand} ${model}`);
    for (const source of effectiveSources) {
      for (const u of source.imageUrls ?? []) {
        if (isApprovedOfficialImageUrl(u)) pool.add(u);
      }
    }

    if (pool.size < 6) {
      const existingUrls = new Set(effectiveSources.map(s => s.url));
      const shopUrls = extraBrandShopUrls(brand, model).filter(u => !existingUrls.has(u));
      const fetchedExtras = await Promise.all(
        shopUrls.slice(0, 2).map(u => fetchOfficialResearchSource(u, `${brand} ${model}`, fetch, brand).catch(() => null)),
      );
      for (const src of fetchedExtras) {
        for (const u of src?.imageUrls ?? []) {
          if (isApprovedOfficialImageUrl(u)) pool.add(u);
        }
      }
    }

    const rankedUrls = Array.from(pool)
      .sort((a, b) => scoreImageCandidate(b, model, input.color) - scoreImageCandidate(a, model, input.color))
      .slice(0, 14);
    if (!rankedUrls.length) return selected;

    const downloaded: Array<NonNullable<Awaited<ReturnType<typeof downloadCandidate>>> & { url: string }> = [];
    const seenFingerprints = new Set<string>();
    for (let i = 0; i < rankedUrls.length; i += 4) {
      const batch = await Promise.all(rankedUrls.slice(i, i + 4).map(async url => {
        const res = await downloadCandidate(url, input.signal);
        return res ? { ...res, url } : null;
      }));
      for (const item of batch) {
        if (!item || seenFingerprints.has(item.fingerprint)) continue;
        seenFingerprints.add(item.fingerprint);
        downloaded.push(item);
        if (downloaded.length >= 10) break;
      }
      if (downloaded.length >= 10) break;
    }

    if (!downloaded.length) return selected;

    const verdicts = await verifyWithGeminiVision(downloaded, { brand, model, color: input.color }, input.signal);
    const angleRank: Record<string, number> = { front: 0, back: 1, side: 2, detail: 3, group: 4, other: 5 };

    let chosen = downloaded.map((item, idx) => ({ item, verdict: verdicts?.find(v => v.index === idx) ?? null }));
    if (verdicts && verdicts.length > 0) {
      chosen = chosen
        .filter(({ verdict }) =>
          Boolean(
            verdict
            && verdict.isCleanProductPhoto
            && verdict.matchesBrandModel
            && !verdict.isBannerOrAccessoryOnly
            && (!input.color?.trim() || verdict.matchesColor),
          ),
        )
        .sort((a, b) => {
          const rankA = angleRank[a.verdict?.angle ?? 'other'] ?? 5;
          const rankB = angleRank[b.verdict?.angle ?? 'other'] ?? 5;
          if (rankA !== rankB) return rankA - rankB;
          return (b.verdict?.score ?? 0) - (a.verdict?.score ?? 0);
        });
    } else {
      // Offline / no-Vision fallback: keep top URL-scored candidates without failing.
      chosen = chosen.filter(({ item }) => scoreImageCandidate(item.url, model, input.color) >= 2);
    }

    const baseSlug = `${brand}-${model}${input.color ? `-${input.color}` : ''}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'product';

    for (let i = 0; i < chosen.length && selected.length < maxPhotos; i += 1) {
      const { item } = chosen[i];
      const uploaded = await uploadProductImage(
        new File([new Uint8Array(item.buffer)], `${baseSlug}-${selected.length + 1}.${item.ext}`, { type: item.mime }),
      );
      if (uploaded.url && !selected.includes(uploaded.url)) {
        selected.push(uploaded.url);
      }
    }

    return selected.slice(0, maxPhotos);
  } catch (error) {
    console.warn('resolveVerifiedResearchPhotos failed cleanly:', error instanceof Error ? error.message : String(error));
    return [];
  }
};
