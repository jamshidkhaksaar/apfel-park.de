"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isAdminUser } from "@/lib/admin-auth";
import { createAdminServerClient } from "@/lib/admin-auth-server";
import { query } from "@/lib/db";
import { sanitizeInput } from "@/lib/security";

const ALLOWED_STATUSES = new Set(["new", "processing", "refunded", "rejected"]);

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function updateWithdrawalStatus(formData: FormData) {
  const adminClient = await createAdminServerClient();
  const {
    data: { user },
    error: authError,
  } = await adminClient.auth.getUser();

  if (authError || !isAdminUser(user)) {
    redirect("/admin/withdrawals?error=auth");
  }

  const id = sanitizeInput(formData.get("id"));
  const nextStatus = sanitizeInput(formData.get("status")).toLowerCase();

  if (!UUID_PATTERN.test(id) || !ALLOWED_STATUSES.has(nextStatus)) {
    redirect("/admin/withdrawals?error=invalid");
  }

  await query(`UPDATE withdrawal_requests SET status = $2 WHERE id = $1`, [id, nextStatus]);

  revalidatePath("/admin/withdrawals");
  redirect("/admin/withdrawals?updated=1");
}
