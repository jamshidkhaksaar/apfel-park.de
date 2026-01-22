import { createClient } from "./supabase/server";

export async function verifyTurnstile(token: string) {
  const supabase = await createClient();
  
  // Get secret key from DB
  const { data } = await supabase
    .from("store_settings")
    .select("value")
    .eq("key", "security")
    .single();
    
  const secretKey = data?.value?.cfSecretKey;

  if (!secretKey) {
    console.warn("Turnstile secret key not found in settings. Skipping verification.");
    return { success: true }; // Fail open if not configured, or false to fail closed
  }

  const formData = new FormData();
  formData.append("secret", secretKey);
  formData.append("response", token);

  try {
    const result = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      body: formData,
      method: "POST",
    });

    const outcome = await result.json();
    return { success: outcome.success };
  } catch (e) {
    console.error("Turnstile verification error:", e);
    return { success: false };
  }
}

export async function getTurnstileSiteKey() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_settings")
    .select("value")
    .eq("key", "security")
    .single();
    
  return data?.value?.cfSiteKey || null;
}
