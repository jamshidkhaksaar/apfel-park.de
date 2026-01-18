import AdminShell from "../../../components/admin/AdminShell";

const repairs = [
  {
    ticket: "R-204",
    device: "iPhone 14 Pro",
    issue: "Display",
    status: "Diagnose",
  },
  {
    ticket: "R-203",
    device: "Samsung S23",
    issue: "Wasserschaden",
    status: "In Arbeit",
  },
  {
    ticket: "R-202",
    device: "iPad Air",
    issue: "Akku",
    status: "Fertig",
  },
];

export default function RepairsPage() {
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
              {repairs.map((repair) => (
                <tr key={repair.ticket} className="border-t border-border/50">
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {repair.ticket}
                  </td>
                  <td className="px-4 py-3 text-muted">{repair.device}</td>
                  <td className="px-4 py-3 text-muted">{repair.issue}</td>
                  <td className="px-4 py-3 text-muted">{repair.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
