import { isValidInputLength, sanitizeInput } from '@/lib/security';
import { classifySubcategory } from '@/lib/product-subcategory';
import { validatedGtin } from '@/lib/product-identifiers';
import { eprelAssetRoutes } from '@/lib/eprel';
import { energyLabelError } from '@/lib/energy-label-validation';
import { normalizeAiTextFields, type AiTextField } from '@/lib/product-ai-fields';
import type {
  BatteryDetails,
  MarketplaceAttributes,
  MarketplaceCategoryMappings,
  ProductIdentifierStatus,
} from '@/lib/product-channel-readiness';

export type ProductPayload = {
  aiGeneratedFields?: AiTextField[];
  id?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  price?: number;
  compareAtPrice?: number | null;
  category?: string;
  condition?: string;
  batteryHealth?: number | null;
  hasRealProductPhotos?: boolean;
  conditionNote?: string;
  brand?: string;
  model?: string;
  stock?: number;
  sku?: string;
  mpn?: string;
  gtin?: string;
  identifierStatus?: ProductIdentifierStatus;
  asin?: string;
  ebayEpid?: string;
  countryOfOrigin?: string;
  packageWeightKg?: number | null;
  packageLengthCm?: number | null;
  packageWidthCm?: number | null;
  packageHeightCm?: number | null;
  chargerIncluded?: boolean | null;
  chargingPowerMinW?: number | null;
  chargingPowerMaxW?: number | null;
  usbPdSupported?: boolean | null;
  batteryDetails?: BatteryDetails | null;
  marketplaceCategoryMappings?: MarketplaceCategoryMappings;
  marketplaceAttributes?: MarketplaceAttributes;
  amazonGtinExemption?: boolean;
  amazonRenewedApproved?: boolean;
  manufacturer?: { name?: string; address?: string; email?: string } | null;
  euResponsiblePerson?: {
    name?: string;
    address?: string;
    email?: string;
  } | null;
  safetyWarnings?: string[];
  safetyDocuments?: string[];
  eprelId?: string;
  faq?: {
    de?: Array<{ q?: string; a?: string }>;
    en?: Array<{ q?: string; a?: string }>;
  } | null;
  energyLabel?: {
    efficiencyClass?: string;
    batteryEndurance?: string;
    batteryCycles?: number;
    reliabilityClass?: string;
    repairabilityClass?: string;
    ipRating?: string;
    labelImage?: string;
    ficheDe?: string;
    ficheEn?: string;
  } | null;
  images?: string[];
  variants?: Array<{
    color?: string;
    storage?: string;
    price?: number | null;
    compareAtPrice?: number | null;
    stock?: number | null;
    sku?: string;
    mpn?: string;
    gtin?: string;
    identifierStatus?: ProductIdentifierStatus;
    asin?: string;
    ebayEpid?: string;
    imageIndex?: number | null;
    images?: string[];
    isDefault?: boolean;
  }>;
  featureBullets?: string[];
  specs?: Array<{ label: string; value: string }>;
  isActive?: boolean;
  isHomepageFeatured?: boolean;
};

const normalizeCategory = (category: string): string | null => {
  const value = category.toLowerCase().trim();
  if (value === 'smartphone' || value === 'smartphones') return 'smartphones';
  if (value === 'tablet' || value === 'tablets') return 'tablets';
  if (value === 'accessory' || value === 'accessories') return 'accessories';
  if (value === 'console' || value === 'consoles' || value === 'gaming')
    return 'consoles';
  if (value === 'laptop' || value === 'laptops') return 'laptops';
  return null;
};

const normalizeCondition = (
  condition: string | undefined,
): 'new' | 'open_box' | 'used' => {
  const value = (condition ?? '').toLowerCase().trim();
  if (value === 'open_box' || value === 'open-box' || value === 'refurbished')
    return 'open_box';
  if (value === 'used') return 'used';
  return 'new';
};

const sanitizeStringArray = (items: unknown, maxLength: number) => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => sanitizeInput(typeof item === 'string' ? item : ''))
    .filter((item) => item && isValidInputLength(item, maxLength));
};

