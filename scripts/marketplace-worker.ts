import { query } from "../src/lib/db";
import {
  attachProviderReference,
  getOrderPaymentExpectation,
  getPaymentMode,
  isOrderInProviderState,
  markOrderCancelled,
  markOrderPaid,
} from "../src/lib/checkout";
import { getMarketplaceAdapter } from "../src/lib/marketplaces";
import { updateGoogleMerchantAvailability } from "../src/lib/marketplaces/google-merchant-api";
import { loadMarketplaceListingInput } from "../src/lib/marketplaces/listing-input";
import type { Marketplace, MarketplaceOperation } from "../src/lib/marketplaces/types";
import { paypalCaptureIdentityMatches } from "../src/lib/payment-coupon";
import { sendPurchaseTrackingEvents } from "../src/lib/marketing";
import { notifyPaidOrderAdmin } from "../src/lib/order-notifications";
import {
  PAYPAL_STALE_ORDER_STATUSES,
  PROVIDER_RECONCILIATION_AGE_SECONDS,
  STRIPE_CHECKOUT_STALE_STATUSES,
  STRIPE_INTENT_STALE_STATUSES,
  classifyStripeCheckoutSession,
  classifyStripePaymentIntent,
  isStripeIntentReconciliationStatus,
  providerPaymentMatchesExpectation,
} from "../src/lib/checkout-reconciliation";

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
const deltaReconciliationMilliseconds = Math.min(
  86_400_000,
  Math.max(60_000, Number(process.env.MARKETPLACE_DELTA_RECONCILIATION_MS) || 900_000),
);
const once = process.env.MARKETPLACE_WORKER_ONCE === "1";
let stopping = false;
let lastDeltaReconciliationAt = 0;
let lastProviderOutcomeReconciliationAt = 0;

type UncertainProviderOrder = {
  id: string;
  provider: "stripe" | "paypal";
  provider_order_id: string | null;
  provider_session_id: string | null;
  updated_at: string | Date;
  provider_status: string;
};

const errorMessage = (error: unknown): string =>
  (error instanceof Error ? error.message : "Unknown marketplace worker error").slice(0, 2_000);

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

let paypalAccessToken: { token: string; expiresAt: number } | null = null;
const getPayPalBaseUrl = () =>
  getPaymentMode() === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

const getPayPalAccessToken = async (): Promise<string> => {
  if (paypalAccessToken && paypalAccessToken.expiresAt > Date.now() + 60_000) return paypalAccessToken.token;
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) throw new Error("PayPal is not configured for reconciliation");
  const response = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(15_000),
  });
  const data = await response.json() as { access_token?: string; expires_in?: number; error_description?: string };
  if (!response.ok || !data.access_token) throw new Error(data.error_description || "PayPal authentication failed");
  paypalAccessToken = {
    token: data.access_token,
    expiresAt: Date.now() + Math.max(60, Number(data.expires_in) || 300) * 1000,
  };
  return data.access_token;
};

type PayPalOrderSnapshot = {
  id?: string;
  status?: string;
  purchase_units?: Array<{
    reference_id?: string;
    custom_id?: string;
    amount?: { value?: string; currency_code?: string };
    payments?: { captures?: Array<{ id?: string; status?: string; amount?: { value?: string; currency_code?: string } }> };
  }>;
  message?: string;
};

