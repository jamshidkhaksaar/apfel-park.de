"use client";

import { useEffect, useMemo, useState } from "react";

type HealthDictionary = {
  title: string;
  subtitle: string;
  tabs: Record<string, string>;
  cards: Record<string, string>;
  labels: Record<string, string>;
  backup: Record<string, string>;
  emptyLogs: string;
  loading: string;
  error: string;
};

type HealthPayload = {
  generatedAt: string;
  overview: {
    requests24h: number;
    visitors24h: number;
    topPage: string;
    dbSizeBytes: number;
    cpuLoadPercent: number;
    memoryUsagePercent: number;
    diskUsagePercent: number;
    uploadsUsageBytes: number;
  };
  traffic: {
    requests24h: number;
    requests7d: number;
    visitors24h: number;
    visitors7d: number;
    bandwidth24hBytes: number;
    topRoutes: Array<{ path: string; hits: number }>;
    statusCounts: { s2xx: number; s3xx: number; s4xx: number; s5xx: number };
  };
  server: {
    platform: string;
    uptimeSeconds: number;
    appService: string;
    ram: { total: number; used: number; free: number };
    cpu: { cores: number; model: string; load1: number; load5: number; load15: number };
    storage: {
      rootTotal: number;
      rootUsed: number;
      rootAvailable: number;
      uploadsUsed: number;
    };
    database: {
      sizeBytes: number;
      productCount: number;
      orderCount: number;
      repairCount: number;
      chatCount: number;
    };
    security: {
      firewall: string;
      fail2ban: string;
      secureCookies: boolean;
      recaptcha: boolean;
    };
  };
  logs: {
    app: string[];
    database: string[];
    nginx: string[];
  };
};

const formatBytes = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const size = value / 1024 ** index;
  return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
};

const formatUptime = (seconds: number) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return [days ? `${days}d` : null, hours ? `${hours}h` : null, `${minutes}m`].filter(Boolean).join(" ");
};

const formatPercent = (value: number) => `${Math.round(value)}%`;

const MetricCard = ({
  label,
  value,
  hint,
  meter,
}: {
  label: string;
  value: string;
  hint?: string;
  meter?: number;
}) => (
  <div className="rounded-xl border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(0,0,0,0.08)]">
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
    <p className="mt-3 text-xl font-semibold tabular-nums text-foreground">{value}</p>
    {typeof meter === "number" ? (
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border/60" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.max(0, Math.round(meter)))}>
        <div className={`h-full rounded-full ${meter >= 90 ? "bg-red-500" : meter >= 75 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, Math.max(0, meter))}%` }} />
      </div>
    ) : null}
    {hint ? <p className="mt-2 text-sm text-muted">{hint}</p> : null}
  </div>
);

