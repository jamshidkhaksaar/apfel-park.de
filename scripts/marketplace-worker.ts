import { getMarketplaceAdapter } from '../src/lib/marketplaces';
import type { Marketplace, MarketplaceOperation } from '../src/lib/marketplaces/types';
import { query } from '../src/lib/db';

type Job = { id: string; marketplace: Marketplace; operation: MarketplaceOperation; sku: string | null; payload: Record<string, unknown>; attempts: number };

const run = async (): Promise<void> => {
  const claimed = await query(`UPDATE marketplace_jobs SET status = 'processing', attempts = attempts + 1, updated_at = now() WHERE id IN (SELECT id FROM marketplace_jobs WHERE status = 'queued' AND run_after <= now() ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 25) RETURNING id, marketplace, operation, sku, payload, attempts`);
  for (const job of claimed.rows as Job[]) {
    try {
      const adapter = getMarketplaceAdapter(job.marketplace);
      if (job.operation === 'reconcile') await adapter.reconcile();
      else if (job.operation === 'import_orders') await adapter.importOrders();
      else if (job.operation === 'update_availability') await adapter.updateAvailability(job.sku ?? '', Number(job.payload.quantity ?? 0));
      else if (job.operation === 'update_price') await adapter.updatePrice(job.sku ?? '', Number(job.payload.price ?? 0));
      else if (job.operation === 'confirm_shipment') await adapter.confirmShipment(String(job.payload.externalOrderId ?? ''), String(job.payload.carrier ?? ''), String(job.payload.trackingNumber ?? ''));
      await query(`UPDATE marketplace_jobs SET status = 'succeeded', updated_at = now() WHERE id = $1`, [job.id]);
    } catch (error) {
      const message = error instanceof Error ? error.message.slice(0, 2000) : 'Unknown marketplace worker error';
      await query(`UPDATE marketplace_jobs SET status = CASE WHEN attempts >= 5 THEN 'failed' ELSE 'queued' END, run_after = now() + (least(60, power(2, attempts)) * interval '1 minute'), last_error = $2, updated_at = now() WHERE id = $1`, [job.id, message]);
    }
  }
};
run().catch((error) => { console.error(error); process.exitCode = 1; });
