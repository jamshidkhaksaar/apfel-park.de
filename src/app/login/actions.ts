"use server";

import { createClient } from "@/lib/supabase/server";
import { verifyReCaptcha } from "@/lib/recaptcha";
import { isSafeRedirect } from "@/lib/security";
import { redirect } from "next/navigation";

type LoginActionState = {
  error?: string;
};

export async function loginAction(_prevState: LoginActionState | null, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const token = formData.get("recaptchaToken") as string;
  const rawRedirectTo = formData.get("redirectTo") as string;
  // Prevent Open Redirect vulnerability by validating the redirect URL
  const redirectTo = isSafeRedirect(rawRedirectTo) ? rawRedirectTo : "/admin";

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const verification = await verifyReCaptcha(token, "admin_login");
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
