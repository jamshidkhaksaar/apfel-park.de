import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import LocaleSync from "../../../components/LocaleSync";
import PageTransition from "../../../components/PageTransition";
import SiteFooter from "../../../components/SiteFooter";
import SiteHeader from "../../../components/SiteHeader";
import { locales, getDictionary, isLocale, type Locale } from "../../../lib/i18n";

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
  if (!isLocale(lang)) {
    notFound();
  }
  const locale = lang as Locale;
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
    </div>
  );
}
