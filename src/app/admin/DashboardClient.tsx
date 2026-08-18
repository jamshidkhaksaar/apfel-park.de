"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";
import { useAdmin } from "@/lib/admin-context";
import AdminShell from "@/components/admin/AdminShell";
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

const BagIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);

const CubeIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
  </svg>
);

const StarIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
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

  const statCards: Array<{
    label: string;
    value: number;
    note: string;
    accent: AccentKey;
    Icon: () => ReactNode;
  }> = [
    {
      label: dict.dashboard.stats.repairs,
      value: liveStats.repairs,
      note: lang === "de" ? "Offene Servicefälle" : "Open service tickets",
      accent: 'gold',
      Icon: WrenchIcon,
    },
    {
      label: dict.dashboard.stats.orders,
      value: liveStats.orders,
      note: lang === "de" ? "Warten auf Bearbeitung" : "Awaiting fulfillment",
      accent: 'emerald',
      Icon: BagIcon,
    },
    {
      label: lang === "de" ? "Aktive Katalogeinträge" : "Active catalog listings",
      value: liveStats.catalogListings,
      note: lang === "de" ? "Veröffentlichte Produktseiten" : "Published product pages",
      accent: 'indigo',
      Icon: CubeIcon,
    },
    {
      label: dict.dashboard.stats.reviews,
      value: liveStats.reviews,
      note: lang === "de" ? "Bisher gesammelt" : "Collected to date",
      accent: 'rose',
      Icon: StarIcon,
    },
    {
      label: lang === "de" ? "Live Nutzer" : "Live Users",
      value: liveStats.liveUsers,
      note: lang === "de" ? "Aktive Besucher in den letzten 5 Min." : "Active visitors in the last 5 min.",
      accent: 'emerald',
      Icon: () => (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372A9.337 9.337 0 0021.75 18c0-1.385-.945-2.598-2.31-2.94A5.999 5.999 0 0012 5.25a5.999 5.999 0 00-7.44 9.81C3.195 15.402 2.25 16.615 2.25 18a9.337 9.337 0 004.125 1.5A9.38 9.38 0 009 19.128m6 0a9.38 9.38 0 01-6 0m6 0a8.962 8.962 0 00-6 0" />
        </svg>
      ),
    },
    {
      label: lang === "de" ? "Ungelesene Chats" : "Unread Chats",
      value: liveStats.unreadChats,
      note: lang === "de" ? "Neue Kundennachrichten" : "New customer messages",
      accent: 'gold',
      Icon: () => (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12c0-4.97 4.365-9 9.75-9s9.75 4.03 9.75 9-4.365 9-9.75 9a10.7 10.7 0 01-4.18-.84L3 20.25l1.3-3.9A8.88 8.88 0 012.25 12z" />
        </svg>
      ),
    },
    {
      label: lang === "de" ? "Verfügbare SKUs" : "In-stock SKUs",
      value: liveStats.inStockSkus,
      note: lang === "de" ? "Mindestens ein Stück verkaufbar" : "At least one unit sellable",
      accent: 'emerald',
      Icon: CubeIcon,
    },
    {
      label: lang === "de" ? "Ausverkaufte SKUs" : "Out-of-stock SKUs",
      value: liveStats.outOfStockSkus,
      note: lang === "de" ? "Aktuell nicht bestellbar" : "Currently unavailable",
      accent: 'rose',
      Icon: CubeIcon,
    },
    {
      label: lang === "de" ? "Verkaufbare Einheiten" : "Sellable units",
      value: liveStats.sellableUnits,
      note: lang === "de" ? "Bestand abzüglich Reserven und Puffer" : "On hand minus reservations and buffer",
      accent: 'emerald',
      Icon: CubeIcon,
    },
    {
      label: lang === "de" ? "Reservierte Einheiten" : "Reserved units",
      value: liveStats.reservedUnits,
      note: lang === "de" ? "Für offene Bestellungen reserviert" : "Held for open orders",
      accent: 'gold',
      Icon: BagIcon,
    },
    {
      label: lang === "de" ? "Niedriger Bestand" : "Low-stock SKUs",
      value: liveStats.lowStockSkus,
      note: lang === "de" ? "Nur noch 1 bis 3 Stück" : "Only 1 to 3 units left",
      accent: 'gold',
      Icon: CubeIcon,
    },
  ];

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

      {/* ── Section label ── */}
      <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-muted/60">
        Live Metrics
      </p>
      <p className="-mt-3 mb-4 text-xs text-muted/50">
        {lang === "de" ? "Automatisch aktualisiert: " : "Automatically refreshed: "}
        <time suppressHydrationWarning>
          {new Date(liveStats.updatedAt).toLocaleString(lang === "de" ? "de-DE" : "en-GB")}
        </time>
      </p>

      {/* ── Stat cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, value, note, accent, Icon }) => {
          const s = accentStyles[accent];
          return (
            <div
              key={label}
              className="relative overflow-hidden rounded-2xl border border-white/8 bg-surface p-6 transition-all duration-200 hover:border-white/12"
            >
              {/* Corner glow */}
              <div
                className={`absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl opacity-15 ${s.glow}`}
                aria-hidden="true"
              />

              {/* Icon pill */}
              <div className={`inline-flex items-center justify-center rounded-lg p-2 ${s.pill}`}>
                <span style={{ color: s.hex }}>
                  <Icon />
                </span>
              </div>

              {/* Number */}
              <p className={`mt-4 font-mono text-5xl font-bold tabular-nums leading-none ${s.number}`}>
                {String(value).padStart(2, '0')}
              </p>

              {/* Label */}
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                {label}
              </p>

              {/* Note */}
              <p className="mt-3 text-xs text-muted/50">{note}</p>
            </div>
          );
        })}
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
                className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-white/8 bg-surface p-5 transition-all duration-200 hover:border-white/14 hover:bg-surface-strong/60"
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
        <div className="rounded-2xl border border-white/8 bg-surface p-6">
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-muted/60">
            Recent Activity
          </p>
          <ul className="space-y-1">
            {liveActivity.length > 0 ? liveActivity.map((item) => {
              const cfg = getActivityStatus(item.type, item.status);
              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors duration-150 hover:bg-white/4"
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
        <div className="rounded-2xl border border-white/8 bg-surface p-6">
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-muted/60">
            System
          </p>
          <ul className="space-y-3">
            <li className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-white/4 transition-colors duration-150">
              <div className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-xs text-muted/80">{lang === "de" ? "Hosting" : "Hosting"}</span>
              </div>
              <span className="font-mono text-[10px] tabular-nums text-muted/50">
                {lang === "de" ? "Self-hosted VPS" : "Self-hosted VPS"}
              </span>
            </li>

            <li className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-white/4 transition-colors duration-150">
              <div className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-xs text-muted/80">{lang === "de" ? "Datenbank" : "Database"}</span>
              </div>
              <span className="font-mono text-[10px] tabular-nums text-emerald-400/80">PostgreSQL</span>
            </li>

            <li className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-white/4 transition-colors duration-150">
              <div className="flex items-center gap-3">
                <span className={`h-1.5 w-1.5 rounded-full ${shopOpen ? 'bg-emerald-400' : 'bg-muted/40'}`} />
                <span className="text-xs text-muted/80">{lang === "de" ? "Öffnungszeiten" : "Shop Hours"}</span>
              </div>
              <span className={`font-mono text-[10px] tabular-nums ${shopOpen ? 'text-emerald-400/80' : 'text-muted/50'}`}>
                {shopOpen ? (lang === "de" ? 'Geöffnet' : 'Open') : (lang === "de" ? 'Geschlossen' : 'Closed')}
              </span>
            </li>

            <li className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-white/4 transition-colors duration-150">
              <div className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-xs text-muted/80">{lang === "de" ? "Dateispeicher" : "File Storage"}</span>
              </div>
              <span className="font-mono text-[10px] tabular-nums text-emerald-400/80">
                {lang === "de" ? "Lokaler Uploadspeicher" : "Local upload storage"}
              </span>
            </li>

            <li className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-white/4 transition-colors duration-150">
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

            <li className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-white/4 transition-colors duration-150">
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
