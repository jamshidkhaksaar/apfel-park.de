import { notFound, redirect } from "next/navigation";

import ProductLabelPrint, { type LabelData } from "@/components/admin/ProductLabelPrint";
import { canManageProducts } from "@/lib/admin-auth";
import { query } from "@/lib/db";
import { inventoryProductDetails } from "@/lib/inventory-product-details";
import { readSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

/** Strips a leading brand and a trailing storage size from the model name. */
const modelName = (raw: string, storage: string) => {
  let name = raw.replace(/^(apple|samsung|xiaomi|google|huawei)\s+/i, "").trim();
  if (storage) name = name.replace(new RegExp(`\s*${storage.replace(/\s+/g, "\s*")}\s*$`, "i"), "").trim();
  return name.replace(/\s*\d+\s?(GB|TB)\b.*$/i, "").trim() || raw;
};

export default async function ProductLabelPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sku?: string }>;
}) {
  const user = await readSessionUser();
  if (!canManageProducts(user)) redirect("/admin");
  const [{ id }, { sku: rawSku }] = await Promise.all([params, searchParams]);
  if (!UUID.test(id)) notFound();

  const result = await query(
    `SELECT p.id, p.title, p.brand, p.model, p.sku, p.category, p.condition, p.price, p.variants, p.specs, p.import_metadata,
            (SELECT f.name FROM product_family_members m JOIN product_families f ON f.id = m.family_id
              WHERE m.product_id = p.id AND m.is_active AND f.is_active LIMIT 1) AS family_name
       FROM products p WHERE p.id = $1 LIMIT 1`,
    [id],
  );
  const row = result.rows[0] as Record<string, unknown> | undefined;
  if (!row) notFound();

  const variants = Array.isArray(row.variants) ? (row.variants as Array<Record<string, unknown>>) : [];
  const wanted = text(rawSku).toLowerCase();
  const variant = (wanted && variants.find((entry) => text(entry.sku).toLowerCase() === wanted)) || (variants.length === 1 ? variants[0] : undefined);
  const details = inventoryProductDetails({ ...row, variants: [] }, "de", "product");
  const storage = text(variant?.storage) || details.storage || "";
  const data: LabelData = {
    model: modelName(text(row.family_name) || text(row.model) || text(row.title), storage),
    storage,
    color: text(variant?.color) || details.color || "",
    price: Number(variant?.price ?? row.price) || 0,
    sku: text(variant?.sku) || text(row.sku) || null,
    condition: text(row.condition) || "new",
  };
  const defaultWarranty = data.condition === "new" ? "24 Monate Garantie" : "12 Monate Garantie";

  return <ProductLabelPrint data={data} defaultWarranty={defaultWarranty} />;
}
