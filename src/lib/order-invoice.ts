import { businessIdentity } from '@/lib/business-identity';
import { isValidEmail } from '@/lib/security';

export type InvoiceTaxMode = 'standard' | 'margin';
export type InvoiceAddress = { name: string; line1: string; line2: string; postalCode: string; city: string; country: string };
export type InvoiceSettings = { approvedAt: string | null; taxId: string; taxConfirmed: boolean };
export type InvoiceOrder = {
  id: string; order_number: number | null; payment_status: string; status: string;
  customer_name: string; customer_email: string; customer_address: Record<string, unknown> | null;
  paid_at: string | null; provider: string | null; checkout_locale: string | null; currency: string;
  subtotal_amount: string | number; shipping_amount: string | number; discount_amount: string | number;
  total_amount: string | number; vat_rate: string | number; vat_amount: string | number;
  items: unknown;
};
export type InvoiceSnapshot = {
  version: 1; preview: boolean; number: string; orderId: string; orderLabel: string;
  kind: 'sale' | 'advance'; issueDate: string; supplyDate: string; paidDate: string; locale: 'de' | 'en';
  customer: InvoiceAddress; email: string; paymentMethod: string;
  issuer: { name: string; owner: string; address: string; taxId: string; email: string; phone: string; website: string };
  lines: Array<{ title: string; detail: string; sku: string; quantity: number; unitCents: number; grossCents: number; condition: string }>;
  subtotalCents: number; shippingCents: number; discountCents: number; totalCents: number;
  taxMode: InvoiceTaxMode; vatRateBps: number; netCents: number | null; vatCents: number | null;
};

export const invoiceDefaults: InvoiceSettings = { approvedAt: null, taxId: '', taxConfirmed: false };
export const invoiceDate = (date = new Date()): string => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(date);