const sanitizeSpecs = (items: unknown) => {
  if (!Array.isArray(items)) return [];

  return items
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const candidate = entry as {
        label?: unknown;
        value?: unknown;
        group?: unknown;
      };
      const label = sanitizeInput(
        typeof candidate.label === 'string' ? candidate.label : '',
      );
      const value = sanitizeInput(
        typeof candidate.value === 'string' ? candidate.value : '',
      );
      if (!label || !value) return null;
      if (!isValidInputLength(label, 100) || !isValidInputLength(value, 255))
        return null;
      const group = sanitizeInput(
        typeof candidate.group === 'string' ? candidate.group : '',
      );
      if (group && !isValidInputLength(group, 100)) return null;
      return { label, value, ...(group ? { group } : {}) };
    })
    .filter(
      (entry): entry is { label: string; value: string; group?: string } =>
        entry !== null,
    );
};

const normalizeIdentifierStatus = (value: unknown): ProductIdentifierStatus =>
  value === 'assigned' || value === 'not_applicable' ? value : 'unknown';

const sanitizeMarketplaceCategoryMappings = (
  value: unknown,
): MarketplaceCategoryMappings => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  const result: MarketplaceCategoryMappings = {};

  if (
    source.google &&
    typeof source.google === 'object' &&
    !Array.isArray(source.google)
  ) {
    const category = sanitizeInput(
      String((source.google as Record<string, unknown>).category ?? ''),
    ).slice(0, 255);
    if (category) result.google = { category };
  }
  if (
    source.ebay_de &&
    typeof source.ebay_de === 'object' &&
    !Array.isArray(source.ebay_de)
  ) {
    const ebay = source.ebay_de as Record<string, unknown>;
    const categoryId = sanitizeInput(String(ebay.categoryId ?? '')).slice(
      0,
      12,
    );
    const categoryName = sanitizeInput(String(ebay.categoryName ?? '')).slice(
      0,
      200,
    );
    const requiredAspects = sanitizeStringArray(
      ebay.requiredAspects,
      120,
    ).slice(0, 100);
    if (/^\d+$/.test(categoryId))
      result.ebay_de = { categoryId, categoryName, requiredAspects };
  }
  if (
    source.amazon_de &&
    typeof source.amazon_de === 'object' &&
    !Array.isArray(source.amazon_de)
  ) {
    const productType = sanitizeInput(
      String((source.amazon_de as Record<string, unknown>).productType ?? ''),
    )
      .toUpperCase()
      .replace(/[^A-Z0-9_]/g, '')
      .slice(0, 120);
    if (productType) result.amazon_de = { productType };
  }
  return result;
};

const sanitizeMarketplaceAttributes = (
  value: unknown,
): MarketplaceAttributes => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  const result: MarketplaceAttributes = {};
  if (
    source.ebay_de &&
    typeof source.ebay_de === 'object' &&
    !Array.isArray(source.ebay_de)
  ) {
    const attributes: Record<string, string[]> = {};
    for (const [rawKey, rawValue] of Object.entries(
      source.ebay_de as Record<string, unknown>,
    ).slice(0, 150)) {
      const key = sanitizeInput(rawKey).slice(0, 120);
      if (!key) continue;
      const values = sanitizeStringArray(rawValue, 250).slice(0, 20);
      if (values.length > 0) attributes[key] = values;
    }
    if (Object.keys(attributes).length > 0) result.ebay_de = attributes;
  }
  return result;
};

const sanitizeBatteryDetails = (value: unknown): BatteryDetails => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  const result: BatteryDetails = {};
  if (typeof source.included === 'boolean') result.included = source.included;
  if (typeof source.cellComposition === 'string') {
    const composition = sanitizeInput(source.cellComposition)
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 50);
    if (composition) result.cellComposition = composition;
  }
  const number = (input: unknown, integer = false) => {
    const parsed = Number(input);
    if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
    return integer ? Math.round(parsed) : parsed;
  };
  result.count = number(source.count, true);
  result.weightGrams = number(source.weightGrams);
  result.wattHours = number(source.wattHours);
  if (typeof source.unNumber === 'string') {
    const unNumber = sanitizeInput(source.unNumber)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 6);
    if (/^UN\d{4}$/.test(unNumber)) result.unNumber = unNumber;
  }
  return Object.fromEntries(
    Object.entries(result).filter(([, entry]) => entry !== undefined),
  ) as BatteryDetails;
};

