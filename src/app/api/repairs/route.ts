import { NextRequest, NextResponse } from "next/server";

import { saveRepairBooking } from "@/lib/repair-booking-server";
import { repairBookingSummary, repairBookingError, repairBookingErrorStatus, type RepairBookingInput, type RepairBookingDetails } from "@/lib/repair-booking";
import {
  sendRepairRequestAdminEmail,
  sendRepairRequestCustomerEmail,
} from "@/lib/email";
import { sendLeadTrackingEvents } from "@/lib/marketing";
import { verifyReCaptcha } from "@/lib/recaptcha";
import { isValidEmail, isValidInputLength, sanitizeInput } from "@/lib/security";
import { siteInfo } from "@/lib/site";
import { consumePublicRateLimit } from "@/lib/public-rate-limit";

type RepairRequestPayload = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deviceModel: string;
  issueDescription: string;
  locale: string;
  recaptchaToken: string;
};

const toTicketNumber = (value: number | null): string => (value ? `R-${value}` : "R-neu");

export async function POST(request: NextRequest) {
  const limit = await consumePublicRateLimit(request.headers, "repair_request", 5, 15 * 60);
  if (!limit.allowed) return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
  let locale:"de"|"en"="de";
  try {
    const raw=await request.text();if(raw.length>16384)return NextResponse.json({success:false,error:"Request too large"},{status:413});
    const payload: RepairRequestPayload & RepairBookingInput = JSON.parse(raw);
    locale = payload.locale === "de" ? "de" : "en";
    const customerName = sanitizeInput(payload.customerName);
    const customerEmail = sanitizeInput(payload.customerEmail).toLowerCase();
    const customerPhone = sanitizeInput(payload.customerPhone);
    const deviceModel = sanitizeInput(payload.deviceModel);
    const issueDescription = sanitizeInput(payload.issueDescription);

    const errors: Partial<Record<keyof RepairRequestPayload, string>> = {};

    if (!customerName) errors.customerName = locale === "de" ? "Name ist erforderlich" : "Name is required";
    if (!isValidEmail(customerEmail)) {
      errors.customerEmail = locale === "de" ? "Gultige E-Mail erforderlich" : "Valid email is required";
    }
    if (!customerPhone) errors.customerPhone = locale === "de" ? "Telefon ist erforderlich" : "Phone is required";
    if (!deviceModel) errors.deviceModel = locale === "de" ? "Gerat ist erforderlich" : "Device is required";
    if (!issueDescription) {
      errors.issueDescription = locale === "de" ? "Fehlerbeschreibung ist erforderlich" : "Issue description is required";
    }

    if (!isValidInputLength(customerName, 120)) errors.customerName = "Name is too long";
    if (!isValidInputLength(customerPhone, 60)) errors.customerPhone = "Phone is too long";
    if (!isValidInputLength(deviceModel, 180)) errors.deviceModel = "Device is too long";
    if (!isValidInputLength(issueDescription, 3000)) errors.issueDescription = "Issue description is too long";

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: locale === "de" ? "Bitte Eingaben prufen." : "Please review the form values.",
          errors,
        },
        { status: 400 },
      );
    }

    const captchaResult = await verifyReCaptcha(payload.recaptchaToken, "repair_request");
    if (!captchaResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: captchaResult.error || "Security verification failed",
        },
        { status: 403 },
      );
    }

    const data=await saveRepairBooking({customerName,customerEmail,customerPhone,deviceModel,issueDescription,locale},payload);
    const bookingDetails=data.booking_details as RepairBookingDetails;
    const bookingSummary=repairBookingSummary(bookingDetails,locale);
    if(data.duplicate)return NextResponse.json({success:true,ticketNumber:toTicketNumber(data.ticket_number as number),bookingSummary,message:locale==="de"?"Diese Anfrage wurde bereits gespeichert.":"This request was already saved."});

    const emailPayload = {
      ticketNumber: data.ticket_number as number | null,
      customerName,
      customerEmail,
      customerPhone,
      deviceModel:bookingDetails.repairLabel?bookingDetails.deviceLabel:deviceModel,
      issueDescription,
      locale,
      bookingSummary,
    };

    const [customerEmailResult, adminEmailResult] = await Promise.all([
      sendRepairRequestCustomerEmail(emailPayload),
      sendRepairRequestAdminEmail(emailPayload),
    ]);

    if (!customerEmailResult.success) {
      console.warn("[Repairs API] Customer confirmation email failed:", customerEmailResult.error);
    }
    if (!adminEmailResult.success) {
      console.warn("[Repairs API] Admin notification email failed:", adminEmailResult.error);
    }

    await sendLeadTrackingEvents(
      {
        eventName: "Lead",
        email: customerEmail,
        phone: customerPhone,
        firstName: customerName,
        locale,
        formType: "repair",
        deviceModel,
      },
      {
        consentMode: request.cookies.get("apfel-consent")?.value ?? null,
        ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
        userAgent: request.headers.get("user-agent"),
        url: `${siteInfo.url}/repairs`,
      },
    ).catch(()=>undefined);

    return NextResponse.json({
      success: true,
      ticketNumber: toTicketNumber(data.ticket_number as number | null),
      bookingSummary,
      message:
        locale === "de"
          ? "Deine Reparaturanfrage wurde erfolgreich gesendet."
          : "Your repair request was submitted successfully.",
    });
  } catch (error) {
    console.error("[Repairs API] Unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        error: repairBookingError(error instanceof Error?error.message:"",locale==="de"),
      },
      { status: repairBookingErrorStatus(error instanceof Error?error.message:"") },
    );
  }
}
