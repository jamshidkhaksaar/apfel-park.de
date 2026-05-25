import AdminShell from "../../../components/admin/AdminShell";
import { getAdminDictionary, getAdminLocale } from "@/lib/admin-i18n-server";
import { getPaymentMode, getShopCurrency, getVatRate } from "@/lib/checkout";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

type ProviderStatus = {
  name: string;
  configured: boolean;
  webhookConfigured: boolean;
  notes: string[];
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

export default async function PaymentsPage() {
  const [dict, locale, webhookEvents] = await Promise.all([
    getAdminDictionary(),
    getAdminLocale(),
    getLastWebhookStatus(),
  ]);
  const isGerman = locale === "de";
  const providers: ProviderStatus[] = [
    {
      name: "Stripe",
      configured: Boolean(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
      webhookConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
      notes: [
        `Secret: ${mask(process.env.STRIPE_SECRET_KEY)}`,
        `Publishable: ${mask(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)}`,
        `Webhook: ${process.env.STRIPE_WEBHOOK_SECRET ? "configured" : "missing"}`,
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

