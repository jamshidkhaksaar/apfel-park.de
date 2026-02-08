import { createClient } from "@/lib/supabase/server";
import AdminShell from "../../../components/admin/AdminShell";

export const dynamic = "force-dynamic";

type RepairRow = {
  id: string;
  ticket_number: number | null;
  device_model: string;
  issue_description: string | null;
  status: string | null;
};

const formatStatus = (status: string | null): string => {
  if (!status) return "Unbekannt";
  if (status === "new") return "Neu";
  if (status === "in_progress") return "In Arbeit";
  if (status === "waiting_for_parts") return "Warten auf Teile";
  if (status === "ready") return "Abholbereit";
  if (status === "completed") return "Abgeschlossen";
  if (status === "cancelled") return "Storniert";
  return status;
};

export default async function RepairsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("repairs")
    .select("id,ticket_number,device_model,issue_description,status")
    .order("created_at", { ascending: false })
    .limit(100);

  const repairs = (data ?? []) as RepairRow[];

  return (
    <AdminShell title="Reparaturaufträge">
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Werkstatt-Workflow
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              Reparaturstatus
            </h2>
          </div>
          <button className="rounded-full bg-brand-gold px-6 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-black">
            Neuer Auftrag
          </button>
        </div>
        <div className="mt-6 overflow-hidden rounded-xl border border-border/60">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-strong/60 text-xs uppercase tracking-[0.2em] text-muted">
              <tr>
                <th className="px-4 py-3">Ticket</th>
                <th className="px-4 py-3">Gerät</th>
                <th className="px-4 py-3">Problem</th>
                <th className="px-4 py-3">Status</th>
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
                    <td className="px-4 py-3 text-muted">{formatStatus(repair.status)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted">
                    Noch keine Reparaturauftrage vorhanden.
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
