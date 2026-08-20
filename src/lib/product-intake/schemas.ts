import { validatedGtin } from '@/lib/product-identifiers';
import { isIP } from 'node:net';

import { SchemaValidationError } from './errors';
import { canonicalJson } from './json';
import { assertRedacted } from './redaction';
import {
  productIntakeConditions,
  productIntakeSources,
  type CreateRunInput,
  type DecisionInput,
  type JsonObject,
  type ProductIntakeCondition,
  type ProductProposal,
  type ProposalSource,
  type RecordAssetInput,
  type RecordVisionAnalysisInput,
  type UpdateRunInput,
} from './types';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const hashPattern = /^[a-f0-9]{64}$/;
const idempotencyPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,159}$/;

const record = (value: unknown, path: string): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new SchemaValidationError([`${path} must be an object`]);
  }
  return value as Record<string, unknown>;
};

const strictKeys = (value: Record<string, unknown>, allowed: readonly string[], path: string): void => {
  const extras = Object.keys(value).filter((key) => !allowed.includes(key));
  if (extras.length > 0) throw new SchemaValidationError([`${path} has unsupported fields: ${extras.join(', ')}`]);
};

const text = (
  value: unknown,
  path: string,
  options: { required?: boolean; max?: number; pattern?: RegExp } = {},
): string | null => {
  if (value === undefined || value === null) {
    if (options.required) throw new SchemaValidationError([`${path} is required`]);
    return null;
  }
  if (typeof value !== 'string') throw new SchemaValidationError([`${path} must be a string`]);
  const normalized = value.trim();
  if (options.required && !normalized) throw new SchemaValidationError([`${path} is required`]);
  if (!normalized) return null;
  if (normalized.length > (options.max ?? 500)) throw new SchemaValidationError([`${path} is too long`]);
  if (options.pattern && !options.pattern.test(normalized)) throw new SchemaValidationError([`${path} has an invalid format`]);
  return normalized;
};

const enumValue = <T extends string>(value: unknown, choices: readonly T[], path: string): T => {
  if (typeof value !== 'string' || !choices.includes(value as T)) {
    throw new SchemaValidationError([`${path} must be one of: ${choices.join(', ')}`]);
  }
  return value as T;
};

const nullableEnum = <T extends string>(value: unknown, choices: readonly T[], path: string): T | null => {
  if (value === undefined || value === null || value === '') return null;
  return enumValue(value, choices, path);
};

const jsonObject = (value: unknown, path: string): JsonObject => {
  if (value === undefined) return {};
  const parsed = record(value, path) as JsonObject;
  assertRedacted(parsed);
  if (Buffer.byteLength(canonicalJson(parsed), 'utf8') > 256 * 1024) {
    throw new SchemaValidationError([`${path} exceeds 256 KiB`]);
  }
  return parsed;
};

const numberValue = (
  value: unknown,
  path: string,
  options: { integer?: boolean; min?: number; max?: number } = {},
): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new SchemaValidationError([`${path} must be a finite number`]);
  }
  if (options.integer && !Number.isSafeInteger(value)) throw new SchemaValidationError([`${path} must be a whole number`]);
  if (options.min !== undefined && value < options.min) throw new SchemaValidationError([`${path} is too small`]);
  if (options.max !== undefined && value > options.max) throw new SchemaValidationError([`${path} is too large`]);
  return value;
};

const safeHttpsUrl = (value: unknown, path: string): string => {
  const raw = text(value, path, { required: true, max: 2048 })!;
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new SchemaValidationError([`${path} must be a valid HTTPS URL`]);
  }
  const host = parsed.hostname.toLowerCase();
  if (
    parsed.protocol !== 'https:'
    || parsed.username
    || parsed.password
    || host === 'localhost'
    || host.endsWith('.local')
    || isIP(host) !== 0
    || /^127\./.test(host)
    || /^10\./.test(host)
    || /^192\.168\./.test(host)
    || /^169\.254\./.test(host)
    || /^172\.(?:1[6-9]|2\d|3[01])\./.test(host)
  ) {
    throw new SchemaValidationError([`${path} must be a public HTTPS URL`]);
  }
  parsed.hash = '';
  return parsed.toString();
};

