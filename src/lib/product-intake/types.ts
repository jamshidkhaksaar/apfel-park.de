export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export const productIntakeConditions = ['sealed', 'open_box', 'used'] as const;
export type ProductIntakeCondition = (typeof productIntakeConditions)[number];

export const productIntakeSources = ['safi_bot', 'hermes', 'n8n_v2', 'admin', 'manual', 'test'] as const;
export type ProductIntakeSource = (typeof productIntakeSources)[number];

export const productIntakeStatuses = [
  'awaiting_condition',
  'collecting_assets',
  'extracting',
  'researching',
  'proposal_ready',
  'needs_review',
  'approved_once',
  'approved_twice',
  'apply_pending',
  'applied',
  'blocked',
  'failed',
  'rejected',
  'cancelled',
] as const;
export type ProductIntakeStatus = (typeof productIntakeStatuses)[number];

export type ProductIntakeMode = 'shadow' | 'live';
export type ProductIntakeOperation = 'create' | 'update';

export type ProductIntakeActor = {
  type: 'integration' | 'admin' | 'system';
  id: string;
};

export type CreateRunInput = {
  source: ProductIntakeSource;
  sourceReference: string | null;
  condition: ProductIntakeCondition | null;
  submittedBy: string;
  submittedByRole: 'safi' | 'owner' | 'admin' | 'integration' | 'system';
  locale: 'de' | 'en' | null;
  payload: JsonObject;
};

export type UpdateRunInput = {
  condition?: ProductIntakeCondition;
  status?: 'collecting_assets' | 'extracting' | 'researching' | 'blocked' | 'failed' | 'cancelled';
  payload?: JsonObject;
  expectedVersion?: number;
};

export type ProposalSource = {
  id: string;
  kind: 'manufacturer' | 'regulator' | 'gs1' | 'licensed_portal' | 'shop_record';
  url: string;
  title: string | null;
};

export type ProposalFact = {
  field: string;
  value: string | number | boolean;
  sourceUrl: string;
  sourceType: ProposalSource['kind'];
  retrievedAt: string;
  confidence: number;
};

export type ProductIntakeListingCopy = {
  title: string;
  description: string;
  conditionNote: string | null;
};

export type ProductIntakeChannelReadiness = {
  ready: boolean;
  blockers: string[];
};

export type ProductMatchInput = {
  productId: string | null;
  sku: string | null;
  gtin: string | null;
  mpn: string | null;
  hardwareModel: string | null;
  model: string | null;
  storage: string | null;
  color: string | null;
  condition: ProductIntakeCondition;
};

export type ProductProposal = {
  schemaVersion: 2;
  operation: ProductIntakeOperation;
  condition: ProductIntakeCondition;
  target: ProductMatchInput;
  product: {
    title: string | null;
    brand: string | null;
    model: string | null;
    hardwareModel: string | null;
    storage: string | null;
    color: string | null;
    category: string | null;
    batteryHealth: number | null;
    includedAccessories: string[];
  };
  changes: {
    price: number | null;
    inventory: {
      mode: 'set' | 'add';
      quantity: number;
    } | null;
  };
  sources: ProposalSource[];
  facts: ProposalFact[];
  listingPreview: {
    de: ProductIntakeListingCopy;
    en: ProductIntakeListingCopy;
  };
  manualConfirmations: Array<{
    code: string;
    note: string;
    confirmedBy: string;
    confirmedAt: string;
  }>;
  identifierException: {
    reason: string;
    evidenceSourceUrl: string;
    approvedBy: string;
    approvedAt: string;
  } | null;
  notes: string | null;
};

export type DecisionInput = {
  decision: 'approve' | 'reject' | 'request_changes';
  stage: 'draft' | 'publish' | 'update' | null;
  actorId: string | null;
  proposalHash: string;
  reason: string | null;
};

export type RecordVisionAnalysisInput = {
  semanticType: 'barcode_label' | 'about_screen' | 'battery_health';
  model: 'gpt-5.6-sol';
  result: JsonObject;
};

