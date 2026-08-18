import { withTransaction } from "@/lib/db";
import { adjustInventory } from "@/lib/marketplaces/inventory";
import type { Marketplace } from "@/lib/marketplaces/types";

export type MarketplaceOrderLine = { sku: string; quantity: number };

export const importMarketplaceOrder = async (input: {
  marketplace: Marketplace;
  externalOrderId: string;
  status: string;
  fulfillmentMode: "MFN" | "FBA";
  lines: MarketplaceOrderLine[];
  rawPayload: unknown;
  cancelled?: boolean;
}): Promise<void> => {
  const normalizedLines = Array.from(
    input.lines.reduce((map, line) => {
      const sku = line.sku.trim();
      const quantity = Math.max(0, Math.trunc(line.quantity));
      if (sku && quantity > 0) map.set(sku, (map.get(sku) ?? 0) + quantity);
      return map;
    }, new Map<string, number>()),
    ([sku, quantity]) => ({ sku, quantity }),
  );
  if (!input.externalOrderId || normalizedLines.length === 0) return;

  await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO marketplace_orders (
         marketplace, external_order_id, fulfillment_mode, status, raw_payload, imported_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5::jsonb, now(), now())
       ON CONFLICT (marketplace, external_order_id) DO UPDATE SET
         fulfillment_mode = excluded.fulfillment_mode,
         status = excluded.status,
         raw_payload = excluded.raw_payload,
         updated_at = now()`,
      [
        input.marketplace,
        input.externalOrderId,
        input.fulfillmentMode,
        input.status,
        JSON.stringify(input.rawPayload ?? {}),
      ],
    );

    for (const line of normalizedLines) {
      const saleReference = `${input.marketplace}:${input.externalOrderId}:${line.sku}`;
      if (input.cancelled) {
        const sale = await client.query(
          `SELECT greatest(0, -adjustment.quantity_delta)::int AS sold_quantity
             FROM inventory_adjustments adjustment
             JOIN inventory_skus inventory ON inventory.id = adjustment.inventory_sku_id
            WHERE inventory.sku = $1
              AND adjustment.reference_type = 'marketplace_order_line'
              AND adjustment.reference_id = $2
              AND adjustment.event_type = 'sale'
            LIMIT 1`,
          [line.sku, saleReference],
        );
        const soldQuantity = Number(sale.rows[0]?.sold_quantity ?? 0);
        if (soldQuantity > 0) {
          await adjustInventory({
            sku: line.sku,
            type: "return",
            quantity: soldQuantity,
            referenceType: "marketplace_order_cancellation",
            referenceId: saleReference,
            actor: input.marketplace,
            metadata: { externalOrderId: input.externalOrderId },
          }, client);
        }
        continue;
      }

      if (input.fulfillmentMode === "MFN") {
        await adjustInventory({
          sku: line.sku,
          type: "marketplace_sale",
          quantity: line.quantity,
          referenceType: "marketplace_order_line",
          referenceId: saleReference,
          actor: input.marketplace,
          metadata: { externalOrderId: input.externalOrderId },
        }, client);
      }
    }
  });
};
