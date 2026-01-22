import { createClient } from "@/lib/supabase/server";
import AdminShell from "../../../components/admin/AdminShell";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();

  // Fetch all settings
  const { data: settingsData } = await supabase.from("store_settings").select("*");

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
      cfSecretKey: settingsMap.security?.cfSecretKey || "",
    },
  };

  return (
    <AdminShell title="Shop Settings">
      <SettingsForm initialSettings={initialSettings} />
    </AdminShell>
  );
}
