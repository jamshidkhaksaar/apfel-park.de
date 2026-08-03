"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { type ReactNode, useState, useEffect } from "react";

import { createAdminBrowserClient } from "@/lib/admin-auth-client";
import { useAdmin } from "@/lib/admin-context";
import { useTheme } from "@/components/ThemeProvider";

const playAdminTone = () => {
  try {
    const AudioContextCtor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    const context = new AudioContextCtor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.value = 920;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.05, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.22);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.24);
  } catch {
    // ignore audio failures
  }
};

type AdminBadgeCounts = {
  chat: number;
  repairs: number;
  orders: number;
};

const NavIcon = ({ type }: { type: string }) => {
  const icons: Record<string, ReactNode> = {
    dashboard: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
    products: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
    orders: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
    marketplaces: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5v13.5H3.75zM3.75 9.75h16.5M8.25 5.25v4.5m7.5-4.5v4.5M7.5 14.25h3m3 0h3" />
      </svg>
    ),
    repairs: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
      </svg>
    ),
    batchBuy: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5h10.5M6.75 12h10.5M7.5 16.5h4.5M4.5 4.5h15v15h-15z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 16.5h.008v.008H16.5v-.008zM19.5 12h.008v.008H19.5V12z" />
      </svg>
    ),
    chat: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12c0-4.97 4.365-9 9.75-9s9.75 4.03 9.75 9-4.365 9-9.75 9a10.7 10.7 0 01-4.18-.84L3 20.25l1.3-3.9A8.88 8.88 0 012.25 12z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 10.5h7.5M8.25 13.5h4.5" />
      </svg>
    ),
    reviews: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
    seo: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
    mail: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 7.5v9A2.25 2.25 0 0119.5 18.75h-15A2.25 2.25 0 012.25 16.5v-9m19.5 0A2.25 2.25 0 0019.5 5.25h-15A2.25 2.25 0 002.25 7.5m19.5 0v.243a2.25 2.25 0 01-1.07 1.91l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 9.653a2.25 2.25 0 01-1.07-1.91V7.5" />
      </svg>
    ),
    payments: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    ),
    branding: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
      </svg>
    ),
    media: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6.75A2.25 2.25 0 0013.5 4.5h-6A2.25 2.25 0 005.25 6.75v10.5A2.25 2.25 0 007.5 19.5h6a2.25 2.25 0 002.25-2.25V13.5l4.125 3.093a.75.75 0 001.2-.6V8.007a.75.75 0 00-1.2-.6L15.75 10.5z" />
      </svg>
    ),
    health: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h3l2.25-6 4.5 12 2.25-6h4.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5h15" />
      </svg>
    ),
    users: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372A9.337 9.337 0 0021.75 18c0-1.385-.945-2.598-2.31-2.94A5.999 5.999 0 0012 5.25a5.999 5.999 0 00-7.44 9.81C3.195 15.402 2.25 16.615 2.25 18a9.337 9.337 0 004.125 1.5A9.38 9.38 0 009 19.128m6 0a9.38 9.38 0 01-6 0m6 0a8.962 8.962 0 00-6 0" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 6a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    settings: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  };
  return <>{icons[type] || icons.dashboard}</>;
};