const isoTimestamp = (value: unknown, path: string): string => {
  const raw = text(value, path, { required: true, max: 40 })!;
  const parsed = new Date(raw);
  if (!/^\d{4}-\d{2}-\d{2}T/.test(raw) || Number.isNaN(parsed.getTime())) {
    throw new SchemaValidationError([`${path} must be an ISO-8601 timestamp`]);
  }
  return parsed.toISOString();
};

export const parseIdempotencyKey = (value: unknown): string => {
  const result = text(value, 'idempotency key', { required: true, max: 160, pattern: idempotencyPattern });
  return result!;
};

export const parseRunId = (value: unknown): string => text(value, 'runId', { required: true, max: 36, pattern: uuidPattern })!;

export const parseRunReference = (value: unknown): string => {
  const reference = text(value, 'run reference', { required: true, max: 36 })!;
  if (!uuidPattern.test(reference) && !/^APF-[A-Z0-9]{4,12}$/i.test(reference)) {
    throw new SchemaValidationError(['run reference must be a UUID or APF intake code']);
  }
  return reference.toUpperCase().startsWith('APF-') ? reference.toUpperCase() : reference;
};

export const parseCreateRunInput = (input: unknown): CreateRunInput => {
  assertRedacted(input);
  const value = record(input, '$');
  strictKeys(value, ['source', 'sourceReference', 'condition', 'submittedBy', 'submittedByRole', 'locale', 'payload', 'originProductId', 'requestedScopes'], '$');

  const requestedScopes = value.requestedScopes === undefined
    ? undefined
    : (Array.isArray(value.requestedScopes)
      ? value.requestedScopes.map((entry, index) => text(entry, `$.requestedScopes[${index}]`, { required: true, max: 40 })!)
      : (() => { throw new SchemaValidationError(['$.requestedScopes must be an array']); })());

  const originProductId = text(value.originProductId, '$.originProductId', { max: 36, pattern: uuidPattern });
  return {
    source: enumValue(value.source, productIntakeSources, '$.source'),
    sourceReference: text(value.sourceReference, '$.sourceReference', { max: 200 }),
    condition: nullableEnum(value.condition, productIntakeConditions, '$.condition'),
    submittedBy: text(value.submittedBy, '$.submittedBy', { required: true, max: 200 })!,
    submittedByRole: enumValue(
      value.submittedByRole,
      ['safi', 'owner', 'admin', 'integration', 'system'] as const,
      '$.submittedByRole',
    ),
    locale: nullableEnum(value.locale, ['de', 'en'] as const, '$.locale'),
    payload: jsonObject(value.payload, '$.payload'),
    ...(originProductId ? { originProductId } : {}),
    ...(requestedScopes ? { requestedScopes } : {}),
  };
};

export const parseUpdateRunInput = (input: unknown): UpdateRunInput => {
  assertRedacted(input);
  const value = record(input, '$');
  strictKeys(value, ['condition', 'status', 'payload', 'expectedVersion'], '$');
  if (Object.keys(value).length === 0) throw new SchemaValidationError(['At least one run update is required']);

  const result: UpdateRunInput = {};
  if (value.condition !== undefined) result.condition = enumValue(value.condition, productIntakeConditions, '$.condition');
  if (value.status !== undefined) {
    result.status = enumValue(
      value.status,
      ['collecting_assets', 'extracting', 'researching', 'blocked', 'failed', 'cancelled'] as const,
      '$.status',
    );
  }
  if (value.payload !== undefined) result.payload = jsonObject(value.payload, '$.payload');
  if (value.expectedVersion !== undefined) {
    result.expectedVersion = numberValue(value.expectedVersion, '$.expectedVersion', { integer: true, min: 1 });
  }
  return result;
};

const parseSource = (input: unknown, index: number): ProposalSource => {
  const value = record(input, `$.sources[${index}]`);
  strictKeys(value, ['id', 'kind', 'url', 'title'], `$.sources[${index}]`);
  return {
    id: text(value.id, `$.sources[${index}].id`, { required: true, max: 80, pattern: /^[A-Za-z0-9][A-Za-z0-9._:-]*$/ })!,
    kind: enumValue(
      value.kind,
      ['manufacturer', 'regulator', 'gs1', 'licensed_portal', 'shop_record'] as const,
      `$.sources[${index}].kind`,
    ),
    url: safeHttpsUrl(value.url, `$.sources[${index}].url`),
    title: text(value.title, `$.sources[${index}].title`, { max: 300 }),
  };
};

