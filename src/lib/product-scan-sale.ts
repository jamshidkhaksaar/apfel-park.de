import { BarcodeFormat, BinaryBitmap, DecodeHintType, HybridBinarizer, MultiFormatReader, RGBLuminanceSource } from '@zxing/library';
import sharp from 'sharp';
import { query } from '@/lib/db';
import { inventoryProductDetails, inventoryProductImage } from '@/lib/inventory-product-details';
import { adjustInventory, type InventorySnapshot } from '@/lib/marketplaces/inventory';
import { readBatteryHealthRange, validBatteryHealthRange, type BatteryHealthRange } from '@/lib/product-offer-options';
import { labelCodeHash, normalizeScanCode, normalizedSkuSql } from '@/lib/scan-code';
import {
  listActiveTelegramRecipientIds,
  notifyProductSold,
  type SoldBroadcastResult,
} from '@/lib/telegram-products/notify';

const text = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const ACTIVE = "p.import_metadata->>'catalogDeletedAt' IS NULL";

export type ScanResult = {
  productId: string;
  title: string;
  brand: string | null;
  model: string | null;
  category: string | null;
  condition: string;
  color: string;
  storage: string;
  batteryHealth: number | null;
  batteryHealthRange: BatteryHealthRange | null;
  price: number;
  sku: string | null;
  stock: number;
  canSell: boolean;
  active: boolean;
  image: string | null;
};

const fallbackSku = async (code: string): Promise<string | null> => {
  const normalized = normalizeScanCode(code);
  const hash = labelCodeHash(code);
  if (normalized.length < 3) return null;
  const result = await query(
    `WITH s AS (
       SELECT p.id AS product_id, p.sku FROM products p WHERE p.sku IS NOT NULL AND ${ACTIVE}
       UNION SELECT p.id, v->>'sku' FROM products p,
         jsonb_array_elements(CASE WHEN jsonb_typeof(p.variants) = 'array' THEN p.variants ELSE '[]'::jsonb END) v
        WHERE v->>'sku' IS NOT NULL AND ${ACTIVE}
       UNION SELECT i.product_id, i.sku FROM inventory_skus i JOIN products p ON p.id = i.product_id WHERE ${ACTIVE}
     )
     SELECT DISTINCT product_id, lower(sku) AS sku FROM s
      WHERE ${normalizedSkuSql('sku')} = $1
         OR ($2::text IS NOT NULL AND left(md5(lower(sku)), 8) = $2)
      LIMIT 2`,
    [normalized, hash],
  );
  return result.rows.length === 1
    ? String((result.rows[0] as { sku: string }).sku)
    : null;
};

const lookupProductRow = (code: string) =>
  query(
    `SELECT p.id, p.title, p.brand, p.model, p.sku, p.gtin, p.category, p.condition, p.price, p.stock, p.is_active,
            p.catalog_enabled, p.images, p.variants, p.specs, p.import_metadata, p.battery_health
       FROM products p
      WHERE ${ACTIVE}
        AND (lower(p.sku) = lower($1) OR p.gtin = $1
             OR EXISTS (SELECT 1 FROM jsonb_array_elements(CASE WHEN jsonb_typeof(p.variants) = 'array' THEN p.variants ELSE '[]'::jsonb END) v
                         WHERE lower(v->>'sku') = lower($1) OR v->>'gtin' = $1)
             OR EXISTS (SELECT 1 FROM inventory_skus i WHERE i.product_id = p.id AND lower(i.sku) = lower($1)))
      ORDER BY p.is_active DESC, p.updated_at DESC
      LIMIT 1`,
    [code],
  );

const ledgerFor = async (sku: string) =>
  (
    await query(
      `SELECT sku, available_inventory(on_hand, reserved, safety_buffer)::int AS available
         FROM inventory_skus WHERE location = 'local' AND is_active = true AND lower(sku) = lower($1) LIMIT 1`,
      [sku],
    )
  ).rows[0] as { sku: string; available: number } | undefined;

const formatScanResult = async (
  row: Record<string, unknown>,
  code: string,
): Promise<ScanResult> => {
  const variants = Array.isArray(row.variants)
    ? (row.variants as Array<Record<string, unknown>>)
    : [];
  const lower = code.toLowerCase();
  const variant =
    variants.find(
      (entry) =>
        text(entry.sku).toLowerCase() === lower || text(entry.gtin) === code,
    ) ?? (variants.length === 1 ? variants[0] : undefined);
  // Sell the stock line that was scanned: the variant's SKU, else the scanned
  // ledger SKU itself, else the product SKU.
  const candidates = [text(variant?.sku), code, text(row.sku)].filter(Boolean);
  let ledger: { sku: string; available: number } | undefined;
  for (const candidate of candidates) {
    ledger = await ledgerFor(candidate);
    if (ledger) break;
  }
  const sku = ledger?.sku || text(variant?.sku) || text(row.sku) || null;
  const details = inventoryProductDetails({ ...row, variants: [] }, 'de', 'product');
  const exactBattery =
    typeof row.battery_health === 'number' && Number.isFinite(row.battery_health)
      ? row.battery_health
      : typeof variant?.batteryHealth === 'number'
        ? variant.batteryHealth
        : null;
  const variantRange = validBatteryHealthRange(variant?.batteryHealthRange)
    ? variant.batteryHealthRange
    : undefined;
  const batteryHealthRange =
    variantRange ?? readBatteryHealthRange(row.import_metadata, exactBattery) ?? null;

  return {
    productId: String(row.id),
    title: text(row.title),
    brand: text(row.brand) || null,
    model: text(row.model) || null,
    category: text(row.category) || null,
    condition: text(row.condition) || 'new',
    color: text(variant?.color) || details.color || '',
    storage: text(variant?.storage) || details.storage || '',
    batteryHealth: batteryHealthRange ? batteryHealthRange.min : exactBattery,
    batteryHealthRange,
    price: Number(variant?.price ?? row.price) || 0,
    sku,
    stock: ledger?.available ?? Math.max(0, Number(row.stock ?? 0)),
    canSell: Boolean(ledger),
    active: Boolean(row.is_active) && row.catalog_enabled !== false,
    image:
      inventoryProductImage({ ...row, sku: sku ?? row.sku }) ??
      (Array.isArray(row.images)
        ? (row.images as unknown[]).find((img): img is string => typeof img === 'string') ?? null
        : null),
  };
};

