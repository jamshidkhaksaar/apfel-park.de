"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isAdminUser } from "@/lib/admin-auth";
import { createAdminServerClient } from "@/lib/admin-auth-server";
import { query } from "@/lib/db";
import { sanitizeInput } from "@/lib/security";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_ACTIONS = new Set(["unsubscribe", "reactivate"]);

export async function updateOfferSubscriberStatus(formData: FormData) {
  const adminClient = await createAdminServerClient();
  const {
    data: { user },
    error: authError,
  } = await adminClient.auth.getUser();
  if (authError || !isAdminUser(user)) redirect("/admin/subscribers?error=auth");

  const id = sanitizeInput(formData.get("id"));
  const action = sanitizeInput(formData.get("action")).toLowerCase();
  if (!UUID_PATTERN.test(id) || !ALLOWED_ACTIONS.has(action)) redirect("/admin/subscribers?error=invalid");

  const result = action === "unsubscribe"
    ? await query(
        `UPDATE offer_subscribers
            SET unsubscribed_at = COALESCE(unsubscribed_at, now()), updated_at = now()
          WHERE id = $1
          RETURNING id`,
        [id],
      )
    : await query(
        `UPDATE offer_subscribers
            SET unsubscribed_at = NULL, updated_at = now()
          WHERE id = $1
            AND confirmed_at IS NOT NULL
            AND unsubscribed_at IS NOT NULL
          RETURNING id`,
        [id],
      );

  if (!result.rows[0]) redirect("/admin/subscribers?error=conflict");
  revalidatePath("/admin/subscribers");
  redirect("/admin/subscribers?updated=1");
}
