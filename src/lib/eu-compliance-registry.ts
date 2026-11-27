import type { ProductResearchResult } from './product-research-core';

type ComplianceEntity = {
  manufacturer: { name: string; address: string; email?: string };
  euResponsiblePerson: { name: string; address: string; email?: string };
  expectedHosts: string[];
};

const BRAND_COMPLIANCE_REGISTRY: Record<string, ComplianceEntity> = {
  apple: {
    manufacturer: { name: 'Apple Inc.', address: 'One Apple Park Way, Cupertino, CA 95014, USA', email: 'https://www.apple.com/de/contact/' },
    euResponsiblePerson: { name: 'Apple Distribution International Ltd.', address: 'Hollyhill Industrial Estate, Cork, T23 YK84, Ireland', email: 'https://www.apple.com/de/compliance/' },
    expectedHosts: ['apple.com'],
  },
  samsung: {
    manufacturer: { name: 'Samsung Electronics Co., Ltd.', address: '129 Samsung-ro, Yeongtong-gu, Suwon-si, Gyeonggi-do, Republic of Korea', email: 'https://www.samsung.com/de/support/contact/' },
    euResponsiblePerson: { name: 'Samsung Electronics GmbH', address: 'Am Kronberger Hang 6, 65824 Schwalbach am Taunus, Germany', email: 'compliance@samsung.de' },
    expectedHosts: ['samsung.com'],
  },
  google: {
    manufacturer: { name: 'Google LLC', address: '1600 Amphitheatre Parkway, Mountain View, CA 94043, USA', email: 'https://support.google.com/product-documentation/' },
    euResponsiblePerson: { name: 'Google Commerce Limited', address: 'Gordon House, Barrow Street, Dublin 4, Ireland', email: 'https://store.google.com/de/' },
    expectedHosts: ['google.com', 'blog.google'],
  },
  xiaomi: {
    manufacturer: { name: 'Xiaomi Communications Co., Ltd.', address: '#019, 9th Floor, Building 6, 33 Xi\'erqi Middle Road, Haidian District, Beijing 100085, China' },
    euResponsiblePerson: { name: 'Xiaomi Technology Netherlands B.V.', address: 'Prinses Beatrixlaan 582, 2595BM The Hague, Netherlands', email: 'contact@support.mi.com' },
    expectedHosts: ['mi.com', 'xiaomi.com', 'po.co'],
  },
  oneplus: {
    manufacturer: { name: 'OnePlus Technology (Shenzhen) Co., Ltd.', address: '18C02, 18C03, 18C04, and 18C05, Shum Yip Terra Building, Binhe Avenue North, Futian District, Shenzhen, China' },
    euResponsiblePerson: { name: 'Reflection Investment B.V.', address: 'Hofplein 20, 3032AC Rotterdam, Netherlands', email: 'eu_rep@oneplus.com' },
    expectedHosts: ['oneplus.com'],
  },
  sony: {
    manufacturer: { name: 'Sony Corporation', address: '1-7-1 Konan Minato-ku, Tokyo 108-0075, Japan' },
    euResponsiblePerson: { name: 'Sony Europe B.V.', address: 'Da Vincilaan 7-D1, 1930 Zaventem, Belgium', email: 'https://www.sony.de/electronics/support' },
    expectedHosts: ['sony.de', 'sony.com', 'sony.eu'],
  },
  nothing: {
    manufacturer: { name: 'Nothing Technology Limited', address: '80 Cheapside, London EC2V 6EE, United Kingdom' },
    euResponsiblePerson: { name: 'Nothing Technology BV', address: 'Jachthavenweg 109H, 1081 KM Amsterdam, Netherlands', email: 'compliance@nothing.tech' },
    expectedHosts: ['nothing.tech'],
  },
  lenovo: {
    manufacturer: { name: 'Lenovo PC HK Limited', address: '23/F, Lincoln House, Taikoo Place, 979 King\'s Road, Quarry Bay, Hong Kong' },
    euResponsiblePerson: { name: 'Lenovo (Slovakia) s.r.o.', address: 'Landererova 12, 811 09 Bratislava, Slovakia', email: 'compliance@lenovo.com' },
    expectedHosts: ['lenovo.com', 'motorola.de', 'motorola.com'],
  },
  motorola: {
    manufacturer: { name: 'Motorola Mobility LLC', address: '222 W. Merchandise Mart Plaza, Chicago, IL 60654, USA' },
    euResponsiblePerson: { name: 'Motorola Mobility Germany GmbH', address: 'Am Borsigturm 130, 13507 Berlin, Germany', email: 'https://de-de.support.motorola.com/' },
    expectedHosts: ['motorola.de', 'motorola.com', 'lenovo.com'],
  },
  fairphone: {
    manufacturer: { name: 'Fairphone B.V.', address: 'Van Diemenstraat 200, 1013 CP Amsterdam, Netherlands', email: 'support@fairphone.com' },
    euResponsiblePerson: { name: 'Fairphone B.V.', address: 'Van Diemenstraat 200, 1013 CP Amsterdam, Netherlands', email: 'support@fairphone.com' },
    expectedHosts: ['fairphone.com'],
  },
};