export type RecordAssetInput = {
  assetKey: string;
  kind: "shop_photo" | "barcode_photo" | "about_screenshot" | "battery_health" | "redacted_derivative" | "official_render" | "official_document";
  sha256: string;
  contentType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
  byteSize: number;
  width: number | null;
  height: number | null;
  rightsBasis: "shop_owned" | "submitter_owned" | "manufacturer_licensed" | "official_reference" | "unknown";
  sourceUrl: string | null;
  isRedacted: boolean;
  containsSensitiveIdentifiers: boolean;
  externalProcessingAllowed: boolean;
  metadata: JsonObject;
};

export type ProductMatchCandidate = {
  id: string;
  title: string;
  slug: string | null;
  condition: string;
  sku: string | null;
  gtin: string | null;
  mpn: string | null;
  hardwareModel: string | null;
  model: string | null;
  storage: string | null;
  color: string | null;
};

export type ProductMatchStrategy =
  | 'product_id'
  | 'sku'
  | 'gtin_condition'
  | 'mpn_condition'
  | 'hardware_model_condition'
  | 'model_variant_condition'
  | 'normalized_model_condition';

export type ProductMatchResult = {
  state: 'none' | 'exact' | 'ambiguous';
  strategy: ProductMatchStrategy | null;
  candidates: ProductMatchCandidate[];
  productId: string | null;
};

export type ProposalValidation = {
  valid: boolean;
  blockers: Array<{ code: string; message: string }>;
  warnings: Array<{ code: string; message: string }>;
  readiness: {
    store: ProductIntakeChannelReadiness;
    google: ProductIntakeChannelReadiness;
    ebay: ProductIntakeChannelReadiness;
    amazon: ProductIntakeChannelReadiness;
  };
};

export type ProductIntakeRun = {
  id: string;
  intakeCode: string;
  source: ProductIntakeSource;
  sourceReference: string | null;
  idempotencyKey: string;
  requestHash: string;
  status: ProductIntakeStatus;
  condition: ProductIntakeCondition | null;
  mode: ProductIntakeMode;
  submittedBy: string;
  submittedByRole: CreateRunInput['submittedByRole'];
  locale: 'de' | 'en' | null;
  payload: JsonObject;
  proposal: ProductProposal | null;
  proposalHash: string | null;
  evidenceHash: string | null;
  validation: ProposalValidation;
  matchResult: ProductMatchResult;
  targetProductId: string | null;
  approvalCount: 0 | 1 | 2;
  firstApprovedAt: string | null;
  firstApprovedBy: string | null;
  secondApprovedAt: string | null;
  secondApprovedBy: string | null;
  rejectedAt: string | null;
  rejectedBy: string | null;
  appliedAt: string | null;
  appliedBy: string | null;
  lastError: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type IdempotentResult<T> = {
  value: T;
  duplicate: boolean;
};

export type ProductIntakeAsset = {
  id: string;
  runId: string;
  assetKey: string;
  kind: RecordAssetInput['kind'];
  sha256: string;
  contentType: string;
  byteSize: number;
  width: number | null;
  height: number | null;
  rightsBasis: RecordAssetInput['rightsBasis'];
  sourceUrl: string | null;
  isRedacted: boolean;
  containsSensitiveIdentifiers: boolean;
  externalProcessingAllowed: boolean;
  metadata: JsonObject;
  createdAt: string;
  visionUrl?: string;
  visionExpiresAt?: string;
  visionAnalysis?: {
    id: string;
    semanticType: RecordVisionAnalysisInput['semanticType'];
    model: string;
    resultHash: string;
    result: JsonObject;
    createdAt: string;
  } | null;
};

export type ProductIntakeEvent = {
  id: string;
  eventNumber: number;
  runId: string;
  eventType: string;
  actorType: string;
  actorId: string;
  proposalHash: string | null;
  payload: JsonObject;
  createdAt: string;
};

export type ProductIntakeRunDetail = {
  run: ProductIntakeRun;
  assets: ProductIntakeAsset[];
  events: ProductIntakeEvent[];
};
