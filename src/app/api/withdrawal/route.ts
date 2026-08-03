import { NextRequest, NextResponse } from "next/server";

import { getOrderByNumberAndEmail } from "@/lib/checkout";
import { createAdminDbClient } from "@/lib/admin-db";
import { sendWithdrawalAdminEmail, sendWithdrawalCustomerEmail } from "@/lib/email";
import { verifyReCaptcha } from "@/lib/recaptcha";
import { isValidEmail, isValidInputLength, sanitizeInput } from "@/lib/security";

type WithdrawalFormData = {
  name: string;
  email: string;
  orderNumber: string;
  receivedDate?: string;
  reason?: string;
  recaptchaToken: string;
  locale: string;
};

export async function POST(request: NextRequest) {
  try {
    const payload: WithdrawalFormData = await request.json();
    const locale = payload.locale === "en" ? "en" : "de";

    const name = sanitizeInput(payload.name);
    const email = sanitizeInput(payload.email);
    const orderNumber = sanitizeInput(payload.orderNumber);
    const receivedDate = payload.receivedDate ? sanitizeInput(payload.receivedDate) : null;
    // The withdrawal reason must stay optional (Widerrufsbutton rules).
    const reason = payload.reason ? sanitizeInput(payload.reason) : null;

    if (!name || !email || !orderNumber) {
      return NextResponse.json(
        {
          success: false,
          error:
            locale === "de"
              ? "Name, E-Mail und Bestellnummer sind erforderlich."
              : "Name, email, and order number are required.",
        },
        { status: 400 },
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: locale === "de" ? "Ungültige E-Mail-Adresse." : "Invalid email address." },
        { status: 400 },
      );
    }

    if (
      !isValidInputLength(name, 100) ||
      !isValidInputLength(orderNumber, 60) ||
      !isValidInputLength(receivedDate || "", 60) ||
      !isValidInputLength(reason || "", 2000)
    ) {
      return NextResponse.json({ success: false, error: "Input too long" }, { status: 400 });
    }

    const captchaResult = await verifyReCaptcha(payload.recaptchaToken, "withdrawal_form");
    if (!captchaResult.success) {
      console.error("[Withdrawal API] reCAPTCHA verification failed:", captchaResult.error);
      return NextResponse.json(
        { success: false, error: captchaResult.error || "Security verification failed" },
        { status: 403 },
      );
    }

    // Soft-match against orders; never reject on mismatch (the withdrawal
    // declaration must be accepted regardless — the shop reviews manually).
    let orderMatch: string | null = null;
    try {
      const order = await getOrderByNumberAndEmail(orderNumber, email);
      orderMatch = order?.id ?? null;
    } catch (error) {
      console.error("[Withdrawal API] Order lookup failed:", error);
    }

    const confirmedAt = new Date().toISOString();
    const adminDb = createAdminDbClient();
    const { error: dbError } = await adminDb.from("withdrawal_requests").insert({
      customer_name: name,
      customer_email: email,
      order_number: orderNumber,
      received_date: receivedDate,
      reason,
      locale,
      status: "new",
      order_match: orderMatch,
      confirmed_at: confirmedAt,
    });

    if (dbError) {
      console.error("[Withdrawal API] DB insert failed:", dbError.message);
      return NextResponse.json(
        {
          success: false,
          error:
            locale === "de"
              ? "Ihr Widerruf konnte nicht gespeichert werden. Bitte kontaktieren Sie uns per E-Mail."
              : "Your withdrawal could not be saved. Please contact us by email.",
        },
        { status: 500 },
      );
    }

    const emailData = {
      customerName: name,
      customerEmail: email,
      orderNumber,
      receivedDate,
      reason,
      locale: locale as "de" | "en",
      confirmedAt,
    };

    const [customerEmailResult, adminEmailResult] = await Promise.all([
      sendWithdrawalCustomerEmail(emailData),
      sendWithdrawalAdminEmail({ ...emailData, orderMatched: Boolean(orderMatch) }),
    ]);
    if (!customerEmailResult.success) {
      console.error("[Withdrawal API] Customer confirmation email failed:", customerEmailResult.error);
    }
    if (!adminEmailResult.success) {
      console.error("[Withdrawal API] Admin notification email failed:", adminEmailResult.error);
    }

    return NextResponse.json({
      success: true,
      confirmedAt,
      message:
        locale === "de"
          ? "Ihr Widerruf ist bei uns eingegangen. Sie erhalten eine Eingangsbestätigung per E-Mail."
          : "Your withdrawal has been received. You will get a receipt confirmation by email.",
    });
  } catch (error) {
    console.error("[Withdrawal API] Unexpected error:", error);
    return NextResponse.json({ success: false, error: "Request failed" }, { status: 500 });
  }
}
