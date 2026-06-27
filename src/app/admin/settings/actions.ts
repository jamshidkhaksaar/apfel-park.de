"use server";

import { createAdminDbClient } from "@/lib/admin-db";
import { isAdminUser } from "@/lib/admin-auth";
import { createAdminServerClient } from "@/lib/admin-auth-server";
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
  const existingRecaptcha = (existing.recaptcha as SettingsData["recaptcha"] | undefined) ?? {
    enabled: false,
    siteKey: "",
    secretKey: "",
    minScore: 0.5,
  };
  const existingIntegrations = (existing.integrations as SettingsData["integrations"] | undefined) ?? {
    whatsappWidgetEnabled: true,
    whatsappNumber: "",
    whatsappDefaultMessageDe: "",
    whatsappDefaultMessageEn: "",
    whatsappCloudApiEnabled: false,
    whatsappPhoneNumberId: "",
    whatsappBusinessAccountId: "",
    whatsappAccessToken: "",
    whatsappWebhookVerifyToken: "",
    metaPixelEnabled: false,
    metaPixelId: "",
    metaConversionsApiToken: "",
    metaDatasetQualityApiToken: "",
    metaConversionsTestEventCode: "",
    tiktokPixelEnabled: false,
    tiktokPixelId: "",
    tiktokEventsApiToken: "",
    tiktokTestEventCode: "",
    googleAnalyticsEnabled: false,
    googleAnalyticsId: "",
    facebookPageId: "",
    facebookPageAccessToken: "",
    instagramBusinessAccountId: "",
    instagramAccessToken: "",
    tiktokShopEnabled: false,
    tiktokShopAppKey: "",
    tiktokShopAppSecret: "",
    tiktokShopWebhookSecret: "",
    autoPublishNewProducts: false,
    autoPublishDiscountProducts: false,
  };

  return {
    ...settings,
    recaptcha: {
      ...settings.recaptcha,
      secretKey: settings.recaptcha.secretKey || existingRecaptcha.secretKey || "",
    },
    integrations: {
      ...settings.integrations,
      whatsappAccessToken:
        settings.integrations.whatsappAccessToken || existingIntegrations.whatsappAccessToken || "",
      whatsappWebhookVerifyToken:
        settings.integrations.whatsappWebhookVerifyToken || existingIntegrations.whatsappWebhookVerifyToken || "",
      metaConversionsApiToken:
        settings.integrations.metaConversionsApiToken || existingIntegrations.metaConversionsApiToken || "",
      metaDatasetQualityApiToken:
        settings.integrations.metaDatasetQualityApiToken || existingIntegrations.metaDatasetQualityApiToken || "",
      tiktokEventsApiToken:
        settings.integrations.tiktokEventsApiToken || existingIntegrations.tiktokEventsApiToken || "",
      facebookPageAccessToken:
        settings.integrations.facebookPageAccessToken || existingIntegrations.facebookPageAccessToken || "",
      instagramAccessToken:
        settings.integrations.instagramAccessToken || existingIntegrations.instagramAccessToken || "",
      tiktokShopAppSecret:
        settings.integrations.tiktokShopAppSecret || existingIntegrations.tiktokShopAppSecret || "",
      tiktokShopWebhookSecret:
        settings.integrations.tiktokShopWebhookSecret || existingIntegrations.tiktokShopWebhookSecret || "",
    },
  };
};

export const saveSettings = async (
  settings: SettingsData,
  lang: AdminLocale,
): Promise<SaveSettingsResult> => {
  const isEnglish = lang === "en";

  try {
    const adminClient = await createAdminServerClient();
    const {
      data: { user },
      error: authError,
    } = await adminClient.auth.getUser();

    if (authError || !isAdminUser(user)) {
      return { success: false, message: isEnglish ? "Unauthorized" : "Nicht autorisiert" };
    }

    const admin = createAdminDbClient();
    const { data: existingRows } = await admin
      .from("store_settings")
      .select("key, value");
    const rows = (existingRows ?? []) as Array<{ key: keyof SettingsData; value: SettingsData[keyof SettingsData] }>;

    const existingMap =
      rows.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {} as Partial<Record<keyof SettingsData, SettingsData[keyof SettingsData]>>);

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
