import Link from "next/link";
import type { ReactNode } from "react";

const navItems = [
  { label: "Dashboard", path: "/admin" },
  { label: "Produkte", path: "/admin/products" },
  { label: "Bestellungen", path: "/admin/orders" },
  { label: "Reparaturen", path: "/admin/repairs" },
  { label: "Bewertungen", path: "/admin/reviews" },
  { label: "SEO & Keys", path: "/admin/seo" },
  { label: "Payments", path: "/admin/payments" },
  { label: "Branding", path: "/admin/branding" },
  { label: "Shop Settings", path: "/admin/settings" },
];

export default function AdminShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-foreground" translate="no">
      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-10 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-6">
          <div className="rounded-2xl border border-border/60 bg-surface/70 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-muted">
              Admin
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              Apfel Park
            </p>
            <p className="mt-2 text-sm text-muted">
              Dashboard Scaffold (noch ohne Auth)
            </p>
          </div>
          <nav className="space-y-2 rounded-2xl border border-border/60 bg-surface/70 p-4 text-sm text-muted">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className="block rounded-xl px-4 py-3 transition hover:bg-surface-strong/70 hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="space-y-6">
          <div className="rounded-2xl border border-border/60 bg-surface/70 px-8 py-6">
            <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
            <p className="mt-2 text-sm text-muted">
              Konfiguriere Inhalte, SEO, Zahlungen und Bestellungen.
            </p>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