const sourceKinds = ['manufacturer', 'regulator', 'gs1', 'licensed_portal', 'shop_record'] as const;

const parseFact = (input: unknown, index: number): ProductProposal['facts'][number] => {
  const path = `$.facts[${index}]`;
  const value = record(input, path);
  strictKeys(value, ['field', 'value', 'sourceUrl', 'sourceType', 'retrievedAt', 'confidence'], path);
  const factValue = value.value;
  if (!['string', 'number', 'boolean'].includes(typeof factValue) || (typeof factValue === 'number' && !Number.isFinite(factValue))) {
    throw new SchemaValidationError([`${path}.value must be a string, finite number, or boolean`]);
  }
  return {
    field: text(value.field, `${path}.field`, { required: true, max: 120, pattern: /^[A-Za-z][A-Za-z0-9.[\]_-]*$/ })!,
    value: factValue as string | number | boolean,
    sourceUrl: safeHttpsUrl(value.sourceUrl, `${path}.sourceUrl`),
    sourceType: enumValue(value.sourceType, sourceKinds, `${path}.sourceType`),
    retrievedAt: isoTimestamp(value.retrievedAt, `${path}.retrievedAt`),
    confidence: numberValue(value.confidence, `${path}.confidence`, { min: 0, max: 1 }),
  };
};

const parseListingCopy = (input: unknown, path: string): ProductProposal['listingPreview']['de'] => {
  const value = record(input, path);
  strictKeys(value, ['title', 'description', 'conditionNote'], path);
  return {
    title: text(value.title, `${path}.title`, { required: true, max: 255 })!,
    description: text(value.description, `${path}.description`, { required: true, max: 5000 })!,
    conditionNote: text(value.conditionNote, `${path}.conditionNote`, { max: 2000 }),
  };
};

const parseManualConfirmation = (
  input: unknown,
  index: number,
): ProductProposal['manualConfirmations'][number] => {
  const path = `$.manualConfirmations[${index}]`;
  const value = record(input, path);
  strictKeys(value, ['code', 'note', 'confirmedBy', 'confirmedAt'], path);
  return {
    code: text(value.code, `${path}.code`, { required: true, max: 160, pattern: /^[A-Za-z0-9][A-Za-z0-9._:-]*$/ })!,
    note: text(value.note, `${path}.note`, { required: true, max: 1000 })!,
    confirmedBy: text(value.confirmedBy, `${path}.confirmedBy`, { required: true, max: 200 })!,
    confirmedAt: isoTimestamp(value.confirmedAt, `${path}.confirmedAt`),
  };
};

const optionalUuid = (value: unknown, path: string): string | null => text(value, path, { max: 36, pattern: uuidPattern });