const sanitizeVariants = (items: unknown) => {
  if (!Array.isArray(items))
    return { variants: [], invalidGtin: false, invalidAsin: false };

  let invalidGtin = false;
  let invalidAsin = false;

  const variants = items
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const candidate = entry as {
        color?: unknown;
        storage?: unknown;
        price?: unknown;
        compareAtPrice?: unknown;
        stock?: unknown;
        sku?: unknown;
        mpn?: unknown;
        gtin?: unknown;
        identifierStatus?: unknown;
        asin?: unknown;
        ebayEpid?: unknown;
        imageIndex?: unknown;
        images?: unknown;
        isDefault?: unknown;
      };

      const color = sanitizeInput(
        typeof candidate.color === 'string' ? candidate.color : '',
      );
      const storage = sanitizeInput(
        typeof candidate.storage === 'string' ? candidate.storage : '',
      );
      if (!color || !storage) return null;
      if (!isValidInputLength(color, 80) || !isValidInputLength(storage, 80))
        return null;

      const price = parsePrice(candidate.price);
      const compareAtPrice = parsePrice(candidate.compareAtPrice);
      const stock =
        candidate.stock === null ||
        candidate.stock === undefined ||
        candidate.stock === ''
          ? undefined
          : Number(candidate.stock);
      const sku = sanitizeInput(
        typeof candidate.sku === 'string' ? candidate.sku : '',
      );
      const mpn = sanitizeInput(
        typeof candidate.mpn === 'string' ? candidate.mpn : '',
      ).slice(0, 120);
      const gtinInput = sanitizeInput(
        typeof candidate.gtin === 'string' ? candidate.gtin : '',
      );
      const gtin = validatedGtin(gtinInput);
      if (gtinInput && !gtin) invalidGtin = true;
      const asinInput = sanitizeInput(
        typeof candidate.asin === 'string' ? candidate.asin : '',
      ).toUpperCase();
      if (asinInput && !/^[A-Z0-9]{10}$/.test(asinInput)) invalidAsin = true;
      const asin = asinInput.slice(0, 10);
      const ebayEpid = sanitizeInput(
        typeof candidate.ebayEpid === 'string' ? candidate.ebayEpid : '',
      ).slice(0, 40);
      const images = sanitizeStringArray(candidate.images, 1000).slice(0, 4);
      const imageIndex =
        candidate.imageIndex === null ||
        candidate.imageIndex === undefined ||
        candidate.imageIndex === ''
          ? undefined
          : Number(candidate.imageIndex);

      if (price !== null && (Number.isNaN(price) || price < 0)) return null;
      if (
        compareAtPrice !== null &&
        (Number.isNaN(compareAtPrice) || compareAtPrice < 0)
      )
        return null;
      if (compareAtPrice !== null && price !== null && compareAtPrice <= price)
        return null;
      if (stock !== undefined && (Number.isNaN(stock) || stock < 0))
        return null;
      if (!isValidInputLength(sku, 120)) return null;
      if (
        imageIndex !== undefined &&
        (Number.isNaN(imageIndex) || imageIndex < 0 || imageIndex > 3)
      )
        return null;

      return {
        color,
        storage,
        price: price === null ? undefined : price,
        compareAtPrice: compareAtPrice === null ? undefined : compareAtPrice,
        stock,
        sku: sku || undefined,
        mpn: mpn || undefined,
        gtin: gtin || undefined,
        identifierStatus: normalizeIdentifierStatus(candidate.identifierStatus),
        asin: asin || undefined,
        ebayEpid: ebayEpid || undefined,
        imageIndex,
        images: images.length > 0 ? images : undefined,
        isDefault: Boolean(candidate.isDefault),
      };
    })
    .filter((entry) => entry !== null)
    .map((entry, index, array) => ({
      ...entry,
      isDefault: array.some((variant) => variant.isDefault)
        ? entry.isDefault
        : index === 0,
    })) as Array<{
    color: string;
    storage: string;
    price?: number;
    compareAtPrice?: number;
    stock?: number;
    sku?: string;
    mpn?: string;
    gtin?: string;
    identifierStatus: ProductIdentifierStatus;
    asin?: string;
    ebayEpid?: string;
    imageIndex?: number;
    images?: string[];
    isDefault?: boolean;
  }>;

  return { variants, invalidGtin, invalidAsin };
};

