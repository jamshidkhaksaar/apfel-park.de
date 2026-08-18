import { query } from "../src/lib/db";
import { getMarketplaceAdapter } from "../src/lib/marketplaces";
import { updateGoogleMerchantAvailability } from "../src/lib/marketplaces/google-merchant-api";
import { loadMarketplaceListingInput } from "../src/lib/marketplaces/listing-input";
import type { Marketplace, MarketplaceOperation } from "../src/lib/marketplaces/types";

type Job = {
  id: string;
  marketplace: Marketplace;
  operation: MarketplaceOperation;
  sku: string | null;
  payload: Record<string, unknown>;
  attempts: number;
};

type InventoryTarget = {
  marketplace: "google_merchant" | Marketplace;
  sku: string;
  desired_quantity: number;
  inventory_version: number;
  attempts: number;
};

const pollMilliseconds = Math.min(
  300_000,
  Math.max(5_000, Number(process.env.MARKETPLACE_WORKER_POLL_MS) || 15_000),
);
const once = process.env.MARKETPLACE_WORKER_ONCE === "1";
let stopping = false;

const errorMessage = (error: unknown): string =>
  (error instanceof Error ? error.message : "Unknown marketplace worker error").slice(0, 2_000);

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

const resetInterruptedWork = async (): Promise<void> => {
  await Promise.all([
    query(
      `UPDATE marketplace_jobs
          SET status = 'queued', run_after = now(),
              last_error = coalesce(last_error, 'Worker restarted during processing'), updated_at = now()
        WHERE status = 'processing' AND updated_at < now() - interval '10 minutes'`,
    ),
    query(
      `UPDATE inventory_sync_targets
          SET status = 'queued', run_after = now(),
              last_error = coalesce(last_error, 'Worker restarted during processing'), updated_at = now()
        WHERE status = 'processing' AND updated_at < now() - interval '10 minutes'`,
    ),
  ]);
};

const queuePeriodicWork = async (): Promise<void> => {
  await query(
    `INSERT INTO marketplace_jobs (marketplace, operation, payload)
     SELECT settings.marketplace, 'import_orders', '{}'::jsonb
       FROM marketplace_channel_settings settings
      WHERE settings.marketplace IN ('ebay_de', 'amazon_de')
        AND settings.enabled = true
        AND settings.order_sync_enabled = true
        AND NOT EXISTS (
          SELECT 1
            FROM marketplace_jobs job
           WHERE job.marketplace = settings.marketplace
             AND job.operation = 'import_orders'
             AND (
               job.status IN ('queued', 'processing')
               OR (job.status = 'failed' AND job.updated_at > now() - interval '1 hour')
               OR (
                 job.status = 'succeeded'
                 AND job.updated_at > now() - CASE
                   WHEN settings.marketplace = 'ebay_de' THEN interval '1 minute'
                   ELSE interval '5 minutes'
                 END
               )
             )
        )
     ON CONFLICT DO NOTHING`,
  );

  await query(
    `INSERT INTO marketplace_jobs (marketplace, operation, payload)
     SELECT settings.marketplace, 'reconcile', jsonb_build_object('scheduled', 'nightly')
       FROM marketplace_channel_settings settings
      WHERE settings.marketplace IN ('ebay_de', 'amazon_de')
        AND settings.enabled = true
        AND settings.stock_sync_enabled = true
        AND NOT EXISTS (
          SELECT 1
            FROM marketplace_jobs job
           WHERE job.marketplace = settings.marketplace
             AND job.operation = 'reconcile'
             AND (
               job.status IN ('queued', 'processing')
               OR (job.status = 'failed' AND job.updated_at > now() - interval '24 hours')
               OR job.updated_at > now() - interval '24 hours'
             )
        )
     ON CONFLICT DO NOTHING`,
  );

  const googleDue = await query(
    `UPDATE marketplace_channel_settings
        SET metadata = jsonb_set(
              coalesce(metadata, '{}'::jsonb),
              '{lastFullReconciliationAt}',
              to_jsonb(now()::text),
              true
            ),
            updated_at = now()
      WHERE marketplace = 'google_merchant'
        AND enabled = true
        AND stock_sync_enabled = true
        AND coalesce((metadata ->> 'lastFullReconciliationAt')::timestamptz, 'epoch'::timestamptz)
            < now() - interval '24 hours'
      RETURNING marketplace`,
  );
  if (googleDue.rowCount) {
    await query(
      `INSERT INTO inventory_sync_targets (
         marketplace, sku, desired_quantity, inventory_version, status, attempts,
         run_after, last_error, updated_at
       )
       SELECT 'google_merchant', inventory.sku,
              available_inventory(inventory.on_hand, inventory.reserved, inventory.safety_buffer),
              inventory.version, 'queued', 0, now(), null, now()
         FROM inventory_skus inventory
         JOIN products product ON product.id = inventory.product_id
        WHERE inventory.location = 'local' AND inventory.is_active = true AND product.is_active = true
       ON CONFLICT (marketplace, sku) DO UPDATE SET
         desired_quantity = excluded.desired_quantity,
         inventory_version = excluded.inventory_version,
         status = 'queued', attempts = 0, run_after = now(), last_error = null, updated_at = now()`,
    );
  }
};

