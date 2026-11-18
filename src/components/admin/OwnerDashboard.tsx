"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { DashboardActivityItem, DashboardDay, DashboardOverview, DashboardProductLine } from "@/lib/admin-dashboard-overview";

export type DashboardCampaign = {
  active: boolean;
  phase: "before" | "live" | "after" | "off";
  startsAt: string;
  endsAt: string;
  deals: number;
};

type LiveData = { overview: DashboardOverview; visitors: number };

const POLL_MS = 30_000;
const euro = (value: number, digits = 0) =>
  value.toLocaleString("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: digits, minimumFractionDigits: digits });
const count = (value: number) => value.toLocaleString("de-DE");
const CATEGORY: Record<string, string> = {
  smartphones: "Smartphones", tablets: "Tablets", accessories: "Zubehör", parts: "Ersatzteile", laptops: "Laptops", consoles: "Konsolen",
};

const relative = (iso: string, now: number) => {
  const diff = Math.max(0, now - Date.parse(iso)) / 1000;
  if (diff < 60) return "gerade eben";
  if (diff < 3600) return `vor ${Math.round(diff / 60)} Min.`;
  if (diff < 86_400) return `vor ${Math.round(diff / 3600)} Std.`;
  if (diff < 172_800) return "gestern";
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
};

const greeting = () => {
  const hour = Number(new Intl.DateTimeFormat("de-DE", { hour: "numeric", hourCycle: "h23", timeZone: "Europe/Berlin" }).format(new Date()));
  return hour < 11 ? "Guten Morgen" : hour < 18 ? "Guten Tag" : "Guten Abend";
};

/* ---------- small pieces ---------- */

function Sparkline({ days }: { days: DashboardDay[] }) {
  const values = days.map((day) => day.shop + day.online);
  const max = Math.max(1, ...values);
  const w = 120, h = 36;
  const points = values.map((value, index) => [ (index / (values.length - 1)) * w, h - 3 - (value / max) * (h - 8) ] as const);
  const line = points.map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-9 w-28" aria-hidden="true">
      <path d={`${line} L${w},${h} L0,${h} Z`} fill="var(--dash-series-1)" opacity="0.14" />
      <path d={line} fill="none" stroke="var(--dash-series-1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="3" fill="var(--dash-series-1)" />
    </svg>
  );
}

