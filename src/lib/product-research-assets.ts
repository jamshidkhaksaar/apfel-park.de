import { createHash } from 'node:crypto';
import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { resolveUploadPath } from '@/lib/blob';

export type LicensedResearchAsset = {
  brand: string; model: string; color: string; colorAliases?: string[];
  localUrl: string; sha256: string; sourceUrl: string; licenseReference: string; rightsStatus: 'licensed';
};
type AssetInput = { brand: string; model: string; query?: string; color?: string; condition?: string };
const normalized = (value: string): string => value.toLocaleLowerCase('de-DE').normalize('NFKD').replace(/\p{M}/gu, '').replace(/[^a-z0-9]+/g, ' ').trim();

/** Operator-supplied licence records only; search results and AI claims cannot grant rights. */
export const selectLicensedResearchAssets = (value: unknown, input: AssetInput): LicensedResearchAsset[] => {
  if (input.condition !== 'new' || !input.brand || !input.model || !Array.isArray(value)) return [];
  return value.filter((asset): asset is LicensedResearchAsset => {
    if (!asset || typeof asset !== 'object') return false;
    const a = asset as Partial<LicensedResearchAsset>;
    if (a.rightsStatus !== 'licensed' || typeof a.licenseReference !== 'string' || !a.licenseReference.trim()
        || typeof a.brand !== 'string' || typeof a.model !== 'string' || typeof a.color !== 'string' || !a.color.trim()
        || typeof a.localUrl !== 'string' || !/^\/uploads\/products\/[a-z0-9_.-]+\.webp$/i.test(a.localUrl)
        || typeof a.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(a.sha256) || typeof a.sourceUrl !== 'string') return false;
    try { const url = new URL(a.sourceUrl); if (url.protocol !== 'https:' || url.username || url.password) return false; } catch { return false; }
    if (normalized(a.brand) !== normalized(input.brand) || normalized(a.model) !== normalized(input.model)) return false;
    const colors = [a.color, ...(Array.isArray(a.colorAliases) ? a.colorAliases.filter((c): c is string => typeof c === 'string') : [])].map(normalized).filter(Boolean);
    return input.color ? colors.includes(normalized(input.color)) : colors.some(color => ` ${normalized(input.query ?? '')} `.includes(` ${color} `));
  }).slice(0, 4);
};

export const licensedResearchImages = async (input: AssetInput): Promise<string[]> => {
  const manifestPath = '/srv/apfel-park/app/shared/licensed-product-images.json';
  let assets: unknown;
  try {
    const raw = await readFile(manifestPath, 'utf8');
    if (raw.length > 1_000_000) return [];
    assets = (JSON.parse(raw) as { assets?: unknown }).assets;
  } catch { return []; }
  const matched = selectLicensedResearchAssets(assets, input);
  const checked = await Promise.all(matched.map(async asset => {
    try {
      const file = resolveUploadPath(asset.localUrl);
      if (!file) return null;
      const resolved = await realpath(file);
      if (resolved !== path.resolve(file)) return null;
      const bytes = await readFile(resolved);
      if (bytes.length > 2_000_000 || bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WEBP') return null;
      return createHash('sha256').update(bytes).digest('hex') === asset.sha256 ? asset.localUrl : null;
    } catch { return null; }
  }));
  return [...new Set(checked.filter((url): url is string => Boolean(url)))];
};