export default function AdminShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { dict, lang, setLang, user } = useAdmin();
  const { theme, toggleTheme } = useTheme();
  const [clock, setClock] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [navigatingPath, setNavigatingPath] = useState<string | null>(null);
  const [badges, setBadges] = useState<AdminBadgeCounts>({ chat: 0, repairs: 0, orders: 0 });

  // Live clock
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  useEffect(() => {
    setNavigatingPath(null);
    setSidebarOpen(false);
  }, [pathname]);

  // Badge polling
  useEffect(() => {
    let cancelled = false;
    let previous: AdminBadgeCounts | null = null;
    let timer: number | null = null;
    let retryDelay = 5000;

    const schedule = (delay: number) => {
      if (cancelled) return;
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => void loadBadges(), delay);
    };

    const loadBadges = async () => {
      if (cancelled) return;
      if (document.hidden || !navigator.onLine) {
        schedule(15000);
        return;
      }

      try {
        const res = await fetch("/api/admin/badges", { credentials: "include", cache: "no-store" });
        if (!res.ok) {
          retryDelay = 15000;
          return;
        }
        const data = (await res.json()) as Partial<AdminBadgeCounts>;
        if (cancelled) return;
        const next = {
          chat: Number(data.chat ?? 0),
          repairs: Number(data.repairs ?? 0),
          orders: Number(data.orders ?? 0),
        };
        if (previous && (next.chat > previous.chat || next.repairs > previous.repairs || next.orders > previous.orders)) {
          playAdminTone();
        }
        previous = next;
        setBadges(next);
        retryDelay = 5000;
      } catch {
        // DNS and transient network failures should not hammer the endpoint.
        retryDelay = Math.min(Math.max(retryDelay * 2, 10000), 60000);
      } finally {
        schedule(retryDelay);
      }
    };

    const resumePolling = () => {
      if (!document.hidden && navigator.onLine) schedule(250);
    };

    void loadBadges();
    window.addEventListener("online", resumePolling);
    document.addEventListener("visibilitychange", resumePolling);

    return () => {
      cancelled = true;
      if (timer !== null) window.clearTimeout(timer);
      window.removeEventListener("online", resumePolling);
      document.removeEventListener("visibilitychange", resumePolling);
    };
  }, []);

  const handleLangChange = (nextLang: 'de' | 'en') => {
    setLang(nextLang);
    router.refresh();
  };

  const handleLogout = async () => {
    const adminClient = createAdminBrowserClient();
    await adminClient.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const closeSidebar = () => setSidebarOpen(false);

  const isAdmin = user?.role === "admin";

  const baseItems: Array<{ label: string; path: string; icon: string; badge?: number }> = [
    { label: dict.sidebar.dashboard, path: '/admin', icon: 'dashboard' },
    { label: dict.sidebar.products,  path: '/admin/products', icon: 'products' },
  ];

  const managerItems: Array<{ label: string; path: string; icon: string; badge?: number }> = [
    { label: dict.sidebar.orders,    path: '/admin/orders',   icon: 'orders',  badge: badges.orders },
    { label: 'Marketplaces', path: '/admin/marketplaces', icon: 'marketplaces' },
    { label: dict.sidebar.withdrawals, path: '/admin/withdrawals', icon: 'orders' },
    { label: dict.sidebar.repairs,   path: '/admin/repairs',  icon: 'repairs', badge: badges.repairs },
    { label: lang === 'de' ? 'Kostenvoranschläge' : 'Repair Estimates', path: '/admin/repair-estimates', icon: 'repairs' },
    { label: dict.sidebar.batchBuy,  path: '/admin/batch-buy', icon: 'batchBuy' },
    { label: dict.sidebar.chat,      path: '/admin/chat',     icon: 'chat',    badge: badges.chat },
    { label: dict.sidebar.reviews,   path: '/admin/reviews',  icon: 'reviews' },
  ];

  const adminItems: Array<{ label: string; path: string; icon: string; badge?: number }> = [
    { label: dict.sidebar.users,     path: '/admin/users',    icon: 'users' },
    { label: dict.sidebar.mail,      path: '/admin/mail',     icon: 'mail' },
    { label: dict.sidebar.seo,       path: '/admin/seo',      icon: 'seo' },
    { label: dict.sidebar.payments,  path: '/admin/payments', icon: 'payments' },
    { label: dict.sidebar.branding,  path: '/admin/branding', icon: 'branding' },
    { label: dict.sidebar.media,     path: '/admin/media',    icon: 'media' },
    { label: dict.sidebar.health,    path: '/admin/health',   icon: 'health' },
    { label: dict.sidebar.settings,  path: '/admin/settings', icon: 'settings' },
  ];

  const userRole = user?.role;
  const navItems = [
    ...baseItems,
    ...(userRole === "admin" || userRole === "manager" ? managerItems : []),
    ...(isAdmin ? adminItems : []),
  ];

  // Breadcrumb segments
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumb = pathSegments.map((seg, i) => ({
    label: seg.charAt(0).toUpperCase() + seg.slice(1),
    href: '/' + pathSegments.slice(0, i + 1).join('/'),
  }));

  return (
    <div className="admin-shell-root fixed inset-0 h-dvh min-h-dvh w-full overflow-hidden bg-background text-foreground" translate="no">
      <div className="flex h-full min-h-0 overflow-hidden">

        {/* ── Mobile backdrop ── */}
        <div
          aria-hidden="true"
          className={`fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
            sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={closeSidebar}
        />

        {/* ── Sidebar (single element; slides in on mobile, always visible on desktop) ── */}
        <aside
          id="admin-sidebar"
          aria-label="Admin navigation"
          className={`
            admin-shell-panel
            fixed inset-y-0 left-0 z-40 flex h-full w-72 shrink-0 flex-col overflow-hidden
            border-r border-white/5 bg-surface/95
            transition-[transform,width] duration-300 ease-in-out
            lg:relative lg:inset-auto lg:z-auto lg:translate-x-0 lg:bg-surface/40
            ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'}
            ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
          `}
        >
          {/* Brand mark */}
          <div className={`px-5 pb-4 pt-6 ${sidebarCollapsed ? 'lg:px-3' : ''}`}>
            {/* Close button – mobile only */}
            <div className="mb-4 flex items-center justify-between lg:hidden">
              <div className="flex items-center gap-2.5">
                <span className="text-gold text-base leading-none" aria-hidden="true">◆</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-foreground" style={{ fontVariant: 'small-caps' }}>
                  Apfel Park
                </span>
              </div>
              <button
                type="button"
                onClick={closeSidebar}
                aria-label="Close navigation"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted/60 transition hover:bg-white/8 hover:text-foreground"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Brand mark (desktop only) */}
            <Link href="/admin" className={`hidden lg:block ${sidebarCollapsed ? 'lg:hidden' : ''}`} onClick={closeSidebar}>
              <div className="flex items-center gap-2.5">
                <span className="text-gold text-base leading-none" aria-hidden="true">◆</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-foreground" style={{ fontVariant: 'small-caps' }}>
                  Apfel Park
                </span>
              </div>
              <p className="mt-1 pl-[22px] text-[10px] tracking-[0.15em] text-muted/60 uppercase">
                Admin Console
              </p>
            </Link>

            {/* Status bar */}
            <div className={`mt-4 flex items-center justify-between ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
              <div className="flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                <span className="text-[10px] text-muted/70 tracking-wide">Hamburg</span>
              </div>
              <span className="font-mono text-[10px] tabular-nums text-muted/50" suppressHydrationWarning>{clock}</span>
            </div>

            {/* Language + theme toggles */}
            <div className={`mt-4 flex items-center gap-1 ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
              <button
                onClick={() => handleLangChange('de')}
                aria-pressed={lang === 'de'}
                className={`rounded px-3 py-1 text-[10px] font-semibold uppercase tracking-widest transition-all duration-150 ${
                  lang === 'de' ? 'bg-gold/15 text-gold ring-1 ring-gold/30' : 'text-muted/50 hover:text-muted'
                }`}
              >
                DE
              </button>
              <button
                onClick={() => handleLangChange('en')}
                aria-pressed={lang === 'en'}
                className={`rounded px-3 py-1 text-[10px] font-semibold uppercase tracking-widest transition-all duration-150 ${
                  lang === 'en' ? 'bg-gold/15 text-gold ring-1 ring-gold/30' : 'text-muted/50 hover:text-muted'
                }`}
              >
                EN
              </button>
              <div className="ml-auto">
                <button
                  onClick={toggleTheme}
                  aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted/50 transition-all duration-150 hover:bg-white/8 hover:text-gold"
                >
                  {theme === 'dark' ? (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                    </svg>
                  ) : (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5" />

          {/* Nav */}
          <nav className={`flex-1 overflow-y-auto px-3 py-3 ${sidebarCollapsed ? 'lg:px-2' : ''}`}>
            <p className={`mb-2 px-2 text-[9px] font-semibold uppercase tracking-[0.3em] text-muted/40 ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
              Navigation
            </p>
            <ul className="space-y-0.5">
              {navItems.map((item) => {
                const isActive =
                  item.path === '/admin'
                    ? pathname === item.path
                    : pathname === item.path || pathname.startsWith(`${item.path}/`);
                return (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      prefetch={false}
                      aria-current={pathname === item.path ? 'page' : undefined}
                      onMouseEnter={() => router.prefetch(item.path)}
                      onFocus={() => router.prefetch(item.path)}
                      onClick={(event) => {
                        if (navigatingPath) {
                          event.preventDefault();
                          return;
                        }
                        closeSidebar();
                        if (pathname !== item.path) setNavigatingPath(item.path);
                      }}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs transition-all duration-150 lg:py-2 ${navigatingPath ? 'cursor-wait' : ''} ${sidebarCollapsed ? 'lg:justify-center lg:px-2' : ''} ${
                        isActive
                          ? 'border-l-2 border-gold bg-gold/5 pl-[10px] text-gold'
                          : 'border-l-2 border-transparent pl-[10px] text-muted/70 hover:bg-white/4 hover:text-foreground'
                      }`}
                    >
                      <span className={`shrink-0 transition-colors duration-150 ${isActive ? 'text-gold' : 'text-muted/40 group-hover:text-muted/70'}`}>
                        <NavIcon type={item.icon} />
                      </span>
                      <span className={`min-w-0 flex-1 break-words leading-snug font-medium ${sidebarCollapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
                      {item.badge && item.badge > 0 ? (
                        <span className={`ml-auto inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
                          isActive ? "bg-gold text-black" : "bg-red-500/15 text-red-500"
                        }`}>
                          {item.badge > 99 ? "99+" : item.badge}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Bottom links */}
          <div className={`border-t border-white/5 px-3 py-3 ${sidebarCollapsed ? 'lg:px-2' : ''}`}>
            <a
              href="https://mail.apfel-park.de"
              target="_blank"
              rel="noreferrer"
              title={sidebarCollapsed ? "Webmail Login" : undefined}
              className={`flex items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2.5 pl-[10px] text-xs text-muted/60 transition-all duration-150 hover:bg-white/4 hover:text-foreground lg:py-2 ${sidebarCollapsed ? 'lg:justify-center lg:px-2' : ''}`}
            >
              <svg className="h-4 w-4 shrink-0 text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 7.5v9A2.25 2.25 0 0119.5 18.75h-15A2.25 2.25 0 012.25 16.5v-9m19.5 0A2.25 2.25 0 0019.5 5.25h-15A2.25 2.25 0 002.25 7.5m19.5 0v.243a2.25 2.25 0 01-1.07 1.91l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 9.653a2.25 2.25 0 01-1.07-1.91V7.5" />
              </svg>
              <span className={`min-w-0 break-words leading-snug font-medium ${sidebarCollapsed ? 'lg:hidden' : ''}`}>Webmail Login</span>
            </a>
            <Link
              href={`/${lang}`}
              onClick={closeSidebar}
              title={sidebarCollapsed ? dict.sidebar.backToSite : undefined}
              className={`flex items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2.5 pl-[10px] text-xs text-muted/60 transition-all duration-150 hover:bg-white/4 hover:text-foreground lg:py-2 ${sidebarCollapsed ? 'lg:justify-center lg:px-2' : ''}`}
            >
              <svg className="h-4 w-4 shrink-0 text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              <span className={`min-w-0 break-words leading-snug font-medium ${sidebarCollapsed ? 'lg:hidden' : ''}`}>{dict.sidebar.backToSite}</span>
            </Link>
            <button
              onClick={handleLogout}
              title={sidebarCollapsed ? dict.sidebar.logout : undefined}
              className={`mt-0.5 flex w-full items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2.5 pl-[10px] text-xs text-red-400/70 transition-all duration-150 hover:bg-red-500/8 hover:text-red-400 lg:py-2 ${sidebarCollapsed ? 'lg:justify-center lg:px-2' : ''}`}
            >
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              <span className={`font-medium ${sidebarCollapsed ? 'lg:hidden' : ''}`}>{dict.sidebar.logout}</span>
            </button>
          </div>
        </aside>

        {/* ── Main area ── */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

          {/* Top header */}
          <header className="admin-shell-panel flex h-14 shrink-0 items-center justify-between border-b border-white/5 bg-surface/20 px-4 lg:px-8">

            {/* Left: hamburger (mobile) + breadcrumb (desktop) + page title (mobile) */}
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarCollapsed((value) => !value)}
                aria-label={sidebarCollapsed ? dict.sidebar.expandNavigation : dict.sidebar.collapseNavigation}
                title={sidebarCollapsed ? dict.sidebar.expandNavigation : dict.sidebar.collapseNavigation}
                className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted/70 transition-all duration-150 hover:border-gold/30 hover:bg-gold/10 hover:text-gold lg:flex"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={sidebarCollapsed ? "M9 4.5l7.5 7.5-7.5 7.5" : "M15 4.5L7.5 12l7.5 7.5"} />
                </svg>
              </button>

              {/* Hamburger – mobile only */}
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open navigation menu"
                aria-expanded={sidebarOpen}
                aria-controls="admin-sidebar"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted/70 transition-all duration-150 hover:border-gold/30 hover:bg-gold/10 hover:text-gold lg:hidden"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>

              {/* Page title – mobile only (replaces breadcrumb) */}
              <span className="truncate text-sm font-semibold text-foreground lg:hidden">{title}</span>

              {/* Breadcrumb – desktop only */}
              <nav aria-label="Breadcrumb" className="hidden items-center gap-1.5 lg:flex">
                {breadcrumb.map((seg, i) => (
                  <span key={seg.href} className="flex items-center gap-1.5">
                    {i > 0 && <span className="text-muted/30 text-xs">/</span>}
                    {i === breadcrumb.length - 1 ? (
                      <span className="max-w-[18rem] break-words text-xs font-semibold leading-snug text-foreground">{title}</span>
                    ) : (
                      <Link href={seg.href} className="text-xs text-muted/50 transition hover:text-muted">
                        {seg.label}
                      </Link>
                    )}
                  </span>
                ))}
              </nav>
            </div>

            {/* Right: status + theme + logout */}
            <div className="flex items-center gap-2">
              {/* Online status – hidden on small mobile */}
              <div className="hidden items-center gap-2 sm:flex">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                <span className="text-[10px] text-muted/50 tracking-wide">{dict.sidebar.authenticated}</span>
              </div>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted/40 transition-all duration-150 hover:bg-surface hover:text-gold"
              >
                {theme === 'dark' ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                  </svg>
                )}
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                title={dict.sidebar.logout}
                className="hidden items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-medium text-muted/50 transition-all duration-150 hover:bg-red-500/10 hover:text-red-400 sm:flex"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
                {dict.sidebar.logout}
              </button>
            </div>
          </header>
          {navigatingPath ? <div className="relative z-20 h-0.5 shrink-0 overflow-hidden bg-gold/15"><div className="h-full w-1/3 animate-pulse bg-gold" /></div> : null}

          {/* Page content */}
          <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 lg:p-6">
            {children}
          </main>
        </div>

      </div>
    </div>
  );
}
