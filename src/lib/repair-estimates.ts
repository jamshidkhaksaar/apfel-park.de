export type EstimateLanguage = 'de' | 'en';
export type EstimateStatus = 'draft' | 'issued' | 'accepted' | 'declined' | 'expired';

export type EstimateAddress = {
  name: string;
  email: string;
  phone: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
};

export type EstimateInsurer = EstimateAddress & {
  enabled: boolean;
  contactName: string;
  claimNumber: string;
};

export type EstimateDevice = {
  brandId: string;
  familyId: string;
  modelId: string;
  brand: string;
  family: string;
  model: string;
  serialNumber: string;
};

export type EstimateCatalogReference = {
  brandId: string;
  familyId: string;
  modelId: string;
  partId: string;
  variantId: string;
  quality: string;
};

export type EstimateLineItem = {
  id: string;
  description: string;
  quantity: number;
  grossUnitCents: number;
  catalog?: EstimateCatalogReference;
};

export type RepairEstimatePayload = {
  language: EstimateLanguage;
  issueDate: string;
  validUntil: string;
  repairTicket: string;
  customer: EstimateAddress;
  insurer: EstimateInsurer;
  device: EstimateDevice;
  damageAssessment: string;
  items: EstimateLineItem[];
  issuerText: string;
  bankName: string;
  accountHolder: string;
  iban: string;
  bic: string;
  paymentReference: string;
  footerNote: string;
  vatRateBps: number;
};

export type RepairEstimateTemplateSettings = {
  issuerText: string;
  bankName: string;
  accountHolder: string;
  iban: string;
  bic: string;
  vatRateBps: number;
  validityDays: number;
};

export type EstimateTotals = {
  netCents: number;
  vatCents: number;
  grossCents: number;
  lines: Array<{ netCents: number; vatCents: number; grossCents: number }>;
};

export type RepairEstimateRow = {
  id: string;
  estimate_number: string;
  repair_id: string | null;
  status: EstimateStatus;
  language: EstimateLanguage;
  customer_name: string;
  customer_email: string | null;
  insurer_name: string | null;
  device_label: string;
  claim_number: string | null;
  draft_payload: RepairEstimatePayload;
  current_revision: number;
  version_token: number;
  created_at: string;
  updated_at: string;
};

export const defaultEstimateTemplate: RepairEstimateTemplateSettings = {
  issuerText: 'Apfel Park',
  bankName: 'Sparkasse Holstein',
  accountHolder: '',
  iban: 'DE82 2135 2240 0187 9906 92',
  bic: 'NOLADE21HOL',
  vatRateBps: 1900,
  validityDays: 30,
};

const text = (value: unknown, max = 500): string =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

const integer = (value: unknown, fallback: number, min: number, max: number): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
};

