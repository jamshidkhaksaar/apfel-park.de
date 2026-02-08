"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { AdminLocale } from "@/lib/admin-i18n";

import { type SettingsData } from "./types";

type SaveSettingsResult = {
  success: boolean;
  message: string;
};

const mergeSecretValues = (
  settings: SettingsData,
  existing: Record<string, unknown>,
): SettingsData => {
  const existingSecurity = (existing.security as SettingsData["security"] | undefined) ?? {
    cfSiteKey: "",
    cfSecretKey: "",
  };
  const existingRecaptcha = (existing.recaptcha as SettingsData["recaptcha"] | undefined) ?? {
    enabled: false,
    siteKey: "",
    secretKey: "",
    minScore: 0.5,
  };

  return {
    ...settings,
    security: {
      ...settings.security,
      cfSecretKey:
        settings.security.cfSecretKey || existingSecurity.cfSecretKey || "",
    },
    recaptcha: {
      ...settings.recaptcha,
      secretKey: settings.recaptcha.secretKey || existingRecaptcha.secretKey || "",
    },
  };
};

export const saveSettings = async (
  settings: SettingsData,
  lang: AdminLocale,
): Promise<SaveSettingsResult> => {
  const isEnglish = lang === "en";

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, message: isEnglish ? "Unauthorized" : "Nicht autorisiert" };
    }

    const admin = createAdminClient();
    const { data: existingRows } = await admin
      .from("store_settings")
      .select("key, value");

    const existingMap =
      existingRows?.reduce((acc, curr) => {
        acc[curr.key] = curr.value as SettingsData[keyof SettingsData];
        return acc;
      }, {} as Record<string, SettingsData[keyof SettingsData]>) || {};

    const mergedSettings = mergeSecretValues(settings, existingMap);

    const updates = Object.keys(mergedSettings).map((key) =>
      admin
        .from("store_settings")
        .upsert(
          {
            key,
            value: mergedSettings[key as keyof SettingsData],
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" },
        ),
    );

    const results = await Promise.all(updates);
    const failed = results.find((result) => result.error);
    if (failed) {
      console.error("Error saving settings:", failed.error);
      return {
        success: false,
        message: isEnglish ? "Failed to save settings." : "Einstellungen konnten nicht gespeichert werden.",
      };
    }

    return {
      success: true,
      message: isEnglish ? "Settings saved successfully!" : "Einstellungen erfolgreich gespeichert!",
    };
  } catch (error) {
    console.error("Error saving settings:", error);
    return {
      success: false,
      message: isEnglish ? "Failed to save settings." : "Einstellungen konnten nicht gespeichert werden.",
    };
  }
};