const parsePrice = (value: unknown) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
};

export const getMessages = (isEnglish: boolean) => ({
  energyFormatInvalid: isEnglish ? 'Invalid energy-label data. Use a numeric EPREL ID, valid A–G/A–E classes, a duration such as 47 h 0 min, and positive whole cycle counts.' : 'Ungültige Energielabel-Daten. Numerische EPREL-ID, gültige Klassen A–G/A–E, eine Dauer wie 47 h 0 min und positive ganze Zyklenzahlen verwenden.',
  energyReferenceRequired: isEnglish ? 'Add the matching EPREL registration before publishing energy-label claims, or save an inactive draft.' : 'Vor Veröffentlichung der Energielabel-Angaben die passende EPREL-Registrierung ergänzen oder als inaktiven Entwurf speichern.',
  unauthorized: isEnglish ? 'Unauthorized' : 'Nicht autorisiert',
  titleRequired: isEnglish ? 'Title is required' : 'Titel ist erforderlich',
  categoryRequired: isEnglish
    ? 'Valid category is required'
    : 'Gültige Kategorie ist erforderlich',
  priceRequired: isEnglish
    ? 'Valid price is required'
    : 'Gültiger Preis ist erforderlich',
  stockRequired: isEnglish
    ? 'Valid stock is required'
    : 'Gültiger Lagerwert ist erforderlich',
  comparePriceInvalid: isEnglish
    ? 'Compare-at price must be higher than the current price'
    : 'Streichpreis muss höher als der aktuelle Preis sein',
  gtinInvalid: isEnglish
    ? 'GTIN/EAN must be a valid 8, 12, 13, or 14-digit manufacturer barcode'
    : 'GTIN/EAN muss ein gültiger 8-, 12-, 13- oder 14-stelliger Hersteller-Barcode sein',
  variantGtinInvalid: isEnglish
    ? 'At least one variant has an invalid GTIN/EAN checksum'
    : 'Mindestens eine Variante hat eine ungültige GTIN/EAN-Prüfziffer',
  variantAsinInvalid: isEnglish
    ? 'At least one variant has an invalid Amazon ASIN'
    : 'Mindestens eine Variante hat eine ungültige Amazon-ASIN',
  asinInvalid: isEnglish
    ? 'ASIN must contain exactly 10 letters or digits'
    : 'Die ASIN muss genau 10 Buchstaben oder Ziffern enthalten',
  countryInvalid: isEnglish
    ? 'Country of origin must be a two-letter ISO code'
    : 'Das Ursprungsland muss als zweistelliger ISO-Code angegeben werden',
  packageInvalid: isEnglish
    ? 'Package weight and dimensions must be greater than zero'
    : 'Paketgewicht und -maße müssen größer als null sein',
  chargingInvalid: isEnglish
    ? 'Charging power must be zero or greater and maximum power cannot be below minimum power'
    : 'Die Ladeleistung muss mindestens null sein und die Maximalleistung darf nicht unter der Minimalleistung liegen',
  conditionDetailsRequired: isEnglish
    ? 'Open-box and used products need a condition note, at least one image, and confirmation of real product photos'
    : 'Open-Box- und Gebrauchtprodukte benötigen einen Zustandshinweis, mindestens ein Bild und die Bestätigung echter Produktfotos',
  batteryHealthRequired: isEnglish
    ? 'Used iPhones require battery health'
    : 'Für gebrauchte iPhones ist die Batteriekapazität erforderlich',
  batteryHealthInvalid: isEnglish
    ? 'Battery health must be a whole number from 1 to 100'
    : 'Die Batteriekapazität muss eine ganze Zahl von 1 bis 100 sein',
  createFailed: isEnglish
    ? 'Failed to save product'
    : 'Produkt konnte nicht gespeichert werden',
  inputTooLong: isEnglish ? 'Input too long' : 'Eingabe zu lang',
  missingId: isEnglish
    ? 'Product id is required'
    : 'Produkt-ID ist erforderlich',
  deleteFailed: isEnglish
    ? 'Failed to delete product'
    : 'Produkt konnte nicht gelöscht werden',
  activeNotReady: isEnglish
    ? 'This product is not ready for the live store and Google Merchant feed. Save it as an inactive draft and complete the listed requirements.'
    : 'Dieses Produkt ist noch nicht für den Live-Shop und den Google-Merchant-Feed bereit. Als inaktiven Entwurf speichern und die angezeigten Anforderungen vervollständigen.',
});

