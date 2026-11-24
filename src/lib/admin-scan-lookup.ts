/**
 * Barcode lookup for the admin product list: a scanned SKU, label code or EAN
 * resolves to its product. Scanning only finds a product; it never sells one.
 */

export type ScanResult = {
  productId: string;
  title: string;
  brand: string | null;
  condition: string;
  color: string;
  storage: string;
  price: number;
  sku: string | null;
  stock: number;
  canSell: boolean;
  active: boolean;
  image: string | null;
};

export type ScanLookup = { status: "found"; result: ScanResult } | { status: "not_found" | "forbidden" | "error" };

export async function lookupScan(code: string): Promise<ScanLookup> {
  try {
    const response = await fetch(`/api/admin/products/scan?code=${encodeURIComponent(code)}`, { cache: "no-store" });
    if (response.ok) return { status: "found", result: (await response.json()) as ScanResult };
    if (response.status === 404) return { status: "not_found" };
    if (response.status === 401 || response.status === 403) return { status: "forbidden" };
    return { status: "error" };
  } catch {
    return { status: "error" };
  }
}
