"use client";

import AdminShell from "../../../components/admin/AdminShell";
import { useAdmin } from "@/lib/admin-context";

export default function PaymentsPage() {
  const { dict } = useAdmin();

  return (
    <AdminShell title={dict.paymentsPage.title}>
      <div className="grid gap-6 xl:grid-cols-[1fr_350px]">
        {/* Main Provider List */}
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground">
            {dict.paymentsPage.providersTitle}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {dict.paymentsPage.providersDesc}
          </p>

          <div className="mt-8 rounded-xl border border-border/60 bg-black/20 p-6 text-sm text-muted">
            {dict.paymentsPage.providersEmpty}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="font-semibold text-foreground">{dict.paymentsPage.transactionsTitle}</h3>
            <p className="mt-2 text-sm text-muted">
              {dict.paymentsPage.transactionsDesc}
            </p>
            <div className="mt-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted">{dict.paymentsPage.revenueToday}</span>
                <span className="font-mono text-brand-gold">2.450 €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">{dict.paymentsPage.openPayouts}</span>
                <span className="font-mono text-foreground">890 €</span>
              </div>
              <div className="h-px w-full bg-border/50" />
              <button className="w-full rounded-xl bg-surface-strong py-2 text-xs font-semibold text-foreground transition hover:bg-brand-gold hover:text-black">
                {dict.paymentsPage.openReport}
              </button>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6">
            <h3 className="font-semibold text-foreground">{dict.paymentsPage.taxesTitle}</h3>
            <div className="mt-4 space-y-3">
              <label className="flex items-center justify-between text-sm text-muted">
                <span>{dict.paymentsPage.vat}</span>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </label>
              <label className="flex items-center justify-between text-sm text-muted">
                <span>{dict.paymentsPage.smallBusiness}</span>
                <input type="checkbox" className="h-4 w-4" />
              </label>
              <label className="flex items-center justify-between text-sm text-muted">
                <span>{dict.paymentsPage.oss}</span>
                <input type="checkbox" className="h-4 w-4" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
