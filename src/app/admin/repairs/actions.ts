"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { canManageRepairs } from "@/lib/admin-auth";
import { createAdminServerClient } from "@/lib/admin-auth-server";
import { updateRepairBookingRecord } from "@/lib/repair-booking-admin";
import { repairBookingSummary } from "@/lib/repair-booking";
import { sendRepairStatusEmail } from "@/lib/email";
import { sanitizeInput } from "@/lib/security";

const ALLOWED_STATUSES = new Set([
  "new",
  "in_progress",
  "waiting_for_parts",
  "ready",
  "completed",
  "cancelled",
]);

const parseMoneyValue = (value: FormDataEntryValue | null): number | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildRedirect = (params: Record<string, string>) => {
  const search = new URLSearchParams(params);
  return `/admin/repairs?${search.toString()}`;
};

export async function updateRepair(formData: FormData) {
  const adminClient = await createAdminServerClient();
  const {
    data: { user },
    error: authError,
  } = await adminClient.auth.getUser();

  if (authError || !canManageRepairs(user)) {
    redirect(buildRedirect({ error: "auth" }));
  }

  const id = sanitizeInput(formData.get("id"));
  const nextStatus = sanitizeInput(formData.get("status")).toLowerCase();
  const repairSummary = sanitizeInput(formData.get("repairSummary"));
  const notes = sanitizeInput(formData.get("notes"));
  const estimatedCost = parseMoneyValue(formData.get("estimatedCost"));
  const finalCost = parseMoneyValue(formData.get("finalCost"));

  if (!id || !ALLOWED_STATUSES.has(nextStatus)) {
    redirect(buildRedirect({ error: "invalid" }));
  }

  let saved;
  try { saved=await updateRepairBookingRecord({id,status:nextStatus,estimatedCost,finalCost,repairSummary,notes,appointment:sanitizeInput(formData.get("appointment"))}); }
  catch(error){const message=error instanceof Error?error.message:"invalid";redirect(buildRedirect({error:["missing","coupon_date","coupon_minimum","cancelled_coupon"].includes(message)?message:"invalid"}));}
  const existing=saved.existing;

  let emailWarning = false;
  if (existing.customer_email && saved.changed) {
    const emailResult = await sendRepairStatusEmail({
      ticketNumber: existing.ticket_number,
      customerName: existing.customer_name,
      customerEmail: existing.customer_email,
      deviceModel: existing.device_model,
      locale: existing.customer_locale === "de" ? "de" : "en",
      status: nextStatus,
      repairSummary: repairSummary || null,
      estimatedCost:saved.estimatedCost,
      finalCost:saved.finalCost,
      bookingSummary:repairBookingSummary(saved.details,existing.customer_locale==="de"?"de":"en"),
    });

    if (!emailResult.success) {
      emailWarning = true;
      console.warn("[Admin Repairs] Customer status email failed:", emailResult.error);
    }
  }

  revalidatePath("/admin/repairs");
  redirect(
    buildRedirect({
      updated: "1",
      ...(emailWarning ? { email: "warning" } : {}),
    }),
  );
}
