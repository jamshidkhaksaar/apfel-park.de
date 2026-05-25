"use server";

import { revalidatePath } from "next/cache";

import { isAdminUser } from "@/lib/admin-auth";
import { createAdminServerClient } from "@/lib/admin-auth-server";
import { createAdminDbClient } from "@/lib/admin-db";
import { locales } from "@/lib/i18n";
import { seoRouteDefinitions, type SeoSettings } from "@/lib/seo";

type SaveSeoResult = {
  success: boolean;
  message: string;
};

export async function saveSeoSettings(settings: SeoSettings): Promise<SaveSeoResult> {
  try {
    const adminClient = await createAdminServerClient();
    const {
      data: { user },
      error: authError,
    } = await adminClient.auth.getUser();

    if (authError || !isAdminUser(user)) {
      return { success: false, message: "Unauthorized" };
    }

    const admin = createAdminDbClient();
    const { error } = await admin
      .from("store_settings")
      .upsert(
        {
          key: "seo_settings",
          value: settings,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" },
      );

    if (error) {
      console.error("Error saving SEO settings:", error);
      return { success: false, message: "Failed to save SEO settings." };
    }

    revalidatePath("/robots.txt");
    revalidatePath("/sitemap.xml");
    revalidatePath("/", "layout");

    for (const locale of locales) {
      for (const route of seoRouteDefinitions) {
        revalidatePath(`/${locale}${route.path || ""}`);
      }
    }

    return { success: true, message: "SEO settings saved successfully." };
  } catch (error) {
    console.error("Error saving SEO settings:", error);
    return { success: false, message: "Failed to save SEO settings." };
  }
}
