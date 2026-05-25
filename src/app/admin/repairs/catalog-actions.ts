"use server";

import { revalidatePath } from "next/cache";

import { isAdminUser } from "@/lib/admin-auth";
import { createAdminServerClient } from "@/lib/admin-auth-server";
import { createAdminDbClient } from "@/lib/admin-db";
import { sanitizeCatalogForSave, type RepairCatalog } from "@/lib/repair-catalog";

type SaveResult = {
  success: boolean;
  message: string;
};

export const saveRepairCatalog = async (
  payload: RepairCatalog,
  locale: "de" | "en",
): Promise<SaveResult> => {
  const isGerman = locale === "de";

  try {
    const adminClient = await createAdminServerClient();
    const {
      data: { user },
      error,
    } = await adminClient.auth.getUser();

    if (error || !isAdminUser(user)) {
      return { success: false, message: isGerman ? "Nicht autorisiert." : "Unauthorized." };
    }

    // Sanitize but preserve the user's intent — even an empty brand list is valid here
    const normalized = sanitizeCatalogForSave(payload);
    console.log(`[repair-catalog] saving ${normalized.brands.length} brand(s)`);

    const admin = createAdminDbClient();
    const { error: saveError } = await admin.from("store_settings").upsert(
      {
        key: "repair_catalog",
        value: JSON.parse(JSON.stringify(normalized)), // ensure plain object for pg serialization
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );

    if (saveError) {
      console.error("[repair-catalog] upsert error:", saveError);
      return {
        success: false,
        message: isGerman ? "Der Reparaturkatalog konnte nicht gespeichert werden." : "Failed to save repair catalog.",
      };
    }

    console.log(`[repair-catalog] saved successfully`);

    revalidatePath("/admin/repairs");
    revalidatePath("/de/repairs");
    revalidatePath("/en/repairs");

    return {
      success: true,
      message: isGerman ? "Reparaturkatalog gespeichert." : "Repair catalog saved.",
    };
  } catch (error) {
    console.error("[repair-catalog] save failed", error);
    return {
      success: false,
      message: isGerman ? "Der Reparaturkatalog konnte nicht gespeichert werden." : "Failed to save repair catalog.",
    };
  }
};