const claimInventoryTargets = async (): Promise<InventoryTarget[]> => {
  const result = await query(
    `WITH ready AS (
       SELECT target.marketplace, target.sku
         FROM inventory_sync_targets target
         JOIN marketplace_channel_settings settings
           ON settings.marketplace = target.marketplace
        WHERE target.status = 'queued' AND target.run_after <= now()
          AND settings.enabled = true
          AND settings.stock_sync_enabled = true
        ORDER BY target.updated_at, target.marketplace, target.sku
        FOR UPDATE OF target SKIP LOCKED
        LIMIT 50
     )
     UPDATE inventory_sync_targets target
        SET status = 'processing', attempts = target.attempts + 1, updated_at = now()
       FROM ready
      WHERE target.marketplace = ready.marketplace AND target.sku = ready.sku
      RETURNING target.marketplace, target.sku, target.desired_quantity,
                target.inventory_version, target.attempts`,
  );
  return result.rows as InventoryTarget[];
};

const processInventoryTarget = async (target: InventoryTarget): Promise<void> => {
  try {
    if (target.marketplace === "google_merchant") {
      await updateGoogleMerchantAvailability(target.sku, Number(target.desired_quantity));
    } else {
      await getMarketplaceAdapter(target.marketplace).updateAvailability(
        target.sku,
        Number(target.desired_quantity),
      );
    }

    // A newer ledger mutation may have replaced this desired state while the
    // remote request was in flight. The version predicate prevents this old
    // response from marking the newer quantity as synchronized.
    await query(
      `UPDATE inventory_sync_targets
          SET status = 'succeeded', last_synced_quantity = desired_quantity,
              last_synced_version = inventory_version, last_synced_at = now(),
              last_error = null, updated_at = now()
        WHERE marketplace = $1 AND sku = $2
          AND inventory_version = $3 AND status = 'processing'`,
      [target.marketplace, target.sku, target.inventory_version],
    );
  } catch (error) {
    const message = errorMessage(error);
    await query(
      `UPDATE inventory_sync_targets
          SET status = CASE WHEN attempts >= 8 THEN 'failed' ELSE 'queued' END,
              run_after = now() + (least(900, 15 * power(2, greatest(0, attempts - 1))) * interval '1 second'),
              last_error = $4, updated_at = now()
        WHERE marketplace = $1 AND sku = $2
          AND inventory_version = $3 AND status = 'processing'`,
      [target.marketplace, target.sku, target.inventory_version, message],
    );
    console.error(`[marketplace-worker] ${target.marketplace} stock ${target.sku}: ${message}`);
  }
};