export const parseProductProposal = (input: unknown): ProductProposal => {
  assertRedacted(input);
  const value = record(input, '$');
  strictKeys(value, [
    'schemaVersion', 'operation', 'condition', 'target', 'product', 'changes',
    'sources', 'facts', 'listingPreview', 'manualConfirmations', 'identifierException', 'notes',
  ], '$');
  if (value.schemaVersion !== 2 && value.schemaVersion !== 3) throw new SchemaValidationError(['$.schemaVersion must equal 2 or 3']);

  const operation = enumValue(value.operation, ['create', 'update'] as const, '$.operation');
  const condition = enumValue(value.condition, productIntakeConditions, '$.condition');
  const targetValue = record(value.target ?? {}, '$.target');
  strictKeys(targetValue, ['productId', 'sku', 'gtin', 'mpn', 'hardwareModel', 'model', 'storage', 'color', 'condition'], '$.target');
  if (targetValue.condition !== undefined && targetValue.condition !== condition) {
    throw new SchemaValidationError(['$.target.condition must match $.condition']);
  }
  const productValue = record(value.product ?? {}, '$.product');
  strictKeys(productValue, [
    'title', 'brand', 'model', 'hardwareModel', 'storage', 'color', 'category',
    'batteryHealth', 'includedAccessories',
  ], '$.product');
  const changesValue = record(value.changes ?? {}, '$.changes');
  strictKeys(changesValue, ['price', 'inventory'], '$.changes');

  const rawGtin = text(targetValue.gtin, '$.target.gtin', { max: 32 });
  const gtin = rawGtin ? validatedGtin(rawGtin) : null;
  if (rawGtin && !gtin) throw new SchemaValidationError(['$.target.gtin must have a valid GTIN checksum']);

  let price: number | null = null;
  if (changesValue.price !== undefined && changesValue.price !== null) {
    price = numberValue(changesValue.price, '$.changes.price', { min: 0.01, max: 10_000_000 });
    const cents = Math.round(price * 100);
    if (Math.abs(price - cents / 100) > 1e-9) throw new SchemaValidationError(['$.changes.price supports at most two decimals']);
  }

  let inventory: ProductProposal['changes']['inventory'] = null;
  if (changesValue.inventory !== undefined && changesValue.inventory !== null) {
    const inventoryValue = record(changesValue.inventory, '$.changes.inventory');
    strictKeys(inventoryValue, ['mode', 'quantity'], '$.changes.inventory');
    const mode = enumValue(inventoryValue.mode, ['set', 'add'] as const, '$.changes.inventory.mode');
    const quantity = numberValue(inventoryValue.quantity, '$.changes.inventory.quantity', {
      integer: true,
      min: mode === 'add' ? 1 : 0,
      max: 1_000_000,
    });
    inventory = { mode, quantity };
  }

  const rawAccessories = productValue.includedAccessories ?? [];
  if (!Array.isArray(rawAccessories) || rawAccessories.length > 30) {
    throw new SchemaValidationError(['$.product.includedAccessories must be an array with at most 30 entries']);
  }
  const includedAccessories = rawAccessories.map((entry, index) =>
    text(entry, `$.product.includedAccessories[${index}]`, { required: true, max: 160 })!,
  );
  const category = text(productValue.category, '$.product.category', { max: 80 });
  if (category && !['smartphones', 'tablets', 'accessories', 'consoles', 'laptops'].includes(category)) {
    throw new SchemaValidationError(['$.product.category must be a supported store category']);
  }
  const product = {
    title: text(productValue.title, '$.product.title', { max: 255 }),
    brand: text(productValue.brand, '$.product.brand', { max: 100 }),
    model: text(productValue.model, '$.product.model', { max: 160 }),
    hardwareModel: text(productValue.hardwareModel, '$.product.hardwareModel', { max: 120 }),
    storage: text(productValue.storage, '$.product.storage', { max: 80 }),
    color: text(productValue.color, '$.product.color', { max: 80 }),
    category,
    batteryHealth: productValue.batteryHealth == null
      ? null
      : numberValue(productValue.batteryHealth, '$.product.batteryHealth', { integer: true, min: 1, max: 100 }),
    includedAccessories,
  };
  const mpn = text(targetValue.mpn, '$.target.mpn', { max: 120 });
  if (mpn && (!/^[A-Za-z0-9][A-Za-z0-9._/-]{2,119}$/.test(mpn) || /^(?:n\/?a|none|unknown|test)$/i.test(mpn))) {
    throw new SchemaValidationError(['$.target.mpn must be a real manufacturer part number']);
  }
  const target = {
    productId: optionalUuid(targetValue.productId, '$.target.productId'),
    sku: text(targetValue.sku, '$.target.sku', { max: 120 }),
    gtin,
    mpn,
    hardwareModel: text(targetValue.hardwareModel, '$.target.hardwareModel', { max: 120 }) ?? product.hardwareModel,
    model: text(targetValue.model, '$.target.model', { max: 160 }) ?? product.model,
    storage: text(targetValue.storage, '$.target.storage', { max: 80 }) ?? product.storage,
    color: text(targetValue.color, '$.target.color', { max: 80 }) ?? product.color,
    condition,
  };

  if (operation === 'update' && price === null && inventory === null) {
    throw new SchemaValidationError(['An update proposal must change price or inventory']);
  }
  if (operation === 'update' && !target.productId && !target.sku && !target.gtin && !target.mpn && !target.model) {
    throw new SchemaValidationError(['An update proposal requires explicit matching data']);
  }
  if (operation === 'create') {
    const missing = (['title', 'brand', 'model', 'category'] as const).filter((key) => !product[key]);
    if (missing.length > 0) throw new SchemaValidationError([`A create proposal is missing: ${missing.join(', ')}`]);
    if (price === null || inventory === null) {
      throw new SchemaValidationError(['A create proposal requires price and inventory']);
    }
  }

  if (!Array.isArray(value.sources) || value.sources.length > 30) {
    throw new SchemaValidationError(['$.sources must be an array with at most 30 entries']);
  }
  const sources = value.sources.map(parseSource);
  if (new Set(sources.map((source) => source.id)).size !== sources.length) {
    throw new SchemaValidationError(['$.sources contains duplicate ids']);
  }

  if (!Array.isArray(value.facts) || value.facts.length > 100) {
    throw new SchemaValidationError(['$.facts must be an array with at most 100 entries']);
  }
  const facts = value.facts.map(parseFact);
  const listingValue = record(value.listingPreview, '$.listingPreview');
  strictKeys(listingValue, ['de', 'en'], '$.listingPreview');
  const listingPreview = {
    de: parseListingCopy(listingValue.de, '$.listingPreview.de'),
    en: parseListingCopy(listingValue.en, '$.listingPreview.en'),
  };
  const rawConfirmations = value.manualConfirmations ?? [];
  if (!Array.isArray(rawConfirmations) || rawConfirmations.length > 30) {
    throw new SchemaValidationError(['$.manualConfirmations must be an array with at most 30 entries']);
  }
  const manualConfirmations = rawConfirmations.map(parseManualConfirmation);
  if (new Set(manualConfirmations.map((entry) => entry.code)).size !== manualConfirmations.length) {
    throw new SchemaValidationError(['$.manualConfirmations contains duplicate codes']);
  }
  let identifierException: ProductProposal['identifierException'] = null;
  if (value.identifierException !== undefined && value.identifierException !== null) {
    const exception = record(value.identifierException, '$.identifierException');
    strictKeys(exception, ['reason', 'evidenceSourceUrl', 'approvedBy', 'approvedAt'], '$.identifierException');
    identifierException = {
      reason: text(exception.reason, '$.identifierException.reason', { required: true, max: 1000 })!,
      evidenceSourceUrl: safeHttpsUrl(exception.evidenceSourceUrl, '$.identifierException.evidenceSourceUrl'),
      approvedBy: text(exception.approvedBy, '$.identifierException.approvedBy', { required: true, max: 200 })!,
      approvedAt: isoTimestamp(exception.approvedAt, '$.identifierException.approvedAt'),
    };
  }

  return {
    schemaVersion: value.schemaVersion === 3 ? 3 : 2,
    operation,
    condition,
    target,
    product,
    changes: { price, inventory },
    sources,
    facts,
    listingPreview,
    manualConfirmations,
    identifierException,
    notes: text(value.notes, '$.notes', { max: 2000 }),
  };
};