const findBrandCompliance = (brand?: string, sourceUrls: string[] = []): ComplianceEntity | null => {
  const b = brand?.trim().toLowerCase() ?? '';
  const entry = Object.entries(BRAND_COMPLIANCE_REGISTRY).find(([key]) => b === key || b.includes(key))?.[1];
  if (!entry) return null;
  if (!sourceUrls.length) return entry;
  const hostMatches = sourceUrls.some(raw => {
    try {
      const host = new URL(raw).hostname.toLowerCase();
      return entry.expectedHosts.some(expected => host === expected || host.endsWith(`.${expected}`));
    } catch {
      return false;
    }
  });
  return hostMatches || b ? entry : null;
};

const parseWattValues = (result: ProductResearchResult): { minW?: number; maxW?: number; usbPd?: boolean; chargerIncluded?: boolean } => {
  const text = [
    ...(result.specs ?? []).map(s => `${s.label} ${s.value}`),
    ...(result.features ?? []),
    ...(result.packageContents ?? []).map(p => `${p.label.de} ${p.label.en} ${p.included}`),
    result.description ?? '',
  ].join(' \n ');

  const watts = [...text.matchAll(/(?:usb[\s-]*pd|power delivery|schnelllad|fast charg|ladeleistung|charging power|netzteil|adapter)[^.\n]{0,60}?(\d{2,3})\s*w\b/gi)]
    .map(m => Number(m[1]))
    .filter(n => Number.isFinite(n) && n >= 5 && n <= 240);

  const minMatch = text.match(/(?:mindestladeleistung|min(?:\.|imum)?\s*(?:charging\s*)?power)\D{0,15}(\d{1,3})\s*w\b/i);
  const maxMatch = text.match(/(?:bis zu|up to|max(?:\.|imum)?\s*(?:charging\s*)?power|höchstladeleistung)\D{0,15}(\d{2,3})\s*w\b/i);
  const usbPd = /\b(usb[\s-]*pd|power delivery|pps)\b/i.test(text);

  let chargerIncluded: boolean | undefined;
  const pkg = result.packageContents ?? [];
  const chargerItem = pkg.find(p => /\b(netzteil|charger|power adapter|ladegerät)\b/i.test(`${p.label.de} ${p.label.en}`));
  if (chargerItem) {
    chargerIncluded = chargerItem.included;
  } else if (/(?:ohne\s+netzteil|kein\s+netzteil|power adapter\s+(?:is\s+)?sold separately|netzteil\s+separat\s+erhältlich)/i.test(text)) {
    chargerIncluded = false;
  }

  const maxW = maxMatch ? Number(maxMatch[1]) : watts.length ? Math.max(...watts) : undefined;
  const minW = minMatch ? Number(minMatch[1]) : maxW ? (usbPd ? 5 : undefined) : undefined;
  return {
    ...(minW ? { minW } : {}),
    ...(maxW ? { maxW } : {}),
    ...(usbPd ? { usbPd: true } : {}),
    ...(chargerIncluded !== undefined ? { chargerIncluded } : {}),
  };
};

/**
 * Enriches verified official research output with grounded GPSR addresses (sibling DB
 * match or official EU legal entity) and structured EU battery / USB-PD charging tags.
 */
