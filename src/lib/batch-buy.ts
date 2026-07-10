import { query } from "@/lib/db";
import { isBatchPhoneStatus, type BatchPhone, type BatchPhoneStatus, type BatchSeller } from "@/lib/batch-buy-shared";

type SellerRow = {
  id: string;
  created_at: string;
  updated_at: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  phone_count: number | string | null;
  last_purchase_at: string | null;
};

type PhoneRow = {
  id: string;
  seller_id: string;
  seller_name: string;
  created_at: string;
  updated_at: string;
  phone_model: string;
  catalog_brand_id: string | null;
  catalog_family_id: string | null;
  catalog_model_id: string | null;
  imei: string;
  purchase_date: string;
  notes: string | null;
  status: string | null;
};

const toSeller = (row: SellerRow): BatchSeller => ({
  id: row.id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  fullName: row.full_name,
  phone: row.phone,
  email: row.email,
  notes: row.notes,
  phoneCount: Number(row.phone_count ?? 0),
  lastPurchaseAt: row.last_purchase_at,
});

const toPhone = (row: PhoneRow): BatchPhone => ({
  id: row.id,
  sellerId: row.seller_id,
  sellerName: row.seller_name,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  phoneModel: row.phone_model,
  catalogBrandId: row.catalog_brand_id,
  catalogFamilyId: row.catalog_family_id,
  catalogModelId: row.catalog_model_id,
  imei: row.imei,
  purchaseDate: row.purchase_date,
  notes: row.notes,
  status: isBatchPhoneStatus(row.status) ? row.status : "bought",
});

export const listBatchSellers = async (): Promise<BatchSeller[]> => {
  const result = await query(
    `SELECT s.id,
            s.created_at,
            s.updated_at,
            s.full_name,
            s.phone,
            s.email,
            s.notes,
            COUNT(p.id)::int AS phone_count,
            MAX(p.purchase_date)::text AS last_purchase_at
     FROM batch_sellers s
     LEFT JOIN batch_phones p ON p.seller_id = s.id
     GROUP BY s.id
     ORDER BY s.created_at DESC
     LIMIT 300`,
  );

  return (result.rows as SellerRow[]).map(toSeller);
};

export const listBatchPhones = async (): Promise<BatchPhone[]> => {
  const result = await query(
    `SELECT p.id,
            p.seller_id,
            s.full_name AS seller_name,
            p.created_at,
            p.updated_at,
            p.phone_model,
            p.catalog_brand_id,
            p.catalog_family_id,
            p.catalog_model_id,
            p.imei,
            p.purchase_date::text AS purchase_date,
            p.notes,
            p.status
     FROM batch_phones p
     JOIN batch_sellers s ON s.id = p.seller_id
     ORDER BY p.created_at DESC
     LIMIT 500`,
  );

  return (result.rows as PhoneRow[]).map(toPhone);
};

export const createBatchSeller = async (input: {
  fullName: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
}): Promise<string> => {
  const result = await query(
    `INSERT INTO batch_sellers (full_name, phone, email, notes)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [input.fullName, input.phone, input.email, input.notes],
  );

  return String(result.rows[0]?.id ?? "");
};

export const updateBatchSeller = async (input: {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
}): Promise<void> => {
  await query(
    `UPDATE batch_sellers
     SET full_name = $2,
         phone = $3,
         email = $4,
         notes = $5,
         updated_at = NOW()
     WHERE id = $1`,
    [input.id, input.fullName, input.phone, input.email, input.notes],
  );
};

export const createBatchPhone = async (input: {
  sellerId: string;
  phoneModel: string;
  catalogBrandId: string | null;
  catalogFamilyId: string | null;
  catalogModelId: string | null;
  imei: string;
  purchaseDate: string;
  notes: string | null;
  status: BatchPhoneStatus;
}): Promise<void> => {
  await query(
    `INSERT INTO batch_phones (
       seller_id,
       phone_model,
       catalog_brand_id,
       catalog_family_id,
       catalog_model_id,
       imei,
       purchase_date,
       notes,
       status
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7::date, $8, $9)`,
    [
      input.sellerId,
      input.phoneModel,
      input.catalogBrandId,
      input.catalogFamilyId,
      input.catalogModelId,
      input.imei,
      input.purchaseDate,
      input.notes,
      input.status,
    ],
  );
};

export const updateBatchPhoneStatus = async (input: {
  id: string;
  sellerId: string;
  status: BatchPhoneStatus;
}): Promise<void> => {
  await query(
    `UPDATE batch_phones
     SET status = $3,
         updated_at = NOW()
     WHERE id = $1 AND seller_id = $2`,
    [input.id, input.sellerId, input.status],
  );
};

export const updateBatchPhone = async (input: {
  id: string;
  sellerId: string;
  phoneModel: string;
  imei: string;
  purchaseDate: string;
  notes: string | null;
  status: BatchPhoneStatus;
}): Promise<void> => {
  await query(
    `UPDATE batch_phones
     SET phone_model = $3,
         imei = $4,
         purchase_date = $5::date,
         notes = $6,
         status = $7,
         updated_at = NOW()
     WHERE id = $1 AND seller_id = $2`,
    [
      input.id,
      input.sellerId,
      input.phoneModel,
      input.imei,
      input.purchaseDate,
      input.notes,
      input.status,
    ],
  );
};

export const deleteBatchPhone = async (input: { id: string; sellerId: string }): Promise<void> => {
  await query(
    `DELETE FROM batch_phones
     WHERE id = $1 AND seller_id = $2`,
    [input.id, input.sellerId],
  );
};
