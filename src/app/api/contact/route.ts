import { NextRequest, NextResponse } from "next/server";

import { sendContactNotificationEmail } from "@/lib/email";
import { verifyReCaptcha } from "@/lib/recaptcha";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidEmail } from "@/lib/security";
import { locales, type Locale } from "@/lib/i18n";

type ContactFormData = {
  name: string;
  email: string;
  device?: string;
  message: string;
  recaptchaToken: string;
  locale: string;
};

const MAX_NAME_LENGTH = 100;
const MAX_DEVICE_LENGTH = 100;
const MAX_MESSAGE_LENGTH = 5000;

export async function POST(request: NextRequest) {
  try {
    const data: ContactFormData = await request.json();

    // Validate required fields
    if (!data.name || !data.email || !data.message) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Security: Validate input lengths to prevent DoS/Storage exhaustion
    if (data.name.length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        { success: false, error: "Name exceeds maximum length" },
        { status: 400 }
      );
    }

    if (data.device && data.device.length > MAX_DEVICE_LENGTH) {
      return NextResponse.json(
        { success: false, error: "Device name exceeds maximum length" },
        { status: 400 }
      );
    }

    if (data.message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { success: false, error: "Message exceeds maximum length" },
        { status: 400 }
      );
    }

    // Security: Validate email format strictly
    if (!isValidEmail(data.email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Security: Validate locale to prevent injection of invalid values
    if (data.locale && !locales.includes(data.locale as Locale)) {
      return NextResponse.json(
        { success: false, error: "Invalid locale" },
        { status: 400 }
      );
    }

    // Verify reCAPTCHA token
    const captchaResult = await verifyReCaptcha(data.recaptchaToken, "contact_form");
    if (!captchaResult.success) {
      console.error("[Contact API] reCAPTCHA verification failed:", captchaResult.error);
      return NextResponse.json(
        { success: false, error: captchaResult.error || "Security verification failed" },
        { status: 403 }
      );
    }

    // Store the contact submission in database using Service Role (admin access)
    // This allows inserting even if RLS denies public inserts
    const supabase = createAdminClient();

    const { error: dbError } = await supabase.from("contact_submissions").insert({
      name: data.name,
      email: data.email,
      device: data.device || null,
      message: data.message,
      locale: data.locale || "en",
      recaptcha_score: captchaResult.score,
      status: "new",
      created_at: new Date().toISOString(),
    });

    if (dbError) {
      console.error("[Contact API] Database error:", dbError);
      // Don't expose database errors to client
      return NextResponse.json(
        { success: false, error: "Failed to submit message" },
        { status: 500 }
      );
    }

    const emailResult = await sendContactNotificationEmail({
      name: data.name,
      email: data.email,
      device: data.device,
      message: data.message,
      locale: data.locale,
    });

    if (!emailResult.success) {
      console.warn("[Contact API] Email notification failed:", emailResult.error);
    }

    return NextResponse.json({
      success: true,
      message: data.locale === "de" 
        ? "Nachricht erfolgreich gesendet!" 
        : "Message sent successfully!",
    });
  } catch (error) {
    console.error("[Contact API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
