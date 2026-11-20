import { createHash } from "node:crypto";

import { isCode128BText } from "@/lib/barcode-code128";

/**
 * Barcode codes as a USB scanner actually types them.
 *
 * Scanners act as a keyboard and usually send US key positions. On a German
 * keyboard layout "-" then arrives as "ß" (and "/" as "-"), and Y and Z swap.
 * Comparing only letters and digits, with Y and Z folded together, makes a
 * scan match its SKU whatever layout the shop PC uses.
 */
// Strip first, then upper-case: "ß".toUpperCase() is "SS" in JavaScript.
export const normalizeScanCode = (value: string): string =>
  value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().replace(/Y/g, "Z");

/** The same normalisation in SQL, for a column or expression `column`. */
export const normalizedSkuSql = (column: string): string =>
  `translate(upper(regexp_replace(${column}, '[^A-Za-z0-9]', '', 'g')), 'Y', 'Z')`;

/**
 * Longest SKU printed as-is. Longer ones would need bars one printer dot wide
 * on a 62 mm label (too thin to scan reliably), so they get a short label code.
 */
export const MAX_DIRECT_BARCODE_LENGTH = 24;

const LABEL_CODE_PREFIX = "LB";

/** Short, stable label code for a long SKU: "LB-" + 8 hex of md5(lower(sku)). */
export const labelCodeForSku = (sku: string): string =>
  `${LABEL_CODE_PREFIX}-${createHash("md5").update(sku.toLowerCase()).digest("hex").slice(0, 8).toUpperCase()}`;

/** What the label's barcode encodes for this SKU. */
export const barcodeValueForSku = (sku: string): string =>
  sku.length <= MAX_DIRECT_BARCODE_LENGTH && isCode128BText(sku) ? sku : labelCodeForSku(sku);

/** The md5 part of a scanned label code ("LB-3F9A12C4" → "3f9a12c4"), or null. */
export const labelCodeHash = (scanned: string): string | null => {
  const match = /^LB([0-9A-F]{8})$/.exec(normalizeScanCode(scanned));
  return match ? match[1].toLowerCase() : null;
};
