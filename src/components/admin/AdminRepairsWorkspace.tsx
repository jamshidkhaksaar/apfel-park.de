"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { AdminDictionary } from "@/lib/admin-i18n";
import { updateRepair } from "@/app/admin/repairs/actions";
import type { RepairCatalog } from "@/lib/repair-catalog";
import AdminRepairCatalogManager from "@/components/admin/AdminRepairCatalogManager";

type RepairRow = {
  id: string;
  ticket_number: number | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  customer_locale: string | null;
  device_model: string;
  issue_description: string | null;
  status: string | null;
  estimated_cost: number | null;
  final_cost: number | null;
  repair_summary: string | null;
  notes: string | null;
  created_at: string;
};

type Props = {
  locale: "de" | "en";
  repairsPage: AdminDictionary["repairsPage"];
  repairs: RepairRow[];
  catalog: RepairCatalog;
  openRepairs: number;
  showSuccess: boolean;
  showEmailWarning: boolean;
};

const inputClassName =
  "w-full rounded-xl border border-border/70 bg-background/70 px-3 py-2 text-sm text-foreground focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40";

const textareaClassName = `${inputClassName} min-h-28`;

const formatTicket = (repair: RepairRow): string =>
  repair.ticket_number ? `R-${repair.ticket_number}` : `R-${repair.id.slice(0, 6)}`;

const formatDate = (value: string, locale: "de" | "en"): string =>
  new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const formatMoneyInput = (value: number | null): string => (typeof value === "number" ? value.toFixed(2) : "");

const normalizeStatus = (status: string | null): string => (status ?? "new").toLowerCase().trim();

const isClosedStatus = (status: string | null): boolean => ["completed", "cancelled"].includes(normalizeStatus(status));

const badgeClassName = (status: string | null): string => {
  const normalized = normalizeStatus(status);
  if (normalized === "completed" || normalized === "ready") {
    return "border-green-500/30 bg-green-500/10 text-green-300";
  }
  if (normalized === "in_progress" || normalized === "waiting_for_parts") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  }
  if (normalized === "cancelled") {
    return "border-red-500/30 bg-red-500/10 text-red-300";
  }
  return "border-gold/30 bg-gold/10 text-gold";
};

const formatStatus = (status: string | null, repairsPage: AdminDictionary["repairsPage"]): string => {
  const normalized = normalizeStatus(status);
  if (normalized === "new") return repairsPage.status.new;
  if (normalized === "in_progress") return repairsPage.status.in_progress;
  if (normalized === "waiting_for_parts") return repairsPage.status.waiting_for_parts;
  if (normalized === "ready") return repairsPage.status.ready;
  if (normalized === "completed") return repairsPage.status.completed;
  if (normalized === "cancelled") return repairsPage.status.cancelled;
  return repairsPage.status.unknown;
};

