"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isAdminUser } from "@/lib/admin-auth";
import { createAdminServerClient } from "@/lib/admin-auth-server";
import { query } from "@/lib/db";
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

  if (authError || !isAdminUser(user)) {
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

  const existingResult = await query(
    `SELECT id, ticket_number, customer_name, customer_email, customer_locale, device_model, status
     FROM repairs
     WHERE id = $1
     LIMIT 1`,
    [id],
  );

  const existing = existingResult.rows[0] as
    | {
        id: string;
        ticket_number: number | null;
        customer_name: string;
        customer_email: string | null;
        customer_locale: string | null;
        device_model: string;
        status: string | null;
      }
    | undefined;

  if (!existing) {
    redirect(buildRedirect({ error: "missing" }));
  }

  await query(
    `UPDATE repairs
     SET status = $2,
         estimated_cost = $3,
         final_cost = $4,
         repair_summary = $5,
         notes = $6,
         status_updated_at = NOW()
     WHERE id = $1`,
    [id, nextStatus, estimatedCost, finalCost, repairSummary || null, notes || null],
  );

  let emailWarning = false;
  if (existing.customer_email && (existing.status ?? "") !== nextStatus) {
    const emailResult = await sendRepairStatusEmail({
      ticketNumber: existing.ticket_number,
      customerName: existing.customer_name,
      customerEmail: existing.customer_email,
      deviceModel: existing.device_model,
      locale: existing.customer_locale === "de" ? "de" : "en",
      status: nextStatus,
      repairSummary: repairSummary || null,
      estimatedCost,
      finalCost,
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
