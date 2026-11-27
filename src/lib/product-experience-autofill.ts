import {
  sanitizeProductExperienceProfile,
  type ConditionGuideItem,
  type DeviceDimensions,
  type PackageContentItem,
  type ProductExperienceProfile,
  type RefurbishmentStep,
  type TrustPoint,
} from './product-experience';
import type { ProductCondition } from './products';

export type AutoExperienceInput = {
  category?: string;
  brand?: string;
  model?: string;
  title?: string;
  condition?: ProductCondition;
  specs?: Array<{ label: string; value: string }>;
  dimensions?: DeviceDimensions;
  packageContents?: PackageContentItem[];
  chargerIncluded?: boolean | null;
  chargingPowerMaxW?: number | null;
  usbPdSupported?: boolean | null;
  batteryDetails?: { wattHours?: number; chemistry?: string } | null;
  campaign?: { badge?: { de: string; en: string }; message?: { de: string; en: string }; campaignId?: string } | null;
  comparisonProductIds?: string[];
  existing?: ProductExperienceProfile;
  preserveEmptyPackageContentsForUsed?: boolean;
};

const extractNumber = (text: string, regex: RegExp): number | undefined => {
  const m = text.match(regex);
  if (!m?.[1]) return undefined;
  const parsed = Number(m[1].replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const dimensionsFromSpecs = (specs: Array<{ label: string; value: string }> = []): DeviceDimensions => {
  const joined = specs.map(s => `${s.label}: ${s.value}`).join('\n');
  const triple = joined.match(/(\d{2,3}(?:[.,]\d+)?)\s*[xÃ—]\s*(\d{2,3}(?:[.,]\d+)?)\s*[xÃ—]\s*(\d{1,2}(?:[.,]\d+)?)\s*mm/i);
  const weightG = extractNumber(joined, /(?:gewicht|weight|masse)[^0-9\n]{0,20}(\d{2,4}(?:[.,]\d+)?)\s*g\b/i);
  const screenInches = extractNumber(joined, /(\d(?:[.,]\d{1,2})?)\s*(?:zoll|"|inch)/i);
  return {
    ...(triple ? {
      heightMm: Number(triple[1].replace(',', '.')),
      widthMm: Number(triple[2].replace(',', '.')),
      depthMm: Number(triple[3].replace(',', '.')),
    } : {}),
    ...(weightG ? { weightG } : {}),
    ...(screenInches ? { screenInches } : {}),
  };
};

const defaultPackageContents = (
  category: string,
  condition: ProductCondition,
  brand: string,
  model: string,
  chargerIncluded?: boolean | null,
): PackageContentItem[] => {
  const nameDe = model || {
    smartphones: 'Smartphone',
    tablets: 'Tablet',
    laptops: 'Laptop',
    watches: 'Smartwatch',
    audio: 'Audio-Gerät',
    consoles: 'Konsole',
    accessories: 'Zubehör',
    parts: 'Ersatzteil',
  }[category] || 'Gerät';
  const nameEn = model || {
    smartphones: 'Smartphone',
    tablets: 'Tablet',
    laptops: 'Laptop',
    watches: 'Smartwatch',
    audio: 'Audio device',
    consoles: 'Console',
    accessories: 'Accessory',
    parts: 'Replacement part',
  }[category] || 'Device';

  if (category === 'parts') {
    return [
      { label: { de: nameDe, en: nameEn }, included: true },
      { label: { de: 'Einbauanleitung / Schutzverpackung', en: 'Protective antistatic packaging' }, included: true },
    ];
  }

  const isApple = /apple/i.test(brand);
  const cableLabel = category === 'watches'
    ? { de: 'Magnetisches Schnellladekabel', en: 'Magnetic fast charger cable' }
    : isApple && /\biphone\s*(?:1[0-4]|se|x)\b/i.test(model)
      ? { de: 'USB-C auf Lightning Kabel', en: 'USB-C to Lightning cable' }
      : { de: 'USB-C Ladekabel', en: 'USB-C charging cable' };

  const items: PackageContentItem[] = [
    { label: { de: nameDe, en: nameEn }, included: true },
  ];

  if (category !== 'accessories') {
    items.push({ label: cableLabel, included: true, icon: 'usb', presetId: 'usb-cable' });
  }
  if (category === 'smartphones' && condition === 'new') {
    items.push({ label: { de: 'Dokumentation & SIM-Nadel', en: 'Documentation & SIM ejector pin' }, included: true });
  }
  if (chargerIncluded === true) {
    items.push({ label: { de: 'Netzteil (enthalten)', en: 'Power adapter (included)' }, included: true, icon: 'charger', presetId: 'charger' });
  } else if (chargerIncluded === false && ['smartphones', 'tablets', 'watches', 'audio'].includes(category)) {
    items.push({ label: { de: 'Netzteil (optional separat)', en: 'Power adapter (sold separately)' }, included: false, icon: 'charger' });
  }
  return items;
};

const defaultConditionGuide = (condition: ProductCondition): ConditionGuideItem[] => {
  const guides: Record<ProductCondition, ConditionGuideItem> = {
    new: {
      condition: 'new',
      label: { de: 'Neu & Originalversiegelt', en: 'Brand New & Sealed' },
      description: {
        de: 'Originalverpackte Neuware ohne Aktivierung, mit voller Herstellergarantie und geprüfter EU-Konformität.',
        en: 'Factory-sealed new unit, never activated, backed by full manufacturer warranty and verified EU compliance.',
      },
      imageUrls: [],
    },
    open_box: {
      condition: 'open_box',
      label: { de: 'Open Box / Wie Neu', en: 'Open Box / Like New' },
      description: {
        de: 'Verpackung geöffnet, Gerät optisch neuwertig und vollständig im Apfel Park Techniklabor auf 100 % Funktion getestet.',
        en: 'Opened packaging only; device in like-new cosmetic condition and fully tested in our lab for 100% functionality.',
      },
      imageUrls: [],
    },
    used: {
      condition: 'used',
      label: { de: 'Geprüfte Gebrauchtware (Technisch 100 %)', en: 'Inspected Pre-Owned (100% Tested)' },
      description: {
        de: 'Von unseren Technikern mehrfach getestet: Akku, Display, Kameras, Sensoren und Anschlüsse funktionieren einwandfrei.',
        en: 'Thoroughly inspected by our technicians: battery health, display, cameras, sensors and ports tested and verified.',
      },
      imageUrls: [],
    },
  };
  return [guides[condition]];
};

const defaultRefurbishmentSteps = (condition: ProductCondition): RefurbishmentStep[] => {
  if (condition === 'new') return [];
  return [
    {
      title: { de: '1. Hardware- & Funktionsdiagnose', en: '1. Hardware & Sensor Diagnostics' },
      description: {
        de: 'Prüfung von Display, Touch, Kameras, Lautsprechern, Mikrofonen, Mobilfunk, WLAN und Bluetooth.',
        en: 'Verification of display, touch response, cameras, speakers, microphones, cellular, Wi-Fi and Bluetooth.',
      },
    },
    {
      title: { de: '2. Akku- & Ladeleistungstest', en: '2. Battery & Charging Verification' },
      description: {
        de: 'Messung der realen Batteriekapazität, Ladezyklen und USB-PD Schnellladefunktion am Prüfstand.',
        en: 'Measurement of actual battery health, cycle stability and USB-PD charging under load.',
      },
    },
    {
      title: { de: '3. Datenlöschung & Werksreset', en: '3. Secure Wipe & Factory Reset' },
      description: {
        de: 'Zertifizierte Zurücksetzung ohne Vorbesitzer-Konten (kein MDM / keine Aktivierungssperre).',
        en: 'Complete reset with zero prior account locks, MDM profiles or activation restrictions.',
      },
    },
    {
      title: { de: '4. Professionelle Reinigung & Qualitätskontrolle', en: '4. Cleaning & Final QC' },
      description: {
        de: 'Antistatische Reinigung aller Anschlüsse und abschließende Endkontrolle vor dem Versand.',
        en: 'Ultrasonic/antistatic port cleaning and final technical sign-off before dispatch.',
      },
    },
  ];
};

const defaultTrustPoints = (input: AutoExperienceInput): TrustPoint[] => {
  const isNew = (input.condition ?? 'new') === 'new';
  const points: TrustPoint[] = [
    {
      title: { de: '100 % Geprüfte Originalware', en: '100% Authentic & Verified' },
      description: {
        de: 'Jedes Gerät wird anhand von Modellnummer und Serienstatus für den deutschen/EU-Markt verifiziert.',
        en: 'Every unit is verified for authenticity, clean serial status and German/EU market compatibility.',
      },
    },
    {
      title: {
        de: isNew ? 'Garantie & Käuferschutz' : '12 Monate Apfel Park Gewährleistung',
        en: isNew ? 'Warranty & Buyer Protection' : '12-Month Apfel Park Warranty',
      },
      description: {
        de: isNew
          ? 'Rechnung mit ausgewiesener MwSt. sowie gesetzliche Gewährleistung und Herstellergarantie.'
          : 'Inklusive 12 Monate Gewährleistung, geprüfter Akkukapazität und ordentlicher Rechnung.',
        en: isNew
          ? 'Includes VAT invoice, statutory German warranty and applicable manufacturer coverage.'
          : 'Backed by our 12-month warranty, verified battery capacity report and proper invoice.',
      },
    },
    {
      title: { de: 'Schneller Versand & Store-Abholung', en: 'Fast DE Dispatch & Store Pickup' },
      description: {
        de: 'Sicher verpackt ab unserem Standort in Deutschland — Versand am selben Werktag oder Abholung vor Ort.',
        en: 'Securely packed and shipped directly from our German store, or ready for local pickup.',
      },
    },
  ];

  if (input.usbPdSupported || input.chargingPowerMaxW) {
    const wattText = input.chargingPowerMaxW ? `bis zu ${input.chargingPowerMaxW} W` : 'USB-C PD';
    const wattTextEn = input.chargingPowerMaxW ? `up to ${input.chargingPowerMaxW}W` : 'USB-C PD';
    points.push({
      title: { de: 'EU-Standard & USB-C Laden', en: 'EU Standard & USB-C Charging' },
      description: {
        de: `Unterstützt genormtes USB-C Laden (${wattText}) gemäß EU-Richtlinie für maximale Kompatibilität.`,
        en: `Supports standardized USB-C charging (${wattTextEn}) under EU common charger standards.`,
      },
    });
  }
  return points;
};

/**
 * Builds an accurate, bilingual Product Experience Profile and auto-enables every
 * populated section without overwriting existing user customizations.
 */
export const buildAutoProductExperience = (input: AutoExperienceInput): ProductExperienceProfile => {
  const existing = sanitizeProductExperienceProfile(input.existing ?? {});
  const category = input.category || 'smartphones';
  const condition: ProductCondition = input.condition ?? 'new';

  const specDimensions = dimensionsFromSpecs(input.specs);
  const dimensions: DeviceDimensions = {
    heightMm: existing.dimensions.heightMm ?? input.dimensions?.heightMm ?? specDimensions.heightMm,
    widthMm: existing.dimensions.widthMm ?? input.dimensions?.widthMm ?? specDimensions.widthMm,
    depthMm: existing.dimensions.depthMm ?? input.dimensions?.depthMm ?? specDimensions.depthMm,
    weightG: existing.dimensions.weightG ?? input.dimensions?.weightG ?? specDimensions.weightG,
    screenInches: existing.dimensions.screenInches ?? input.dimensions?.screenInches ?? specDimensions.screenInches,
  };

  const packageContents = existing.packageContents.length
    ? existing.packageContents
    : input.packageContents?.length
      ? input.packageContents
      : (input.preserveEmptyPackageContentsForUsed && condition !== 'new')
        ? []
        : defaultPackageContents(category, condition, input.brand ?? '', input.model ?? input.title ?? '', input.chargerIncluded);

  const conditionGuide = existing.conditionGuide.length
    ? existing.conditionGuide
    : defaultConditionGuide(condition);

  const refurbishmentSteps = existing.refurbishmentSteps.length
    ? existing.refurbishmentSteps
    : defaultRefurbishmentSteps(condition);

  const trustPoints = existing.trustPoints.length
    ? existing.trustPoints
    : defaultTrustPoints(input);

  const comparisonProductIds = existing.comparisonProductIds.length
    ? existing.comparisonProductIds
    : (input.comparisonProductIds ?? []).slice(0, 4);

  const campaign = existing.campaign.badge.de || existing.campaign.message.de
    ? existing.campaign
    : input.campaign
      ? {
          badge: input.campaign.badge ?? { de: '', en: '' },
          message: input.campaign.message ?? { de: '', en: '' },
          campaignId: input.campaign.campaignId,
        }
      : existing.campaign;

  const isDevice = ['smartphones', 'tablets', 'laptops', 'watches', 'consoles'].includes(category);
  const hasDimensions = Boolean(dimensions.heightMm && dimensions.widthMm);
  const hasCampaign = Boolean(campaign.badge.de || campaign.badge.en || campaign.message.de || campaign.message.en);

  return sanitizeProductExperienceProfile({
    ...existing,
    dimensions,
    packageContents,
    conditionGuide,
    refurbishmentSteps,
    trustPoints,
    comparisonProductIds,
    campaign,
    enabledSections: {
      familyConfigurator: existing.enabledSections.familyConfigurator || isDevice,
      packageContents: existing.enabledSections.packageContents || packageContents.length > 0,
      conditionGuide: existing.enabledSections.conditionGuide || conditionGuide.length > 0,
      refurbishment: existing.enabledSections.refurbishment || (condition !== 'new' && refurbishmentSteps.length > 0),
      sizeComparison: existing.enabledSections.sizeComparison || hasDimensions,
      modelComparison: existing.enabledSections.modelComparison || comparisonProductIds.length > 0,
      bundles: existing.enabledSections.bundles || existing.bundleProductIds.length > 0,
      campaign: existing.enabledSections.campaign || hasCampaign,
      tradeIn: existing.enabledSections.tradeIn || ['smartphones', 'tablets', 'laptops', 'watches'].includes(category),
      wishlist: true,
    },
  });
};
