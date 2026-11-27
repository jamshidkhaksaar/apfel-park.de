import { query } from '@/lib/db';
import { eprelAssetRoutes, eprelEndurance, eprelCycles, eprelProductUrl, EPREL_PRODUCT_GROUP, type EprelAssetRoutes } from '@/lib/eprel';
import { resolveKnownEuHardwareModel } from '@/lib/eprel-catalog';
import { mirrorEprelRegistrationAssets } from '@/lib/eprel-storage';
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
  const supplierNames = ['poco','redmi'].includes(brand) ? ['xiaomi'] : ['oneplus'].includes(brand) ? ['oneplus','oneplus technology','guangdong'] : ['nokia','hmd'].includes(brand) ? ['nokia','hmd'] : [brand];
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

const fetchLiveEprelRow = async (
  input: { brand: string; model: string; hardwareModel?: string; eprelId?: string },
  signal?: AbortSignal,
): Promise<EprelRow | null> => {
  try {
    const queryParam = input.eprelId
      ? `registrationNumber=${encodeURIComponent(input.eprelId)}`
      : input.hardwareModel
        ? `modelIdentifier=${encodeURIComponent(input.hardwareModel)}`
        : '';
    if (!queryParam) return null;
    const url = `https://eprel.ec.europa.eu/api/products/${EPREL_PRODUCT_GROUP}?_page=1&_limit=10&${queryParam}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36',
        Accept: 'application/json, text/plain, */*',
        Referer: `https://eprel.ec.europa.eu/screen/product/${EPREL_PRODUCT_GROUP}`,
      },
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(8_000)]) : AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { hits?: Array<Record<string, unknown>> };
    const hits = (json.hits ?? []).filter(h => String(h.status ?? '').toUpperCase() === 'PUBLISHED');
    hits.sort((a, b) => Number(b.versionNumber ?? 0) - Number(a.versionNumber ?? 0));
    const mapped: EprelRow[] = hits.map(hit => ({
      registration_number: String(hit.eprelRegistrationNumber ?? ''),
      supplier: String(hit.supplierOrTrademark ?? ''),
      model_identifier: String(hit.modelIdentifier ?? ''),
      energy_class: typeof hit.energyClass === 'string' ? hit.energyClass : null,
      battery_endurance_minutes: typeof hit.batteryEndurancePerCycle === 'number' ? hit.batteryEndurancePerCycle : null,
      battery_endurance_cycles: typeof hit.batteryEnduranceInCycles === 'number' ? hit.batteryEnduranceInCycles : null,
      repairability_class: typeof hit.repairabilityClass === 'string' ? hit.repairabilityClass : null,
      reliability_class: typeof hit.repeatedFreeFallReliabilityClass === 'string' ? hit.repeatedFreeFallReliabilityClass : null,
      ingress_protection: typeof hit.ingressProtectionRating === 'string' ? hit.ingressProtectionRating : null,
    }));
    const targetEprel = input.eprelId?.trim();
    const picked = targetEprel
      ? mapped.find(r => r.registration_number === targetEprel) ?? mapped[0] ?? null
      : selectExactEprelMatch(mapped, { ...input, hardwareModel: input.hardwareModel });
    if (picked) {
      await query(
        `INSERT INTO eprel_models (
          registration_number, supplier, model_identifier, device_type, energy_class,
          battery_endurance_minutes, battery_endurance_cycles, repairability_class, reliability_class, ingress_protection
        ) VALUES ($1,$2,$3,'SMARTPHONE',$4,$5,$6,$7,$8,$9)
        ON CONFLICT (registration_number) DO UPDATE SET
          energy_class=excluded.energy_class,
          battery_endurance_minutes=excluded.battery_endurance_minutes,
          battery_endurance_cycles=excluded.battery_endurance_cycles,
          repairability_class=excluded.repairability_class,
          reliability_class=excluded.reliability_class,
          ingress_protection=excluded.ingress_protection,
          synced_at=now()`,
        [
          picked.registration_number, picked.supplier, picked.model_identifier, picked.energy_class,
          picked.battery_endurance_minutes, picked.battery_endurance_cycles, picked.repairability_class,
          picked.reliability_class, picked.ingress_protection,
        ],
      ).catch(() => undefined);
    }
    return picked;
  } catch {
    return null;
  }
};

export const researchExactEprel = async (input: { brand: string; model: string; hardwareModel?: string; eprelId?: string }, signal?: AbortSignal): Promise<(Pick<ProductResearchResult, 'eprelId' | 'energyLabel'> & { source: { url: string; title: string; retrievedAt: string } }) | null> => {
  const knownHardware = resolveKnownEuHardwareModel(input.brand, input.model) ?? undefined;
  const cached = input.eprelId
    ? ((await query(
        `SELECT registration_number, supplier, model_identifier, energy_class, battery_endurance_minutes, battery_endurance_cycles, repairability_class, reliability_class, ingress_protection
         FROM eprel_models WHERE registration_number = $1 LIMIT 1`,
        [input.eprelId.trim()],
      ).catch(() => ({ rows: [] as EprelRow[] }))).rows[0] as EprelRow | undefined) ?? null
    : null;
  const hardware = input.hardwareModel?.trim() || knownHardware || cached?.model_identifier;
  if (!hardware) return null;
  const rows = (await query(
    `SELECT registration_number, supplier, model_identifier, energy_class, battery_endurance_minutes, battery_endurance_cycles, repairability_class, reliability_class, ingress_protection
     FROM eprel_models WHERE regexp_replace(upper(model_identifier), '[^A-Z0-9]', '', 'g') = $1`,
    [normalizeEprelIdentifier(hardware)],
  ).catch(() => ({ rows: [] as EprelRow[] }))).rows as EprelRow[];
  const matched = selectExactEprelMatch(rows, { ...input, hardwareModel: hardware })
    ?? (await fetchLiveEprelRow({ ...input, hardwareModel: hardware }, signal));
  if (!matched) return null;
  const fields = eprelResearchFields(matched);
  if (fields.eprelId && fields.energyLabel) {
    const mirrored: Partial<EprelAssetRoutes> = await mirrorEprelRegistrationAssets(fields.eprelId, signal).catch(() => ({}));
    fields.energyLabel.labelImage = mirrored.labelImage;
    fields.energyLabel.ficheDe = mirrored.ficheDe;
    fields.energyLabel.ficheEn = mirrored.ficheEn;
  }
  return {
    ...fields,
    source: {
      url: eprelProductUrl(matched.registration_number),
      title: `EPREL ${matched.supplier} ${matched.model_identifier} (${matched.registration_number})`,
      retrievedAt: new Date().toISOString().slice(0, 10),
    },
  };
};
