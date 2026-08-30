import Link from "next/link";
import { notFound } from "next/navigation";

import AdminShell from "@/components/admin/AdminShell";
import { isAdminUser } from "@/lib/admin-auth";
import { getAdminLocale } from "@/lib/admin-i18n-server";
import { query } from "@/lib/db";
import {
  canReactivateOfferSubscriber,
  filterOfferSubscribers,
  getOfferSubscriberStatus,
  type OfferSubscriberRow,
  type OfferSubscriberStatus,
} from "@/lib/offer-subscribers";
import { readSessionUser } from "@/lib/session";

import { updateOfferSubscriberStatus } from "./actions";

export const dynamic = "force-dynamic";

const STATUS_FILTERS = ["all", "active", "pending", "unsubscribed"] as const;

export default async function SubscribersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; updated?: string; error?: string }>;
}) {
  const user = await readSessionUser();
  if (!isAdminUser(user)) notFound();
  const locale = await getAdminLocale();
  const de = locale === "de";
  const params = await searchParams;
  const queryText = (params.q ?? "").trim().slice(0, 254);
  const requestedStatus = (params.status ?? "all").toLowerCase();
  const status = STATUS_FILTERS.includes(requestedStatus as (typeof STATUS_FILTERS)[number])
    ? requestedStatus as OfferSubscriberStatus | "all"
    : "all";

  const result = await query(
    `SELECT id, email, locale,
            confirmed_at::text, confirmation_sent_at::text, unsubscribed_at::text,
            created_at::text, updated_at::text
       FROM offer_subscribers
      ORDER BY created_at DESC
      LIMIT 1000`,
  );
  const subscribers = result.rows as OfferSubscriberRow[];
  const filtered = filterOfferSubscribers(subscribers, { query: queryText, status });
  const totals = {
    total: subscribers.length,
    active: subscribers.filter((row) => getOfferSubscriberStatus(row) === "active").length,
    pending: subscribers.filter((row) => getOfferSubscriberStatus(row) === "pending").length,
    unsubscribed: subscribers.filter((row) => getOfferSubscriberStatus(row) === "unsubscribed").length,
  };
  const dateFormat = new Intl.DateTimeFormat(de ? "de-DE" : "en-GB", { dateStyle: "medium", timeStyle: "short" });
  const formatDate = (value: string | null) => value ? dateFormat.format(new Date(value)) : "—";
  const labels = {
    active: de ? "Aktiv" : "Active",
    pending: de ? "Ausstehend" : "Pending",
    unsubscribed: de ? "Abgemeldet" : "Unsubscribed",
  } satisfies Record<OfferSubscriberStatus, string>;
  const statusClass = {
    active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
    pending: "border-amber-500/30 bg-amber-500/10 text-amber-500",
    unsubscribed: "border-slate-500/30 bg-slate-500/10 text-muted",
  } satisfies Record<OfferSubscriberStatus, string>;

  return (
    <AdminShell title={de ? "Angebots-Abonnenten" : "Offer subscribers"}>
      {params.updated ? <div className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600">{de ? "Abonnentenstatus gespeichert." : "Subscriber status saved."}</div> : null}
      {params.error ? <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-600">{de ? "Die Änderung konnte nicht gespeichert werden." : "The change could not be saved."}</div> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: de ? "Gesamt" : "Total", value: totals.total },
          { label: de ? "Aktiv bestätigt" : "Confirmed active", value: totals.active },
          { label: de ? "Bestätigung offen" : "Pending confirmation", value: totals.pending },
          { label: de ? "Abgemeldet" : "Unsubscribed", value: totals.unsubscribed },
        ].map((card) => (
          <div key={card.label} className="glass-panel rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">{card.value}</p>
          </div>
        ))}
      </div>

      <section className="mt-6 glass-panel rounded-2xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Double opt-in</p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">{de ? "Einwilligungen & Status" : "Consent and status"}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              {de
                ? "Diese Ansicht zeigt Einwilligungszeitpunkte und Status. Bestätigungs-Token werden nicht angezeigt. Reaktivieren ist nur nach einer früheren Bestätigung möglich."
                : "This view shows consent timestamps and status. Confirmation tokens are never displayed. Reactivation is only available after prior confirmation."}
            </p>
          </div>
          <Link href="/api/admin/subscribers/export" className="rounded-full border border-border/60 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-foreground transition hover:border-gold/50 hover:text-gold">
            {de ? "CSV exportieren" : "Export CSV"}
          </Link>
        </div>

        <form method="get" className="mt-6 flex flex-wrap items-center gap-3">
          <input type="search" name="q" defaultValue={queryText} placeholder={de ? "E-Mail suchen" : "Search email"} className="w-full max-w-md rounded-full border border-border/60 bg-surface-strong/40 px-5 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold" />
          <select name="status" defaultValue={status} className="rounded-full border border-border/60 bg-surface-strong/40 px-4 py-2.5 text-sm text-foreground focus:outline-none">
            <option value="all">{de ? "Alle Status" : "All statuses"}</option>
            <option value="active">{labels.active}</option>
            <option value="pending">{labels.pending}</option>
            <option value="unsubscribed">{labels.unsubscribed}</option>
          </select>
          <button type="submit" className="rounded-full bg-foreground px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-background">{de ? "Filtern" : "Filter"}</button>
          {queryText || status !== "all" ? <Link href="/admin/subscribers" className="text-xs font-semibold uppercase tracking-[0.2em] text-muted hover:text-gold">{de ? "Zurücksetzen" : "Reset"}</Link> : null}
        </form>

        <div className="mt-6 overflow-x-auto rounded-xl border border-border/60">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-surface-strong/60 text-xs uppercase tracking-[0.14em] text-muted">
              <tr>
                <th className="px-4 py-3">E-Mail</th>
                <th className="px-4 py-3">{de ? "Sprache" : "Language"}</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">{de ? "Angelegt" : "Created"}</th>
                <th className="px-4 py-3">{de ? "Bestätigung gesendet" : "Confirmation sent"}</th>
                <th className="px-4 py-3">{de ? "Bestätigt" : "Confirmed"}</th>
                <th className="px-4 py-3">{de ? "Abgemeldet" : "Unsubscribed"}</th>
                <th className="px-4 py-3">{de ? "Aktion" : "Action"}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map((subscriber) => {
                const subscriberStatus = getOfferSubscriberStatus(subscriber);
                const canReactivate = canReactivateOfferSubscriber(subscriber);
                return (
                  <tr key={subscriber.id} className="border-t border-border/50 align-top">
                    <td className="px-4 py-3 font-medium text-foreground">{subscriber.email}</td>
                    <td className="px-4 py-3 uppercase text-muted">{subscriber.locale}</td>
                    <td className="px-4 py-3"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass[subscriberStatus]}`}>{labels[subscriberStatus]}</span></td>
                    <td className="px-4 py-3 text-xs text-muted">{formatDate(subscriber.created_at)}</td>
                    <td className="px-4 py-3 text-xs text-muted">{formatDate(subscriber.confirmation_sent_at)}</td>
                    <td className="px-4 py-3 text-xs text-muted">{formatDate(subscriber.confirmed_at)}</td>
                    <td className="px-4 py-3 text-xs text-muted">{formatDate(subscriber.unsubscribed_at)}</td>
                    <td className="px-4 py-3">
                      {subscriberStatus === "active" || subscriberStatus === "pending" ? (
                        <form action={updateOfferSubscriberStatus}>
                          <input type="hidden" name="id" value={subscriber.id} />
                          <input type="hidden" name="action" value="unsubscribe" />
                          <button type="submit" className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-500/10">{de ? "Abmelden" : "Unsubscribe"}</button>
                        </form>
                      ) : canReactivate ? (
                        <form action={updateOfferSubscriberStatus}>
                          <input type="hidden" name="id" value={subscriber.id} />
                          <input type="hidden" name="action" value="reactivate" />
                          <button type="submit" className="rounded-lg border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-500 hover:bg-emerald-500/10">{de ? "Reaktivieren" : "Reactivate"}</button>
                        </form>
                      ) : <span className="text-xs text-muted">—</span>}
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-muted">{de ? "Keine Abonnenten für diesen Filter." : "No subscribers match this filter."}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {subscribers.length >= 1000 ? <p className="mt-3 text-xs text-amber-500">{de ? "Es werden maximal 1.000 Einträge angezeigt. Der CSV-Export enthält alle Einträge." : "The dashboard shows at most 1,000 rows. CSV export contains all rows."}</p> : null}
      </section>
    </AdminShell>
  );
}
