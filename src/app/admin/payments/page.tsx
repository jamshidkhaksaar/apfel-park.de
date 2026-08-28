import AdminShell from "../../../components/admin/AdminShell";
import { getAdminDictionary, getAdminLocale } from "@/lib/admin-i18n-server";
import { getPaymentMode, getShopCurrency, getVatRate } from "@/lib/checkout";
import { query } from "@/lib/db";
import { resolveStripeConfiguration } from "@/lib/payment-provider-status";

export const dynamic = "force-dynamic";

type ProviderStatus = {
  name: string;
  configured: boolean;
  webhookConfigured: boolean;
  notes: string[];
};

type PaymentDiagnostics = {
  paid: number;
  unpaid: number;
  expired: number;
  paymentFailed: number;
  processing: number;
  lastSuccessfulPayment: string | null;
  lastStripeWebhook: string | null;
};

const mask = (value?: string) => {
  if (!value) return "missing";
  if (value.length <= 8) return "configured";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
};

async function getLastWebhookStatus() {
  try {
    const result = await query(
      `SELECT provider, event_type, processed_at
       FROM payment_webhook_events
       ORDER BY processed_at DESC
       LIMIT 5`,
    );
    return result.rows as Array<{ provider: string; event_type: string; processed_at: string }>;
  } catch {
    return [];
  }
}

async function getPaymentDiagnostics(): Promise<PaymentDiagnostics> {
  try {
    const result = await query(
      `SELECT
         count(*) FILTER (WHERE provider = 'stripe' AND payment_status = 'paid')::int AS paid,
         count(*) FILTER (WHERE provider = 'stripe' AND payment_status = 'unpaid')::int AS unpaid,
         count(*) FILTER (WHERE provider = 'stripe' AND provider_status = 'expired')::int AS expired,
         count(*) FILTER (WHERE provider = 'stripe' AND provider_status = 'payment_failed')::int AS payment_failed,
         count(*) FILTER (WHERE provider = 'stripe' AND provider_status = 'processing')::int AS processing,
         max(paid_at) FILTER (WHERE provider = 'stripe' AND payment_status = 'paid') AS last_successful_payment,
         (SELECT max(processed_at) FROM payment_webhook_events WHERE provider = 'stripe') AS last_stripe_webhook
       FROM orders
       WHERE created_at >= now() - interval '30 days'`,
    );
    const row = result.rows[0] ?? {};
    return {
      paid: Number(row.paid ?? 0),
      unpaid: Number(row.unpaid ?? 0),
      expired: Number(row.expired ?? 0),
      paymentFailed: Number(row.payment_failed ?? 0),
      processing: Number(row.processing ?? 0),
      lastSuccessfulPayment: row.last_successful_payment ?? null,
      lastStripeWebhook: row.last_stripe_webhook ?? null,
    };
  } catch {
    return {
      paid: 0,
      unpaid: 0,
      expired: 0,
      paymentFailed: 0,
      processing: 0,
      lastSuccessfulPayment: null,
      lastStripeWebhook: null,
    };
  }
}

