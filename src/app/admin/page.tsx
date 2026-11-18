import AdminShell from "@/components/admin/AdminShell";
import OwnerDashboard, { type DashboardCampaign } from "@/components/admin/OwnerDashboard";
import { getAdminDictionary, getAdminLocale } from "@/lib/admin-i18n-server";
import { loadDashboardOverview } from "@/lib/admin-dashboard-overview";
import { readActiveVisitors } from "@/lib/admin-live-visitors";
import { getBlackFridaySelection } from "@/lib/black-friday-selection";
import { currentBlackWeek } from "@/lib/black-week-calendar";
import { businessIdentity } from "@/lib/business-identity";
import { isProductIntakeOwner } from "@/lib/product-intake/owner";
import { getEffectiveCampaign, isBlackFridayAdminActive } from "@/lib/seasonal-theme-server";
import { readSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Owner dashboard: today's sales, stock, live visitors, to-dos and activity.
 * The first frame is rendered on the server; OwnerDashboard refreshes it live.
 */
export default async function AdminPage() {
  const [dict, locale, user, overview, visitors, campaignState, selection, blackFridayTools] = await Promise.all([
    getAdminDictionary(),
    getAdminLocale(),
    readSessionUser(),
    loadDashboardOverview(),
    readActiveVisitors(),
    getEffectiveCampaign(),
    getBlackFridaySelection(),
    isBlackFridayAdminActive(),
  ]);
  const week = currentBlackWeek();
  const campaign: DashboardCampaign = {
    active: campaignState.mode !== "off" && (campaignState.phase === "before" || campaignState.phase === "live"),
    phase: campaignState.phase,
    startsAt: week.startsAt,
    endsAt: week.endsAt,
    deals: Object.keys(selection.discounts).length,
  };
  // The owner is greeted by name ("Safi"); everyone else gets a neutral greeting.
  const ownerName = businessIdentity.legalOwner.trim().split(/\s+/).at(-1) ?? null;

  return (
    <AdminShell title={dict.dashboard.title}>
      <OwnerDashboard
        initial={{ overview, visitors }}
        name={isProductIntakeOwner(user) ? ownerName : null}
        campaign={campaign}
        blackFridayTools={blackFridayTools}
        locale={locale}
      />
    </AdminShell>
  );
}