export default function AdminRepairsWorkspace({
  locale,
  repairsPage,
  repairs,
  catalog,
  openRepairs,
  showSuccess,
  showEmailWarning,
}: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">("all");
  const [selectedId, setSelectedId] = useState<string | null>(repairs[0]?.id ?? null);
  const [activeTab, setActiveTab] = useState<"inbox" | "catalog">("inbox");

  const text = useMemo(
    () =>
      locale === "de"
        ? {
            queueTitle: "Werkstatt-Eingang",
            queueSubtitle: "Suche, filtere und offne Reparaturen wie in einem Postfach.",
            searchPlaceholder: "Nach Ticket, Kunde, E-Mail oder Gerat suchen",
            filterAll: "Alle",
            filterOpen: "Offen",
            filterClosed: "Fertig",
            emptyList: "Keine Reparaturen fur diesen Filter gefunden.",
            emptyDetail: "Wahle links eine Reparatur aus, um Details und Status zu bearbeiten.",
            customerUpdates: "Kunden-Updates",
            customerUpdatesTo: "Kunden-Updates gehen an",
          noEmail: "Keine Kunden-E-Mail hinterlegt.",
          tabInbox: "Inbox",
          tabCatalog: "Preis-Katalog",
        }
      : {
            queueTitle: "Repair inbox",
            queueSubtitle: "Search, filter, and open repairs like a work mailbox.",
            searchPlaceholder: "Search by ticket, customer, email, or device",
            filterAll: "All",
            filterOpen: "Open",
            filterClosed: "Done",
            emptyList: "No repairs match this filter.",
            emptyDetail: "Select a repair from the left to manage status and details.",
            customerUpdates: "Customer updates",
            customerUpdatesTo: "Customer updates are sent to",
          noEmail: "No customer email saved.",
          tabInbox: "Inbox",
          tabCatalog: "Pricing catalog",
        },
    [locale],
  );

  const filteredRepairs = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return repairs.filter((repair) => {
      if (statusFilter === "open" && isClosedStatus(repair.status)) return false;
      if (statusFilter === "closed" && !isClosedStatus(repair.status)) return false;

      if (!needle) return true;

      const haystack = [
        formatTicket(repair),
        repair.customer_name,
        repair.customer_email ?? "",
        repair.device_model,
        repair.issue_description ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(needle);
    });
  }, [repairs, search, statusFilter]);

  const effectiveSelectedId =
    filteredRepairs.some((repair) => repair.id === selectedId) ? selectedId : filteredRepairs[0]?.id ?? null;

  const selectedRepair = filteredRepairs.find((repair) => repair.id === effectiveSelectedId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {([
          ["inbox", text.tabInbox],
          ["catalog", text.tabCatalog],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setActiveTab(value)}
            className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
              activeTab === value
                ? "border-gold/50 bg-gold/10 text-gold"
                : "border-border/60 bg-background/40 text-muted hover:border-gold/30 hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {showSuccess && (
        <div className="glass-panel rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-300">
          {showEmailWarning ? repairsPage.emailWarning : repairsPage.success}
        </div>
      )}

      {activeTab === "catalog" ? (
        <AdminRepairCatalogManager locale={locale} initialCatalog={catalog} />
      ) : (
      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="glass-panel flex min-h-[72vh] flex-col rounded-2xl p-5 xl:sticky xl:top-8 xl:max-h-[calc(100vh-4rem)]">
          <div className="border-b border-border/50 pb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{repairsPage.eyebrow}</p>
            <h2 className="mt-2 break-words text-2xl font-semibold leading-tight text-foreground">{text.queueTitle}</h2>
            <p className="mt-2 text-sm text-muted">{text.queueSubtitle}</p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                <p className="break-words text-xs uppercase tracking-[0.2em] text-muted">{repairsPage.title}</p>
                <p className="mt-2 text-2xl font-bold text-foreground">{repairs.length}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                <p className="break-words text-xs uppercase tracking-[0.2em] text-muted">{repairsPage.status.new}</p>
                <p className="mt-2 text-2xl font-bold text-gold">{openRepairs}</p>
              </div>
            </div>

            <div className="mt-4">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={text.searchPlaceholder}
                className={inputClassName}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {([
                ["all", text.filterAll],
                ["open", text.filterOpen],
                ["closed", text.filterClosed],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatusFilter(value)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                    statusFilter === value
                      ? "border-gold/50 bg-gold/10 text-gold"
                      : "border-border/60 bg-background/40 text-muted hover:border-gold/30 hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 flex-1 space-y-2 overflow-y-auto pr-1">
            {filteredRepairs.length > 0 ? (
              filteredRepairs.map((repair) => {
                const selected = repair.id === effectiveSelectedId;

                return (
                  <button
                    key={repair.id}
                    type="button"
                    onClick={() => setSelectedId(repair.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selected
                        ? "border-gold/50 bg-gold/10 shadow-[0_0_0_1px_rgba(212,175,55,0.12)]"
                        : "border-border/60 bg-background/50 hover:border-gold/30 hover:bg-background/70"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{formatTicket(repair)}</p>
                        <p className="mt-1 text-sm text-muted">{repair.customer_name}</p>
                      </div>
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${badgeClassName(repair.status)}`}>
                        {formatStatus(repair.status, repairsPage)}
                      </span>
                    </div>

                    <p className="mt-3 text-sm font-medium text-foreground">{repair.device_model}</p>
                    <p className="mt-2 line-clamp-2 text-sm text-muted">{repair.issue_description ?? "-"}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted">
                      <span>{(repair.customer_locale ?? locale).toUpperCase()}</span>
                      <span>{formatDate(repair.created_at, locale)}</span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 p-6 text-sm text-muted">
                {text.emptyList}
              </div>
            )}
          </div>
        </aside>

        <section className="glass-panel rounded-2xl p-6">
          {selectedRepair ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/50 pb-5">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="break-words text-2xl font-semibold leading-tight text-foreground">{formatTicket(selectedRepair)}</h3>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${badgeClassName(selectedRepair.status)}`}>
                      {formatStatus(selectedRepair.status, repairsPage)}
                    </span>
                    <span className="rounded-full border border-border/60 px-3 py-1 text-xs uppercase tracking-[0.2em] text-muted">
                      {(selectedRepair.customer_locale ?? locale).toUpperCase()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted">{selectedRepair.device_model}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={`/admin/repair-estimates/new?repairId=${selectedRepair.id}`}
                    prefetch={false}
                    className="btn-secondary"
                  >
                    {locale === "de" ? "Kostenvoranschlag erstellen" : "Create estimate"}
                  </Link>
                  <div className="rounded-2xl border border-border/60 bg-background/50 px-4 py-3 text-sm">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted">{repairsPage.createdAt}</p>
                    <p className="mt-1 font-medium text-foreground">{formatDate(selectedRepair.created_at, locale)}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">{repairsPage.fields.customerName}</p>
                  <p className="mt-2 font-semibold text-foreground">{selectedRepair.customer_name}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">{repairsPage.fields.customerEmail}</p>
                  <p className="mt-2 break-all text-sm text-foreground">{selectedRepair.customer_email ?? "-"}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">{repairsPage.fields.customerPhone}</p>
                  <p className="mt-2 text-sm text-foreground">{selectedRepair.customer_phone ?? "-"}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">{repairsPage.fields.device}</p>
                  <p className="mt-2 text-sm text-foreground">{selectedRepair.device_model}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/50 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-muted">{repairsPage.issueLabel}</p>
                <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">{selectedRepair.issue_description ?? "-"}</p>
              </div>

              <form action={updateRepair} className="grid gap-5">
                <input type="hidden" name="id" value={selectedRepair.id} />

                <div className="grid gap-4 lg:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                      {repairsPage.statusLabel}
                    </label>
                    <select name="status" defaultValue={normalizeStatus(selectedRepair.status)} className={inputClassName}>
                      <option value="new">{repairsPage.status.new}</option>
                      <option value="in_progress">{repairsPage.status.in_progress}</option>
                      <option value="waiting_for_parts">{repairsPage.status.waiting_for_parts}</option>
                      <option value="ready">{repairsPage.status.ready}</option>
                      <option value="completed">{repairsPage.status.completed}</option>
                      <option value="cancelled">{repairsPage.status.cancelled}</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                      {repairsPage.estimatedCost}
                    </label>
                    <input
                      type="text"
                      name="estimatedCost"
                      defaultValue={formatMoneyInput(selectedRepair.estimated_cost)}
                      placeholder="0.00"
                      className={inputClassName}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                      {repairsPage.finalCost}
                    </label>
                    <input
                      type="text"
                      name="finalCost"
                      defaultValue={formatMoneyInput(selectedRepair.final_cost)}
                      placeholder="0.00"
                      className={inputClassName}
                    />
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                      {repairsPage.repairSummary}
                    </label>
                    <textarea
                      name="repairSummary"
                      defaultValue={selectedRepair.repair_summary ?? ""}
                      className={textareaClassName}
                      placeholder={
                        locale === "de"
                          ? "Was wurde repariert, ersetzt oder gepruft?"
                          : "What was repaired, replaced, or checked?"
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                      {repairsPage.internalNotes}
                    </label>
                    <textarea
                      name="notes"
                      defaultValue={selectedRepair.notes ?? ""}
                      className={textareaClassName}
                      placeholder={
                        locale === "de" ? "Interne Hinweise fur das Team" : "Internal notes for the team"
                      }
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{text.customerUpdates}</p>
                  <p className="mt-2 text-sm text-foreground">
                    {selectedRepair.customer_email ? (
                      <>
                        {text.customerUpdatesTo} <strong>{selectedRepair.customer_email}</strong>.
                      </>
                    ) : (
                      text.noEmail
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3">
                  <button type="submit" className="btn-primary">
                    {repairsPage.save}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex min-h-[60vh] items-center justify-center rounded-2xl border border-dashed border-border/70 bg-background/30 p-8 text-center text-sm text-muted">
              {text.emptyDetail}
            </div>
          )}
        </section>
      </div>
      )}
    </div>
  );
}