export default async function PaymentsPage() {
  const [dict, locale, webhookEvents, diagnostics] = await Promise.all([
    getAdminDictionary(),
    getAdminLocale(),
    getLastWebhookStatus(),
    getPaymentDiagnostics(),
  ]);
  const isGerman = locale === "de";
  const stripeConfiguration = resolveStripeConfiguration({
    secret: process.env.STRIPE_SECRET_KEY,
    webhook: process.env.STRIPE_WEBHOOK_SECRET,
    publishable: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  });
  const providers: ProviderStatus[] = [
    {
      name: "Stripe",
      configured: stripeConfiguration.ready,
      webhookConfigured: stripeConfiguration.webhookConfigured,
      notes: [
        `Secret: ${mask(process.env.STRIPE_SECRET_KEY)}`,
        stripeConfiguration.publishableConfigured
          ? `Publishable: ${mask(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)}`
          : isGerman ? "Publishable: optional · Hosted Checkout aktiv" : "Publishable: optional · Hosted Checkout active",
        `Webhook: ${process.env.STRIPE_WEBHOOK_SECRET ? "configured" : "missing"}`,
        `${isGerman ? "Modus" : "Mode"}: ${stripeConfiguration.checkoutMode === "embedded" ? "Payment Element" : "Hosted Checkout"}`,
      ],
    },
    {
      name: "PayPal",
      configured: Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
      webhookConfigured: Boolean(process.env.PAYPAL_WEBHOOK_ID),
      notes: [
        `Client ID: ${mask(process.env.PAYPAL_CLIENT_ID)}`,
        `Client secret: ${mask(process.env.PAYPAL_CLIENT_SECRET)}`,
        `Webhook ID: ${process.env.PAYPAL_WEBHOOK_ID ? "configured" : "optional/missing"}`,
      ],
    },
  ];

  return (
    <AdminShell title={dict.paymentsPage.title}>
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                {isGerman ? "Sichere Checkout-Konfiguration" : "Secure checkout configuration"}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-foreground">
                {dict.paymentsPage.providersTitle}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                {isGerman
                  ? "Zahlungsschlüssel werden ausschließlich aus Umgebungsvariablen gelesen und hier nicht bearbeitbar gespeichert."
                  : "Payment secrets are read only from environment variables and are not stored in editable admin fields."}
              </p>
            </div>
            <span className="rounded-full border border-border/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              {getPaymentMode()}
            </span>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {providers.map((provider) => (
              <div key={provider.name} className="rounded-2xl border border-border/60 bg-surface/40 p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-foreground">{provider.name}</h3>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${provider.configured ? "bg-emerald-500/15 text-emerald-200" : "bg-red-500/15 text-red-200"}`}>
                    {provider.configured ? (isGerman ? "bereit" : "ready") : (isGerman ? "fehlt" : "missing")}
                  </span>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-muted">
                  {provider.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-muted">
                  {provider.webhookConfigured
                    ? isGerman ? "Webhook-Verifikation ist konfiguriert." : "Webhook verification is configured."
                    : isGerman ? "Webhook-Konfiguration fehlt oder ist optional." : "Webhook configuration is missing or optional."}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="font-semibold text-foreground">{isGerman ? "Shop-Regeln" : "Shop rules"}</h3>
            <div className="mt-4 space-y-3 text-sm text-muted">
              <div className="flex justify-between gap-4">
                <span>{isGerman ? "Währung" : "Currency"}</span>
                <span className="font-semibold text-foreground">{getShopCurrency()}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>{isGerman ? "MwSt. inklusive" : "VAT included"}</span>
                <span className="font-semibold text-foreground">{Math.round(getVatRate() * 100)}%</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>{isGerman ? "Versand" : "Shipping"}</span>
                <span className="font-semibold text-foreground">{isGerman ? "Abholung + DE" : "Pickup + DE"}</span>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6">
            <h3 className="font-semibold text-foreground">
              {isGerman ? "Stripe-Diagnose · 30 Tage" : "Stripe diagnostics · 30 days"}
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              {[
                [isGerman ? "Bezahlt" : "Paid", diagnostics.paid],
                [isGerman ? "Offen" : "Unpaid", diagnostics.unpaid],
                [isGerman ? "Abgelaufen" : "Expired", diagnostics.expired],
                [isGerman ? "Zahlung fehlgeschlagen" : "Payment failed", diagnostics.paymentFailed],
                [isGerman ? "In Bearbeitung" : "Processing", diagnostics.processing],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-xl border border-border/60 bg-surface/40 p-3">
                  <div className="text-xs text-muted">{label}</div>
                  <div className="mt-1 text-xl font-semibold text-foreground">{value}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2 border-t border-border/60 pt-4 text-xs text-muted">
              <p>
                {isGerman ? "Letzte erfolgreiche Zahlung" : "Last successful payment"}: {" "}
                <span className="text-foreground">
                  {diagnostics.lastSuccessfulPayment
                    ? new Date(diagnostics.lastSuccessfulPayment).toLocaleString(isGerman ? "de-DE" : "en-US")
                    : isGerman ? "keine in diesem Zeitraum" : "none in this period"}
                </span>
              </p>
              <p>
                {isGerman ? "Letzter Stripe-Webhook" : "Last Stripe webhook"}: {" "}
                <span className="text-foreground">
                  {diagnostics.lastStripeWebhook
                    ? new Date(diagnostics.lastStripeWebhook).toLocaleString(isGerman ? "de-DE" : "en-US")
                    : isGerman ? "noch keiner" : "none yet"}
                </span>
              </p>
              <p>
                {isGerman
                  ? "Abgelaufen bedeutet meist, dass eine geöffnete Stripe-Kasse nicht abgeschlossen wurde; es ist kein Kartenfehler."
                  : "Expired usually means an opened Stripe checkout was not completed; it is not a card error."}
              </p>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6">
            <h3 className="font-semibold text-foreground">{isGerman ? "Letzte Webhooks" : "Latest webhooks"}</h3>
            <div className="mt-4 space-y-3 text-sm text-muted">
              {webhookEvents.length > 0 ? webhookEvents.map((event) => (
                <div key={`${event.provider}-${event.event_type}-${event.processed_at}`} className="rounded-xl border border-border/60 bg-surface/40 p-3">
                  <div className="font-semibold text-foreground">{event.provider} · {event.event_type}</div>
                  <div className="mt-1 text-xs">{new Date(event.processed_at).toLocaleString(isGerman ? "de-DE" : "en-US")}</div>
                </div>
              )) : (
                <p>{isGerman ? "Noch keine Webhooks verarbeitet." : "No webhooks processed yet."}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

