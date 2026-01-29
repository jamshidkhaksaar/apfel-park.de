"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { type SettingsData } from "./types";

type SaveSettingsResult = {
  success: boolean;
  message: string;
};

const mergeSecretValues = (
  settings: SettingsData,
  existing: Record<string, any>,
): SettingsData => {
  const existingSecurity = existing.security ?? {};
  const existingRecaptcha = existing.recaptcha ?? {};

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
): Promise<SaveSettingsResult> => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, message: "Unauthorized" };
    }

    const admin = createAdminClient();
    const { data: existingRows } = await admin
      .from("store_settings")
      .select("key, value");

    const existingMap =
      existingRows?.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {} as Record<string, any>) || {};

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
      return { success: false, message: "Failed to save settings." };
    }

    return { success: true, message: "Settings saved successfully!" };
  } catch (error) {
    console.error("Error saving settings:", error);
    return { success: false, message: "Failed to save settings." };
  }
};
