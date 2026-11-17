import type { ReactNode } from "react";

import StorePromotion from "@/components/promotion/StorePromotion";
import BlackFridayRibbon from "@/components/black-friday/BlackFridayRibbon";
import { getPublicPromotion } from "@/lib/promotion-server";
import { blackFriday, blackFridayCopy } from "@/lib/black-friday";
import { currentBlackWeek } from "@/lib/black-week-calendar";
import { isCampaignPagePublic, secondsRemaining } from "@/lib/seasonal-theme";
import { getEffectiveCampaign } from "@/lib/seasonal-theme-server";
import { getCampaignMaxPercent } from "@/lib/products";

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
  const promotion = await getPublicPromotion().catch(() => null);
  const { theme: season, phase: campaignPhase } = await getEffectiveCampaign();
  const seasonSeconds = season ? secondsRemaining(season.endsAt) : 0;
  // The landing page is public during the teaser, but the site-wide theme is
  // not. A single header pill keeps the page findable without repainting the
  // whole shop a month early.
  const navPhase = isCampaignPagePublic(campaignPhase) ? campaignPhase : null;
  const campaignCopy = blackFridayCopy[locale];
  const campaignMaxPercent = navPhase === "live" ? await getCampaignMaxPercent() : null;

  return (
    <div className="min-h-screen">
      <LocaleSync locale={locale} />
      <SiteHeader
        lang={locale}
        navItems={dict.nav}
        labels={dict.header}
        campaign={
          navPhase
            ? {
                label: campaignCopy.campaign.short,
                href: blackFriday.href,
                phase: navPhase,
                // Before launch the date is the honest signal: it is a
                // countdown, not a running sale.
                date: navPhase === "before" ? currentBlackWeek().de.startShort : currentBlackWeek().de.bfShort,
                ariaLabel: navPhase === "before" ? campaignCopy.hero.startAria : undefined,
                maxPercent: campaignMaxPercent,
              }
            : null
        }
      />
      {season ? (
        <BlackFridayRibbon
          lang={locale}
          endsAt={season.endsAt}
          initialSeconds={seasonSeconds}
          maxDiscount={campaignMaxPercent}
          phase={campaignPhase === "before" ? "before" : "live"}
        />
      ) : null}
      <main id="main-content" tabIndex={-1} className="page-surface">
        {/* One promotion at a time: the campaign ribbon and this repair banner
            would otherwise stack two countdowns above the fold. */}
        {season ? null : <StorePromotion locale={locale} initial={promotion} />}
        <PageTransition>{children}</PageTransition>
      </main>
      <SiteFooter lang={locale} />
      <MiniCart locale={locale} />
    </div>
  );
}
