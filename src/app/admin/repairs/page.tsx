import { createClient } from "@/lib/supabase/server";
import { getAdminDictionary } from "@/lib/admin-i18n-server";
import type { AdminDictionary } from "@/lib/admin-i18n";
import AdminShell from "../../../components/admin/AdminShell";

export const dynamic = "force-dynamic";

type RepairRow = {
  id: string;
  ticket_number: number | null;
  device_model: string;
  issue_description: string | null;
  status: string | null;
};

const formatStatus = (status: string | null, dict: AdminDictionary): string => {
  if (!status) return dict.repairsPage.status.unknown;
  const normalized = status.toLowerCase().trim();
  if (normalized === "new" || normalized === "neu") return dict.repairsPage.status.new;
  if (normalized === "in_progress" || normalized === "in arbeit") {
    return dict.repairsPage.status.in_progress;
  }
  if (normalized === "waiting_for_parts" || normalized === "warten auf teile") {
    return dict.repairsPage.status.waiting_for_parts;
  }
  if (normalized === "ready" || normalized === "abholbereit") return dict.repairsPage.status.ready;
  if (normalized === "completed" || normalized === "abgeschlossen") {
    return dict.repairsPage.status.completed;
  }
  if (normalized === "cancelled" || normalized === "storniert") {
    return dict.repairsPage.status.cancelled;
  }
  return status;
};

export default async function RepairsPage() {
  const supabase = await createClient();
  const dict = await getAdminDictionary();
  const { data } = await supabase
    .from("repairs")
    .select("id,ticket_number,device_model,issue_description,status")
    .order("created_at", { ascending: false })
    .limit(100);

  const repairs = (data ?? []) as RepairRow[];

  return (
    <AdminShell title={dict.repairsPage.title}>
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              {dict.repairsPage.eyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              {dict.repairsPage.heading}
            </h2>
          </div>
          <button className="rounded-full bg-brand-gold px-6 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-black">
            {dict.repairsPage.create}
          </button>
        </div>
        <div className="mt-6 overflow-hidden rounded-xl border border-border/60">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-strong/60 text-xs uppercase tracking-[0.2em] text-muted">
              <tr>
                <th className="px-4 py-3">{dict.repairsPage.table.ticket}</th>
                <th className="px-4 py-3">{dict.repairsPage.table.device}</th>
                <th className="px-4 py-3">{dict.repairsPage.table.issue}</th>
                <th className="px-4 py-3">{dict.repairsPage.table.status}</th>
              </tr>
            </thead>
            <tbody>
              {repairs.length > 0 ? (
                repairs.map((repair) => (
                  <tr
                    key={repair.id}
                    className="border-t border-border/50"
                  >
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {repair.ticket_number ? `R-${repair.ticket_number}` : `R-${repair.id.slice(0, 6)}`}
                    </td>
                    <td className="px-4 py-3 text-muted">{repair.device_model}</td>
                    <td className="px-4 py-3 text-muted">{repair.issue_description ?? "-"}</td>
                    <td className="px-4 py-3 text-muted">{formatStatus(repair.status, dict)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted">
                    {dict.repairsPage.empty}
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
