"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { type ReactNode, useState, useEffect } from "react";

import { createClient } from "@/lib/supabase/client";
import { useAdmin } from "@/lib/admin-context";
import { useTheme } from "@/components/ThemeProvider";

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
    repairs: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
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
    settings: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    content: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  };
  return <>{icons[type] || icons.dashboard}</>;
};

// ── Isolated Clock Component to prevent full shell re-renders ──
function AdminClock() {
  const [clock, setClock] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return <span className="font-mono text-[10px] tabular-nums text-muted/50">{clock}</span>;
}

export default function AdminShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { dict, lang, setLang } = useAdmin();
  const { theme, toggleTheme } = useTheme();
  const [contentOpen, setContentOpen] = useState(false);

  const handleLangChange = (nextLang: 'de' | 'en') => {
    setLang(nextLang);
    router.refresh();
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const navItems: Array<{ label: string; path: string; icon: string } | { divider: true; label: string }> = [
    { label: dict.sidebar.dashboard, path: '/admin', icon: 'dashboard' },
    { label: dict.sidebar.products, path: '/admin/products', icon: 'products' },
    { label: dict.sidebar.orders, path: '/admin/orders', icon: 'orders' },
    { label: dict.sidebar.repairs, path: '/admin/repairs', icon: 'repairs' },
    { label: dict.sidebar.reviews, path: '/admin/reviews', icon: 'reviews' },
    { label: dict.sidebar.seo, path: '/admin/seo', icon: 'seo' },
    { label: dict.sidebar.payments, path: '/admin/payments', icon: 'payments' },
    { label: dict.sidebar.branding, path: '/admin/branding', icon: 'branding' },
    { label: dict.sidebar.settings, path: '/admin/settings', icon: 'settings' },
    { divider: true, label: dict.sidebar.contentSection },
    { label: dict.sidebar.contentHome, path: '/admin/content/home', icon: 'content' },
    { label: dict.sidebar.contentAbout, path: '/admin/content/about', icon: 'content' },
    { label: dict.sidebar.contentRepairs, path: '/admin/content/repairs', icon: 'content' },
    { label: dict.sidebar.contentFaq, path: '/admin/content/faq', icon: 'content' },
    { label: dict.sidebar.contentContact, path: '/admin/content/contact', icon: 'content' },
    { label: dict.sidebar.contentSmartphones, path: '/admin/content/smartphones', icon: 'content' },
    { label: dict.sidebar.contentAccessories, path: '/admin/content/accessories', icon: 'content' },
    { label: dict.sidebar.contentGaming, path: '/admin/content/gaming', icon: 'content' },
    { label: dict.sidebar.contentLaptops, path: '/admin/content/laptops', icon: 'content' },
    { label: dict.sidebar.contentPrivacy, path: '/admin/content/privacy', icon: 'content' },
    { label: dict.sidebar.contentTerms, path: '/admin/content/terms', icon: 'content' },
  ];

  // Separate main nav from content items
  const mainNavItems = navItems.filter((item): item is { label: string; path: string; icon: string } =>
    !('divider' in item) && !['contentHome','contentAbout','contentRepairs','contentFaq','contentContact','contentSmartphones','contentAccessories','contentGaming','contentLaptops','contentPrivacy','contentTerms'].some(k => item.label === (dict.sidebar as Record<string, string>)[k])
  );
  const contentItems = navItems.filter((item): item is { label: string; path: string; icon: string } =>
    !('divider' in item) && item.icon === 'content'
  );

  // Determine breadcrumb segments from pathname
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumb = pathSegments.map((seg, i) => {
    const label = seg.charAt(0).toUpperCase() + seg.slice(1);
    const href = '/' + pathSegments.slice(0, i + 1).join('/');
    return { label, href };
  });

  return (
    <div className="min-h-screen bg-background text-foreground" translate="no">
      <div className="flex min-h-screen">
        {/* ── Sidebar ── */}
        <aside className="flex w-64 shrink-0 flex-col border-r border-white/5 bg-surface/40">

          {/* Brand mark */}
          <div className="px-5 pb-4 pt-6">
            <Link href="/admin" className="block">
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
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                <span className="text-[10px] text-muted/70 tracking-wide">Hamburg</span>
              </div>
              <AdminClock />
            </div>

            {/* Language toggle + theme toggle */}
            <div className="mt-4 flex items-center gap-1">
              <button
                onClick={() => handleLangChange('de')}
                aria-pressed={lang === 'de'}
                className={`rounded px-3 py-1 text-[10px] font-semibold uppercase tracking-widest transition-all duration-150 ${
                  lang === 'de'
                    ? 'bg-gold/15 text-gold ring-1 ring-gold/30'
                    : 'text-muted/50 hover:text-muted'
                }`}
              >
                DE
              </button>
              <button
                onClick={() => handleLangChange('en')}
                aria-pressed={lang === 'en'}
                className={`rounded px-3 py-1 text-[10px] font-semibold uppercase tracking-widest transition-all duration-150 ${
                  lang === 'en'
                    ? 'bg-gold/15 text-gold ring-1 ring-gold/30'
                    : 'text-muted/50 hover:text-muted'
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

          {/* Main nav */}
          <nav className="flex-1 overflow-y-auto px-3 py-3">
            <p className="mb-2 px-2 text-[9px] font-semibold uppercase tracking-[0.3em] text-muted/40">
              Navigation
            </p>
            <ul className="space-y-0.5">
              {mainNavItems.map((item) => {
                const isActive =
                  item.path === '/admin'
                    ? pathname === item.path
                    : pathname === item.path || pathname.startsWith(`${item.path}/`);
                const isExactMatch = pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      aria-current={isExactMatch ? 'page' : undefined}
                      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-xs transition-all duration-150 ${
                        isActive
                          ? 'border-l-2 border-gold bg-gold/5 pl-[10px] text-gold'
                          : 'border-l-2 border-transparent pl-[10px] text-muted/70 hover:bg-white/4 hover:text-foreground'
                      }`}
                    >
                      <span className={`shrink-0 transition-colors duration-150 ${isActive ? 'text-gold' : 'text-muted/40 group-hover:text-muted/70'}`}>
                        <NavIcon type={item.icon} />
                      </span>
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Page Content collapsible */}
            <div className="mt-4">
              <button
                onClick={() => setContentOpen((v) => !v)}
                className="flex w-full items-center justify-between px-2 py-1.5 text-[9px] font-semibold uppercase tracking-[0.3em] text-muted/40 hover:text-muted/60 transition-colors duration-150"
                aria-expanded={contentOpen}
              >
                <span>{dict.sidebar.contentSection}</span>
                <svg
                  className={`h-3 w-3 transition-transform duration-200 ${contentOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {contentOpen && (
                <ul className="mt-1 space-y-0.5">
                  {contentItems.map((item) => {
                    const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
                    const isExactMatch = pathname === item.path;
                    return (
                      <li key={item.path}>
                        <Link
                          href={item.path}
                          aria-current={isExactMatch ? 'page' : undefined}
                          className={`group relative flex items-center gap-3 rounded-lg px-3 py-1.5 text-xs transition-all duration-150 ${
                            isActive
                              ? 'border-l-2 border-gold bg-gold/5 pl-[10px] text-gold'
                              : 'border-l-2 border-transparent pl-[10px] text-muted/60 hover:bg-white/4 hover:text-foreground'
                          }`}
                        >
                          <span className={`shrink-0 transition-colors duration-150 ${isActive ? 'text-gold' : 'text-muted/30 group-hover:text-muted/60'}`}>
                            <NavIcon type={item.icon} />
                          </span>
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </nav>

          {/* Bottom section */}
          <div className="border-t border-white/5 px-3 py-3">
            <Link
              href={`/${lang}`}
              className="flex items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2 pl-[10px] text-xs text-muted/60 transition-all duration-150 hover:bg-white/4 hover:text-foreground"
            >
              <svg className="h-4 w-4 shrink-0 text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              <span className="font-medium">{dict.sidebar.backToSite}</span>
            </Link>
            <button
              onClick={handleLogout}
              className="mt-0.5 flex w-full items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2 pl-[10px] text-xs text-red-400/70 transition-all duration-150 hover:bg-red-500/8 hover:text-red-400"
            >
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              <span className="font-medium">{dict.sidebar.logout}</span>
            </button>
          </div>
        </aside>

        {/* ── Main area ── */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top header bar */}
          <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/5 bg-surface/20 px-8">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
              {breadcrumb.map((seg, i) => (
                <span key={seg.href} className="flex items-center gap-1.5">
                  {i > 0 && (
                    <span className="text-muted/30 text-xs">/</span>
                  )}
                  {i === breadcrumb.length - 1 ? (
                    <span className="text-xs font-semibold text-foreground">{title}</span>
                  ) : (
                    <Link href={seg.href} className="text-xs text-muted/50 transition hover:text-muted">
                      {seg.label}
                    </Link>
                  )}
                </span>
              ))}
            </nav>

            {/* Right: status + theme toggle + logout */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                <span className="text-[10px] text-muted/50 tracking-wide">{dict.sidebar.authenticated}</span>
              </div>
              <button
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted/40 transition-all duration-150 hover:bg-surface hover:text-gold"
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
              <button
                onClick={handleLogout}
                title={dict.sidebar.logout}
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-medium text-muted/50 transition-all duration-150 hover:bg-red-500/10 hover:text-red-400"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
                {dict.sidebar.logout}
              </button>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
