import Link from "next/link";

import { query } from "@/lib/db";
import { getAdminDictionary, getAdminNumberLocale } from "@/lib/admin-i18n-server";
import AdminShell from "../../../components/admin/AdminShell";
import { updateWithdrawalStatus } from "./actions";

export const dynamic = "force-dynamic";

type WithdrawalRow = {
  id: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  order_number: string;
  received_date: string | null;
  reason: string | null;
  locale: string | null;
  status: string | null;
  order_match: string | null;
};

const STATUS_OPTIONS = ["new", "processing", "refunded", "rejected"] as const;

const statusLabel = (status: string, isGerman: boolean): string => {
  const labels: Record<string, [string, string]> = {
    new: ["Neu", "New"],
    processing: ["In Bearbeitung", "Processing"],
    refunded: ["Erstattet", "Refunded"],
    rejected: ["Abgelehnt", "Rejected"],
  };
  const entry = labels[status] ?? [status, status];
  return isGerman ? entry[0] : entry[1];
};

export default async function WithdrawalsPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string; error?: string }>;
}) {
  const params = await searchParams;
  const dict = await getAdminDictionary();
  const numberLocale = await getAdminNumberLocale();
  const isGerman = numberLocale.startsWith("de");

  const result = await query(
    `SELECT id, created_at, customer_name, customer_email, order_number, received_date, reason, locale, status, order_match
     FROM withdrawal_requests
     ORDER BY created_at DESC
     LIMIT 200`,
  );
  const rows = result.rows as WithdrawalRow[];
  const dateFormat = new Intl.DateTimeFormat(numberLocale, { dateStyle: "medium", timeStyle: "short" });

  const openCount = rows.filter((row) => row.status === "new" || row.status === "processing").length;

  return (
    <AdminShell title={dict.sidebar.withdrawals}>
      {params.updated ? (
        <div className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600">
          {isGerman ? "Gespeichert." : "Saved."}
        </div>
      ) : null}
      {params.error ? (
        <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-600">
          {isGerman ? "Aktion fehlgeschlagen." : "Action failed."}
        </div>
      ) : null}

      <div className="glass-panel rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              {isGerman ? "Widerrufe (14-Tage-Widerrufsrecht)" : "Withdrawals (14-day right)"}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              {isGerman
                ? `${openCount} offene Widerrufe`
                : `${openCount} open withdrawals`}
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-muted">
              {isGerman
                ? "Frist: Erstattung spätestens 14 Tage nach Eingang des Widerrufs (Zurückbehaltung bis Wareneingang oder Versandnachweis zulässig)."
                : "Deadline: refund within 14 days of receiving the withdrawal (you may withhold until the goods arrive or shipping proof is provided)."}
            </p>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-xl border border-border/60">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-strong/60 text-xs uppercase tracking-[0.2em] text-muted">
              <tr>
                <th className="px-4 py-3">{isGerman ? "Eingang" : "Received"}</th>
                <th className="px-4 py-3">{isGerman ? "Kunde" : "Customer"}</th>
                <th className="px-4 py-3">{isGerman ? "Bestellung" : "Order"}</th>
                <th className="px-4 py-3">{isGerman ? "Ware erhalten" : "Goods received"}</th>
                <th className="px-4 py-3">{isGerman ? "Grund" : "Reason"}</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows.map((row) => (
                  <tr key={row.id} className="border-t border-border/50">
                    <td className="px-4 py-3 text-muted">{dateFormat.format(new Date(row.created_at))}</td>
                    <td className="px-4 py-3 text-muted">
                      <div className="font-medium text-foreground">{row.customer_name}</div>
                      <div className="text-xs">{row.customer_email}</div>
                    </td>
                    <td className="px-4 py-3">
                      {row.order_match ? (
                        <Link href={`/admin/orders/${row.order_match}`} className="font-semibold text-foreground underline-offset-4 hover:underline">
                          {row.order_number}
                        </Link>
                      ) : (
                        <span>
                          <span className="text-muted">{row.order_number}</span>
                          <span className="ml-2 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-red-400">
                            {isGerman ? "Nicht gefunden" : "Not found"}
                          </span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">{row.received_date || "-"}</td>
                    <td className="max-w-[240px] px-4 py-3 text-xs text-muted">{row.reason || "-"}</td>
                    <td className="px-4 py-3">
                      <form action={updateWithdrawalStatus} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={row.id} />
                        <select
                          name="status"
                          defaultValue={row.status ?? "new"}
                          className="rounded-lg border border-border/60 bg-surface-strong/40 px-2 py-1.5 text-xs text-foreground focus:outline-none"
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {statusLabel(option, isGerman)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="rounded-lg border border-border/60 px-2.5 py-1.5 text-xs font-semibold text-foreground"
                          title={isGerman ? "Speichern" : "Save"}
                        >
                          &#10003;
                        </button>
                      </form>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted">
                    {isGerman ? "Keine Widerrufe vorhanden." : "No withdrawals yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
