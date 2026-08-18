"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { canManageOrders, isAdminUser } from "@/lib/admin-auth";
import { createAdminServerClient } from "@/lib/admin-auth-server";
import { query } from "@/lib/db";
import { enqueueMarketplaceJob, validateMarketplaceProduct } from "@/lib/marketplaces";
import { channelPrice, getChannelSettings, type SalesChannel } from "@/lib/marketplaces/channel-settings";
import { loadMarketplaceListingInput } from "@/lib/marketplaces/listing-input";
import type { Marketplace, MarketplaceOperation } from "@/lib/marketplaces/types";

const marketplace = (value: FormDataEntryValue | null): Marketplace | null =>
  value === "amazon_de" || value === "ebay_de" ? value : null;

const salesChannel = (value: FormDataEntryValue | null): SalesChannel | null =>
  value === "google_merchant" || value === "amazon_de" || value === "ebay_de" ? value : null;

const checked = (value: FormDataEntryValue | null): boolean => value === "on" || value === "true";

export async function queueMarketplaceOperation(formData: FormData): Promise<void> {
  const client = await createAdminServerClient();
  const { data: { user } } = await client.auth.getUser();
  const channel = marketplace(formData.get("marketplace"));
  const operation = String(formData.get("operation") ?? "") as MarketplaceOperation;
  const sku = String(formData.get("sku") ?? "").trim();

  if (!channel || !["publish", "unpublish", "update_price", "reconcile"].includes(operation) || !canManageOrders(user)) {
    redirect("/admin/marketplaces?error=auth");
  }
  if (operation !== "reconcile" && !sku) redirect("/admin/marketplaces?error=sku");

  if (operation === "publish") {
    // Publication is the per-product approval action, so only an owner/admin
    // can perform it. Managers may monitor, reconcile, or withdraw listings.
    if (!isAdminUser(user)) redirect("/admin/marketplaces?error=admin");
    const [compliance, input, settings] = await Promise.all([
      query(`SELECT id FROM marketplace_compliance_profiles
              WHERE verified_at IS NOT NULL
                AND evidence @> '{"lucid":true,"weee":true,"batteries":true,"gpsr":true}'::jsonb
              ORDER BY verified_at DESC LIMIT 1`),
      loadMarketplaceListingInput(sku),
      getChannelSettings(channel),
    ]);
    if (!compliance.rows[0] || !input || !settings.enabled || !settings.priceRuleConfirmedAt) {
      redirect("/admin/marketplaces?error=blocked");
    }
    const validation = validateMarketplaceProduct(channel, input);
    if (!validation.valid) {
      await query(
        `INSERT INTO marketplace_listings (sku, marketplace, status, last_error)
         VALUES ($1, $2, 'blocked', $3)
         ON CONFLICT (sku, marketplace) DO UPDATE SET
           status = 'blocked', last_error = excluded.last_error, updated_at = now()`,
        [sku, channel, validation.errors.join(" ")],
      );
      redirect("/admin/marketplaces?error=blocked");
    }
    const price = channelPrice(input.price, settings);
    await query(
      `INSERT INTO marketplace_listings (
         sku, marketplace, status, price, approved_at, approved_by, fulfillment_mode
       ) VALUES ($1, $2, 'queued', $3, now(), $4, 'MFN')
       ON CONFLICT (sku, marketplace) DO UPDATE SET
         status = 'queued', price = excluded.price,
         approved_at = now(), approved_by = excluded.approved_by,
         fulfillment_mode = 'MFN', last_error = null, updated_at = now()`,
      [sku, channel, price, user?.email ?? "admin"],
    );
  }

  await enqueueMarketplaceJob(channel, operation, sku || undefined, {});
  revalidatePath("/admin/marketplaces");
  redirect("/admin/marketplaces?queued=1");
}