const claimJobs = async (): Promise<Job[]> => {
  const result = await query(
    `WITH ready AS (
       SELECT job.id
         FROM marketplace_jobs job
         JOIN marketplace_channel_settings settings
           ON settings.marketplace = job.marketplace
        WHERE job.status = 'queued' AND job.run_after <= now()
          AND settings.enabled = true
          AND CASE
                WHEN job.operation IN ('update_availability', 'reconcile')
                  THEN settings.stock_sync_enabled
                WHEN job.operation = 'update_price'
                  THEN settings.price_sync_enabled
                WHEN job.operation = 'import_orders'
                  THEN settings.order_sync_enabled
                ELSE true
              END
        ORDER BY job.created_at
        FOR UPDATE OF job SKIP LOCKED
        LIMIT 25
     )
     UPDATE marketplace_jobs job
        SET status = 'processing', attempts = job.attempts + 1, updated_at = now()
       FROM ready
      WHERE job.id = ready.id
      RETURNING job.id, job.marketplace, job.operation, job.sku, job.payload, job.attempts`,
  );
  return result.rows as Job[];
};

const executeJob = async (job: Job): Promise<void> => {
  const adapter = getMarketplaceAdapter(job.marketplace);
  const sku = job.sku?.trim() ?? "";
  switch (job.operation) {
    case "publish": {
      if (!sku) throw new Error("Publish job has no SKU");
      const input = await loadMarketplaceListingInput(sku);
      if (!input) throw new Error(`Marketplace SKU ${sku} does not exist`);
      const validation = adapter.validate(input);
      if (!validation.valid) throw new Error(validation.errors.join(" "));
      await adapter.publish(input);
      return;
    }
    case "unpublish":
      if (!sku) throw new Error("Unpublish job has no SKU");
      await adapter.unpublish(sku);
      return;
    case "update_price": {
      if (!sku) throw new Error("Price job has no SKU");
      const input = await loadMarketplaceListingInput(sku);
      const price = Number(job.payload.price ?? input?.price ?? 0);
      await adapter.updatePrice(sku, price);
      return;
    }
    case "update_availability":
      if (!sku) throw new Error("Availability job has no SKU");
      await adapter.updateAvailability(sku, Number(job.payload.quantity ?? 0));
      return;
    case "import_orders":
      await adapter.importOrders();
      return;
    case "confirm_shipment":
      await adapter.confirmShipment(
        String(job.payload.externalOrderId ?? ""),
        String(job.payload.carrier ?? ""),
        String(job.payload.trackingNumber ?? ""),
      );
      return;
    case "reconcile":
      await adapter.reconcile();
      return;
  }
};

const processJob = async (job: Job): Promise<void> => {
  try {
    await executeJob(job);
    await query(
      `UPDATE marketplace_jobs
          SET status = 'succeeded', last_error = null, updated_at = now()
        WHERE id = $1 AND status = 'processing'`,
      [job.id],
    );
  } catch (error) {
    const message = errorMessage(error);
    await query(
      `UPDATE marketplace_jobs
          SET status = CASE WHEN attempts >= 8 THEN 'failed' ELSE 'queued' END,
              run_after = now() + (least(900, 15 * power(2, greatest(0, attempts - 1))) * interval '1 second'),
              last_error = $2, updated_at = now()
        WHERE id = $1 AND status = 'processing'`,
      [job.id, message],
    );
    if (job.sku) {
      await query(
        `UPDATE marketplace_listings
            SET status = 'error', last_error = $3, updated_at = now()
          WHERE marketplace = $1 AND sku = $2`,
        [job.marketplace, job.sku, message],
      );
    }
    console.error(`[marketplace-worker] ${job.marketplace} ${job.operation}: ${message}`);
  }
};

export const runMarketplaceWorkerPass = async (): Promise<void> => {
  await queuePeriodicWork();
  for (const target of await claimInventoryTargets()) await processInventoryTarget(target);
  for (const job of await claimJobs()) await processJob(job);
};

const main = async (): Promise<void> => {
  await resetInterruptedWork();
  do {
    try {
      await runMarketplaceWorkerPass();
    } catch (error) {
      console.error(`[marketplace-worker] pass failed: ${errorMessage(error)}`);
    }
    if (!once && !stopping) await wait(pollMilliseconds);
  } while (!once && !stopping);
};

process.on("SIGTERM", () => { stopping = true; });
process.on("SIGINT", () => { stopping = true; });

main()
  .then(() => {
    if (once) process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