export const buildPayload = (payload: ProductPayload, slug?: string) => {
  const title = sanitizeInput(payload.title);
  const subtitle = payload.subtitle ? sanitizeInput(payload.subtitle) : null;
  const description = payload.description
    ? sanitizeInput(payload.description)
    : null;
  const brand = payload.brand ? sanitizeInput(payload.brand) : null;
  const model = payload.model ? sanitizeInput(payload.model) : null;
  const sku = payload.sku ? sanitizeInput(payload.sku) : null;
  const mpn = payload.mpn ? sanitizeInput(payload.mpn) : null;
  const gtinInput = payload.gtin ? sanitizeInput(payload.gtin) : null;
  const gtin = validatedGtin(gtinInput);
  const identifierStatus = normalizeIdentifierStatus(payload.identifierStatus);
  const asinInput = payload.asin
    ? sanitizeInput(payload.asin).toUpperCase()
    : null;
  const asin = asinInput?.slice(0, 10) || null;
  const ebayEpid = payload.ebayEpid
    ? sanitizeInput(payload.ebayEpid).slice(0, 40)
    : null;
  const countryOfOriginInput = payload.countryOfOrigin
    ? sanitizeInput(payload.countryOfOrigin).toUpperCase()
    : null;
  const countryOfOrigin = countryOfOriginInput?.slice(0, 2) || null;
  const packageWeightKg = parsePrice(payload.packageWeightKg);
  const packageLengthCm = parsePrice(payload.packageLengthCm);
  const packageWidthCm = parsePrice(payload.packageWidthCm);
  const packageHeightCm = parsePrice(payload.packageHeightCm);
  const chargerIncluded =
    typeof payload.chargerIncluded === 'boolean'
      ? payload.chargerIncluded
      : null;
  const chargingPowerMinW = parsePrice(payload.chargingPowerMinW);
  const chargingPowerMaxW = parsePrice(payload.chargingPowerMaxW);
  const usbPdSupported =
    typeof payload.usbPdSupported === 'boolean' ? payload.usbPdSupported : null;
  const batteryDetails = sanitizeBatteryDetails(payload.batteryDetails);
  const marketplaceCategoryMappings = sanitizeMarketplaceCategoryMappings(
    payload.marketplaceCategoryMappings,
  );
  const marketplaceAttributes = sanitizeMarketplaceAttributes(
    payload.marketplaceAttributes,
  );
  const gpsrParty = (
    value:
      { name?: string; address?: string; email?: string } | null | undefined,
  ) => {
    const name = value?.name ? sanitizeInput(value.name) : '';
    if (!name) return {};
    const party: Record<string, string> = { name };
    const address = value?.address ? sanitizeInput(value.address) : '';
    const email = value?.email ? sanitizeInput(value.email) : '';
    if (address) party.address = address;
    if (email) party.email = email;
    return party;
  };
  const manufacturer = gpsrParty(payload.manufacturer);
  const euResponsiblePerson = gpsrParty(payload.euResponsiblePerson);
  const safetyWarnings = sanitizeStringArray(payload.safetyWarnings, 500);
  const safetyDocuments = sanitizeStringArray(payload.safetyDocuments, 1000);
  const eprelId = typeof payload.eprelId === 'string' && payload.eprelId
    ? sanitizeInput(payload.eprelId).slice(0, 32)
    : null;
  const sanitizeFaqList = (
    list: Array<{ q?: string; a?: string }> | undefined,
  ) =>
    (Array.isArray(list) ? list : [])
      .map((entry) => ({
        q: sanitizeInput(entry?.q ?? '').slice(0, 300),
        a: sanitizeInput(entry?.a ?? '').slice(0, 1000),
      }))
      .filter((entry) => entry.q && entry.a)
      .slice(0, 10);
  const faqDe = sanitizeFaqList(payload.faq?.de);
  const faqEn = sanitizeFaqList(payload.faq?.en);
  const faq =
    faqDe.length > 0 || faqEn.length > 0 ? { de: faqDe, en: faqEn } : null;
  const energyText = (value: unknown, uppercase = false) => {
    if (typeof value !== 'string') return undefined;
    const clean = sanitizeInput(value);
    if (!clean) return undefined;
    return uppercase ? clean.toUpperCase() : clean;
  };
  const energyLabel: Record<string, string | number> = {};
  const efficiencyClass = energyText(
    payload.energyLabel?.efficiencyClass,
    true,
  );
  if (efficiencyClass) energyLabel.efficiencyClass = efficiencyClass;
  const batteryEndurance = energyText(payload.energyLabel?.batteryEndurance);
  if (batteryEndurance) energyLabel.batteryEndurance = batteryEndurance;
  if (
    typeof payload.energyLabel?.batteryCycles === 'number' &&
    Number.isFinite(payload.energyLabel.batteryCycles)
  ) {
    energyLabel.batteryCycles = Math.round(payload.energyLabel.batteryCycles);
  }
  const reliabilityClass = energyText(
    payload.energyLabel?.reliabilityClass,
    true,
  );
  if (reliabilityClass) energyLabel.reliabilityClass = reliabilityClass;
  const repairabilityClass = energyText(
    payload.energyLabel?.repairabilityClass,
    true,
  );
  if (repairabilityClass) energyLabel.repairabilityClass = repairabilityClass;
  const ipRating = energyText(payload.energyLabel?.ipRating);
  if (ipRating) energyLabel.ipRating = ipRating;
  const expectedEnergyAssets = eprelId ? eprelAssetRoutes(eprelId) : null;
  if (
    expectedEnergyAssets &&
    payload.energyLabel?.labelImage === expectedEnergyAssets.labelImage
  ) {
    energyLabel.labelImage = expectedEnergyAssets.labelImage;
  }
  if (
    expectedEnergyAssets &&
    payload.energyLabel?.ficheDe === expectedEnergyAssets.ficheDe
  ) {
    energyLabel.ficheDe = expectedEnergyAssets.ficheDe;
  }
  if (
    expectedEnergyAssets &&
    payload.energyLabel?.ficheEn === expectedEnergyAssets.ficheEn
  ) {
    energyLabel.ficheEn = expectedEnergyAssets.ficheEn;
  }
  const category = payload.category
    ? normalizeCategory(payload.category)
    : null;
  const condition = normalizeCondition(payload.condition);
  const subcategory = classifySubcategory(
    category,
    `${title} ${subtitle ?? ''} ${model ?? ''}`,
  );
  const batteryHealth =
    payload.batteryHealth === null || payload.batteryHealth === undefined
      ? null
      : Number(payload.batteryHealth);
  const hasRealProductPhotos = Boolean(payload.hasRealProductPhotos);
  const conditionNote = payload.conditionNote
    ? sanitizeInput(payload.conditionNote)
    : null;
  const price = parsePrice(payload.price);
  const compareAtPrice = parsePrice(payload.compareAtPrice);
  const stock = payload.stock === undefined ? 0 : Number(payload.stock);
  const images = sanitizeStringArray(payload.images, 1000);
  const variantResult = sanitizeVariants(payload.variants);
  const featureBullets = sanitizeStringArray(payload.featureBullets, 200);
  const specs = sanitizeSpecs(payload.specs);

  return {
    aiGeneratedFields: normalizeAiTextFields(payload.aiGeneratedFields),
    title,
    subtitle,
    description,
    brand,
    model,
    sku,
    mpn,
    gtin,
    gtinInput,
    identifierStatus,
    asin,
    asinInput,
    ebayEpid,
    countryOfOrigin,
    countryOfOriginInput,
    packageWeightKg,
    packageLengthCm,
    packageWidthCm,
    packageHeightCm,
    chargerIncluded,
    chargingPowerMinW,
    chargingPowerMaxW,
    usbPdSupported,
    batteryDetails,
    marketplaceCategoryMappings,
    marketplaceAttributes,
    amazonGtinExemption: Boolean(payload.amazonGtinExemption),
    amazonRenewedApproved: Boolean(payload.amazonRenewedApproved),
    manufacturer,
    euResponsiblePerson,
    safetyWarnings,
    safetyDocuments,
    eprelId,
    energyInputError: energyLabelError(payload.energyLabel, payload.eprelId, Boolean(payload.isActive)),
    energyLabel,
    faq,
    category,
    subcategory,
    price,
    compareAtPrice,
    stock,
    condition,
    batteryHealth,
    hasRealProductPhotos,
    conditionNote,
    images,
    variants: variantResult.variants,
    invalidVariantGtin: variantResult.invalidGtin,
    invalidVariantAsin: variantResult.invalidAsin,
    featureBullets,
    specs,
    isActive: payload.isActive ?? false,
    isHomepageFeatured: Boolean(payload.isHomepageFeatured),
    slug,
  };
};

