import { query } from "@/lib/db";

export const markOpenIntakeRunsStale = async (
  productId: string,
  reason: string,
  executor: { query: typeof query } = { query },
): Promise<number> => {
  const result = await executor.query(
    `UPDATE product_intake_runs
        SET stale_at = now(),
            stale_reason = $2,
            dispatch_status = 'stale'
      WHERE (origin_product_id = $1::uuid OR target_product_id = $1::uuid)
        AND status NOT IN ('applied', 'rejected', 'cancelled')
        AND stale_at IS NULL
      RETURNING id`,
    [productId, reason.slice(0, 300)],
  );
  return result.rowCount ?? result.rows.length;
};