const dateOnly = (value: unknown, fallback: string): string => {
  const normalized = text(value, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : fallback;
};

const normalizeAddress = (value: unknown): EstimateAddress => {
  const data = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return {
    name: text(data.name, 160),
    email: text(data.email, 254).toLowerCase(),
    phone: text(data.phone, 60),
    street: text(data.street, 180),
    postalCode: text(data.postalCode, 24),
    city: text(data.city, 100),
    country: text(data.country, 100) || 'Deutschland',
  };
};

export const addDays = (date: string, days: number): string => {
  const parsed = new Date(`${date}T12:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
};

export const createDefaultEstimatePayload = (
  settings: RepairEstimateTemplateSettings,
  language: EstimateLanguage = 'de',
): RepairEstimatePayload => {
  const issueDate = new Date().toISOString().slice(0, 10);
  return {
    language,
    issueDate,
    validUntil: addDays(issueDate, settings.validityDays),
    repairTicket: '',
    customer: { name: '', email: '', phone: '', street: '', postalCode: '', city: '', country: language === 'de' ? 'Deutschland' : 'Germany' },
    insurer: { enabled: false, name: '', contactName: '', email: '', phone: '', street: '', postalCode: '', city: '', country: language === 'de' ? 'Deutschland' : 'Germany', claimNumber: '' },
    device: { brandId: '', familyId: '', modelId: '', brand: '', family: '', model: '', serialNumber: '' },
    damageAssessment: '',
    items: [],
    issuerText: settings.issuerText,
    bankName: settings.bankName,
    accountHolder: settings.accountHolder,
    iban: settings.iban,
    bic: settings.bic,
    paymentReference: '',
    footerNote: language === 'de'
      ? 'Dieser Kostenvoranschlag wurde nach technischer Prüfung erstellt und kann bei einer Versicherung oder Garantiegesellschaft eingereicht werden.'
      : 'This repair cost estimate was prepared following a technical inspection and may be submitted to an insurance or warranty company.',
    vatRateBps: settings.vatRateBps,
  };
};

export const normalizeEstimatePayload = (
  value: unknown,
  fallbackSettings: RepairEstimateTemplateSettings = defaultEstimateTemplate,
): RepairEstimatePayload => {
  const data = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const language: EstimateLanguage = data.language === 'en' ? 'en' : 'de';
  const today = new Date().toISOString().slice(0, 10);
  const issueDate = dateOnly(data.issueDate, today);
  const insurerData = data.insurer && typeof data.insurer === 'object' ? data.insurer as Record<string, unknown> : {};
  const deviceData = data.device && typeof data.device === 'object' ? data.device as Record<string, unknown> : {};
  const items = Array.isArray(data.items) ? data.items.slice(0, 100).map((item, index) => {
    const row = item && typeof item === 'object' ? item as Record<string, unknown> : {};
    const catalogData = row.catalog && typeof row.catalog === 'object' ? row.catalog as Record<string, unknown> : null;
    return {
      id: text(row.id, 80) || `line-${index + 1}`,
      description: text(row.description, 400),
      quantity: integer(row.quantity, 1, 1, 100),
      grossUnitCents: integer(row.grossUnitCents, 0, 0, 100_000_000),
      ...(catalogData ? {
        catalog: {
          brandId: text(catalogData.brandId, 100),
          familyId: text(catalogData.familyId, 100),
          modelId: text(catalogData.modelId, 100),
          partId: text(catalogData.partId, 100),
          variantId: text(catalogData.variantId, 100),
          quality: text(catalogData.quality, 40),
        },
      } : {}),
    };
  }) : [];

  return {
    language,
    issueDate,
    validUntil: dateOnly(data.validUntil, addDays(issueDate, fallbackSettings.validityDays)),
    repairTicket: text(data.repairTicket, 80),
    customer: normalizeAddress(data.customer),
    insurer: {
      ...normalizeAddress(insurerData),
      enabled: insurerData.enabled === true,
      contactName: text(insurerData.contactName, 160),
      claimNumber: text(insurerData.claimNumber, 120),
    },
    device: {
      brandId: text(deviceData.brandId, 100),
      familyId: text(deviceData.familyId, 100),
      modelId: text(deviceData.modelId, 100),
      brand: text(deviceData.brand, 100),
      family: text(deviceData.family, 100),
      model: text(deviceData.model, 180),
      serialNumber: text(deviceData.serialNumber, 120),
    },
    damageAssessment: text(data.damageAssessment, 5000),
    items,
    issuerText: text(data.issuerText, 500) || fallbackSettings.issuerText,
    bankName: text(data.bankName, 160) || fallbackSettings.bankName,
    accountHolder: text(data.accountHolder, 160),
    iban: text(data.iban, 80).toUpperCase() || fallbackSettings.iban,
    bic: text(data.bic, 20).toUpperCase() || fallbackSettings.bic,
    paymentReference: text(data.paymentReference, 160),
    footerNote: text(data.footerNote, 1500),
    vatRateBps: integer(data.vatRateBps, fallbackSettings.vatRateBps, 0, 10_000),
  };
};

export const calculateEstimateTotals = (payload: RepairEstimatePayload): EstimateTotals => {
  const divisor = 10_000 + payload.vatRateBps;
  const grossCents = payload.items.reduce((sum, item) => sum + item.grossUnitCents * item.quantity, 0);
  const targetNetCents = Math.round((grossCents * 10_000) / divisor);
  const lines = payload.items.map((item) => {
    const grossCents = item.grossUnitCents * item.quantity;
    const netCents = Math.round((grossCents * 10_000) / divisor);
    return { grossCents, netCents, vatCents: grossCents - netCents };
  });
  if (lines.length > 0) {
    const roundedNetCents = lines.reduce((sum, line) => sum + line.netCents, 0);
    const adjustment = targetNetCents - roundedNetCents;
    const last = lines[lines.length - 1];
    last.netCents += adjustment;
    last.vatCents = last.grossCents - last.netCents;
  }
  return lines.reduce<EstimateTotals>((totals, line) => ({
    netCents: totals.netCents + line.netCents,
    vatCents: totals.vatCents + line.vatCents,
    grossCents: totals.grossCents + line.grossCents,
    lines: [...totals.lines, line],
  }), { netCents: 0, vatCents: 0, grossCents: 0, lines: [] });
};

export const normalizeIban = (value: string): string => value.replace(/\s+/g, '').toUpperCase();

export const isValidIban = (value: string): boolean => {
  const iban = normalizeIban(value);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
  const rearranged = `${iban.slice(4)}${iban.slice(0, 4)}`;
  const numeric = rearranged.replace(/[A-Z]/g, (letter) => String(letter.charCodeAt(0) - 55));
  let remainder = 0;
  for (const digit of numeric) remainder = (remainder * 10 + Number(digit)) % 97;
  return remainder === 1;
};

export const isValidBic = (value: string): boolean => /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(value.replace(/\s+/g, '').toUpperCase());

export const validateEstimatePayload = (payload: RepairEstimatePayload, forIssue = false): string[] => {
  const errors: string[] = [];
  if (forIssue && !payload.customer.name) errors.push('customer_name');
  if (forIssue && !payload.device.model) errors.push('device');
  if (forIssue && !payload.damageAssessment) errors.push('damage_assessment');
  if (forIssue && payload.items.length === 0) errors.push('items');
  if (payload.items.some((item) => !item.description || item.grossUnitCents < 0 || item.quantity < 1)) errors.push('items');
  if (payload.customer.email && !/^\S+@\S+\.\S+$/.test(payload.customer.email)) errors.push('customer_email');
  if (payload.insurer.enabled && payload.insurer.email && !/^\S+@\S+\.\S+$/.test(payload.insurer.email)) errors.push('insurer_email');
  if (forIssue) {
    if (!payload.issuerText) errors.push('issuer');
    if (!payload.accountHolder) errors.push('account_holder');
    if (!isValidIban(payload.iban)) errors.push('iban');
    if (!isValidBic(payload.bic)) errors.push('bic');
  }
  return [...new Set(errors)];
};

export const normalizeTemplateSettings = (value: unknown): RepairEstimateTemplateSettings => {
  const data = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return {
    issuerText: text(data.issuerText, 500) || defaultEstimateTemplate.issuerText,
    bankName: text(data.bankName, 160) || defaultEstimateTemplate.bankName,
    accountHolder: text(data.accountHolder, 160),
    iban: text(data.iban, 80).toUpperCase() || defaultEstimateTemplate.iban,
    bic: text(data.bic, 20).toUpperCase() || defaultEstimateTemplate.bic,
    vatRateBps: integer(data.vatRateBps, defaultEstimateTemplate.vatRateBps, 0, 10_000),
    validityDays: integer(data.validityDays, defaultEstimateTemplate.validityDays, 1, 365),
  };
};