export const validatePayload = (
  data: ReturnType<typeof buildPayload>,
  messages: ReturnType<typeof getMessages>,
) => {
  if (!data.title) return messages.titleRequired;
  if (data.energyInputError === 'format') return messages.energyFormatInvalid;
  if (data.energyInputError === 'reference') return messages.energyReferenceRequired;
  if (!data.category) return messages.categoryRequired;
  if (data.price === null || Number.isNaN(data.price) || data.price < 0)
    return messages.priceRequired;
  if (Number.isNaN(data.stock) || data.stock < 0) return messages.stockRequired;
  if (
    data.compareAtPrice !== null &&
    (Number.isNaN(data.compareAtPrice) || data.compareAtPrice <= data.price)
  ) {
    return messages.comparePriceInvalid;
  }
  if (
    data.condition !== 'new' &&
    (!data.hasRealProductPhotos ||
      data.images.length === 0 ||
      !data.conditionNote)
  ) {
    return messages.conditionDetailsRequired;
  }
  if (
    data.batteryHealth !== null &&
    (!Number.isInteger(data.batteryHealth) ||
      data.batteryHealth < 1 ||
      data.batteryHealth > 100)
  ) {
    return messages.batteryHealthInvalid;
  }
  if (data.gtinInput && !data.gtin) return messages.gtinInvalid;
  if (data.invalidVariantGtin) return messages.variantGtinInvalid;
  if (data.invalidVariantAsin) return messages.variantAsinInvalid;
  if (data.asinInput && !/^[A-Z0-9]{10}$/.test(data.asinInput))
    return messages.asinInvalid;
  if (
    data.countryOfOriginInput &&
    !/^[A-Z]{2}$/.test(data.countryOfOriginInput)
  )
    return messages.countryInvalid;
  if (
    [
      data.packageWeightKg,
      data.packageLengthCm,
      data.packageWidthCm,
      data.packageHeightCm,
    ].some((value) => value !== null && (!Number.isFinite(value) || value <= 0))
  ) {
    return messages.packageInvalid;
  }
  if (
    [data.chargingPowerMinW, data.chargingPowerMaxW].some(
      (value) => value !== null && (!Number.isFinite(value) || value < 0),
    ) ||
    (data.chargingPowerMinW !== null &&
      data.chargingPowerMaxW !== null &&
      data.chargingPowerMaxW < data.chargingPowerMinW)
  ) {
    return messages.chargingInvalid;
  }
  const isUsedIphone =
    data.condition === 'used' &&
    /iphone/i.test(`${data.brand || ''} ${data.model || ''} ${data.title}`);
  if (isUsedIphone && data.batteryHealth === null)
    return messages.batteryHealthRequired;

  if (
    !isValidInputLength(data.title, 255) ||
    !isValidInputLength(data.subtitle || '', 255) ||
    !isValidInputLength(data.description || '', 5000) ||
    !isValidInputLength(data.conditionNote || '', 1000) ||
    !isValidInputLength(data.brand || '', 100) ||
    !isValidInputLength(data.model || '', 100) ||
    !isValidInputLength(data.sku || '', 120) ||
    data.images.some((item) => !isValidInputLength(item, 1000))
  ) {
    return messages.inputTooLong;
  }

  return null;
};
