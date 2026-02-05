import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import LocaleSync from "../../../components/LocaleSync";
import SiteFooter from "../../../components/SiteFooter";
import SiteHeader from "../../../components/SiteHeader";
import { locales, getDictionary, type Locale } from "../../../lib/i18n";

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
  const locale = lang as Locale;
  const dict = getDictionary(locale);

  if (!locales.includes(locale)) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <LocaleSync locale={locale} />
      <SiteHeader
        lang={locale}
        navItems={dict.nav}
        labels={dict.header}
      />
      <main id="main-content" tabIndex={-1} className="page-surface">{children}</main>
      <SiteFooter lang={locale} />
    </div>
  );
}
