import { createAdminDbClient } from "@/lib/admin-db";
import { getAdminDictionary, getAdminLocale } from "@/lib/admin-i18n-server";

import AdminShell from "../../../components/admin/AdminShell";
import SettingsForm from "./SettingsForm";
import { type SettingsData } from "./types";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const admin = createAdminDbClient();
  const dict = await getAdminDictionary();
  const locale = await getAdminLocale();

  // Fetch all settings
  const { data: settingsData } = await admin.from("store_settings").select("*");
  const rows = (settingsData ?? []) as Array<{ key: keyof SettingsData; value: SettingsData[keyof SettingsData] }>;

  // Transform array to object
  const settingsMap = rows.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Partial<Record<keyof SettingsData, SettingsData[keyof SettingsData]>>);
  const general = (settingsMap.general ?? {}) as SettingsData["general"];
  const hours = (settingsMap.hours ?? {}) as SettingsData["hours"];
  const maintenance = (settingsMap.maintenance ?? {}) as SettingsData["maintenance"];
  const recaptcha = (settingsMap.recaptcha ?? {}) as SettingsData["recaptcha"];
  const integrations = (settingsMap.integrations ?? {}) as SettingsData["integrations"];

  // Default values fallback
  const initialSettings = {
    general: {
      shopName: general.shopName || "Apfel Park",
      owner: general.owner || "",
      address: general.address || "",
      email: general.email || "",
      phone: general.phone || "",
    },
    hours: {
      monday: hours.monday || "09:00 - 18:00",
      tuesday: hours.tuesday || "09:00 - 18:00",
      wednesday: hours.wednesday || "09:00 - 18:00",
      thursday: hours.thursday || "09:00 - 18:00",
      friday: hours.friday || "09:00 - 18:00",
      saturday: hours.saturday || "10:00 - 16:00",
      sunday: hours.sunday || (locale === "en" ? "Closed" : "Geschlossen"),
    },
    maintenance: {
      siteEnabled: maintenance.siteEnabled || false,
      storeEnabled: maintenance.storeEnabled || false,
    },
    recaptcha: {
      enabled: recaptcha.enabled || false,
      siteKey: recaptcha.siteKey || "",
      secretKey: "",
      minScore: recaptcha.minScore || 0.5,
    },
    integrations: {
      whatsappWidgetEnabled: integrations.whatsappWidgetEnabled ?? true,
      whatsappNumber: integrations.whatsappNumber || "494058978787",
      whatsappDefaultMessageDe: integrations.whatsappDefaultMessageDe || "Hallo! Ich habe eine Frage zu Ihren Services.",
      whatsappDefaultMessageEn: integrations.whatsappDefaultMessageEn || "Hello! I have a question about your services.",
      whatsappCloudApiEnabled: integrations.whatsappCloudApiEnabled || false,
      whatsappPhoneNumberId: integrations.whatsappPhoneNumberId || "",
      whatsappBusinessAccountId: integrations.whatsappBusinessAccountId || "",
      whatsappAccessToken: "",
      whatsappWebhookVerifyToken: "",
      metaPixelEnabled: integrations.metaPixelEnabled || false,
      metaPixelId: integrations.metaPixelId || "",
      metaConversionsApiToken: "",
      metaConversionsTestEventCode: integrations.metaConversionsTestEventCode || "",
      tiktokPixelEnabled: integrations.tiktokPixelEnabled || false,
      tiktokPixelId: integrations.tiktokPixelId || "",
      tiktokEventsApiToken: "",
      tiktokTestEventCode: integrations.tiktokTestEventCode || "",
      googleAnalyticsEnabled: integrations.googleAnalyticsEnabled || false,
      googleAnalyticsId: integrations.googleAnalyticsId || "",
      facebookPageId: integrations.facebookPageId || "",
      facebookPageAccessToken: "",
      instagramBusinessAccountId: integrations.instagramBusinessAccountId || "",
      instagramAccessToken: "",
      tiktokShopEnabled: integrations.tiktokShopEnabled || false,
      tiktokShopAppKey: integrations.tiktokShopAppKey || "",
      tiktokShopAppSecret: "",
      tiktokShopWebhookSecret: "",
      autoPublishNewProducts: integrations.autoPublishNewProducts || false,
      autoPublishDiscountProducts: integrations.autoPublishDiscountProducts || false,
    },
  };

  return (
    <AdminShell title={dict.settingsPage.title}>
      <SettingsForm initialSettings={initialSettings} />
    </AdminShell>
  );
}