export const parseDecisionInput = (input: unknown): DecisionInput => {
  assertRedacted(input);
  const value = record(input, '$');
  strictKeys(value, ['decision', 'stage', 'actorId', 'proposalHash', 'reason', 'acceptedPaths'], '$');
  const decision = enumValue(value.decision, ['approve', 'reject', 'request_changes'] as const, '$.decision');
  const stage = nullableEnum(value.stage, ['draft', 'publish', 'update'] as const, '$.stage');
  const reason = text(value.reason, '$.reason', { max: 1000 });
  if (decision !== 'approve' && !reason) throw new SchemaValidationError([`$.reason is required for ${decision}`]);
  if (decision === 'approve' && !stage) throw new SchemaValidationError(['$.stage is required for approve']);
  if (decision !== 'approve' && stage) throw new SchemaValidationError(['$.stage is only valid for approve']);
  const acceptedPaths = value.acceptedPaths === undefined
    ? undefined
    : (Array.isArray(value.acceptedPaths)
      ? value.acceptedPaths.map((entry, index) => text(entry, `$.acceptedPaths[${index}]`, { required: true, max: 80 })!)
      : (() => { throw new SchemaValidationError(['$.acceptedPaths must be an array']); })());
  if (acceptedPaths && decision !== 'approve') throw new SchemaValidationError(['$.acceptedPaths is only valid for approve']);
  return {
    decision,
    stage,
    actorId: text(value.actorId, '$.actorId', { max: 200 }),
    proposalHash: text(value.proposalHash, '$.proposalHash', { required: true, max: 64, pattern: hashPattern })!,
    reason,
    acceptedPaths,
  };
};

