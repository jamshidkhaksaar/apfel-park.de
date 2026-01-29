"use server";

import { createClient } from "@/lib/supabase/server";
import { verifyTurnstile } from "@/lib/turnstile";
import { redirect } from "next/navigation";

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const token = formData.get("cf-turnstile-response") as string;
  const redirectTo = formData.get("redirectTo") as string || "/admin";

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  // Verify Turnstile
  const verification = await verifyTurnstile(token);
  if (!verification.success) {
    return { error: "Invalid captcha. Please try again." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Return generic error to prevent enumeration
    return { error: "Invalid email or password" };
  }

  redirect(redirectTo);
}
