import { createAdminClient } from "@/lib/supabase/admin";
import AdminShell from "../../../components/admin/AdminShell";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const admin = createAdminClient();

  const { data: recaptchaRow } = await admin
    .from("store_settings")
    .select("key")
    .eq("key", "recaptcha")
    .limit(1);

  if (!recaptchaRow || recaptchaRow.length === 0) {
    await admin.from("store_settings").insert({
      key: "recaptcha",
      value: {
        enabled: false,
        siteKey: "",
        secretKey: "",
        minScore: 0.5,
      },
      updated_at: new Date().toISOString(),
    });
  }

  // Fetch all settings
  const { data: settingsData } = await admin.from("store_settings").select("*");

  // Transform array to object
  const settingsMap = settingsData?.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, any>) || {};

  // Default values fallback
  const initialSettings = {
    general: {
      shopName: settingsMap.general?.shopName || "Apfel Park",
      owner: settingsMap.general?.owner || "",
      address: settingsMap.general?.address || "",
      email: settingsMap.general?.email || "",
      phone: settingsMap.general?.phone || "",
    },
    hours: {
      monday: settingsMap.hours?.monday || "09:00 - 18:00",
      tuesday: settingsMap.hours?.tuesday || "09:00 - 18:00",
      wednesday: settingsMap.hours?.wednesday || "09:00 - 18:00",
      thursday: settingsMap.hours?.thursday || "09:00 - 18:00",
      friday: settingsMap.hours?.friday || "09:00 - 18:00",
      saturday: settingsMap.hours?.saturday || "10:00 - 16:00",
      sunday: settingsMap.hours?.sunday || "Closed",
    },
    maintenance: {
      enabled: settingsMap.maintenance?.enabled || false,
    },
    security: {
      cfSiteKey: settingsMap.security?.cfSiteKey || "",
      cfSecretKey: "",
    },
    recaptcha: {
      enabled: settingsMap.recaptcha?.enabled || false,
      siteKey: settingsMap.recaptcha?.siteKey || "",
      secretKey: "",
      minScore: settingsMap.recaptcha?.minScore || 0.5,
    },
  };

  return (
    <AdminShell title="Shop Settings">
      <SettingsForm initialSettings={initialSettings} />
    </AdminShell>
  );
}
