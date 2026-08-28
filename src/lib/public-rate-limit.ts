import { createHmac } from "node:crypto";
import { isIP } from "node:net";

import { withTransaction } from "@/lib/db";

export const getTrustedClientIp = (headers: Headers): string => {
  const value = headers.get("x-real-ip")?.trim() || "";
  return isIP(value) ? value : "unknown";
};

export const consumePublicRateLimit = async (
  headers: Headers,
  action: string,
  maximum: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; retryAfter: number }> => {
  const secret = process.env.APP_SESSION_SECRET?.trim();
  if (!secret) return { allowed: false, retryAfter: windowSeconds };
  const ip = getTrustedClientIp(headers);
  const bucket = createHmac("sha256", secret).update(`${action}:${ip}`).digest("hex");
  try {
    return await withTransaction(async (client) => {
      await client.query(`DELETE FROM public_request_rate_limits WHERE reset_at < now() - interval '1 day'`);
      const result = await client.query(
        `INSERT INTO public_request_rate_limits(action,bucket_hash,count,reset_at,updated_at)
         VALUES($1,$2,1,now()+($3::int * interval '1 second'),now())
         ON CONFLICT(action,bucket_hash) DO UPDATE SET
           count=CASE WHEN public_request_rate_limits.reset_at<=now() THEN 1 ELSE public_request_rate_limits.count+1 END,
           reset_at=CASE WHEN public_request_rate_limits.reset_at<=now() THEN now()+($3::int * interval '1 second') ELSE public_request_rate_limits.reset_at END,
           updated_at=now()
         RETURNING count,GREATEST(1,CEIL(EXTRACT(EPOCH FROM (reset_at-now()))))::int AS retry_after`,
        [action, bucket, windowSeconds],
      );
      const row = result.rows[0] as { count?: number; retry_after?: number } | undefined;
      return { allowed: Number(row?.count ?? maximum + 1) <= maximum, retryAfter: Number(row?.retry_after ?? windowSeconds) };
    });
  } catch (error) {
    console.error("Public rate limit failed closed:", error);
    return { allowed: false, retryAfter: windowSeconds };
  }
};