function Trend({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return <span className="text-xs text-muted">wie letzte Woche</span>;
  const change = previous === 0 ? 100 : Math.round(((current - previous) / previous) * 100);
  const up = change >= 0;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${up ? "bg-[color:var(--dash-good)]/15 text-[color:var(--dash-good-text)]" : "bg-[color:var(--dash-critical)]/15 text-[color:var(--dash-critical-text)]"}`}>
      <span aria-hidden="true">{up ? "▲" : "▼"}</span>{Math.abs(change)} % <span className="font-normal text-muted">vs. Vorwoche</span>
    </span>
  );
}

function Tile({ label, value, sub, flash, children, accent }: { label: string; value: string; sub?: React.ReactNode; flash?: boolean; children?: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border p-5 transition-colors duration-700 ${flash ? "border-gold bg-gold/10" : accent ? "border-gold/40 bg-gold/[0.06]" : "border-border bg-surface"}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
        <p className="whitespace-nowrap text-3xl font-bold tabular-nums tracking-tight text-foreground sm:text-[2rem]">{value}</p>
        {children}
      </div>
      {sub ? <div className="mt-2 text-sm text-muted">{sub}</div> : null}
    </div>
  );
}

function SalesChart({ days }: { days: DashboardDay[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(4, ...days.map((day) => day.shop + day.online));
  const nice = Math.ceil(max / 4) * 4;
  const W = 700, H = 220, padL = 28, padB = 26, padT = 8;
  const innerW = W - padL - 8, innerH = H - padB - padT;
  const slot = innerW / days.length, barW = Math.min(30, slot * 0.62);
  const y = (value: number) => padT + innerH - (value / nice) * innerH;
  const total = days.reduce((sum, day) => sum + day.shop + day.online, 0);
  const weekday = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString("de-DE", { weekday: "short", timeZone: "UTC" }).replace(".", "");
  return (
    <div className="relative">
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-[color:var(--dash-series-1)]" />Im Laden</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-[color:var(--dash-series-2)]" />Online</span>
        <span className="ml-auto tabular-nums">{count(total)} Stück in 14 Tagen</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Verkaufte Stück pro Tag, letzte 14 Tage, insgesamt ${total}`}>
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={padL} x2={W - 8} y1={y(nice * f)} y2={y(nice * f)} stroke="currentColor" className="text-border" strokeWidth="1" strokeDasharray={f === 0 ? undefined : "3 4"} />
            <text x={padL - 6} y={y(nice * f) + 4} textAnchor="end" className="fill-[color:var(--dash-muted)] text-[11px] tabular-nums">{Math.round(nice * f)}</text>
          </g>
        ))}
        {days.map((day, index) => {
          const x = padL + index * slot + (slot - barW) / 2;
          const shopTop = y(day.shop), onlineTop = y(day.shop + day.online);
          const isToday = index === days.length - 1;
          return (
            <g key={day.date} onMouseEnter={() => setHover(index)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(index)} onBlur={() => setHover(null)} tabIndex={0} aria-label={`${weekday(day.date)} ${day.date.slice(8)}.${day.date.slice(5, 7)}.: ${day.shop} im Laden, ${day.online} online`}>
              <rect x={padL + index * slot} y={padT} width={slot} height={innerH} fill="transparent" />
              {hover === index ? <rect x={padL + index * slot + 2} y={padT} width={slot - 4} height={innerH} rx="6" className="fill-[color:var(--dash-hover)]" /> : null}
              {day.shop > 0 ? <rect x={x} y={shopTop} width={barW} height={y(0) - shopTop} rx={day.online > 0 ? 0 : 4} className="fill-[color:var(--dash-series-1)]" /> : null}
              {day.online > 0 ? <rect x={x} y={onlineTop} width={barW} height={Math.max(0, shopTop - onlineTop - (day.shop > 0 ? 2 : 0))} rx="4" className="fill-[color:var(--dash-series-2)]" /> : null}
              {day.shop + day.online === 0 ? <rect x={x} y={y(0) - 2} width={barW} height="2" rx="1" className="fill-[color:var(--dash-muted)]" opacity="0.35" /> : null}
              <text x={x + barW / 2} y={H - 8} textAnchor="middle" className={`text-[11px] ${isToday ? "fill-[color:var(--dash-text)] font-semibold" : "fill-[color:var(--dash-muted)]"}`}>
                {isToday ? "Heute" : index % 2 === 1 ? weekday(day.date) : ""}
              </text>
            </g>
          );
        })}
      </svg>
      {hover !== null ? (
        <div className="pointer-events-none absolute top-8 z-10 rounded-xl border border-border bg-background px-3 py-2 text-xs shadow-xl"
          style={{ left: `clamp(0px, calc(${((padL + (hover + 0.5) * slot) / W) * 100}% - 70px), calc(100% - 150px))` }}>
          <p className="font-semibold text-foreground">{new Date(`${days[hover].date}T12:00:00Z`).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })}</p>
          <p className="mt-1 flex items-center gap-1.5 text-muted"><span className="size-2 rounded-sm bg-[color:var(--dash-series-1)]" />Im Laden: <span className="font-semibold text-foreground tabular-nums">{days[hover].shop}</span></p>
          <p className="flex items-center gap-1.5 text-muted"><span className="size-2 rounded-sm bg-[color:var(--dash-series-2)]" />Online: <span className="font-semibold text-foreground tabular-nums">{days[hover].online}</span></p>
        </div>
      ) : null}
    </div>
  );
}

