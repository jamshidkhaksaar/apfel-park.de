import { isApprovedProposalSource } from './source-policy';
import { evaluateProductChannelReadiness } from '@/lib/product-channel-readiness';
import type {
  JsonValue,
  ProductIntakeAsset,
  ProductMatchResult,
  ProductProposal,
  ProposalValidation,
} from './types';

const metadataArray = (asset: ProductIntakeAsset, key: string): JsonValue[] => {
  const value = asset.metadata[key];
  return Array.isArray(value) ? value : [];
};

const metadataStrings = (asset: ProductIntakeAsset, key: string): string[] =>
  metadataArray(asset, key).filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);

const exactViews = (assets: ProductIntakeAsset[]): Set<string> => {
  const views = new Set<string>();
  for (const asset of assets) {
    if (asset.kind !== 'shop_photo' || asset.metadata.exactItem !== true) continue;
    if (typeof asset.metadata.view === 'string') views.add(asset.metadata.view.toLowerCase());
    for (const view of metadataStrings(asset, 'views')) views.add(view.toLowerCase());
  }
  return views;
};

const normalizedUrl = (value: string): string => {
  try {
    const url = new URL(value);
    url.hash = '';
    return url.toString();
  } catch {
    return value;
  }
};

const normalizedValue = (value: string | number | boolean): string =>
  typeof value === 'string' ? value.trim().toLowerCase().replace(/\s+/g, ' ') : String(value);

const expectedFactValues = (proposal: ProductProposal): Map<string, string | number | boolean> => {
  const values: Record<string, string | number | boolean | null> = {
    'product.title': proposal.product.title,
    'product.brand': proposal.product.brand,
    'product.model': proposal.product.model,
    'product.hardwareModel': proposal.product.hardwareModel,
    'product.storage': proposal.product.storage,
    'product.color': proposal.product.color,
    'product.category': proposal.product.category,
    'product.batteryHealth': proposal.product.batteryHealth,
    'product.includedAccessories': proposal.product.includedAccessories.join(', '),
    'target.gtin': proposal.target.gtin,
    'target.mpn': proposal.target.mpn,
    'changes.price': proposal.changes.price,
    'changes.inventory.mode': proposal.changes.inventory?.mode ?? null,
    'changes.inventory.quantity': proposal.changes.inventory?.quantity ?? null,
    'condition.notes': proposal.notes,
  };
  const result = new Map<string, string | number | boolean>();
  for (const [field, value] of Object.entries(values)) {
    if (value !== null) result.set(field, value);
  }
  return result;
};

const officialFactField = (field: string): boolean =>
  (field.startsWith('product.') && !['product.includedAccessories', 'product.batteryHealth'].includes(field))
  || field.startsWith('target.')
  || field.startsWith('specs.');

const shopFactField = (field: string): boolean =>
  field.startsWith('changes.') || field === 'condition.notes'
  || ['product.includedAccessories', 'product.batteryHealth'].includes(field);

