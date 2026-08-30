import type { ReactNode } from "react";

import LocaleSync from "../../../components/LocaleSync";
import MiniCart from "../../../components/checkout/MiniCart";
import PageTransition from "../../../components/PageTransition";
import SiteFooter from "../../../components/SiteFooter";
import SiteHeader from "../../../components/SiteHeader";
import { locales, getDictionary } from "../../../lib/i18n";
import { requireLocale } from "@/lib/route-locale";

export const generateStaticParams = () =>
  locales.map((lang) => ({ lang }));

export default async function SiteLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = requireLocale(lang);
  const dict = getDictionary(locale);

  return (
    <div className="min-h-screen">
      <LocaleSync locale={locale} />
      <SiteHeader
        lang={locale}
        navItems={dict.nav}
        labels={dict.header}
      />
      <main id="main-content" tabIndex={-1} className="page-surface">
        <PageTransition>{children}</PageTransition>
      </main>
      <SiteFooter lang={locale} />
      <MiniCart locale={locale} />
    </div>
  );
}