const cents = (value: unknown): number => {
  if ((typeof value !== 'number' && typeof value !== 'string') || value === '') throw new Error('Missing invoice amount');
  const result = Math.round(Number(value) * 100);
  if (!Number.isSafeInteger(result) || result < 0) throw new Error('Invalid invoice amount');
  return result;
};
const text = (value: unknown, max = 500): string => typeof value === 'string' ? value.trim().slice(0, max) : '';
const validDate = (value: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(value)
  && Number.isFinite(Date.parse(`${value}T12:00:00Z`)) && new Date(`${value}T12:00:00Z`).toISOString().startsWith(value);
export const normalizeInvoiceSettings = (value: unknown): InvoiceSettings => {
  const data = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const taxId = text(data.taxId, 40);
  const approvedAt = typeof data.approvedAt === 'string' && Number.isFinite(Date.parse(data.approvedAt)) ? data.approvedAt : null;
  return { approvedAt, taxId, taxConfirmed: data.taxConfirmed === true && taxId.length > 0 };
};
export const normalizeInvoiceAddress = (value: unknown, name = ''): InvoiceAddress => {
  const data = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return { name: text(data.name) || name, line1: text(data.line1), line2: text(data.line2), postalCode: text(data.postalCode, 20), city: text(data.city, 100), country: text(data.country, 100) || 'DE' };
};

export const buildInvoiceSnapshot = (order: InvoiceOrder, settings: InvoiceSettings, options: {
  number: string; supplyDate: string; taxMode: InvoiceTaxMode; billingAddress?: unknown; preview?: boolean;
}): InvoiceSnapshot => {
  if (order.payment_status !== 'paid' || ['cancelled', 'refunded'].includes(order.status) || !order.paid_at) throw new Error('Only successfully paid orders can be invoiced');
  if (order.currency !== 'EUR') throw new Error('Only EUR invoices are supported');
  if (!isValidEmail(order.customer_email)) throw new Error('A valid customer email is required');
  if (!options.preview && (!settings.approvedAt || !settings.taxConfirmed || !settings.taxId)) throw new Error('Invoice design and seller tax details must be approved first');
  const issueDate = invoiceDate();
  if (options.supplyDate && (!validDate(options.supplyDate) || options.supplyDate > issueDate)) throw new Error('Confirm the actual supply date before issuing the invoice');
  const customer = normalizeInvoiceAddress(options.billingAddress ?? order.customer_address, order.customer_name);
  if (!customer.name || !customer.line1 || !customer.postalCode || !customer.city) throw new Error('Complete billing name and address are required');
  if (!Array.isArray(order.items) || !order.items.length || order.items.length > 200) throw new Error('Invalid order items');
  const lines = order.items.map((value: unknown) => {
    if (!value || typeof value !== 'object') throw new Error('Invalid order line');
    const item = value as Record<string, unknown>;
    const quantity = Number(item.quantity);
    const unitCents = cents(item.unitAmount);
    const grossCents = cents(item.lineAmount);
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 10000 || unitCents * quantity !== grossCents || !text(item.title)) throw new Error('Order line amounts do not match');
    return { title: text(item.title), detail: [text(item.variantColor), text(item.variantStorage)].filter(Boolean).join(' · '), sku: text(item.sku, 100), quantity, unitCents, grossCents, condition: text(item.condition, 30) };
  });
  const subtotalCents = cents(order.subtotal_amount);
  const shippingCents = cents(order.shipping_amount);
  const discountCents = cents(order.discount_amount ?? 0);
  const totalCents = cents(order.total_amount);
  if (lines.reduce((sum, line) => sum + line.grossCents, 0) !== subtotalCents || discountCents > subtotalCents || subtotalCents + shippingCents - discountCents !== totalCents || totalCents <= 0) throw new Error('Stored order totals do not reconcile');
  if (options.taxMode === 'margin' && lines.some(line => line.condition !== 'used')) throw new Error('Margin mode requires exclusively used goods; mixed orders need accounting review');
  const vatRateBps = Math.round(Number(order.vat_rate) * 10000);
  if (!Number.isInteger(vatRateBps) || vatRateBps <= 0 || vatRateBps > 10000) throw new Error('Confirm the order VAT rate');
  const netCents = options.taxMode === 'standard' ? Math.round(totalCents * 10000 / (10000 + vatRateBps)) : null;
  const vatCents = netCents === null ? null : totalCents - netCents;
  if (options.taxMode === 'standard' && Math.abs(cents(order.vat_amount) - (vatCents ?? 0)) > 1) throw new Error('Stored VAT needs accounting review');
  const a = businessIdentity.address;
  return { version: 1, preview: options.preview === true, number: options.number, orderId: order.id,
    orderLabel: order.order_number ? `A-${order.order_number}` : order.id.slice(0, 8), issueDate,
    kind: options.supplyDate ? 'sale' : 'advance', supplyDate: options.supplyDate || invoiceDate(new Date(order.paid_at)), paidDate: invoiceDate(new Date(order.paid_at)), locale: order.checkout_locale === 'en' ? 'en' : 'de',
    customer, email: order.customer_email, paymentMethod: order.provider === 'paypal' ? 'PayPal' : order.provider === 'stripe' ? 'Karte / Card' : text(order.provider) || 'Online',
    issuer: { name: businessIdentity.tradingName, owner: businessIdentity.legalOwner,
      address: `${a.street}, ${a.postalCode} ${a.city}, Deutschland`, taxId: settings.taxId || 'VORSCHAU · Steuer-ID noch bestätigen', email: businessIdentity.email, phone: businessIdentity.phones.store.de, website: businessIdentity.website },
    lines, subtotalCents, shippingCents, discountCents, totalCents, taxMode: options.taxMode, vatRateBps, netCents, vatCents,
  };
};

export const invoiceDesignSample = (locale: 'de' | 'en' = 'de'): InvoiceSnapshot => {
  const total = 948.89;
  const vat = Math.round((total - total / 1.19) * 100) / 100;
  const snapshot = buildInvoiceSnapshot({ id: '00000000-0000-4000-8000-000000000000', order_number: 999999,
    payment_status: 'paid', status: 'paid', customer_name: 'Max Mustermann', customer_email: 'sample@example.com',
    customer_address: { line1: 'Musterstraße 12', postalCode: '20095', city: 'Hamburg', country: 'Deutschland' },
    paid_at: new Date().toISOString(), provider: 'paypal', checkout_locale: locale, currency: 'EUR',
    subtotal_amount: 943.90, shipping_amount: 4.99, discount_amount: 0, total_amount: total, vat_rate: 0.19, vat_amount: vat,
    items: [ { title: 'Apple iPhone 16 · 128 GB', variantColor: 'Schwarz / Black', sku: 'DEMO-IP16-128', quantity: 1, unitAmount: 899, lineAmount: 899, condition: 'new' },
      { title: 'TRUSMI USB-C Schnellladegerät · 30 W', sku: 'DEMO-TRUSMI-30W', quantity: 1, unitAmount: 24.90, lineAmount: 24.90, condition: 'new' },
      { title: 'USB-C Ladekabel · 1 m', sku: 'DEMO-CABLE-1M', quantity: 2, unitAmount: 10, lineAmount: 20, condition: 'new' } ],
  }, { ...invoiceDefaults, taxId: businessIdentity.vatId }, { number: 'DESIGN-PREVIEW', supplyDate: invoiceDate(), taxMode: 'standard', preview: true });
  return snapshot;
};