export const parseRecordAssetInput = (input: unknown): RecordAssetInput => {
  assertRedacted(input);
  const value = record(input, "$" );
  strictKeys(value, [
    "assetKey", "kind", "sha256", "contentType", "byteSize", "width", "height",
    "rightsBasis", "sourceUrl", "isRedacted", "containsSensitiveIdentifiers",
    "externalProcessingAllowed", "metadata",
  ], "$" );
  const booleanValue = (entry: unknown, path: string): boolean => {
    if (typeof entry !== "boolean") throw new SchemaValidationError([`${path} must be a boolean`]);
    return entry;
  };
  const width = value.width == null ? null : numberValue(value.width, "$.width", { integer: true, min: 1, max: 20000 });
  const height = value.height == null ? null : numberValue(value.height, "$.height", { integer: true, min: 1, max: 20000 });
  if ((width === null) !== (height === null)) throw new SchemaValidationError(["width and height must be supplied together"]);
  const sourceUrl = value.sourceUrl == null ? null : safeHttpsUrl(value.sourceUrl, "$.sourceUrl");
  const kind = enumValue(value.kind, [
    "shop_photo", "barcode_photo", "about_screenshot", "battery_health", "redacted_derivative", "official_render", "official_document",
  ] as const, "$.kind");
  const contentType = enumValue(value.contentType, ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const, "$.contentType");
  if (kind !== "official_document" && contentType === "application/pdf") {
    throw new SchemaValidationError(["Only official_document assets may use application/pdf"]);
  }
  const isRedacted = booleanValue(value.isRedacted, "$.isRedacted");
  const containsSensitiveIdentifiers = booleanValue(value.containsSensitiveIdentifiers, "$.containsSensitiveIdentifiers");
  const externalProcessingAllowed = booleanValue(value.externalProcessingAllowed, "$.externalProcessingAllowed");
  if (externalProcessingAllowed && (containsSensitiveIdentifiers || (["barcode_photo", "about_screenshot", "battery_health"].includes(kind) && !isRedacted))) {
    throw new SchemaValidationError(["Sensitive or unredacted identifier images cannot be externally processed"]);
  }
  const assetKey = text(value.assetKey, "$.assetKey", { required: true, max: 512, pattern: /^[A-Za-z0-9][A-Za-z0-9/_.-]*$/ })!;
  if (assetKey.split('/').includes('..')) throw new SchemaValidationError(["$.assetKey cannot contain parent-directory segments"]);
  const metadata = jsonObject(value.metadata, "$.metadata");
  if (["solVisionCompleted", "visionAnalysis", "analysisResult"].some((key) => key in metadata)) {
    throw new SchemaValidationError(["Vision completion metadata must be appended through the analysis endpoint"]);
  }
  return {
    assetKey,
    kind,
    sha256: text(value.sha256, "$.sha256", { required: true, max: 64, pattern: hashPattern })!,
    contentType,
    byteSize: numberValue(value.byteSize, "$.byteSize", { integer: true, min: 1, max: 25 * 1024 * 1024 }),
    width,
    height,
    rightsBasis: enumValue(value.rightsBasis, ["shop_owned", "submitter_owned", "manufacturer_licensed", "official_reference", "unknown"] as const, "$.rightsBasis"),
    sourceUrl,
    isRedacted,
    containsSensitiveIdentifiers,
    externalProcessingAllowed,
    metadata,
  };
};

export const parseVisionAnalysisInput = (input: unknown): RecordVisionAnalysisInput => {
  assertRedacted(input);
  const value = record(input, '$');
  strictKeys(value, ['semanticType', 'model', 'result'], '$');
  return {
    semanticType: enumValue(value.semanticType, ['barcode_label', 'about_screen', 'battery_health'] as const, '$.semanticType'),
    model: enumValue(value.model, ['gpt-5.6-sol'] as const, '$.model'),
    result: jsonObject(value.result, '$.result'),
  };
};

export const conditionToDatabaseValues = (condition: ProductIntakeCondition): string[] => {
  if (condition === 'sealed') return ['new'];
  if (condition === 'open_box') return ['open_box', 'refurbished'];
  return ['used'];
};
