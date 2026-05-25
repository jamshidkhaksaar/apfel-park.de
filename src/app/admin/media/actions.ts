"use server";

import { createAdminDbClient } from "@/lib/admin-db";
import { isAdminUser } from "@/lib/admin-auth";
import { createAdminServerClient } from "@/lib/admin-auth-server";
import type { AdminLocale } from "@/lib/admin-i18n";

export type HeroMediaFormState = {
  enabled: boolean;
  sourceType: "image" | "local" | "external";
  videoUrl: string;
  posterUrl: string;
  mobileImages: string[];
  fallbackImageUrl: string;
  title: string;
  subtitle: string;
};

type SaveResult = {
  success: boolean;
  message: string;
};

export const saveHeroMedia = async (
  payload: HeroMediaFormState,
  lang: AdminLocale,
): Promise<SaveResult> => {
  const isEnglish = lang === "en";

  try {
    const adminClient = await createAdminServerClient();
    const {
      data: { user },
      error,
    } = await adminClient.auth.getUser();

    if (error || !isAdminUser(user)) {
      return { success: false, message: isEnglish ? "Unauthorized" : "Nicht autorisiert" };
    }

    const admin = createAdminDbClient();
    const { error: saveError } = await admin
      .from("store_settings")
      .upsert(
        {
          key: "hero_media",
          value: payload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" },
      );

    if (saveError) {
      console.error("Error saving hero media:", saveError);
      return {
        success: false,
        message: isEnglish ? "Failed to save hero media." : "Hero Media konnte nicht gespeichert werden.",
      };
    }

    return {
      success: true,
      message: isEnglish ? "Hero media saved successfully." : "Hero Media erfolgreich gespeichert.",
    };
  } catch (error) {
    console.error("Error saving hero media:", error);
    return {
      success: false,
      message: isEnglish ? "Failed to save hero media." : "Hero Media konnte nicht gespeichert werden.",
    };
  }
};