export default function AdminHealthWorkspace({ dict }: { dict: HealthDictionary }) {
  const [tab, setTab] = useState<keyof HealthDictionary["tabs"]>("overview");
  const [data, setData] = useState<HealthPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch("/api/admin/health", {
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("Failed");
        }
        const payload = (await response.json()) as HealthPayload;
        if (!cancelled) {
          setData(payload);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError(dict.error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    const id = window.setInterval(load, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [dict.error]);

  const updatedAt = useMemo(() => {
    if (!data?.generatedAt) return "";
    return new Date(data.generatedAt).toLocaleString();
  }, [data?.generatedAt]);

  if (loading) {
    return <div className="rounded-xl border border-border bg-surface p-6 text-sm text-muted" role="status">{dict.loading}</div>;
  }

  if (!data) {
    return <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-sm text-red-500" role="alert">{error ?? dict.error}</div>;
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[28px] p-6 md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted">{dict.title}</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{dict.subtitle}</h1>
          </div>
          <div className="rounded-2xl border border-border/60 bg-surface-strong/50 px-4 py-3 text-sm text-muted">
            <span className="font-semibold text-foreground">{dict.labels.generatedAt}:</span> {updatedAt}
          </div>
        </div>
        <div role="tablist" aria-label={dict.title} className="mt-6 flex flex-wrap gap-2">
          {(Object.keys(dict.tabs) as Array<keyof HealthDictionary["tabs"]>).map((key) => (
            <button
              key={key}
              id={`health-tab-${key}`}
              type="button"
              role="tab"
              aria-selected={tab === key}
              aria-controls={`health-panel-${key}`}
              onClick={() => setTab(key)}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
                tab === key
                  ? "bg-gold text-black shadow-lg"
                  : "border border-border/60 bg-surface/60 text-muted hover:text-foreground"
              }`}
            >
              {dict.tabs[key]}
            </button>
          ))}
        </div>
      </section>

      {tab === "overview" ? (
        <section id="health-panel-overview" role="tabpanel" aria-labelledby="health-tab-overview" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label={dict.cards.requests24h} value={String(data.overview.requests24h)} />
          <MetricCard label={dict.cards.visitors24h} value={String(data.overview.visitors24h)} />
          <MetricCard label={dict.cards.topPage} value={data.overview.topPage || "-"} />
          <MetricCard label={dict.cards.dbSize} value={formatBytes(data.overview.dbSizeBytes)} />
          <MetricCard label={dict.cards.cpuLoad} value={formatPercent(data.overview.cpuLoadPercent)} meter={data.overview.cpuLoadPercent} />
          <MetricCard label={dict.cards.memoryUsage} value={formatPercent(data.overview.memoryUsagePercent)} meter={data.overview.memoryUsagePercent} />
          <MetricCard label={dict.cards.diskUsage} value={formatPercent(data.overview.diskUsagePercent)} meter={data.overview.diskUsagePercent} />
          <MetricCard label={dict.cards.uploadsUsage} value={formatBytes(data.overview.uploadsUsageBytes)} />
        </section>
      ) : null}

      {tab === "traffic" ? (
        <div id="health-panel-traffic" role="tabpanel" aria-labelledby="health-tab-traffic" className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="glass-panel rounded-2xl p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <MetricCard label={dict.labels.requests24h} value={String(data.traffic.requests24h)} />
              <MetricCard label={dict.labels.requests7d} value={String(data.traffic.requests7d)} />
              <MetricCard label={dict.labels.visitors24h} value={String(data.traffic.visitors24h)} />
              <MetricCard label={dict.labels.visitors7d} value={String(data.traffic.visitors7d)} />
              <MetricCard label={dict.labels.bandwidth24h} value={formatBytes(data.traffic.bandwidth24hBytes)} />
            </div>
          </section>
          <section className="glass-panel rounded-2xl p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{dict.labels.status}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <MetricCard label="2xx" value={String(data.traffic.statusCounts.s2xx)} />
              <MetricCard label="3xx" value={String(data.traffic.statusCounts.s3xx)} />
              <MetricCard label="4xx" value={String(data.traffic.statusCounts.s4xx)} />
              <MetricCard label="5xx" value={String(data.traffic.statusCounts.s5xx)} />
            </div>
          </section>
          <section className="glass-panel rounded-2xl p-6 xl:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{dict.labels.topRoutes}</p>
            <div className="mt-4 space-y-3">
              {data.traffic.topRoutes.map((route) => (
                <div key={route.path} className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-surface/60 px-4 py-3">
                  <span className="truncate text-sm font-medium text-foreground">{route.path}</span>
                  <span className="shrink-0 rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold">{route.hits}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {tab === "server" ? (
        <div id="health-panel-server" role="tabpanel" aria-labelledby="health-tab-server" className="grid gap-6 lg:grid-cols-2">
          <section className="glass-panel rounded-2xl p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{dict.labels.platform}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <MetricCard label={dict.labels.platform} value={data.server.platform} />
              <MetricCard label={dict.labels.uptime} value={formatUptime(data.server.uptimeSeconds)} />
              <MetricCard label={dict.labels.appService} value={data.server.appService} />
              <MetricCard label={dict.labels.database} value={formatBytes(data.server.database.sizeBytes)} />
            </div>
          </section>
          <section className="glass-panel rounded-2xl p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{dict.labels.storage}</p>
            <div className="mt-4 space-y-4">
              <MetricCard label={dict.labels.storage} value={`${formatBytes(data.server.storage.rootUsed)} / ${formatBytes(data.server.storage.rootTotal)}`} />
              <MetricCard label={dict.cards.uploadsUsage} value={formatBytes(data.server.storage.uploadsUsed)} />
            </div>
          </section>
          <section className="glass-panel rounded-2xl p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{dict.labels.ram}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <MetricCard label={dict.labels.ram} value={`${formatBytes(data.server.ram.used)} / ${formatBytes(data.server.ram.total)}`} />
              <MetricCard label="Free" value={formatBytes(data.server.ram.free)} />
            </div>
          </section>
          <section className="glass-panel rounded-2xl p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{dict.labels.cpu}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <MetricCard label={dict.labels.cpu} value={`${data.server.cpu.cores} cores`} hint={data.server.cpu.model} />
              <MetricCard label={dict.labels.load} value={`${data.server.cpu.load1.toFixed(2)} / ${data.server.cpu.load5.toFixed(2)} / ${data.server.cpu.load15.toFixed(2)}`} />
            </div>
          </section>
        </div>
      ) : null}

      {tab === "logs" ? (
        <div id="health-panel-logs" role="tabpanel" aria-labelledby="health-tab-logs" className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="glass-panel rounded-2xl p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{dict.labels.security}</p>
            <div className="mt-4 grid gap-4">
              <MetricCard label={dict.labels.firewall} value={data.server.security.firewall} />
              <MetricCard label={dict.labels.fail2ban} value={data.server.security.fail2ban} />
              <MetricCard label={dict.labels.secureCookies} value={data.server.security.secureCookies ? "On" : "Off"} />
              <MetricCard label={dict.labels.recaptcha} value={data.server.security.recaptcha ? "On" : "Off"} />
            </div>
          </section>
          <section className="space-y-6">
            {[
              { label: dict.labels.appLogs, lines: data.logs.app },
              { label: dict.labels.dbLogs, lines: data.logs.database },
              { label: dict.labels.nginxErrors, lines: data.logs.nginx },
            ].map((group) => (
              <div key={group.label} className="glass-panel rounded-2xl p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{group.label}</p>
                <div className="mt-4 max-h-72 overflow-auto rounded-2xl border border-border/60 bg-black p-4 font-mono text-xs text-emerald-200">
                  {group.lines.length > 0 ? group.lines.join("\n") : dict.emptyLogs}
                </div>
              </div>
            ))}
          </section>
        </div>
      ) : null}

      {tab === "backups" ? (
        <section id="health-panel-backups" role="tabpanel" aria-labelledby="health-tab-backups" className="grid gap-6 lg:grid-cols-2">
          <div className="glass-panel rounded-2xl p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{dict.backup.database}</p>
            <p className="mt-3 text-sm text-muted">{dict.backup.databaseHint}</p>
            <form action="/api/admin/health/backup?type=database" method="post">
              <button type="submit" className="mt-5 inline-flex rounded-full bg-gold px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-black">
                {dict.backup.database}
              </button>
            </form>
          </div>
          <div className="glass-panel rounded-2xl p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{dict.backup.app}</p>
            <p className="mt-3 text-sm text-muted">{dict.backup.appHint}</p>
            <form action="/api/admin/health/backup?type=app" method="post">
              <button type="submit" className="mt-5 inline-flex rounded-full bg-gold px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-black">
                {dict.backup.app}
              </button>
            </form>
          </div>
        </section>
      ) : null}
    </div>
  );
}
