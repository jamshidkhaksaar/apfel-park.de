import bwipjs from 'bwip-js/node';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  adjustInventory: vi.fn(),
  listActiveTelegramRecipientIds: vi.fn(),
  notifyProductSold: vi.fn(),
}));

vi.mock('@/lib/db', () => ({ query: mocks.query }));
vi.mock('@/lib/marketplaces/inventory', () => ({ adjustInventory: mocks.adjustInventory }));
vi.mock('@/lib/telegram-products/notify', () => ({
  listActiveTelegramRecipientIds: mocks.listActiveTelegramRecipientIds,
  notifyProductSold: mocks.notifyProductSold,
}));

import {
  decodeBarcodeFromBuffer,
  lookupScannedProduct,
  recordScannedProductSale,
} from '@/lib/product-scan-sale';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('product-scan-sale', () => {
  it('looks up scanned product, decrements -1 unit, and broadcasts Telegram فروخته شد alert', async () => {
    mocks.query
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'prod-1',
            title: 'Apple iPhone 15',
            brand: 'Apple',
            model: 'iPhone 15',
            sku: 'AP-IP15-128-BLK',
            gtin: null,
            category: 'smartphones',
            condition: 'used',
            price: '599.00',
            stock: 4,
            is_active: true,
            catalog_enabled: true,
            images: ['/uploads/products/iphone15.webp'],
            variants: [{ sku: 'AP-IP15-128-BLK', color: 'Black', storage: '128 GB', price: 599 }],
            specs: [],
            import_metadata: {},
            battery_health: 93,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [{ sku: 'AP-IP15-128-BLK', available: 4 }],
      });
    mocks.adjustInventory.mockResolvedValueOnce({
      sku: 'AP-IP15-128-BLK',
      onHand: 3,
      reserved: 0,
      available: 3,
      version: 12,
    });
    mocks.listActiveTelegramRecipientIds.mockResolvedValueOnce(['111', '222']);
    mocks.notifyProductSold.mockResolvedValueOnce({ recipients: 2, sent: 2, failed: 0 });

    const outcome = await recordScannedProductSale({
      codeOrSku: 'AP-IP15-128-BLK',
      actor: 'owner@apfel-park.de',
      idempotencyKey: 'scan-key-1',
      discount: 20,
      source: 'admin_scan',
    });

    expect(mocks.adjustInventory).toHaveBeenCalledWith(
      expect.objectContaining({
        sku: 'AP-IP15-128-BLK',
        type: 'correction',
        quantity: -1,
        referenceType: 'admin_scan_sale',
        referenceId: 'scan-key-1',
      }),
    );
    expect(mocks.notifyProductSold).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Apple iPhone 15',
        color: 'Black',
        storage: '128 GB',
        batteryHealth: 93,
        salePrice: 579,
        originalPrice: 599,
        sku: 'AP-IP15-128-BLK',
        remainingStock: 3,
        image: '/uploads/products/iphone15.webp',
      }),
      ['111', '222'],
    );
    expect(outcome.product.stock).toBe(3);
    expect(outcome.telegram).toEqual({ recipients: 2, sent: 2, failed: 0 });
  });

  it('throws insufficient_stock without touching inventory when stock is 0', async () => {
    mocks.query
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'prod-2',
            title: 'Zero Stock Phone',
            brand: 'Samsung',
            model: 'Galaxy S24',
            sku: 'AP-S24',
            gtin: null,
            category: 'smartphones',
            condition: 'new',
            price: '700.00',
            stock: 0,
            is_active: true,
            catalog_enabled: true,
            images: [],
            variants: [],
            specs: [],
            import_metadata: {},
            battery_health: null,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [{ sku: 'AP-S24', available: 0 }],
      });

    await expect(
      recordScannedProductSale({
        codeOrSku: 'AP-S24',
        actor: 'admin',
        idempotencyKey: 'scan-key-2',
      }),
    ).rejects.toThrow('insufficient_stock');
    expect(mocks.adjustInventory).not.toHaveBeenCalled();
    expect(mocks.notifyProductSold).not.toHaveBeenCalled();
  });

  it('returns null when lookup receives fewer than 3 characters', async () => {
    expect(await lookupScannedProduct('ab')).toBeNull();
    expect(mocks.query).not.toHaveBeenCalled();
  });

  it('decodes Code128 label barcodes from an image buffer', async () => {
    const png = await bwipjs.toBuffer({
      bcid: 'code128',
      text: 'LB-3F9A12C4',
      scale: 3,
      height: 15,
      padding: 15,
    });
    expect(await decodeBarcodeFromBuffer(png)).toBe('LB-3F9A12C4');
  });
});