export const validateProposalMatch = (
  proposal: ProductProposal,
  match: ProductMatchResult,
  assets: ProductIntakeAsset[] = [],
): ProposalValidation => {
  const blockers: ProposalValidation['blockers'] = [];
  const warnings: ProposalValidation['warnings'] = [];
  const confirmed = new Set(proposal.manualConfirmations.map((entry) => entry.code));
  const addBlocker = (code: string, message: string) => {
    if (!blockers.some((entry) => entry.code === code)) blockers.push({ code, message });
  };

  if (proposal.operation === 'update') {
    if (match.state === 'none') {
      addBlocker('product_not_found', 'No existing product matched the supplied exact identifiers.');
    } else if (match.state === 'ambiguous') {
      addBlocker('ambiguous_product_match', 'More than one product matched; owner selection is required.');
    }
    if (proposal.changes.inventory && !proposal.target.sku) {
      addBlocker('missing_update_sku', 'Inventory updates require the exact sellable SKU, even when the product model matches uniquely.');
    }
    if (match.state === 'exact' && ['hardware_model_condition', 'model_variant_condition', 'normalized_model_condition'].includes(match.strategy ?? '')) {
      addBlocker('weak_match_requires_selection', 'Model-based matches are suggestions only; select an explicit product ID or exact SKU/GTIN/MPN.');
    }
  } else if (match.state !== 'none') {
    addBlocker(
      match.state === 'ambiguous' ? 'ambiguous_existing_product' : 'existing_product_match',
      'The proposed new product may already exist; creation remains blocked for owner review.',
    );
  }

  const sourceByUrl = new Map(proposal.sources.map((source) => [normalizedUrl(source.url), source]));
  for (const source of proposal.sources) {
    if (!isApprovedProposalSource(source)) {
      addBlocker(`unapproved_source:${source.id}`, `The source domain is not approved for ${source.kind}: ${source.url}`);
    }
  }
  if (proposal.operation === 'create' && !proposal.sources.some((source) => source.kind !== 'shop_record')) {
    addBlocker('missing_official_source', 'At least one approved official product source is required.');
  }
  if (proposal.operation === 'update' && proposal.sources.length === 0) {
    warnings.push({ code: 'missing_update_source', message: 'Record a source for the proposed price or inventory update.' });
  }

  const expectedFacts = expectedFactValues(proposal);
  for (const [index, fact] of proposal.facts.entries()) {
    const source = sourceByUrl.get(normalizedUrl(fact.sourceUrl));
    if (!source || source.kind !== fact.sourceType) {
      addBlocker(`unlinked_fact:${index}`, `Evidence for ${fact.field} is not linked to a matching declared source.`);
    }
    if (officialFactField(fact.field) && fact.sourceType === 'shop_record') {
      addBlocker(`invalid_fact_source:${fact.field}`, `${fact.field} requires manufacturer, regulator, GS1, or licensed evidence.`);
    }
    if (shopFactField(fact.field) && fact.sourceType !== 'shop_record') {
      addBlocker(`invalid_fact_source:${fact.field}`, `${fact.field} must be tied to the signed Apfel Park intake record.`);
    }
    const expected = expectedFacts.get(fact.field);
    if (expected !== undefined && normalizedValue(fact.value) !== normalizedValue(expected)) {
      addBlocker(`fact_value_mismatch:${fact.field}`, `Evidence value for ${fact.field} does not match the proposal.`);
    }
    if (fact.confidence < (fact.sourceType === 'shop_record' ? 0.99 : 0.8)) {
      addBlocker(`low_fact_confidence:${fact.field}`, `Evidence confidence for ${fact.field} is below the publication threshold.`);
    }
    if (Date.parse(fact.retrievedAt) > Date.now() + 5 * 60 * 1000) {
      addBlocker(`future_fact:${fact.field}`, `Evidence timestamp for ${fact.field} is in the future.`);
    }
  }
  const evidencedFields = new Set(proposal.facts.map((fact) => fact.field));
  const requiredFacts: string[] = [];
  if (proposal.operation === 'create') {
    for (const [field, value] of Object.entries({
      'product.title': proposal.product.title,
      'product.brand': proposal.product.brand,
      'product.model': proposal.product.model,
      'product.hardwareModel': proposal.product.hardwareModel,
      'product.storage': proposal.product.storage,
      'product.color': proposal.product.color,
      'product.category': proposal.product.category,
      'target.gtin': proposal.target.gtin,
      'target.mpn': proposal.target.mpn,
    })) {
      if (value !== null) requiredFacts.push(field);
    }
    requiredFacts.push('changes.price', 'changes.inventory.mode', 'changes.inventory.quantity');
    if (proposal.product.includedAccessories.length > 0) requiredFacts.push('product.includedAccessories');
    if (proposal.product.batteryHealth !== null) requiredFacts.push('product.batteryHealth');
    if (proposal.notes) requiredFacts.push('condition.notes');
  } else {
    if (proposal.changes.price !== null) requiredFacts.push('changes.price');
    if (proposal.changes.inventory !== null) requiredFacts.push('changes.inventory.mode', 'changes.inventory.quantity');
  }
  for (const field of requiredFacts) {
    if (!evidencedFields.has(field)) addBlocker(`missing_fact:${field}`, `Auditable evidence is missing for ${field}.`);
  }

  if (proposal.condition !== 'sealed' && !proposal.notes) {
    addBlocker('missing_condition_note', 'Open-Box and Used proposals require an exact cosmetic and functional condition note.');
  }
  if (proposal.condition !== 'sealed' && (!proposal.listingPreview.de.conditionNote || !proposal.listingPreview.en.conditionNote)) {
    addBlocker('missing_listing_condition_note', 'Open-Box and Used previews require German and English condition notes.');
  }
  if (proposal.condition !== 'sealed' && proposal.product.includedAccessories.length === 0) {
    addBlocker('missing_included_accessories', 'Record included accessories, using “none” when the device has no accessories.');
  }

  const deviceCategory = ['smartphones', 'tablets'].includes(proposal.product.category ?? '');
  if (proposal.operation === 'create' && !proposal.target.sku) {
    addBlocker('missing_sku', 'A new product requires a unique SKU before draft creation.');
  }
  if (proposal.operation === 'create' && proposal.changes.inventory?.mode !== 'set') {
    addBlocker('invalid_new_inventory_mode', 'New products must set their opening stock; add is only valid for an existing SKU.');
  }
  if (proposal.operation === 'create' && deviceCategory && !proposal.target.gtin && !proposal.target.mpn && !proposal.identifierException) {
    addBlocker('missing_device_identifier', 'Phones and tablets require a valid GTIN or MPN before draft publication.');
  }
  if (proposal.identifierException) {
    const source = sourceByUrl.get(normalizedUrl(proposal.identifierException.evidenceSourceUrl));
    if (proposal.target.gtin || proposal.target.mpn || !source) {
      addBlocker('invalid_identifier_exception', 'Identifier exceptions require no assigned GTIN/MPN and a declared evidence source.');
    }
  }

  for (const [field, targetValue, productValue] of [
    ['model', proposal.target.model, proposal.product.model],
    ['hardwareModel', proposal.target.hardwareModel, proposal.product.hardwareModel],
    ['storage', proposal.target.storage, proposal.product.storage],
    ['color', proposal.target.color, proposal.product.color],
  ] as const) {
    if (targetValue && productValue && normalizedValue(targetValue) !== normalizedValue(productValue)) {
      addBlocker(`target_product_mismatch:${field}`, `Target ${field} conflicts with the product ${field}.`);
    }
  }
  if (proposal.product.title && normalizedValue(proposal.listingPreview.de.title) !== normalizedValue(proposal.product.title)) {
    addBlocker('listing_title_mismatch', 'The German listing title must match the proposed product title.');
  }
  if (proposal.condition !== 'sealed'
    && proposal.listingPreview.de.conditionNote
    && proposal.notes
    && normalizedValue(proposal.listingPreview.de.conditionNote) !== normalizedValue(proposal.notes)) {
    addBlocker('condition_note_mismatch', 'The German listing condition note must match the audited condition note.');
  }

  const exactPhotos = assets.filter((asset) =>
    asset.kind === 'shop_photo'
    && asset.rightsBasis === 'shop_owned'
    && asset.metadata.exactItem === true
    && asset.metadata.privacyScanPassed === true
    && !asset.containsSensitiveIdentifiers,
  );
  const aboutScreens = assets.filter((asset) =>
    asset.metadata.assetType === 'about_screen'
    && asset.visionAnalysis?.semanticType === 'about_screen'
    && asset.visionAnalysis.model === 'gpt-5.6-sol'
    && asset.isRedacted
    && !asset.containsSensitiveIdentifiers
    && asset.metadata.solVisionCompleted === true,
  );
  const batteryScreens = assets.filter((asset) =>
    asset.metadata.assetType === 'battery_health'
    && asset.visionAnalysis?.semanticType === 'battery_health'
    && asset.visionAnalysis.model === 'gpt-5.6-sol'
    && asset.isRedacted
    && !asset.containsSensitiveIdentifiers
    && asset.metadata.solVisionCompleted === true,
  );
  const barcodeScreens = assets.filter((asset) =>
    asset.metadata.assetType === 'barcode_label'
    && asset.visionAnalysis?.semanticType === 'barcode_label'
    && asset.visionAnalysis.model === 'gpt-5.6-sol'
    && asset.isRedacted
    && !asset.containsSensitiveIdentifiers
    && asset.metadata.solVisionCompleted === true,
  );
  const publicationPhotos = assets.filter((asset) =>
    asset.kind === 'shop_photo'
    && asset.rightsBasis === 'shop_owned'
    && !asset.containsSensitiveIdentifiers
    && asset.metadata.privacyScanPassed === true
    && asset.metadata.publishable === true,
  );

  if (proposal.condition === 'sealed' && barcodeScreens.length === 0) {
    addBlocker('missing_barcode_label', 'Sealed devices require a redacted barcode-label asset completed by Sol vision.');
  }
  if (proposal.condition !== 'sealed') {
    if (exactPhotos.length === 0) addBlocker('missing_exact_photos', 'Open-Box and Used devices require shop-owned exact-item photos.');
    if (aboutScreens.length === 0) addBlocker('missing_about_screen', 'Open-Box and Used devices require a redacted About-page screenshot completed by Sol vision.');
    const views = exactViews(exactPhotos);
    const requiredViews = proposal.condition === 'used' ? ['front', 'back', 'screen', 'frame'] : ['front', 'back'];
    const missingViews = requiredViews.filter((view) => !views.has(view));
    if (missingViews.length > 0) {
      addBlocker('missing_exact_photo_views', `Exact-item photos are missing these views: ${missingViews.join(', ')}.`);
    }
  }
  const usedIphone = proposal.condition === 'used'
    && proposal.product.brand?.trim().toLowerCase() === 'apple'
    && proposal.product.category === 'smartphones';
  if (usedIphone && batteryScreens.length === 0) {
    addBlocker('missing_battery_health', 'Used iPhones require a redacted Battery Health screenshot completed by Sol vision.');
  }
  if (usedIphone && proposal.product.batteryHealth === null) {
    addBlocker('missing_battery_health_value', 'Used iPhones require a verified Battery Health percentage.');
  }
  if (usedIphone && proposal.product.batteryHealth !== null
    && !batteryScreens.some((asset) => Number(asset.metadata.batteryHealth) === proposal.product.batteryHealth)) {
    addBlocker('battery_health_evidence_mismatch', 'Battery Health value must match the immutable analyzed Battery Health screenshot.');
  }
  if (proposal.operation === 'create' && publicationPhotos.length === 0) {
    addBlocker('missing_publishable_image', 'A new product requires at least one permitted publishable image.');
  }

  for (const asset of assets) {
    if (asset.rightsBasis === 'unknown') addBlocker(`unknown_image_rights:${asset.id}`, `Image rights are unknown for ${asset.assetKey}.`);
    if (asset.metadata.isPrimary === true && proposal.condition !== 'sealed' && asset.metadata.exactItem !== true) {
      addBlocker('non_exact_primary_image', 'The primary Open-Box/Used image must show the exact item.');
    }
    if (asset.containsSensitiveIdentifiers && asset.externalProcessingAllowed) {
      addBlocker('sensitive_external_asset', 'Sensitive identifier media cannot be sent to external vision.');
    }
    const conflicts = metadataStrings(asset, 'conflicts');
    const conflictCode = `vision_conflict:${asset.id}`;
    if (conflicts.length > 0 && !confirmed.has(conflictCode)) {
      addBlocker(conflictCode, `Vision conflict requires owner resolution: ${conflicts.join('; ')}`);
    }
    const confirmations = metadataStrings(asset, 'requiresConfirmation');
    const confirmationCode = `vision_confirmation:${asset.id}`;
    if (confirmations.length > 0 && !confirmed.has(confirmationCode)) {
      addBlocker(confirmationCode, `Vision result requires owner confirmation: ${confirmations.join('; ')}`);
    }
    const identifierCandidates = metadataArray(asset, 'gtinCandidates')
      .filter((entry): entry is { value?: JsonValue; checksumValid?: JsonValue; extractionMethod?: JsonValue; autoAccept?: JsonValue; localDecoder?: JsonValue } =>
        Boolean(entry && typeof entry === 'object' && !Array.isArray(entry)),
      );
    const visionValues = new Set(
      identifierCandidates
        .filter((candidate) => candidate.extractionMethod === 'vision')
        .map((candidate) => String(candidate.value ?? '')),
    );
    const corroboratedValues = new Set(
      identifierCandidates
        .filter((candidate) =>
          candidate.checksumValid === true
          && (candidate.autoAccept === true
            || candidate.extractionMethod === 'ocr' && visionValues.has(String(candidate.value ?? ''))),
        )
        .map((candidate) => String(candidate.value ?? '')),
    );
    const uncorroboratedVisionDigits = identifierCandidates.some((candidate) =>
      candidate.extractionMethod === 'vision'
      && /^\d+$/.test(String(candidate.value ?? ''))
      && !corroboratedValues.has(String(candidate.value)),
    );
    if (uncorroboratedVisionDigits && !confirmed.has(confirmationCode)) {
      addBlocker(confirmationCode, 'A vision-only numeric identifier requires explicit owner confirmation.');
    }
    if (identifierCandidates.some((candidate) => candidate.checksumValid === false) && !confirmed.has(confirmationCode)) {
      addBlocker(confirmationCode, 'A GTIN-like identifier failed checksum validation and cannot be used automatically.');
    }
  }

  if (proposal.target.gtin && barcodeScreens.length > 0) {
    const decoded = barcodeScreens.flatMap((asset) => metadataArray(asset, 'gtinCandidates'))
      .filter((entry): entry is { value?: JsonValue; checksumValid?: JsonValue; extractionMethod?: JsonValue; autoAccept?: JsonValue; localDecoder?: JsonValue } =>
        Boolean(entry && typeof entry === 'object' && !Array.isArray(entry)),
      );
    const validDecoded = decoded.filter((candidate) =>
      candidate.checksumValid === true && candidate.extractionMethod === 'barcode'
      && candidate.localDecoder === true && candidate.autoAccept === true,
    );
    if (new Set(validDecoded.map((candidate) => String(candidate.value))).size > 1) {
      addBlocker('multiple_gtin_asset_conflict', 'Different checksum-valid GTIN values were decoded across barcode evidence.');
    }
    if (validDecoded.length > 0 && !validDecoded.some((candidate) => candidate.value === proposal.target.gtin)) {
      addBlocker('gtin_asset_conflict', 'The proposed GTIN does not match the checksum-valid barcode decoder result.');
    }
    if (!validDecoded.some((candidate) => candidate.value === proposal.target.gtin)) {
      addBlocker('missing_deterministic_gtin', 'The proposed GTIN requires an exact checksum-valid local retail-barcode decoder match.');
    }
  } else if (proposal.target.gtin) {
    addBlocker('missing_deterministic_gtin', 'The proposed GTIN requires an exact checksum-valid local retail-barcode decoder match.');
  }

  const coreMessages = blockers.map((entry) => entry.message);
  const standardReadiness = evaluateProductChannelReadiness({
    title: proposal.listingPreview.de.title,
    description: proposal.listingPreview.de.description,
    category: proposal.product.category ?? undefined,
    condition: proposal.condition === 'sealed' ? 'new' : proposal.condition,
    conditionNote: proposal.notes ?? undefined,
    hasRealProductPhotos: publicationPhotos.some((asset) => asset.metadata.exactItem === true),
    brand: proposal.product.brand ?? undefined,
    price: proposal.changes.price ?? undefined,
    stock: proposal.changes.inventory?.quantity,
    sku: proposal.target.sku ?? undefined,
    mpn: proposal.target.mpn ?? undefined,
    gtin: proposal.target.gtin ?? undefined,
    identifierStatus: proposal.target.gtin || proposal.target.mpn
      ? 'assigned'
      : proposal.identifierException
        ? 'not_applicable'
        : 'unknown',
    images: publicationPhotos.map((asset) => asset.assetKey),
  });
  const channelBlockers = (channel: keyof typeof standardReadiness, extra: string[] = []) =>
    [...new Set([
      ...coreMessages,
      ...(proposal.operation === 'create' ? standardReadiness[channel].errors : []),
      ...(proposal.operation === 'create' ? extra : []),
    ])];
  const storeBlockers = channelBlockers('store');
  const googleBlockers = channelBlockers('google');
  const ebayBlockers = channelBlockers('ebay', ['Per-product eBay approval is required before publication.']);
  const amazonBlockers = channelBlockers('amazon', ['Per-product Amazon approval is required before publication.']);
  const readiness = {
    store: { ready: storeBlockers.length === 0, blockers: storeBlockers },
    google: { ready: googleBlockers.length === 0, blockers: googleBlockers },
    ebay: { ready: ebayBlockers.length === 0, blockers: ebayBlockers },
    amazon: { ready: amazonBlockers.length === 0, blockers: amazonBlockers },
  };

  return { valid: blockers.length === 0, blockers, warnings, readiness };
};