const readPayPalOrder = async (providerOrderId: string): Promise<PayPalOrderSnapshot> => {
  const token = await getPayPalAccessToken();
  const response = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders/${providerOrderId}`, {
    headers: { Authorization: "Bearer " + token },
    signal: AbortSignal.timeout(15_000),
  });
  const data = await response.json() as PayPalOrderSnapshot;
  if (!response.ok) throw new Error(data.message || "PayPal order lookup failed");
  return data;
};

const recordReconciledPayment = async ({
  order,
  providerOrderId,
  providerSessionId,
  providerPaymentId,
  providerStatus,
  providerCents,
  providerCurrency,
}: {
  order: UncertainProviderOrder;
  providerOrderId?: string | null;
  providerSessionId?: string | null;
  providerPaymentId?: string | null;
  providerStatus: string;
  providerCents?: number | null;
  providerCurrency?: string | null;
}) => {
  const expected = await getOrderPaymentExpectation(order.id);
  if (!providerPaymentMatchesExpectation(expected, providerCents, providerCurrency)) {
    throw new Error(`Reconciled ${order.provider} amount or currency mismatch`);
  }
  const paidOrder = await markOrderPaid({
    orderId: order.id,
    provider: order.provider,
    providerOrderId: providerOrderId ?? order.provider_order_id,
    providerSessionId: providerSessionId ?? order.provider_session_id,
    providerPaymentId,
    providerStatus,
  });
  if (!paidOrder) {
    const alreadyPaid = await isOrderInProviderState({
      provider: order.provider,
      orderId: order.id,
      providerOrderId: providerOrderId ?? order.provider_order_id,
      providerSessionId: providerSessionId ?? order.provider_session_id,
      statuses: ["paid"],
      paymentStatuses: ["paid"],
    });
    if (!alreadyPaid) throw new Error(`Reconciled ${order.provider} payment could not transition locally`);
    return;
  }
  try {
    await sendPurchaseTrackingEvents({
      eventId: `purchase-${paidOrder.id}`,
      orderId: paidOrder.id,
      email: paidOrder.customer_email,
      firstName: paidOrder.customer_name,
      value: Number(paidOrder.total_amount),
      currency: paidOrder.currency || "EUR",
      items: Array.isArray(paidOrder.items) ? paidOrder.items : [],
    }, {
      consentMode: paidOrder.consent_mode,
      url: "https://apfel-park.de/checkout/success",
    });
  } catch (error) {
    console.error(`[marketplace-worker] reconciled purchase tracking ${order.id}: ${errorMessage(error)}`);
  }
  const notification = await notifyPaidOrderAdmin(order.id);
  if (notification.status === "failed") {
    console.error(`[marketplace-worker] reconciled order notification ${order.id} failed`);
  }
};

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

const runDeltaReconciliation = async (): Promise<void> => {
  const now = Date.now();
  if (now - lastDeltaReconciliationAt < deltaReconciliationMilliseconds) return;

  const mirrorResult = await query(
    `SELECT reconcile_inventory_mirrors()::int AS repaired`,
  );
  const targetResult = await query(
    `SELECT reconcile_inventory_sync_targets()::int AS queued`,
  );
  lastDeltaReconciliationAt = now;

  const repaired = Number((mirrorResult.rows[0] as { repaired?: number } | undefined)?.repaired ?? 0);
  const queued = Number((targetResult.rows[0] as { queued?: number } | undefined)?.queued ?? 0);
  if (repaired > 0 || queued > 0) {
    console.log(
      `[marketplace-worker] delta reconciliation repaired ${repaired} mirror(s) and queued ${queued} SKU(s)`,
    );
  }
};

const reconcileUncertainProviderOutcomes = async (): Promise<void> => {
  const now = Date.now();
  if (now - lastProviderOutcomeReconciliationAt < 300_000) return;
  lastProviderOutcomeReconciliationAt = now;
  const result = await query(
    `SELECT id, provider, provider_status, provider_order_id, provider_session_id, updated_at FROM orders
     WHERE status = 'pending' AND payment_status = 'unpaid' AND (
       (provider = 'stripe' AND provider_status = ANY($1::text[]) AND created_at < now() - ($2::int * interval '1 second'))
       OR (provider = 'stripe' AND provider_status = ANY($3::text[]) AND created_at < now() - ($4::int * interval '1 second'))
       OR (provider = 'paypal' AND provider_status = ANY($5::text[]) AND created_at < now() - ($6::int * interval '1 second'))
       OR (provider = 'stripe' AND provider_status = 'provider_response_recovered' AND provider_order_id IS NOT NULL AND created_at < now() - ($2::int * interval '1 second'))
       OR (provider = 'stripe' AND provider_status = 'provider_response_recovered' AND provider_session_id IS NOT NULL AND created_at < now() - ($4::int * interval '1 second'))
       OR (provider = 'paypal' AND provider_status = 'provider_response_recovered' AND created_at < now() - ($6::int * interval '1 second'))
     )
     ORDER BY created_at LIMIT 25`,
    [
      [...STRIPE_INTENT_STALE_STATUSES],
      PROVIDER_RECONCILIATION_AGE_SECONDS.stripeIntent,
      [...STRIPE_CHECKOUT_STALE_STATUSES],
      PROVIDER_RECONCILIATION_AGE_SECONDS.stripeCheckout,
      [...PAYPAL_STALE_ORDER_STATUSES],
      PROVIDER_RECONCILIATION_AGE_SECONDS.paypalOrder,
    ],
  );
  for (const order of result.rows as UncertainProviderOrder[]) {
    try {
      const isStripeIntent = order.provider === "stripe" && (
        isStripeIntentReconciliationStatus(order.provider_status)
        || (order.provider_status === "provider_response_recovered" && Boolean(order.provider_order_id))
        || !order.provider_session_id
      );
      if (!isStripeIntent) {
        if (order.provider === "stripe" && order.provider_session_id) {
          const secret = process.env.STRIPE_SECRET_KEY?.trim();
          if (!secret) throw new Error("Stripe is not configured for Checkout Session reconciliation");
          const readSession = async () => {
            const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${order.provider_session_id}`, {
              headers: { Authorization: "Bearer " + secret },
              signal: AbortSignal.timeout(15_000),
            });
            const data = await response.json() as {
              status?: string;
              payment_status?: string;
              amount_total?: number;
              currency?: string;
              payment_intent?: string | null;
              error?: { message?: string };
            };
            if (!response.ok) throw new Error(data.error?.message || "Stripe Checkout Session lookup failed");
            return data;
          };
          let session = await readSession();
          let action = classifyStripeCheckoutSession({ status: session.status, paymentStatus: session.payment_status });
          if (action === "protect") {
            if (session.payment_status === "paid") {
              await recordReconciledPayment({
                order,
                providerSessionId: order.provider_session_id,
                providerPaymentId: session.payment_intent ?? null,
                providerStatus: session.status || "complete",
                providerCents: session.amount_total,
                providerCurrency: session.currency,
              });
              continue;
            }
            await attachProviderReference({
              orderId: order.id,
              provider: "stripe",
              providerSessionId: order.provider_session_id,
              providerStatus: `checkout_${session.status || "unknown"}_${session.payment_status || "unknown"}`,
            });
            continue;
          }
          if (action === "expire") {
            const expired = await fetch(`https://api.stripe.com/v1/checkout/sessions/${order.provider_session_id}/expire`, {
              method: "POST",
              headers: { Authorization: "Bearer " + secret, "Idempotency-Key": `reconcile_expire_${order.id}` },
              signal: AbortSignal.timeout(15_000),
            });
            session = await expired.json() as typeof session;
            if (!expired.ok) throw new Error(session.error?.message || "Stripe Checkout Session expiration failed");
            action = classifyStripeCheckoutSession({ status: session.status, paymentStatus: session.payment_status });
          }
          if (action !== "release") {
            throw new Error(`Stripe Checkout Session remained ${session.status || "unknown"}/${session.payment_status || "unknown"}`);
          }
          const boundSnapshot = await attachProviderReference({
            orderId: order.id,
            provider: "stripe",
            providerSessionId: order.provider_session_id,
            providerStatus: session.status || "expired",
          });
          if (!boundSnapshot) throw new Error("Expired Stripe Checkout Session conflicts with the local order");
          const cancelledOrderId = await markOrderCancelled({
            orderId: order.id,
            provider: "stripe",
            providerSessionId: order.provider_session_id,
            providerStatus: session.status || "expired",
            expectedStatus: "pending",
            expectedPaymentStatus: "unpaid",
            expectedProviderStatus: session.status || "expired",
            expectedProviderOrderId: order.provider_order_id,
            expectedProviderSessionId: order.provider_session_id,
            expectedUpdatedAt: boundSnapshot.updatedAt,
          });
          if (!cancelledOrderId) throw new Error("Expired Stripe Checkout Session changed before cancellation");
          continue;
        }
        if (order.provider === "paypal") {
          if (!order.provider_order_id) throw new Error("Stale PayPal order has no provider order id");
          const snapshot = await readPayPalOrder(order.provider_order_id);
          const purchaseUnit = snapshot.purchase_units?.[0];
          if (!paypalCaptureIdentityMatches({
            paypalOrderId: order.provider_order_id,
            responseOrderId: snapshot.id,
            referenceId: purchaseUnit?.reference_id,
            customId: purchaseUnit?.custom_id,
            localOrderId: order.id,
          })) throw new Error("PayPal reconciliation identity mismatch");
          const capture = purchaseUnit?.payments?.captures?.[0];
          if (snapshot.status === "COMPLETED") {
            const amount = capture?.amount ?? purchaseUnit?.amount;
            const providerCents = amount?.value ? Math.round(Number(amount.value) * 100) : null;
            await recordReconciledPayment({
              order,
              providerOrderId: order.provider_order_id,
              providerPaymentId: capture?.id ?? snapshot.id ?? order.provider_order_id,
              providerStatus: capture?.status ?? snapshot.status,
              providerCents,
              providerCurrency: amount?.currency_code,
            });
            continue;
          }
          if (snapshot.status === "VOIDED") {
            const cancelledOrderId = await markOrderCancelled({
              orderId: order.id,
              provider: "paypal",
              providerOrderId: order.provider_order_id,
              providerStatus: "VOIDED",
              expectedStatus: "pending",
              expectedPaymentStatus: "unpaid",
              expectedProviderStatus: order.provider_status,
              expectedProviderOrderId: order.provider_order_id,
              expectedProviderSessionId: order.provider_session_id,
              expectedUpdatedAt: new Date(order.updated_at).toISOString(),
            });
            if (!cancelledOrderId) throw new Error("Voided PayPal order changed before cancellation");
            continue;
          }
          if (!snapshot.status || !["CREATED", "PAYER_ACTION_REQUIRED", "APPROVED"].includes(snapshot.status)) {
            throw new Error(`PayPal order has unhandled status ${snapshot.status || "unknown"}`);
          }
          if (order.provider_status !== "paypal_expiry_check") {
            const fenced = await attachProviderReference({
              orderId: order.id,
              provider: "paypal",
              providerOrderId: order.provider_order_id,
              providerStatus: "paypal_expiry_check",
            });
            if (!fenced) throw new Error("PayPal expiry fence conflicted with the local order");
            continue;
          }
          const cancelledOrderId = await markOrderCancelled({
            orderId: order.id,
            provider: "paypal",
            providerOrderId: order.provider_order_id,
            providerStatus: `${snapshot.status}_expired`,
            expectedStatus: "pending",
            expectedPaymentStatus: "unpaid",
            expectedProviderStatus: "paypal_expiry_check",
            expectedProviderOrderId: order.provider_order_id,
            expectedProviderSessionId: order.provider_session_id,
            expectedUpdatedAt: new Date(order.updated_at).toISOString(),
          });
          if (!cancelledOrderId) throw new Error("PayPal expiry reconciliation changed before cancellation");
          continue;
        }
        const cancelledOrderId = await markOrderCancelled({ orderId: order.id, provider: order.provider, providerStatus: "stale_provider_outcome_expired", expectedStatus: "pending", expectedPaymentStatus: "unpaid", expectedProviderStatus: order.provider_status, expectedProviderOrderId: order.provider_order_id, expectedProviderSessionId: order.provider_session_id, expectedUpdatedAt: new Date(order.updated_at).toISOString() });
        if (!cancelledOrderId) throw new Error("Stale provider outcome changed before cancellation");
        continue;
      }
      const secret = process.env.STRIPE_SECRET_KEY?.trim();
      if (!secret) throw new Error("Stripe is not configured for PaymentIntent reconciliation");
      const params = new URLSearchParams({ query: `metadata['order_id']:'${order.id}'`, limit: "2" });
      const search = await fetch(`https://api.stripe.com/v1/payment_intents/search?${params}`, {
        headers: { Authorization: `Bearer ${secret}` },
        signal: AbortSignal.timeout(15_000),
      });
      const searchData = await search.json() as {
        data?: Array<{ id?: string; status?: string; amount?: number; currency?: string }>;
        error?: { message?: string };
      };
      if (!search.ok) throw new Error(searchData.error?.message || "Stripe PaymentIntent search failed");
      const intents = (searchData.data ?? []).filter((intent): intent is { id: string; status?: string; amount?: number; currency?: string } => Boolean(intent.id));
      if (intents.length > 1) throw new Error("Multiple PaymentIntents matched one local order");
      if (intents.length === 0) {
        const cancelledOrderId = await markOrderCancelled({ orderId: order.id, provider: "stripe", providerStatus: "no_remote_payment_intent", expectedStatus: "pending", expectedPaymentStatus: "unpaid", expectedProviderStatus: order.provider_status, expectedProviderOrderId: order.provider_order_id, expectedProviderSessionId: order.provider_session_id, expectedUpdatedAt: new Date(order.updated_at).toISOString() });
        if (!cancelledOrderId) throw new Error("Unknown PaymentIntent order changed before cancellation");
        continue;
      }
      const intent = intents[0];
      const boundProviderStatus = intent.status || "reconciled";
      const intentAction = classifyStripePaymentIntent(intent.status);
      if (intentAction === "protect") {
        if (intent.status === "succeeded") {
          await recordReconciledPayment({
            order,
            providerOrderId: intent.id,
            providerPaymentId: intent.id,
            providerStatus: intent.status,
            providerCents: intent.amount,
            providerCurrency: intent.currency,
          });
        } else {
          const protectedSnapshot = await attachProviderReference({ orderId: order.id, provider: "stripe", providerOrderId: intent.id, providerStatus: boundProviderStatus });
          if (!protectedSnapshot) throw new Error("Processing PaymentIntent conflicts with the local order");
        }
        continue;
      }
      if (intentAction === "investigate") throw new Error(`Stripe PaymentIntent has unhandled status ${intent.status || "unknown"}`);
      const boundSnapshot = await attachProviderReference({ orderId: order.id, provider: "stripe", providerOrderId: intent.id, providerStatus: boundProviderStatus });
      if (!boundSnapshot) {
        throw new Error("Reconciled PaymentIntent conflicts with the local order");
      }
      let finalStatus = intent.status;
      if (intentAction === "cancel") {
        const cancelled = await fetch(`https://api.stripe.com/v1/payment_intents/${intent.id}/cancel`, {
          method: "POST",
          headers: { Authorization: `Bearer ${secret}`, "Idempotency-Key": `reconcile_cancel_${order.id}` },
          signal: AbortSignal.timeout(15_000),
        });
        const cancelledData = await cancelled.json() as { status?: string; error?: { message?: string } };
        if (!cancelled.ok) throw new Error(cancelledData.error?.message || "Stripe PaymentIntent cancellation failed");
        finalStatus = cancelledData.status;
      }
      if (finalStatus !== "canceled") throw new Error(`Stripe PaymentIntent remained ${finalStatus || "unknown"}`);
      const cancelledOrderId = await markOrderCancelled({ orderId: order.id, provider: "stripe", providerOrderId: intent.id, providerStatus: "canceled_by_reconciliation", expectedStatus: "pending", expectedPaymentStatus: "unpaid", expectedProviderStatus: boundProviderStatus, expectedProviderOrderId: intent.id, expectedProviderSessionId: order.provider_session_id, expectedUpdatedAt: boundSnapshot.updatedAt });
      if (!cancelledOrderId) throw new Error("PaymentIntent order changed before reconciled cancellation");
    } catch (error) {
      console.error(`[marketplace-worker] provider reconciliation ${order.id}: ${errorMessage(error)}`);
    }
  }
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
  await reconcileUncertainProviderOutcomes();
  await runDeltaReconciliation();
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