/** Looks up a product by SKU, short label code ("LB-..."), or EAN/GTIN. */
export const lookupScannedProduct = async (
  rawCode: string,
): Promise<ScanResult | null> => {
  const scanned = rawCode.trim().slice(0, 120);
  if (scanned.length < 3) return null;
  let code = scanned;
  let found = await lookupProductRow(code);
  if (!found.rows[0]) {
    const sku = await fallbackSku(scanned);
    if (sku) {
      code = sku;
      found = await lookupProductRow(code);
    }
  }
  const row = found.rows[0] as Record<string, unknown> | undefined;
  return row ? formatScanResult(row, code) : null;
};

export type RecordScannedSaleInput = {
  codeOrSku: string;
  actor: string;
  idempotencyKey: string;
  discount?: number;
  note?: string;
  source?: 'admin_scan' | 'telegram_scan';
  notifyTelegram?: boolean;
};

export type RecordScannedSaleResult = {
  product: ScanResult;
  salePrice: number;
  originalPrice: number;
  snapshot: InventorySnapshot;
  telegram: SoldBroadcastResult;
};

/** Deducts 1 unit from inventory and sends the Persian "فروخته شد" Telegram alert. */
export const recordScannedProductSale = async (
  input: RecordScannedSaleInput,
): Promise<RecordScannedSaleResult> => {
  const found = await lookupScannedProduct(input.codeOrSku);
  if (!found) throw new Error('not_found');
  if (!found.canSell || !found.sku) throw new Error('no_stock_sku');
  if (found.stock <= 0) throw new Error('insufficient_stock');

  const discount = input.discount ?? 0;
  if (!Number.isFinite(discount) || discount < 0 || discount >= found.price) {
    throw new Error('invalid_discount');
  }
  const salePrice = Math.round((found.price - discount) * 100) / 100;
  const source = input.source ?? 'admin_scan';

  const snapshot = await adjustInventory({
    sku: found.sku,
    type: 'correction',
    quantity: -1,
    referenceType: source === 'telegram_scan' ? 'telegram_scan_sale' : 'admin_scan_sale',
    referenceId: input.idempotencyKey,
    actor: input.actor,
    metadata: {
      note: input.note?.trim().slice(0, 500) || 'Scanner: فروخته شد (-1)',
      source,
      productId: found.productId,
      salePrice,
      discount,
    },
  });

  const updatedProduct: ScanResult = {
    ...found,
    stock: snapshot.available,
  };

  let telegram: SoldBroadcastResult = { recipients: 0, sent: 0, failed: 0 };
  if (input.notifyTelegram !== false) {
    try {
      const recipients = await listActiveTelegramRecipientIds();
      telegram = await notifyProductSold(
        {
          title: updatedProduct.title,
          brand: updatedProduct.brand,
          condition: updatedProduct.condition,
          color: updatedProduct.color,
          storage: updatedProduct.storage,
          batteryHealth: updatedProduct.batteryHealth,
          batteryHealthRange: updatedProduct.batteryHealthRange,
          salePrice,
          originalPrice: found.price,
          sku: found.sku,
          remainingStock: snapshot.available,
          image: updatedProduct.image,
        },
        recipients,
      );
    } catch {
      // Stock decrement is already committed cleanly; report 0 sent instead of failing.
    }
  }

  return {
    product: updatedProduct,
    salePrice,
    originalPrice: found.price,
    snapshot,
    telegram,
  };
};

/** Decodes Code128 / EAN / UPC / QR barcodes from an uploaded label photo. */
export const decodeBarcodeFromBuffer = async (bytes: Buffer): Promise<string | null> => {
  const linearHints = new Map<DecodeHintType, unknown>([
    [
      DecodeHintType.POSSIBLE_FORMATS,
      [
        BarcodeFormat.CODE_128,
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.ITF,
        BarcodeFormat.CODE_39,
      ],
    ],
    [DecodeHintType.TRY_HARDER, true],
  ]);
  const qrHints = new Map<DecodeHintType, unknown>([
    [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]],
    [DecodeHintType.TRY_HARDER, true],
  ]);
  const reader = new MultiFormatReader();
  for (const hints of [linearHints, qrHints]) {
    for (const angle of [0, 90, 180, 270] as const) {
      try {
        let pipeline = sharp(bytes, { limitInputPixels: 25_000_000 }).rotate();
        if (angle !== 0) pipeline = pipeline.rotate(angle);
        const { data, info } = await pipeline
          .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
          .flatten({ background: '#ffffff' })
          .greyscale()
          .removeAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });
        const bitmap = new BinaryBitmap(
          new HybridBinarizer(
            new RGBLuminanceSource(new Uint8ClampedArray(data), info.width, info.height),
          ),
        );
        const decoded = reader.decode(bitmap, hints).getText().trim();
        if (decoded.length >= 3) return decoded;
      } catch {
        // Try next orientation cleanly.
      }
    }
  }
  return null;
};
