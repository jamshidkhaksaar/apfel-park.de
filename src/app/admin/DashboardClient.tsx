"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";
import { useAdmin } from "@/lib/admin-context";
import AdminShell from "@/components/admin/AdminShell";
import { KpiTile, StockComposition } from "@/components/admin/AdminStats";
import { formatPrice } from "@/lib/format";
import type { DashboardStats } from "@/lib/admin-dashboard";

type DashboardActivity = {
  id: string;
  type: "repair" | "order";
  label: string;
  sub: string;
  status: string | null;
  createdAt: string;
};

// ── Inline SVG icons ──────────────────────────────────────────────────────────

const WrenchIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
  </svg>
);

const CubeIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
  </svg>
);

const PlusIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const TicketIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
  </svg>
);

const ArrowRightIcon = ({ className }: { className?: string }) => (
  <svg className={className ?? 'h-4 w-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

// ── Helpers ───────────────────────────────────────────────────────────────────

function isShopOpen(): boolean {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 6=Sat
  const hour = now.getHours();
  if (day === 0) return false;
  if (day === 6) return hour >= 10 && hour < 16;
  return hour >= 10 && hour < 19;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DashboardClient({
  stats,
  recentActivity,
}: {
  stats: DashboardStats;
  recentActivity: DashboardActivity[];
}) {
  const { dict, lang } = useAdmin();
  const [shopOpen, setShopOpen] = useState<boolean | null>(null);
  const [liveStats, setLiveStats] = useState(stats);
  const [liveActivity, setLiveActivity] = useState(recentActivity);

  useEffect(() => {
    const update = () => setShopOpen(isShopOpen());
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadLive = async () => {
      try {
        const response = await fetch("/api/admin/dashboard-live", {
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok) return;
        const payload = (await response.json()) as {
          stats?: DashboardStats;
          recentActivity?: DashboardActivity[];
        };
        if (!cancelled) {
          if (payload.stats) setLiveStats(payload.stats);
          if (Array.isArray(payload.recentActivity)) setLiveActivity(payload.recentActivity);
        }
      } catch {
        // ignore transient poll failures
      }
    };

    loadLive();
    const id = window.setInterval(loadLive, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  type AccentKey = 'gold' | 'emerald' | 'indigo' | 'rose';

  const attentionItems = [
    { label: lang === "de" ? "Offene Bestellungen" : "Pending orders", count: liveStats.orders, href: "/admin/orders", tone: "bg-gold/15 text-gold" },
    { label: lang === "de" ? "Neue Reparaturen" : "New repairs", count: liveStats.repairs, href: "/admin/repairs", tone: "bg-gold/15 text-gold" },
    { label: lang === "de" ? "Ungelesene Chats" : "Unread chats", count: liveStats.unreadChats, href: "/admin/chat", tone: "bg-gold/15 text-gold" },
    { label: lang === "de" ? "Ausverkaufte SKUs" : "Out-of-stock SKUs", count: liveStats.outOfStockSkus, href: "/admin/inventory", tone: "bg-red/15 text-red" },
    { label: lang === "de" ? "Fehlgeschlagene Syncs" : "Failed syncs", count: liveStats.failedSyncs, href: "/admin/marketplaces", tone: "bg-red/15 text-red" },
    { label: lang === "de" ? "Wartende Syncs" : "Queued syncs", count: liveStats.pendingSyncs, href: "/admin/marketplaces", tone: "bg-gold/15 text-gold" },
  ].filter((item) => item.count > 0);

  const getActivityStatus = (type: DashboardActivity["type"], status: string | null) => {
    const normalized = status?.toLowerCase().trim();
    if (type === "repair") {
      if (normalized === "new" || normalized === "neu") {
        return {
          label: lang === "de" ? "Neu" : "New",
          dot: "bg-indigo-400",
          text: "text-indigo-400",
        };
      }
      if (normalized === "in_progress" || normalized === "in arbeit") {
        return {
          label: lang === "de" ? "In Arbeit" : "In Progress",
          dot: "bg-amber-400",
          text: "text-amber-400",
        };
      }
      if (normalized === "ready" || normalized === "abholbereit") {
        return {
          label: lang === "de" ? "Bereit" : "Ready",
          dot: "bg-emerald-400",
          text: "text-emerald-400",
        };
      }
      if (normalized === "completed" || normalized === "abgeschlossen") {
        return {
          label: lang === "de" ? "Abgeschlossen" : "Completed",
          dot: "bg-emerald-400",
          text: "text-emerald-400",
        };
      }
    }

    if (type === "order") {
      if (normalized === "pending" || normalized === "ausstehend" || normalized === "neu") {
        return {
          label: lang === "de" ? "Ausstehend" : "Pending",
          dot: "bg-indigo-400",
          text: "text-indigo-400",
        };
      }
      if (normalized === "paid" || normalized === "bezahlt") {
        return {
          label: lang === "de" ? "Bezahlt" : "Paid",
          dot: "bg-emerald-400",
          text: "text-emerald-400",
        };
      }
      if (normalized === "shipped" || normalized === "versendet") {
        return {
          label: lang === "de" ? "Versendet" : "Shipped",
          dot: "bg-amber-400",
          text: "text-amber-400",
        };
      }
    }

    return {
      label: status || (lang === "de" ? "Unbekannt" : "Unknown"),
      dot: "bg-muted/40",
      text: "text-muted/70",
    };
  };

  const accentStyles: Record<AccentKey, { hex: string; pill: string; glow: string; number: string }> = {
    gold:    { hex: '#F59E0B', pill: 'bg-amber-500/15',   glow: 'bg-amber-500',   number: 'text-amber-400'   },
    emerald: { hex: '#10B981', pill: 'bg-emerald-500/15', glow: 'bg-emerald-500', number: 'text-emerald-400' },
    indigo:  { hex: '#6366F1', pill: 'bg-indigo-500/15',  glow: 'bg-indigo-500',  number: 'text-indigo-400'  },
    rose:    { hex: '#F43F5E', pill: 'bg-rose-500/15',    glow: 'bg-rose-500',    number: 'text-rose-400'    },
  };

  const quickActions: Array<{
    title: string;
    desc: string;
    path: string;
    accent: AccentKey;
    Icon: () => ReactNode;
  }> = [
    {
      title: dict.dashboard.quickActions.addProduct,
      desc: dict.dashboard.quickActions.addProductDesc,
      path: '/admin/products/new',
      accent: 'indigo',
      Icon: PlusIcon,
    },
    {
      title: dict.dashboard.quickActions.addRepair,
      desc: dict.dashboard.quickActions.addRepairDesc,
      path: '/admin/repairs',
      accent: 'gold',
      Icon: WrenchIcon,
    },
    {
      title: dict.dashboard.quickActions.checkOrders,
      desc: dict.dashboard.quickActions.checkOrdersDesc,
      path: '/admin/orders',
      accent: 'emerald',
      Icon: TicketIcon,
    },
    {
      title: lang === "de" ? "Lager verwalten" : "Manage inventory",
      desc: lang === "de" ? "Vor-Ort-Verkauf, Retoure oder Korrektur" : "Shop sale, return or correction",
      path: '/admin/inventory',
      accent: 'rose',
      Icon: CubeIcon,
    },
  ];

  return (
    <AdminShell title={dict.dashboard.title}>

      {/* ── Business KPIs ──
           Counts of pending work told you what to do next but never how the shop
           is doing. Revenue and orders lead now, each against the previous 30
           days. Deliberately no time-series chart: at the current order volume it
           would be a flat line, and a flat line reads as "broken". */}
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">
          {lang === "de" ? "Letzte 30 Tage" : "Last 30 days"}
        </h2>
        <p className="text-xs text-muted">
          {lang === "de" ? "Aktualisiert " : "Updated "}
          <time suppressHydrationWarning>
            {new Date(liveStats.updatedAt).toLocaleTimeString(lang === "de" ? "de-DE" : "en-GB", { hour: "2-digit", minute: "2-digit" })}
          </time>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile
          locale={lang}
          label={lang === "de" ? "Umsatz" : "Revenue"}
          value={formatPrice(lang, liveStats.revenue30d.current)}
          trend={liveStats.revenue30d}
          sub={lang === "de" ? "bezahlt, ohne Erstattungen" : "paid, excluding refunds"}
        />
        <KpiTile
          locale={lang}
          label={lang === "de" ? "Bestellungen" : "Orders"}
          value={String(liveStats.orders30d.current)}
          trend={liveStats.orders30d}
        />
        <KpiTile
          locale={lang}
          label={lang === "de" ? "Ø Bestellwert" : "Avg. order value"}
          value={liveStats.orders30d.current > 0 ? formatPrice(lang, liveStats.averageOrderValue) : "—"}
        />
        <KpiTile
          locale={lang}
          label={lang === "de" ? "Aktive Artikel" : "Active listings"}
          value={String(liveStats.catalogListings)}
          sub={lang === "de" ? `${liveStats.sellableUnits} Einheiten verkäuflich` : `${liveStats.sellableUnits} units sellable`}
        />
      </div>

      {/* ── Needs attention ──
           Only queues with something in them, each a direct link. Doubles as
           navigation: you land on the work instead of hunting through a menu. */}
      {attentionItems.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-foreground">
            {lang === "de" ? "Braucht Aufmerksamkeit" : "Needs attention"}
          </h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {attentionItems.map((item) => (
              <li key={`${item.href}-${item.label}`}>
                <Link
                  href={item.href}
                  className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-border px-3 text-sm transition hover:border-gold/50 hover:bg-gold/5"
                >
                  <span className="truncate text-foreground">{item.label}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${item.tone}`}>
                    {item.count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-4 rounded-2xl border border-border bg-surface p-5 text-sm text-muted">
          {lang === "de" ? "Nichts offen — alle Warteschlangen sind leer." : "Nothing open — every queue is clear."}
        </p>
      )}

      <div className="mt-4">
        <StockComposition
          locale={lang}
          inStock={liveStats.inStockSkus}
          lowStock={liveStats.lowStockSkus}
          outOfStock={liveStats.outOfStockSkus}
        />
      </div>

      {/* ── Quick actions ── */}
      <div className="mt-8">
        <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-muted/60">
          {dict.dashboard.quickActions.title}
        </p>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {quickActions.map(({ title, desc, path, accent, Icon }) => {
            const s = accentStyles[accent];
            return (
              <Link
                key={path}
                href={path}
                className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-surface p-5 transition-all duration-200 hover:border-border hover:bg-surface-strong/60"
              >
                {/* Icon */}
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: `linear-gradient(135deg, ${s.hex}22, ${s.hex}0a)`, border: `1px solid ${s.hex}30` }}
                >
                  <span style={{ color: s.hex }}>
                    <Icon />
                  </span>
                </div>

                {/* Text */}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="mt-1 text-xs text-muted/60">{desc}</p>
                </div>

                {/* Arrow */}
                <div className="flex justify-end">
                  <span
                    className="transition-transform duration-200 group-hover:translate-x-1"
                    style={{ color: s.hex }}
                  >
                    <ArrowRightIcon />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div className="mt-8 grid gap-4 lg:grid-cols-2">

        {/* Recent Activity */}
        <div className="rounded-2xl border border-border bg-surface p-6">
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-muted/60">
            Recent Activity
          </p>
          <ul className="space-y-1">
            {liveActivity.length > 0 ? liveActivity.map((item) => {
              const cfg = getActivityStatus(item.type, item.status);
              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors duration-150 hover:bg-surface-strong"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${cfg.dot}`} />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-foreground">{item.label}</p>
                      <p className="text-[10px] font-mono text-muted/50 tabular-nums">{item.sub}</p>
                    </div>
                  </div>
                  <span className={`ml-3 shrink-0 text-[10px] font-semibold uppercase tracking-wide ${cfg.text}`}>
                    {cfg.label}
                  </span>
                </li>
              );
            }) : (
              <li className="rounded-lg px-3 py-6 text-center text-sm text-muted/70">
                {lang === "de" ? "Noch keine letzten Aktivitäten vorhanden." : "No recent activity yet."}
              </li>
            )}
          </ul>
        </div>

        {/* System */}
        <div className="rounded-2xl border border-border bg-surface p-6">
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-muted/60">
            System
          </p>
          <ul className="space-y-3">
            <li className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-surface-strong transition-colors duration-150">
              <div className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-xs text-muted/80">{lang === "de" ? "Hosting" : "Hosting"}</span>
              </div>
              <span className="font-mono text-[10px] tabular-nums text-muted/50">
                {lang === "de" ? "Self-hosted VPS" : "Self-hosted VPS"}
              </span>
            </li>

            <li className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-surface-strong transition-colors duration-150">
              <div className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-xs text-muted/80">{lang === "de" ? "Datenbank" : "Database"}</span>
              </div>
              <span className="font-mono text-[10px] tabular-nums text-emerald-400/80">PostgreSQL</span>
            </li>

            <li className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-surface-strong transition-colors duration-150">
              <div className="flex items-center gap-3">
                <span className={`h-1.5 w-1.5 rounded-full ${shopOpen ? 'bg-emerald-400' : 'bg-muted/40'}`} />
                <span className="text-xs text-muted/80">{lang === "de" ? "Öffnungszeiten" : "Shop Hours"}</span>
              </div>
              <span className={`font-mono text-[10px] tabular-nums ${shopOpen ? 'text-emerald-400/80' : 'text-muted/50'}`}>
                {shopOpen ? (lang === "de" ? 'Geöffnet' : 'Open') : (lang === "de" ? 'Geschlossen' : 'Closed')}
              </span>
            </li>

            <li className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-surface-strong transition-colors duration-150">
              <div className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-xs text-muted/80">{lang === "de" ? "Dateispeicher" : "File Storage"}</span>
              </div>
              <span className="font-mono text-[10px] tabular-nums text-emerald-400/80">
                {lang === "de" ? "Lokaler Uploadspeicher" : "Local upload storage"}
              </span>
            </li>

            <li className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-surface-strong transition-colors duration-150">
              <div className="flex items-center gap-3">
                <span className={`h-1.5 w-1.5 rounded-full ${liveStats.failedSyncs > 0 ? 'bg-rose-400' : liveStats.pendingSyncs > 0 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                <span className="text-xs text-muted/80">{lang === "de" ? "Kanalsynchronisierung" : "Channel synchronization"}</span>
              </div>
              <span className={`font-mono text-[10px] tabular-nums ${liveStats.failedSyncs > 0 ? 'text-rose-400' : liveStats.pendingSyncs > 0 ? 'text-amber-400' : 'text-emerald-400/80'}`}>
                {liveStats.failedSyncs > 0
                  ? `${liveStats.failedSyncs} ${lang === "de" ? "fehlgeschlagen" : "failed"}${liveStats.failedChannels.length ? ` · ${liveStats.failedChannels.join(", ")}` : ""}`
                  : liveStats.pendingSyncs > 0
                    ? `${liveStats.pendingSyncs} ${lang === "de" ? "ausstehend" : "pending"}`
                    : lang === "de" ? "Aktuell" : "Current"}
              </span>
            </li>

            <li className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-surface-strong transition-colors duration-150">
              <div className="flex items-center gap-3">
                <span className={`h-1.5 w-1.5 rounded-full ${liveStats.lastSyncedAt ? 'bg-emerald-400' : 'bg-muted/40'}`} />
                <span className="text-xs text-muted/80">{lang === "de" ? "Letzte erfolgreiche Synchronisierung" : "Last successful synchronization"}</span>
              </div>
              <span className="font-mono text-[10px] tabular-nums text-muted/60" suppressHydrationWarning>
                {liveStats.lastSyncedAt
                  ? new Date(liveStats.lastSyncedAt).toLocaleString(lang === "de" ? "de-DE" : "en-GB")
                  : lang === "de" ? "Noch keine" : "Not yet"}
              </span>
            </li>
          </ul>
        </div>

      </div>
    </AdminShell>
  );
}
