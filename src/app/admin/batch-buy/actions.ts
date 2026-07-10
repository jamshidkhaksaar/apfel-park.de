"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { canManageBatchBuy } from "@/lib/admin-auth";
import { createAdminServerClient } from "@/lib/admin-auth-server";
import {
  createBatchPhone,
  createBatchSeller,
  deleteBatchPhone,
  updateBatchPhone,
  updateBatchPhoneStatus,
  updateBatchSeller,
} from "@/lib/batch-buy";
import { isBatchPhoneStatus, normalizeImei } from "@/lib/batch-buy-shared";
import { isValidEmail, isValidInputLength, sanitizeInput } from "@/lib/security";

const buildRedirect = (params: Record<string, string>) => {
  const search = new URLSearchParams(params);
  return `/admin/batch-buy?${search.toString()}`;
};

const requireBatchBuyAccess = async () => {
  const adminClient = await createAdminServerClient();
  const {
    data: { user },
    error,
  } = await adminClient.auth.getUser();

  return !error && canManageBatchBuy(user);
};

const optionalText = (value: FormDataEntryValue | null, maxLength: number): string | null => {
  const sanitized = sanitizeInput(value);
  if (!sanitized) return null;
  if (!isValidInputLength(sanitized, maxLength)) return null;
  return sanitized;
};

export async function createSeller(formData: FormData) {
  if (!(await requireBatchBuyAccess())) {
    redirect(buildRedirect({ error: "auth" }));
  }

  const fullName = sanitizeInput(formData.get("fullName"));
  const phone = optionalText(formData.get("phone"), 80);
  const email = optionalText(formData.get("email"), 254);
  const notes = optionalText(formData.get("notes"), 1000);

  if (
    !fullName ||
    !isValidInputLength(fullName, 160) ||
    (!phone && !email) ||
    (email && !isValidEmail(email))
  ) {
    redirect(buildRedirect({ error: "seller" }));
  }

  const id = await createBatchSeller({ fullName, phone, email, notes });

  revalidatePath("/admin/batch-buy");
  redirect(buildRedirect({ seller: id, saved: "seller" }));
}

export async function saveSeller(formData: FormData) {
  if (!(await requireBatchBuyAccess())) {
    redirect(buildRedirect({ error: "auth" }));
  }

  const id = sanitizeInput(formData.get("sellerId"));
  const fullName = sanitizeInput(formData.get("fullName"));
  const phone = optionalText(formData.get("phone"), 80);
  const email = optionalText(formData.get("email"), 254);
  const notes = optionalText(formData.get("notes"), 1000);

  if (
    !id ||
    !fullName ||
    !isValidInputLength(fullName, 160) ||
    (!phone && !email) ||
    (email && !isValidEmail(email))
  ) {
    redirect(buildRedirect({ ...(id ? { seller: id } : {}), error: "seller" }));
  }

  await updateBatchSeller({ id, fullName, phone, email, notes });

  revalidatePath("/admin/batch-buy");
  redirect(buildRedirect({ seller: id, saved: "seller" }));
}

export async function addPhone(formData: FormData) {
  if (!(await requireBatchBuyAccess())) {
    redirect(buildRedirect({ error: "auth" }));
  }

  const sellerId = sanitizeInput(formData.get("sellerId"));
  const phoneModel = sanitizeInput(formData.get("phoneModel"));
  const catalogBrandId = optionalText(formData.get("catalogBrandId"), 120);
  const catalogFamilyId = optionalText(formData.get("catalogFamilyId"), 120);
  const catalogModelId = optionalText(formData.get("catalogModelId"), 160);
  const imei = normalizeImei(sanitizeInput(formData.get("imei")));
  const purchaseDate = sanitizeInput(formData.get("purchaseDate"));
  const notes = optionalText(formData.get("notes"), 1000);
  const status = sanitizeInput(formData.get("status"));

  if (
    !sellerId ||
    !phoneModel ||
    !isValidInputLength(phoneModel, 180) ||
    !imei ||
    !isValidInputLength(imei, 32) ||
    !purchaseDate ||
    Number.isNaN(Date.parse(purchaseDate)) ||
    !isBatchPhoneStatus(status)
  ) {
    redirect(buildRedirect({ ...(sellerId ? { seller: sellerId } : {}), error: "phone" }));
  }

  try {
    await createBatchPhone({
      sellerId,
      phoneModel,
      catalogBrandId,
      catalogFamilyId,
      catalogModelId,
      imei,
      purchaseDate,
      notes,
      status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    redirect(buildRedirect({ seller: sellerId, error: message.includes("unique") ? "imei" : "phone" }));
  }

  revalidatePath("/admin/batch-buy");
  redirect(buildRedirect({ seller: sellerId, saved: "phone" }));
}

export async function savePhoneStatus(formData: FormData) {
  if (!(await requireBatchBuyAccess())) {
    redirect(buildRedirect({ error: "auth" }));
  }

  const id = sanitizeInput(formData.get("phoneId"));
  const sellerId = sanitizeInput(formData.get("sellerId"));
  const status = sanitizeInput(formData.get("status"));

  if (!id || !sellerId || !isBatchPhoneStatus(status)) {
    redirect(buildRedirect({ ...(sellerId ? { seller: sellerId } : {}), error: "status" }));
  }

  await updateBatchPhoneStatus({ id, sellerId, status });

  revalidatePath("/admin/batch-buy");
  redirect(buildRedirect({ seller: sellerId, saved: "status" }));
}

export async function savePhone(formData: FormData) {
  if (!(await requireBatchBuyAccess())) {
    redirect(buildRedirect({ error: "auth" }));
  }

  const id = sanitizeInput(formData.get("phoneId"));
  const sellerId = sanitizeInput(formData.get("sellerId"));
  const phoneModel = sanitizeInput(formData.get("phoneModel"));
  const imei = normalizeImei(sanitizeInput(formData.get("imei")));
  const purchaseDate = sanitizeInput(formData.get("purchaseDate"));
  const notes = optionalText(formData.get("notes"), 1000);
  const status = sanitizeInput(formData.get("status"));

  if (
    !id ||
    !sellerId ||
    !phoneModel ||
    !isValidInputLength(phoneModel, 180) ||
    !imei ||
    !isValidInputLength(imei, 32) ||
    !purchaseDate ||
    Number.isNaN(Date.parse(purchaseDate)) ||
    !isBatchPhoneStatus(status)
  ) {
    redirect(buildRedirect({ ...(sellerId ? { seller: sellerId } : {}), error: "phone" }));
  }

  try {
    await updateBatchPhone({ id, sellerId, phoneModel, imei, purchaseDate, notes, status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    redirect(buildRedirect({ seller: sellerId, error: message.includes("unique") ? "imei" : "phone" }));
  }

  revalidatePath("/admin/batch-buy");
  redirect(buildRedirect({ seller: sellerId, saved: "phone-update" }));
}

export async function removePhone(formData: FormData) {
  if (!(await requireBatchBuyAccess())) {
    redirect(buildRedirect({ error: "auth" }));
  }

  const id = sanitizeInput(formData.get("phoneId"));
  const sellerId = sanitizeInput(formData.get("sellerId"));

  if (!id || !sellerId) {
    redirect(buildRedirect({ ...(sellerId ? { seller: sellerId } : {}), error: "phone" }));
  }

  await deleteBatchPhone({ id, sellerId });

  revalidatePath("/admin/batch-buy");
  redirect(buildRedirect({ seller: sellerId, saved: "phone-delete" }));
}