export async function updateChannelSettings(formData: FormData): Promise<void> {
  const client = await createAdminServerClient();
  const { data: { user } } = await client.auth.getUser();
  if (!isAdminUser(user)) redirect("/admin/marketplaces?error=admin");

  const channel = salesChannel(formData.get("marketplace"));
  if (!channel) redirect("/admin/marketplaces?error=channel");

  const enabled = checked(formData.get("enabled"));
  const stockSync = checked(formData.get("stockSync"));
  const priceSync = channel !== "google_merchant" && checked(formData.get("priceSync"));
  const orderSync = channel !== "google_merchant" && checked(formData.get("orderSync"));
  const confirmed = channel === "google_merchant" || checked(formData.get("confirmPriceRule"));
  const markupPercent = channel === "google_merchant" ? 0 : Number(formData.get("priceMarkupPercent") ?? 0);
  const markupFixed = channel === "google_merchant" ? 0 : Number(formData.get("priceMarkupFixed") ?? 0);

  if (
    !Number.isFinite(markupPercent) || markupPercent < -50 || markupPercent > 500 ||
    !Number.isFinite(markupFixed) || markupFixed < -1_000 || markupFixed > 10_000
  ) {
    redirect("/admin/marketplaces?error=price_rule");
  }
  if (enabled && channel !== "google_merchant" && !confirmed) {
    redirect("/admin/marketplaces?error=price_confirmation");
  }
  if (enabled) {
    const requiredEnvironment = channel === "google_merchant"
      ? ["GOOGLE_MERCHANT_SERVICE_ACCOUNT_JSON", "GOOGLE_MERCHANT_SUPPLEMENTAL_DATA_SOURCE"]
      : channel === "ebay_de"
        ? ["EBAY_MERCHANT_LOCATION_KEY", "EBAY_PAYMENT_POLICY_ID", "EBAY_FULFILLMENT_POLICY_ID", "EBAY_RETURN_POLICY_ID"]
        : ["AMAZON_SP_API_CLIENT_ID", "AMAZON_SP_API_CLIENT_SECRET", "AMAZON_SP_API_REFRESH_TOKEN", "AMAZON_SP_API_SELLER_ID"];
    if (requiredEnvironment.some((name) => !process.env[name]?.trim())) {
      redirect("/admin/marketplaces?error=channel_configuration");
    }
    if (channel === "ebay_de") {
      const connection = await query(
        `SELECT 1 FROM marketplace_connections
          WHERE marketplace = 'ebay_de' AND environment = $1
            AND refresh_token_ciphertext IS NOT NULL
            AND refresh_token_expires_at > now()
          LIMIT 1`,
        [process.env.EBAY_INVENTORY_ENVIRONMENT?.trim().toLowerCase() === "sandbox" ? "sandbox" : "production"],
      );
      if (!connection.rowCount) redirect("/admin/marketplaces?error=channel_configuration");
    }
  }

  await query(
    `UPDATE marketplace_channel_settings
        SET enabled = $2,
            stock_sync_enabled = $3,
            price_sync_enabled = $4,
            order_sync_enabled = $5,
            price_markup_percent = $6,
            price_markup_fixed = $7,
            price_rule_confirmed_at = CASE
              WHEN $8::boolean THEN coalesce(price_rule_confirmed_at, now())
              ELSE null
            END,
            metadata = jsonb_set(coalesce(metadata, '{}'::jsonb), '{updatedBy}', to_jsonb($9::text), true),
            updated_at = now()
      WHERE marketplace = $1`,
    [
      channel,
      enabled,
      stockSync,
      priceSync,
      orderSync,
      markupPercent,
      markupFixed,
      confirmed,
      user?.email ?? "admin",
    ],
  );

  if (enabled && stockSync) {
    await query(
      `SELECT queue_inventory_sync(sku)
         FROM inventory_skus
        WHERE location = 'local' AND is_active = true`,
    );
  }
  if (channel !== "google_merchant" && enabled && priceSync && confirmed) {
    await query(
      `INSERT INTO marketplace_jobs (marketplace, operation, sku, payload)
       SELECT listing.marketplace, 'update_price', listing.sku, '{}'::jsonb
         FROM marketplace_listings listing
        WHERE listing.marketplace = $1
          AND listing.approved_at IS NOT NULL
          AND listing.sync_price = true
          AND NOT EXISTS (
            SELECT 1 FROM marketplace_jobs job
             WHERE job.marketplace = listing.marketplace
               AND job.operation = 'update_price'
               AND job.sku = listing.sku
               AND job.status IN ('queued', 'processing')
          )
       ON CONFLICT DO NOTHING`,
      [channel],
    );
  }

  revalidatePath("/admin/marketplaces");
  redirect("/admin/marketplaces?settings=1");
}

export async function verifyMarketplaceCompliance(formData: FormData): Promise<void> {
  const client = await createAdminServerClient();
  const { data: { user } } = await client.auth.getUser();
  if (!isAdminUser(user)) redirect("/admin/marketplaces?error=admin");
  const evidence = {
    lucid: Boolean(formData.get("lucid")),
    weee: Boolean(formData.get("weee")),
    batteries: Boolean(formData.get("batteries")),
    gpsr: Boolean(formData.get("gpsr")),
  };
  if (!Object.values(evidence).every(Boolean)) {
    redirect("/admin/marketplaces?error=compliance_incomplete");
  }
  await query(
    `INSERT INTO marketplace_compliance_profiles (verified_at, verified_by, evidence, notes)
     VALUES (now(), $1, $2, $3)`,
    [
      user?.email ?? "admin",
      JSON.stringify(evidence),
      String(formData.get("notes") ?? "").slice(0, 2_000),
    ],
  );
  revalidatePath("/admin/marketplaces");
  redirect("/admin/marketplaces?verified=1");
}
