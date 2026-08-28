import { randomUUID } from "node:crypto";
import { claimWebhookEvent, completeWebhookEvent } from "../src/lib/checkout";
import { query } from "../src/lib/db";

const main = async () => {
  const eventId = `audit-${randomUUID()}`;
  try {
    const claims = await Promise.all([
      claimWebhookEvent({ provider: "stripe", eventId, eventType: "audit.test", payload: { test: true } }),
      claimWebhookEvent({ provider: "stripe", eventId, eventType: "audit.test", payload: { test: true } }),
    ]);
    const claimed = claims.find((claim) => claim.status === "claimed");
    if (!claimed || claimed.status !== "claimed" || claims.filter((claim) => claim.status === "busy").length !== 1) {
      throw new Error(`Unexpected concurrent claims: ${JSON.stringify(claims)}`);
    }
    await completeWebhookEvent("stripe", eventId, claimed.token);
    const duplicate = await claimWebhookEvent({ provider: "stripe", eventId, eventType: "audit.test", payload: { test: true } });
    if (duplicate.status !== "processed") throw new Error(`Expected processed duplicate, received ${JSON.stringify(duplicate)}`);
    console.log(JSON.stringify({ concurrent: claims.map((claim) => claim.status).sort(), duplicate: duplicate.status }));
  } finally {
    await query(`DELETE FROM payment_webhook_events WHERE provider='stripe' AND provider_event_id=$1`, [eventId]);
  }
};

main().catch((error) => { console.error(error); process.exit(1); });
