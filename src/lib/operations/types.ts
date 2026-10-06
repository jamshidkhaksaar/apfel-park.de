export type OperationsAccess = { userId: string; email: string; owner: boolean; branchId: string | null };
export type Branch = { id: string; code: string; name: string; address: string; active: boolean };
export type StockItem = {
  inventoryId: string; productId: string; sku: string; title: string; category: string; condition: string;
  image: string | null; priceCents: number; branchId: string; branchName: string;
  onHand: number; reserved: number; available: number; minimum: number; target: number;
  missingCosts?: number;
  inventoryVersion?: string; active?: boolean;
};
export type Asset = { id: string; label: string; inventoryId: string; branchId: string; title: string; sku: string;
  state: string; color: string; storage: string; batteryHealth: number | null;
  costGrossCents?: number | null; costNetCents?: number | null; identifierRecorded?: boolean; updatedAt?: string };
export type BasketItem = { inventoryId: string; quantity: number; assetId?: string };
export type TillLine = BasketItem & { title: string; sku: string; unitCents: number; totalCents: number; condition: string };
export type OperationsDocument = { id: string; number: number; kind: string; status: string; branch_id: string;
  destination_id: string | null; payload: Record<string, unknown>; created_at: string };
export type Overview = {
  units: number; reserved: number; lowStock: number; outOfStock: number; missingCosts: number;
  capturedCents: number; refundedCents: number; revenueCents: number | null; shippingIncomeCents: number;
  shippingExpenseCents: number | null; feesCents: number | null; overheadCents: number | null; purchasesCents: number;
  unitsSold: number; orders: number; partialRefundsUnknown: number;
  knownCostCents: number; costUnits: number; stockValueCents: number; contributionCents: number | null;
  outputVatCents: number; inputVatCents: number; taxEstimateCents: number | null;
  incompleteExpenses: number; windowStart: string; windowEnd: string; historicalCostGap: boolean;
  missingPaymentFees: number; missingShippingCosts: number; unpricedShopUnits: number;
  asOf: string; completenessReasons: string[]; unassignedOrders: number;
};

export type StockSummary = { physicalUnits: number; inactiveUnits: number; transitUnits: number; availableUnits: number;
  reservedUnits: number; lowStock: number; outOfStock: number; missingCosts: number; missingDeviceDetails: number; stockValueCents: number };
export type OperationsOverview = { asOf: string; stock: StockSummary; today: Overview; pendingTransfers: number };
export type OperationsReport = { asOf: string; currentStock: StockSummary; summary: Overview; previous: Overview;
  attribution: { knownOrders: number; unassignedOrders: number }; refundBasis: 'selected_sales_cohort'; shopRevenueAvailable: false };
export type ListOptions = { page?: number; kind?: string; status?: string; from?: string; to?: string; q?: string; filter?: string; category?: string };
export type OperationPreview = { token: string; expiresAt: string; branchName: string; action: string;
  changes: Array<{ field: string; before: string | number | null; after: string | number | null }>;
  totalCents?: number; lines?: TillLine[]; alreadyApplied?: boolean };

export const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const moneyCents = (value: unknown): number => {
  const input = String(value ?? '').trim();
  if (!/^\d{1,8}([.,]\d{1,2})?$/.test(input)) throw new Error('invalid_amount');
  const [whole, decimal = ''] = input.replace(',', '.').split('.');
  const cents = Number(whole) * 100 + Number(decimal.padEnd(2, '0'));
  if (!Number.isSafeInteger(cents)) throw new Error('invalid_amount');
  return cents;
};
export const wholeQuantity = (value: unknown, maximum = 1000): number => {
  const quantity = Number(value);
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > maximum) throw new Error('invalid_quantity');
  return quantity;
};
export const assetLabel = (number: number | string): string => `APF-${String(number).padStart(8, '0')}`;
export const isSensitiveSearchInput=(value:string):boolean=>/^\d{15,}$/.test(value.trim()) || /\b(imei|eid|serial(?:number)?|seriennummer)\s*[:=]/i.test(value);
export const assertCashierPayload = (payload: Record<string, unknown>): void => {
  if (Object.keys(payload).some(key => !['action', 'branchId', 'items', 'idempotencyKey'].includes(key))) throw new Error('price_override_forbidden');
  if (!Array.isArray(payload.items) || payload.items.length < 1 || payload.items.length > 100) throw new Error('invalid_basket');
  for (const item of payload.items) {
    if (!item || typeof item !== 'object' || Object.keys(item).some(key => !['inventoryId', 'quantity', 'assetId'].includes(key))) throw new Error('price_override_forbidden');
  }
};
