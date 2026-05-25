import { NextRequest, NextResponse } from "next/server";

import { sendContactNotificationEmail } from "@/lib/email";
import { sendLeadTrackingEvents } from "@/lib/marketing";
import { verifyReCaptcha } from "@/lib/recaptcha";
import { isValidEmail, isValidInputLength, sanitizeInput } from "@/lib/security";
import { createAdminDbClient } from "@/lib/admin-db";
import { siteInfo } from "@/lib/site";

type ContactFormData = {
  name: string;
  email: string;
  device?: string;
  message: string;
  recaptchaToken: string;
  locale: string;
};

export async function POST(request: NextRequest) {
  try {
    const payload: ContactFormData = await request.json();

    // Sanitize inputs
    const name = sanitizeInput(payload.name);
    const email = sanitizeInput(payload.email);
    const device = payload.device ? sanitizeInput(payload.device) : undefined;
    const message = sanitizeInput(payload.message);

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format and length
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate input lengths (prevention of DoS/Storage spam)
    if (!isValidInputLength(name, 100) ||
        !isValidInputLength(device || "", 100) ||
        !isValidInputLength(message, 5000)) {
      return NextResponse.json(
        { success: false, error: "Input too long" },
        { status: 400 }
      );
    }

    // Verify reCAPTCHA token
    const captchaResult = await verifyReCaptcha(payload.recaptchaToken, "contact_form");
    if (!captchaResult.success) {
      console.error("[Contact API] reCAPTCHA verification failed:", captchaResult.error);
      return NextResponse.json(
        { success: false, error: captchaResult.error || "Security verification failed" },
        { status: 403 }
      );
    }

    // Store the contact submission in database using admin DB access.
    const adminDb = createAdminDbClient();

    const { error: dbError } = await adminDb.from("contact_submissions").insert({
      name,
      email,
      device: device || null,
      message,
      locale: payload.locale || "en",
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
      name,
      email,
      device,
      message,
      locale: payload.locale,
    });

    if (!emailResult.success) {
      console.warn("[Contact API] Email notification failed:", emailResult.error);
    }

    await sendLeadTrackingEvents(
      {
        eventName: "Contact",
        email,
        firstName: name,
        locale: payload.locale || "en",
        formType: "contact",
        deviceModel: device || null,
      },
      {
        consentMode: request.cookies.get("apfel-consent")?.value ?? null,
        ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
        userAgent: request.headers.get("user-agent"),
        url: `${siteInfo.url}/contact`,
      },
    );

    return NextResponse.json({
      success: true,
      message: payload.locale === "de"
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
