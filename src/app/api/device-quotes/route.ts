import { NextResponse, type NextRequest } from "next/server";

import { parseDeviceQuoteRequest, type DeviceQuoteRequest } from "@/lib/device-quote";
import { query } from "@/lib/db";
import { sendContactNotificationEmail } from "@/lib/email";
import { sendLeadTrackingEvents } from "@/lib/marketing";
import { consumePublicRateLimit } from "@/lib/public-rate-limit";
import { verifyReCaptcha } from "@/lib/recaptcha";
import { siteInfo } from "@/lib/site";

const maxBodyBytes = 16 * 1024;

const readJsonBody = async (request: NextRequest): Promise<
  | { success: true; payload: unknown }
  | { success: false; tooLarge: boolean }
> => {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBodyBytes) {
    return { success: false, tooLarge: true };
  }
  if (!request.body) return { success: false, tooLarge: false };

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let body = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBodyBytes) {
        await reader.cancel().catch(() => undefined);
        return { success: false, tooLarge: true };
      }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
    return { success: true, payload: JSON.parse(body) as unknown };
  } catch {
    return { success: false, tooLarge: false };
  }
};

const buildLeadMessage = (lead: DeviceQuoteRequest, id: string): string => [
  lead.locale === "de"
    ? "Unverbindliche Geräteanfrage – derzeit nicht auf Lager"
    : "Non-binding device request – currently not in stock",
  `Lead: ${id}`,
  `Condition: ${lead.condition}`,
  `Storage: ${lead.storage || "-"}`,
  `Color: ${lead.color || "-"}`,
  `Preferred price range: ${lead.budget || "-"}`,
  `Fulfillment: ${lead.fulfillment}`,
  `Phone: ${lead.phone || "-"}`,
  "Consent: yes",
].join("\n");

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await readJsonBody(request);
  if (!body.success) {
    return NextResponse.json(
      { success: false, error: body.tooLarge ? "invalid_size" : "invalid_fields" },
      { status: body.tooLarge ? 413 : 400 },
    );
  }

  const limit = await consumePublicRateLimit(request.headers, "device_quote", 5, 15 * 60);
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  try {
    const rawPayload = body.payload;
    if (!rawPayload || typeof rawPayload !== "object" || Array.isArray(rawPayload)) {
      return NextResponse.json({ success: false, error: "invalid_fields" }, { status: 400 });
    }
    const parsed = parseDeviceQuoteRequest(rawPayload as Record<string, unknown>);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    }
    const lead = parsed.data;
    const captcha = await verifyReCaptcha(lead.recaptchaToken, "device_quote");
    if (!captcha.success) {
      return NextResponse.json(
        { success: false, error: captcha.error || "security_failed" },
        { status: 403 },
      );
    }

    const result = await query(
      `INSERT INTO device_quote_requests
        (customer_name,email,phone,locale,brand,model,condition,storage,color,budget,fulfillment,consent,recaptcha_score)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING id`,
      [
        lead.customerName,
        lead.email || null,
        lead.phone || null,
        lead.locale,
        lead.brand,
        lead.model,
        lead.condition,
        lead.storage || null,
        lead.color || null,
        lead.budget || null,
        lead.fulfillment,
        lead.consent,
        captcha.score ?? null,
      ],
    );
    const id = String(result.rows[0]?.id ?? "");
    const device = `${lead.brand} ${lead.model}`;

    const emailResult = await sendContactNotificationEmail({
      name: lead.customerName,
      email: lead.email,
      device,
      message: buildLeadMessage(lead, id),
      locale: lead.locale,
    });
    if (!emailResult.success) {
      console.warn("[Device quote API] Email notification failed:", emailResult.error);
    }

    await sendLeadTrackingEvents(
      {
        eventName: "Lead",
        email: lead.email || null,
        phone: lead.phone || null,
        firstName: lead.customerName,
        locale: lead.locale,
        formType: "contact",
        deviceModel: device,
      },
      {
        consentMode: request.cookies.get("apfel-consent")?.value ?? null,
        ipAddress: request.headers.get("x-real-ip"),
        userAgent: request.headers.get("user-agent"),
        url: `${siteInfo.url}/${lead.locale}/smartphones`,
      },
    );

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Device quote submission failed:", error);
    return NextResponse.json({ success: false, error: "failed" }, { status: 500 });
  }
}