function ProductList({ items, empty, metric, action }: { items: DashboardProductLine[]; empty: string; metric: (item: DashboardProductLine) => string; action?: string }) {
  if (items.length === 0) return <p className="rounded-xl bg-background/50 px-4 py-6 text-center text-sm text-muted">{empty}</p>;
  return (
    <ul className="divide-y divide-border/60">
      {items.map((item, index) => (
        <li key={item.productId}>
          <Link href={`/admin/products/${item.productId}`} className="group flex items-center gap-3 py-2.5">
            <span className="w-4 text-xs font-semibold tabular-nums text-muted">{index + 1}</span>
            <span className="relative size-11 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-white">
              {item.image ? <Image src={item.image} alt="" fill sizes="44px" className="object-contain p-0.5" unoptimized={item.image.startsWith("/uploads/")} /> : null}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground group-hover:text-gold">{item.title}</span>
            <span className="shrink-0 text-right text-sm font-semibold tabular-nums text-foreground">{metric(item)}</span>
            {action ? <span className="hidden shrink-0 text-xs font-semibold text-gold sm:inline">{action} →</span> : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}

const ACTIVITY_ICON: Record<DashboardActivityItem["kind"], string> = {
  sale_shop: "🛍️", sale_online: "🌐", restock: "📦", product: "✨", order: "🧾", repair: "🔧", chat: "💬",
};

/* ---------- dashboard ---------- */

export default function OwnerDashboard({ initial, name, campaign, blackFridayTools }: {
  initial: LiveData;
  name: string | null;
  campaign: DashboardCampaign;
  blackFridayTools: boolean;
}) {
  const [data, setData] = useState<LiveData>(initial);
  const [updatedAt, setUpdatedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [offline, setOffline] = useState(false);
  const [flash, setFlash] = useState<Record<string, boolean>>({});
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const previous = useRef(initial);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/dashboard/overview", { cache: "no-store" });
      if (!response.ok) throw new Error(String(response.status));
      const next = (await response.json()) as LiveData;
      const before = previous.current;
      const changed: Record<string, boolean> = {
        today: next.overview.today.unitsShop + next.overview.today.unitsOnline !== before.overview.today.unitsShop + before.overview.today.unitsOnline,
        stock: Math.round(next.overview.stock.value) !== Math.round(before.overview.stock.value),
        visitors: next.visitors !== before.visitors,
      };
      const known = new Set(before.overview.activity.map((item) => item.id));
      setFresh(new Set(next.overview.activity.filter((item) => !known.has(item.id)).map((item) => item.id)));
      setFlash(changed);
      window.setTimeout(() => setFlash({}), 1600);
      previous.current = next;
      setData(next);
      setUpdatedAt(Date.now());
      setOffline(false);
    } catch {
      setOffline(true);
    }
  }, []);

  useEffect(() => {
    const poll = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, POLL_MS);
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { window.clearInterval(poll); window.clearInterval(tick); document.removeEventListener("visibilitychange", onVisible); };
  }, [refresh]);

  const { overview, visitors } = data;
  const todayUnits = overview.today.unitsShop + overview.today.unitsOnline;
  const seconds = Math.max(0, Math.round((now - updatedAt) / 1000));
  const categoryMax = Math.max(1, ...overview.stock.byCategory.map((row) => row.value));

  const todos = useMemo(() => {
    const list: Array<{ key: string; label: string; count: number; href: string; level: "critical" | "serious" | "warning" | "info"; cta: string }> = [];
    const t = overview.todo;
    if (t.failedSyncs) list.push({ key: "sync", label: "Marktplatz-Synchronisierung fehlgeschlagen", count: t.failedSyncs, href: "/admin/marketplaces", level: "critical", cta: "Prüfen" });
    if (t.ordersToHandle) list.push({ key: "orders", label: t.ordersToHandle === 1 ? "Bestellung wartet auf Versand/Abholung" : "Bestellungen warten auf Versand/Abholung", count: t.ordersToHandle, href: "/admin/orders", level: "serious", cta: "Bearbeiten" });
    if (t.repairsOpen) list.push({ key: "repairs", label: t.repairsOpen === 1 ? "Reparatur offen" : "Reparaturen offen", count: t.repairsOpen, href: "/admin/repairs", level: "warning", cta: "Öffnen" });
    if (t.unreadChats) list.push({ key: "chats", label: t.unreadChats === 1 ? "ungelesene Nachricht" : "ungelesene Nachrichten", count: t.unreadChats, href: "/admin/chat", level: "warning", cta: "Antworten" });
    if (overview.stock.soldOutProducts) list.push({ key: "soldout", label: "Produkte ausverkauft – nachbestellen?", count: overview.stock.soldOutProducts, href: "/admin/products?status=out-of-stock", level: "info", cta: "Ansehen" });
    if (blackFridayTools && overview.stock.slowMoverCount) list.push({ key: "slow", label: "Ladenhüter – ideal für Black-Friday-Rabatte", count: overview.stock.slowMoverCount, href: "/admin/products/promotions", level: "info", cta: "Rabatt geben" });
    return list;
  }, [overview, blackFridayTools]);

  const campaignTarget = campaign.phase === "before" ? campaign.startsAt : campaign.endsAt;
  const campaignLeft = Math.max(0, Date.parse(campaignTarget) - now);
  const cDays = Math.floor(campaignLeft / 86_400_000), cHours = Math.floor((campaignLeft % 86_400_000) / 3_600_000);

  const levelStyle = {
    critical: { dot: "bg-[color:var(--dash-critical)]", label: "Dringend", icon: "⚠" },
    serious: { dot: "bg-[color:var(--dash-serious)]", label: "Heute", icon: "●" },
    warning: { dot: "bg-[color:var(--dash-warning)]", label: "Bald", icon: "●" },
    info: { dot: "bg-[color:var(--dash-muted)]", label: "Tipp", icon: "i" },
  } as const;

  return (
    <div className="owner-dashboard mx-auto w-full max-w-[1500px] space-y-5">
      <style>{`
        .owner-dashboard { --dash-series-1:#2a78d6; --dash-series-2:#eb6834; --dash-good:#0ca30c; --dash-good-text:#08780a; --dash-warning:#fab219; --dash-serious:#ec835a; --dash-critical:#d03b3b; --dash-critical-text:#b32f2f; --dash-muted:#8a877f; --dash-text:#1c1b19; --dash-hover:rgba(0,0,0,.05); }
        [data-theme="dark"] .owner-dashboard { --dash-series-1:#3987e5; --dash-series-2:#d95926; --dash-good-text:#3fcf3f; --dash-critical-text:#f08080; --dash-muted:#9a978e; --dash-text:#f0efec; --dash-hover:rgba(255,255,255,.06); }
        @keyframes dash-pulse { 0% { box-shadow: 0 0 0 0 rgba(12,163,12,.55); } 100% { box-shadow: 0 0 0 10px rgba(12,163,12,0); } }
        @keyframes dash-in { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
        .dash-live-dot { animation: dash-pulse 1.8s ease-out infinite; }
        .dash-fresh { animation: dash-in .5s ease-out both; }
        @media (prefers-reduced-motion: reduce) { .dash-live-dot, .dash-fresh { animation: none; } }
      `}</style>

      {/* Greeting + live status */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{greeting()}{name ? `, ${name}` : ""} 👋</h1>
          <p className="mt-1 text-sm text-muted">
            {new Date(now).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Berlin" })} · So läuft dein Shop gerade.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${offline ? "border-[color:var(--dash-critical)]/50 text-[color:var(--dash-critical-text)]" : "border-border text-muted"}`}>
            <span className={`size-2.5 rounded-full ${offline ? "bg-[color:var(--dash-critical)]" : "dash-live-dot bg-[color:var(--dash-good)]"}`} />
            {offline ? "Verbindung unterbrochen – neuer Versuch …" : <>Live · aktualisiert {seconds < 5 ? "gerade eben" : `vor ${seconds} s`}</>}
          </span>
          <button type="button" onClick={() => void refresh()} className="rounded-full border border-border px-3 py-1.5 text-muted transition hover:border-gold/50 hover:text-foreground">↻ Aktualisieren</button>
        </div>
      </header>

      {/* Quick actions */}
      <nav aria-label="Schnellaktionen" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { href: "/admin/products?scan=1", icon: "▤", title: "Scannen & verkaufen", sub: "Etikett scannen, −1 Stück", primary: true },
          { href: "/admin/products/new", icon: "＋", title: "Produkt anlegen", sub: "Neues Gerät oder Zubehör" },
          { href: "/admin/orders", icon: "🧾", title: "Bestellungen", sub: overview.todo.ordersToHandle ? `${overview.todo.ordersToHandle} offen` : "Alles erledigt" },
          { href: "/admin/repairs", icon: "🔧", title: "Reparaturen", sub: overview.todo.repairsOpen ? `${overview.todo.repairsOpen} offen` : "Keine offenen" },
        ].map((action) => (
          <Link key={action.href} href={action.href} className={`group flex min-w-0 items-center gap-2.5 rounded-2xl border p-3 transition sm:gap-3 sm:p-4 hover:-translate-y-0.5 hover:shadow-lg ${action.primary ? "border-gold bg-gold text-black shadow-md shadow-gold/20" : "border-border bg-surface hover:border-gold/50"}`}>
            <span aria-hidden="true" className={`grid size-9 shrink-0 place-items-center rounded-xl text-lg sm:size-11 sm:text-xl ${action.primary ? "bg-black/10" : "bg-gold/10 text-gold"}`}>{action.icon}</span>
            <span className="min-w-0">
              <span className={`block text-sm font-bold leading-tight sm:text-base ${action.primary ? "text-black" : "text-foreground"}`}>{action.title}</span>
              <span className={`block truncate text-xs ${action.primary ? "text-black/70" : "text-muted"}`}>{action.sub}</span>
            </span>
          </Link>
        ))}
      </nav>

      {/* KPI tiles */}
      <section aria-label="Kennzahlen" className={`grid gap-4 sm:grid-cols-2 ${campaign.active ? "xl:grid-cols-5" : "xl:grid-cols-4"}`}>
        <Tile label="Heute verkauft" value={`${count(todayUnits)} Stück`} flash={flash.today}
          sub={todayUnits ? <>≈ {euro(overview.today.revenueShopEstimate)} im Laden · {euro(overview.today.revenueOnline)} online</> : "Noch kein Verkauf heute – Scannen geht in 2 Sekunden."}>
          <Sparkline days={overview.days} />
        </Tile>
        <Tile label="Letzte 7 Tage" value={`${count(overview.week.units)} Stück`} sub={<Trend current={overview.week.units} previous={overview.week.previousUnits} />}>
          <span className="text-right text-xs text-muted">≈ {euro(overview.week.revenueShopEstimate + overview.week.revenueOnline)}<br />Umsatz</span>
        </Tile>
        <Tile label="Lagerwert" value={euro(overview.stock.value)} flash={flash.stock}
          sub={<>{count(overview.stock.units)} Stück · {count(overview.stock.inStockSkus)} Varianten auf Lager</>} />
        <Tile label="Besucher gerade" value={count(visitors)} flash={flash.visitors} sub="auf apfel-park.de (letzte 5 Min.)">
          <span aria-hidden="true" className="relative grid size-10 place-items-center">
            <span className="dash-live-dot absolute size-3 rounded-full bg-[color:var(--dash-good)]" />
          </span>
        </Tile>
        {campaign.active ? (
          <Tile accent label={campaign.phase === "live" ? "Black Friday läuft" : "Black Friday startet in"}
            value={`${cDays} T ${cHours} Std`}
            sub={<>{campaign.deals} {campaign.deals === 1 ? "Deal" : "Deals"} vorbereitet · <Link href="/admin/products/promotions" className="font-semibold text-gold hover:underline">verwalten</Link></>} />
        ) : null}
      </section>

      {/* Chart + to-do */}
      <div className="grid gap-4 lg:grid-cols-3 [&>*]:min-w-0">
        <section className="rounded-2xl border border-border bg-surface p-5 lg:col-span-2" aria-labelledby="dash-sales">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="dash-sales" className="text-base font-semibold text-foreground">Verkäufe – letzte 14 Tage</h2>
            <span className="text-xs text-muted">Stück pro Tag</span>
          </div>
          <div className="mt-3"><SalesChart days={overview.days} /></div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5" aria-labelledby="dash-todo">
          <h2 id="dash-todo" className="text-base font-semibold text-foreground">Zu erledigen</h2>
          {todos.length === 0 ? (
            <div className="mt-6 flex flex-col items-center gap-2 py-6 text-center">
              <span className="grid size-12 place-items-center rounded-full bg-[color:var(--dash-good)]/15 text-2xl text-[color:var(--dash-good-text)]">✓</span>
              <p className="font-semibold text-foreground">Alles erledigt</p>
              <p className="text-sm text-muted">Keine offenen Bestellungen, Reparaturen oder Nachrichten.</p>
            </div>
          ) : (
            <ul className="mt-3 space-y-2">
              {todos.map((todo) => (
                <li key={todo.key}>
                  <Link href={todo.href} className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/40 px-3 py-3 transition hover:border-gold/50">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface text-lg font-bold tabular-nums text-foreground">{todo.count}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium leading-5 text-foreground">{todo.label}</span>
                      <span className="mt-0.5 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                        <span className={`size-2 rounded-full ${levelStyle[todo.level].dot}`} aria-hidden="true" />{levelStyle[todo.level].label}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-lg bg-gold/15 px-2.5 py-1.5 text-xs font-bold text-gold">{todo.cta} →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Product insights */}
      <div className="grid gap-4 lg:grid-cols-3 [&>*]:min-w-0">
        <section className="rounded-2xl border border-border bg-surface p-5" aria-labelledby="dash-top">
          <h2 id="dash-top" className="text-base font-semibold text-foreground">Bestseller · 30 Tage</h2>
          <div className="mt-2"><ProductList items={overview.topSellers} empty="Noch keine Verkäufe in den letzten 30 Tagen." metric={(item) => `${item.units} ×`} /></div>
        </section>
        <section className="rounded-2xl border border-border bg-surface p-5" aria-labelledby="dash-low">
          <div className="flex items-baseline justify-between gap-2">
            <h2 id="dash-low" className="text-base font-semibold text-foreground">Fast ausverkauft</h2>
            {overview.stock.lowStockCount ? <span className="text-xs text-muted">{overview.stock.lowStockCount} Neuware</span> : null}
          </div>
          <div className="mt-2"><ProductList items={overview.stock.lowStock} empty="Keine Neuware knapp – alles gut gefüllt." metric={(item) => `noch ${item.units}`} /></div>
        </section>
        <section className="rounded-2xl border border-border bg-surface p-5" aria-labelledby="dash-slow">
          <div className="flex items-baseline justify-between gap-2">
            <h2 id="dash-slow" className="text-base font-semibold text-foreground">Ladenhüter</h2>
            <span className="text-xs text-muted">60 Tage ohne Verkauf</span>
          </div>
          <div className="mt-2"><ProductList items={overview.stock.slowMovers} empty="Keine Ladenhüter – stark!" metric={(item) => euro(item.value ?? 0)} action={blackFridayTools ? "Deal" : undefined} /></div>
        </section>
      </div>

      {/* Stock by category + live activity */}
      <div className="grid gap-4 lg:grid-cols-3 [&>*]:min-w-0">
        <section className="rounded-2xl border border-border bg-surface p-5" aria-labelledby="dash-cat">
          <h2 id="dash-cat" className="text-base font-semibold text-foreground">Lager nach Kategorie</h2>
          <ul className="mt-4 space-y-3">
            {overview.stock.byCategory.map((row) => (
              <li key={row.category}>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium text-foreground">{CATEGORY[row.category] ?? row.category}</span>
                  <span className="tabular-nums text-muted"><span className="font-semibold text-foreground">{euro(row.value)}</span> · {count(row.units)} Stk.</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-background/60">
                  <div className="h-2 rounded-full bg-[color:var(--dash-series-1)]" style={{ width: `${Math.max(2, (row.value / categoryMax) * 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-border bg-surface p-5 lg:col-span-2" aria-labelledby="dash-activity">
          <div className="flex items-baseline justify-between gap-2">
            <h2 id="dash-activity" className="text-base font-semibold text-foreground">Live-Aktivität</h2>
            <span className="hidden text-xs text-muted sm:inline">Verkäufe, Lager, Bestellungen, Nachrichten</span>
          </div>
          <ol className="mt-3 grid gap-x-6 sm:grid-cols-2 [&>*]:min-w-0">
            {overview.activity.map((item) => (
              <li key={item.id} className={fresh.has(item.id) ? "dash-fresh" : undefined}>
                <Link href={item.href} className="flex items-center gap-3 border-b border-border/50 py-2.5 hover:text-gold">
                  <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-background/60 text-base">{ACTIVITY_ICON[item.kind]}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">{item.title}</span>
                    <span className="block truncate text-xs text-muted">{item.detail}</span>
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted">{fresh.has(item.id) ? <span className="rounded-full bg-gold px-1.5 py-0.5 font-bold text-black">neu</span> : relative(item.at, now)}</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      </div>
      <p className="pb-4 text-center text-[11px] text-muted">Laden-Umsatz geschätzt nach aktuellem Listenpreis · Online-Umsatz = bezahlte Bestellungen · aktualisiert sich automatisch alle 30 Sekunden</p>
    </div>
  );
}