export const applyVerifiedEuComplianceFallback = (
  result: ProductResearchResult,
  options?: {
    condition?: string;
    sibling?: {
      manufacturer?: { name?: string; address?: string; email?: string } | null;
      euResponsiblePerson?: { name?: string; address?: string; email?: string } | null;
      chargerIncluded?: boolean | null;
      chargingPowerMinW?: number | null;
      chargingPowerMaxW?: number | null;
      usbPdSupported?: boolean | null;
      batteryDetails?: ProductResearchResult['batteryDetails'] | null;
    } | null;
  },
): ProductResearchResult => {
  const next: ProductResearchResult = { ...result };
  const sibling = options?.sibling;
  const sourceUrls = (result.researchSources ?? []).map(s => s.url);
  const brandEntity = findBrandCompliance(result.brand, sourceUrls);

  if (!next.manufacturer?.name || !next.manufacturer?.address) {
    if (sibling?.manufacturer?.name && sibling?.manufacturer?.address) {
      next.manufacturer = {
        name: sibling.manufacturer.name,
        address: sibling.manufacturer.address,
        ...(sibling.manufacturer.email ? { email: sibling.manufacturer.email } : {}),
      };
    } else if (brandEntity) {
      next.manufacturer = { ...brandEntity.manufacturer };
    }
  }

  if (!next.euResponsiblePerson?.name || !next.euResponsiblePerson?.address) {
    if (sibling?.euResponsiblePerson?.name && sibling?.euResponsiblePerson?.address) {
      next.euResponsiblePerson = {
        name: sibling.euResponsiblePerson.name,
        address: sibling.euResponsiblePerson.address,
        ...(sibling.euResponsiblePerson.email ? { email: sibling.euResponsiblePerson.email } : {}),
      };
    } else if (brandEntity) {
      next.euResponsiblePerson = { ...brandEntity.euResponsiblePerson };
    }
  }

  const parsedPower = parseWattValues(next);
  if (next.chargerIncluded === undefined) {
    if (typeof sibling?.chargerIncluded === 'boolean') next.chargerIncluded = sibling.chargerIncluded;
    else if (parsedPower.chargerIncluded !== undefined) next.chargerIncluded = parsedPower.chargerIncluded;
    else if (
      (options?.condition ?? 'new') === 'new'
      && ['smartphones', 'tablets', 'watches'].includes(next.category ?? '')
      && /apple|samsung|google/i.test(next.brand ?? '')
    ) {
      // Apple, Samsung & Google ship modern EU retail phones/tablets/watches without wall adapters (EU 2022/2380).
      next.chargerIncluded = false;
    }
  }

  if (next.usbPdSupported === undefined) {
    if (typeof sibling?.usbPdSupported === 'boolean') next.usbPdSupported = sibling.usbPdSupported;
    else if (parsedPower.usbPd) next.usbPdSupported = true;
    else if (
      ['smartphones', 'tablets', 'laptops'].includes(next.category ?? '')
      && /usb[\s-]*c/i.test(JSON.stringify(next.specs ?? []))
    ) {
      next.usbPdSupported = true;
    }
  }

  if (next.chargingPowerMaxW === undefined) {
    if (typeof sibling?.chargingPowerMaxW === 'number' && sibling.chargingPowerMaxW > 0) {
      next.chargingPowerMaxW = sibling.chargingPowerMaxW;
    } else if (parsedPower.maxW) {
      next.chargingPowerMaxW = parsedPower.maxW;
    }
  }
  if (next.chargingPowerMinW === undefined) {
    if (typeof sibling?.chargingPowerMinW === 'number' && sibling.chargingPowerMinW > 0) {
      next.chargingPowerMinW = sibling.chargingPowerMinW;
    } else if (parsedPower.minW) {
      next.chargingPowerMinW = parsedPower.minW;
    } else if (next.chargingPowerMaxW && next.usbPdSupported) {
      next.chargingPowerMinW = 5;
    }
  }

  if (!next.batteryDetails) {
    if (sibling?.batteryDetails) {
      next.batteryDetails = { ...sibling.batteryDetails };
    } else if (['smartphones', 'tablets', 'laptops', 'watches', 'audio'].includes(next.category ?? '')) {
      const whMatch = JSON.stringify(next.specs ?? []).match(/(\d+(?:[.,]\d+)?)\s*wh\b/i);
      const wattHours = whMatch ? Number(whMatch[1].replace(',', '.')) : undefined;
      next.batteryDetails = {
        included: true,
        ...(wattHours && Number.isFinite(wattHours) ? { wattHours } : {}),
      };
    }
  }

  return next;
};
