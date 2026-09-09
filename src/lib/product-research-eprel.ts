import { query } from '@/lib/db';
import { eprelAssetRoutes, eprelEndurance, eprelCycles, eprelProductUrl, EPREL_PRODUCT_GROUP } from '@/lib/eprel';
import { access } from 'node:fs/promises';
import path from 'node:path';
import type { ProductResearchResult } from '@/lib/product-research-core';

type EprelRow = {
  registration_number: string; supplier: string; model_identifier: string;
  energy_class?: string | null; battery_endurance_minutes?: number | null;
  battery_endurance_hours?: number | string | null; battery_endurance_cycles?: number | null;
  repairability_class?: string | null; reliability_class?: string | null; ingress_protection?: string | null;
};
export const normalizeEprelIdentifier = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, '');

export const selectExactEprelMatch = (
  rows: EprelRow[], input: { brand: string; model: string; hardwareModel?: string; eprelId?: string },
): EprelRow | null => {
  const identity = normalizeEprelIdentifier(input.hardwareModel || input.model);
  const brand = input.brand.toLowerCase().trim();
  const supplierNames = ['poco','redmi'].includes(brand) ? ['xiaomi'] : ['nokia','hmd'].includes(brand) ? ['nokia','hmd'] : [brand];
  if (identity.length < 3 || brand.length < 2) return null;
  const matches = rows.filter(row => normalizeEprelIdentifier(row.model_identifier) === identity
    && (!input.eprelId || row.registration_number === input.eprelId)
    && supplierNames.some(name => row.supplier.toLowerCase().split(/[^a-z0-9]+/).includes(name)));
  return matches.length === 1 ? matches[0] : null;
};

export const eprelResearchFields = (row: EprelRow): Pick<ProductResearchResult, 'eprelId' | 'energyLabel'> => {
  const classValue = (value: unknown, pattern: RegExp): string | undefined => typeof value === 'string' && pattern.test(value.trim().toUpperCase()) ? value.trim().toUpperCase() : undefined;
  const hours = Number(row.battery_endurance_hours);
  const minutes = row.battery_endurance_minutes ?? (Number.isFinite(hours) && hours > 0 ? Math.round(hours * 60) : undefined);
  const cycles = row.battery_endurance_cycles;
  return {
    eprelId: row.registration_number,
    energyLabel: {
      efficiencyClass: classValue(row.energy_class, /^[A-G]$/),
      batteryEndurance: minutes && minutes > 0 ? eprelEndurance(minutes) || undefined : undefined,
      batteryCycles: typeof cycles === 'number' && Number.isInteger(cycles) && cycles > 0 ? eprelCycles(cycles) : undefined,
      repairabilityClass: classValue(row.repairability_class, /^[A-E]$/),
      reliabilityClass: classValue(row.reliability_class, /^[A-E]$/),
      ipRating: classValue(row.ingress_protection, /^IP[0-6X][0-9X]$/),
      ...eprelAssetRoutes(row.registration_number),
    },
  };
};

export const researchExactEprel = async (input: { brand: string; model: string; hardwareModel?: string; eprelId?: string }, signal?: AbortSignal): Promise<(Pick<ProductResearchResult, 'eprelId' | 'energyLabel'> & { source: { url: string; title: string; retrievedAt: string } }) | null> => {
  const id = input.eprelId?.trim() ?? '';
  if (id && !/^\d{1,16}$/.test(id)) return null;
  const identity = normalizeEprelIdentifier(input.hardwareModel || input.model);
  if (identity.length < 3 || identity.length > 100) return null;
  const result = await query(`SELECT registration_number,supplier,model_identifier,energy_class,battery_endurance_minutes,
    battery_endurance_hours,battery_endurance_cycles,repairability_class,reliability_class,ingress_protection
    FROM eprel_models WHERE ($1<>'' AND registration_number=$1)
      OR lower(regexp_replace(model_identifier,'[^a-zA-Z0-9]','','g'))=$2 LIMIT 10`, [id, identity]);
  const cached = selectExactEprelMatch(result.rows as EprelRow[], input);
  const hardware = input.hardwareModel || cached?.model_identifier;
  if (!hardware) return null;
  // Confirm the candidate against today's public register; never call cached values fresh.
  const url = `https://eprel.ec.europa.eu/api/products/${EPREL_PRODUCT_GROUP}?_page=1&_limit=10&modelIdentifier=${encodeURIComponent(hardware)}`;
  const response = await fetch(url, { redirect: 'error', cache: 'no-store',
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(8000)]) : AbortSignal.timeout(8000),
    headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json, text/plain, */*', Referer: `https://eprel.ec.europa.eu/screen/product/${EPREL_PRODUCT_GROUP}` },
  });
  if (!response.ok) return null;
  const data = await response.json() as { hits?: Array<Record<string, unknown>> };
  const live = (Array.isArray(data.hits) ? data.hits : []).slice(0, 10).map(hit => ({
    registration_number: String(hit.eprelRegistrationNumber ?? ''), supplier: String(hit.supplierOrTrademark ?? ''), model_identifier: String(hit.modelIdentifier ?? ''),
    energy_class: typeof hit.energyClass === 'string' ? hit.energyClass : null,
    battery_endurance_hours: typeof hit.batteryEndurancePerCycleInHours === 'number' ? hit.batteryEndurancePerCycleInHours : null,
    battery_endurance_minutes: typeof hit.batteryEndurancePerCycle === 'number' ? hit.batteryEndurancePerCycle : null,
    battery_endurance_cycles: typeof hit.batteryEnduranceInCycles === 'number' ? hit.batteryEnduranceInCycles : null,
    repairability_class: typeof hit.repairabilityClass === 'string' ? hit.repairabilityClass : null,
    reliability_class: typeof hit.repeatedFreeFallReliabilityClass === 'string' ? hit.repeatedFreeFallReliabilityClass : null,
    ingress_protection: typeof hit.ingressProtectionRating === 'string' ? hit.ingressProtectionRating : null,
  }));
  const match = selectExactEprelMatch(live, input);
  if (!match || !/^\d{1,16}$/.test(match.registration_number)) return null;
  const fields = eprelResearchFields(match);
  if (fields.energyLabel) for (const key of ['labelImage','ficheDe','ficheEn'] as const) {
    const asset = fields.energyLabel[key];
    if (!asset) continue;
    try { await access(path.join(process.cwd(), 'public', asset)); }
    catch { delete fields.energyLabel[key]; }
  }
  return { ...fields, source: { url: eprelProductUrl(match.registration_number), title: `EPREL · ${match.model_identifier}`, retrievedAt: new Date().toISOString() } };
};
