import nodemailer from "nodemailer";

import { createAdminDbClient } from "@/lib/admin-db";
import { escapeHtml } from "@/lib/security";
import { siteInfo } from "@/lib/site";

type ContactNotificationData = {
  name: string;
  email: string;
  device?: string;
  message: string;
  locale?: string;
};

type RepairRequestEmailData = {
  ticketNumber: number | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deviceModel: string;
  issueDescription: string;
  locale: string;
};

type RepairStatusEmailData = {
  ticketNumber: number | null;
  customerName: string;
  customerEmail: string;
  deviceModel: string;
  locale: string;
  status: string;
  repairSummary?: string | null;
  estimatedCost?: number | null;
  finalCost?: number | null;
};

type ChatSummaryEmailData = {
  customerName: string;
  customerEmail: string;
  locale: string;
  conversationId: string;
  sourcePage?: string | null;
  closedAt?: string | null;
  messages: Array<{
    createdAt: string;
    senderRole: "customer" | "admin" | "system";
    message: string;
  }>;
};

type EmailSendResult = {
  success: boolean;
  error?: string;
};

export type EmailAttachment = {
  filename: string;
  content: Buffer;
  contentType: string;
};

type OutboundEmail = {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
  identity?: "repairs" | "sales";
  attachments?: EmailAttachment[];
};

const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
};

const formatTicketNumber = (ticketNumber: number | null | undefined): string =>
  ticketNumber ? `R-${ticketNumber}` : "R-neu";

const formatCurrency = (value: number | null | undefined, locale: string): string | null => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  return new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-US", {
    style: "currency",
    currency: "EUR",
  }).format(value);
};

// Sender identities: "repairs" (default) for the repair flow, "sales" for
// shop matters such as orders and withdrawal confirmations.
export type EmailIdentity = "repairs" | "sales";

const getMailerConfig = (identity: EmailIdentity = "repairs") => {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT ?? "587");
  const defaultUser = process.env.SMTP_USER?.trim();
  const defaultPass = process.env.SMTP_PASS?.trim();
  const user = identity === "sales" ? process.env.SMTP_SALES_USER?.trim() || defaultUser : defaultUser;
  const pass = identity === "sales" ? process.env.SMTP_SALES_PASS?.trim() || defaultPass : defaultPass;
  const from =
    (identity === "sales" ? process.env.SMTP_SALES_FROM?.trim() || process.env.SMTP_SALES_USER?.trim() : undefined) ||
    process.env.SMTP_FROM_EMAIL?.trim() ||
    user ||
    process.env.RESEND_FROM_EMAIL?.trim() ||
    null;
  const secure = parseBoolean(process.env.SMTP_SECURE, port === 465);

  return {
    host,
    port,
    user,
    pass,
    from,
    secure,
    enabled: Boolean(host && port && user && pass && from),
  };
};

const sendWithSmtp = async (email: OutboundEmail): Promise<EmailSendResult> => {
  const config = getMailerConfig(email.identity ?? "repairs");
  if (!config.enabled || !config.host || !config.user || !config.pass || !config.from) {
    return { success: false, error: "SMTP is not configured" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
      requireTLS: !config.secure,
      tls: {
        servername: config.host,
      },
    });

    await transporter.sendMail({
      from: config.from,
      to: email.to,
      replyTo: email.replyTo,
      subject: email.subject,
      text: email.text,
      html: email.html,
      attachments: email.attachments,
    });

    return { success: true };
  } catch (error) {
    console.error("[Email] SMTP send failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
};

const sendWithResend = async (email: OutboundEmail): Promise<EmailSendResult> => {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    return {
      success: false,
      error: "Resend is not configured",
    };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: Array.isArray(email.to) ? email.to : [email.to],
        reply_to: email.replyTo,
        subject: email.subject,
        text: email.text,
        html: email.html,
        attachments: email.attachments?.map((attachment) => ({
          filename: attachment.filename,
          content: attachment.content.toString("base64"),
          content_type: attachment.contentType,
        })),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: errorText || "Failed to send email",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("[Email] Resend send failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
};

const sendTransactionalEmail = async (email: OutboundEmail): Promise<EmailSendResult> => {
  const smtpResult = await sendWithSmtp(email);
  if (smtpResult.success) {
    return smtpResult;
  }

  if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
    return sendWithResend(email);
  }

  return smtpResult;
};

export const sendOfferSubscriptionConfirmationEmail = async (data: {
  email: string;
  locale: "de" | "en";
  token: string;
}): Promise<EmailSendResult> => {
  const confirmationUrl = `${siteInfo.url}/api/offer-subscribe/confirm?token=${encodeURIComponent(data.token)}`;
  const german = data.locale === "de";
  const subject = german ? "Bitte bestätige deine Apfel-Park-Anmeldung" : "Confirm your Apfel Park subscription";
  const text = german
    ? `Bitte bestätige deine Anmeldung für Angebote von Apfel Park: ${confirmationUrl}\n\nWenn du dich nicht angemeldet hast, kannst du diese E-Mail ignorieren.`
    : `Please confirm your subscription to Apfel Park offers: ${confirmationUrl}\n\nIf you did not request this, you can ignore this email.`;
  const html = german
    ? `<p>Bitte bestätige deine Anmeldung für Angebote von Apfel Park.</p><p><a href="${confirmationUrl}">Anmeldung bestätigen</a></p><p>Wenn du dich nicht angemeldet hast, kannst du diese E-Mail ignorieren.</p>`
    : `<p>Please confirm your subscription to Apfel Park offers.</p><p><a href="${confirmationUrl}">Confirm subscription</a></p><p>If you did not request this, you can ignore this email.</p>`;

  return sendTransactionalEmail({
    to: data.email,
    subject,
    text,
    html,
    identity: "sales",
  });
};

const getContactRecipient = async (): Promise<string | null> => {
  const admin = createAdminDbClient();
  const { data } = await admin
    .from("store_settings")
    .select("value")
    .eq("key", "general")
    .maybeSingle();

  const settingsValue = data?.value as { email?: string } | null | undefined;
  const settingsEmail = typeof settingsValue?.email === "string" ? settingsValue.email.trim() : undefined;
  if (settingsEmail) {
    return settingsEmail;
  }

  return process.env.CONTACT_NOTIFICATION_EMAIL || null;
};

const getRepairsRecipient = (): string | null =>
  process.env.REPAIRS_NOTIFICATION_EMAIL?.trim() ||
  process.env.SMTP_USER?.trim() ||
  process.env.CONTACT_NOTIFICATION_EMAIL?.trim() ||
  null;

export type PaidOrderAdminEmailData = {
  id: string;
  orderNumber: number | null;
  paidAt: string | null;
  provider: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  shippingMethod: string | null;
  customerAddress: {
    line1?: string | null;
    line2?: string | null;
    postalCode?: string | null;
    city?: string | null;
    country?: string | null;
  } | null;
  items: unknown;
  subtotalAmount: number | string | null;
  shippingAmount: number | string | null;
  couponCode?: string | null;
  discountAmount?: number | string | null;
  totalAmount: number | string;
  currency: string | null;
  adminUrl?: string;
};

type PaidOrderEmailItem = {
  title: string;
  sku: string | null;
  quantity: number;
  lineAmount: number | null;
};

const toFiniteNumber = (value: unknown): number | null => {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
};

const normalizePaidOrderEmailItems = (items: unknown): PaidOrderEmailItem[] => {
  if (!Array.isArray(items)) return [];

  return items.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const value = item as Record<string, unknown>;
    const title = typeof value.title === "string" && value.title.trim() ? value.title.trim() : "Artikel";
    const sku = typeof value.sku === "string" && value.sku.trim() ? value.sku.trim() : null;
    const quantity = Math.max(1, Math.floor(toFiniteNumber(value.quantity) ?? 1));
    const explicitLineAmount = toFiniteNumber(value.lineAmount);
    const unitAmount = toFiniteNumber(value.unitAmount);

    return [{
      title,
      sku,
      quantity,
      lineAmount: explicitLineAmount ?? (unitAmount === null ? null : unitAmount * quantity),
    }];
  });
};

export const buildPaidOrderAdminEmail = (data: PaidOrderAdminEmailData) => {
  const orderLabel = data.orderNumber ? `#A-${data.orderNumber}` : `#${data.id.slice(0, 8)}`;
  const currency = data.currency?.trim().toUpperCase() || "EUR";
  const money = new Intl.NumberFormat("de-DE", { style: "currency", currency });
  const formatMoney = (value: number | string | null) => {
    const number = toFiniteNumber(value);
    return number === null ? "-" : money.format(number);
  };
  const paidAt = data.paidAt
    ? new Intl.DateTimeFormat("de-DE", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Europe/Berlin",
      }).format(new Date(data.paidAt))
    : "-";
  const address = data.customerAddress;
  const addressLines = data.shippingMethod === "germany" && address
    ? [
        address.line1,
        address.line2,
        [address.postalCode, address.city].filter(Boolean).join(" "),
        address.country === "DE" ? "Deutschland" : address.country,
      ].filter((value): value is string => Boolean(value))
    : ["Abholung im Geschäft"];
  const items = normalizePaidOrderEmailItems(data.items);
  const adminUrl = data.adminUrl || `${(process.env.SITE_URL || "https://apfel-park.de").replace(/\/$/, "")}/admin/orders/${data.id}`;
  const subject = `Neue bezahlte Bestellung ${orderLabel}`;
  const itemLines = items.length > 0
    ? items.map((item) => {
        const sku = item.sku ? ` · SKU ${item.sku}` : "";
        const amount = item.lineAmount === null ? "" : ` · ${money.format(item.lineAmount)}`;
        return `${item.quantity} × ${item.title}${sku}${amount}`;
      })
    : ["Keine Artikeldaten verfügbar"];
  const text = [
    subject,
    `Zahlung: ${paidAt} · ${data.provider || "-"}`,
    "",
    `Kunde: ${data.customerName || "-"}`,
    `E-Mail: ${data.customerEmail || "-"}`,
    `Telefon: ${data.customerPhone || "Nicht angegeben – bei Bedarf per E-Mail anfragen"}`,
    "",
    "Lieferadresse:",
    ...addressLines,
    "",
    "Artikel:",
    ...itemLines,
    "",
    `Zwischensumme: ${formatMoney(data.subtotalAmount)}`,
    ...(toFiniteNumber(data.discountAmount) ? [`Gutschein${data.couponCode ? ` ${data.couponCode}` : ""}: -${formatMoney(data.discountAmount ?? null)}`] : []),
    `Versand: ${formatMoney(data.shippingAmount)}`,
    `Gesamt: ${formatMoney(data.totalAmount)}`,
    "",
    `Bestellung öffnen: ${adminUrl}`,
  ].join("\n");
  const itemRows = items.length > 0
    ? items.map((item) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(`${item.quantity} × ${item.title}`)}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(item.sku || "-")}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">${escapeHtml(item.lineAmount === null ? "-" : money.format(item.lineAmount))}</td>
        </tr>`).join("")
    : `<tr><td colspan="3" style="padding:8px;">Keine Artikeldaten verfügbar</td></tr>`;
  const html = `
    <div style="font-family:Arial,sans-serif;color:#202020;line-height:1.5;max-width:680px;margin:0 auto;">
      <h2 style="margin:0 0 16px;">${escapeHtml(subject)}</h2>
      <p><strong>Zahlung:</strong> ${escapeHtml(paidAt)} · ${escapeHtml(data.provider || "-")}</p>
      <h3 style="margin-top:24px;">Kunde</h3>
      <p>
        ${escapeHtml(data.customerName || "-")}<br />
        ${escapeHtml(data.customerEmail || "-")}<br />
        Telefon: ${escapeHtml(data.customerPhone || "Nicht angegeben – bei Bedarf per E-Mail anfragen")}
      </p>
      <h3 style="margin-top:24px;">Lieferadresse</h3>
      <p>${addressLines.map((line) => escapeHtml(line)).join("<br />")}</p>
      <h3 style="margin-top:24px;">Artikel</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead><tr><th style="padding:8px;text-align:left;">Artikel</th><th style="padding:8px;text-align:left;">SKU</th><th style="padding:8px;text-align:right;">Summe</th></tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
      <p style="margin-top:20px;text-align:right;">
        Zwischensumme: ${escapeHtml(formatMoney(data.subtotalAmount))}<br />
        ${toFiniteNumber(data.discountAmount) ? `Gutschein${data.couponCode ? ` ${escapeHtml(data.couponCode)}` : ""}: -${escapeHtml(formatMoney(data.discountAmount ?? null))}<br />` : ""}
        Versand: ${escapeHtml(formatMoney(data.shippingAmount))}<br />
        <strong>Gesamt: ${escapeHtml(formatMoney(data.totalAmount))}</strong>
      </p>
      <p style="margin-top:24px;"><a href="${escapeHtml(adminUrl)}" style="display:inline-block;background:#111;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;">Bestellung im Admin öffnen</a></p>
    </div>
  `;

  return { subject, text, html };
};

export const sendPaidOrderAdminEmail = async (
  data: PaidOrderAdminEmailData,
): Promise<EmailSendResult> => {
  const contactRecipient = await getContactRecipient();
  const recipients = Array.from(
    new Set([contactRecipient, "info@apfel-park.de"].filter((value): value is string => Boolean(value))),
  );
  if (recipients.length === 0) {
    return { success: false, error: "No order notification recipient configured" };
  }

  const { subject, text, html } = buildPaidOrderAdminEmail(data);
  return sendTransactionalEmail({
    to: recipients,
    replyTo: data.customerEmail || undefined,
    subject,
    text,
    html,
    identity: "sales",
  });
};

export const buildEmailContent = (data: ContactNotificationData) => {
  const subject =
    data.locale === "de"
      ? "Neue Kontaktanfrage"
      : "New contact form submission";

  const textLines = [
    `Name: ${data.name}`,
    `Email: ${data.email || "-"}`,
    `Device: ${data.device || "-"}`,
    "",
    data.message,
  ];

  const text = textLines.join("\n");
  const html = `
    <h2>${escapeHtml(subject)}</h2>
    <p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(data.email || "-")}</p>
    <p><strong>Device:</strong> ${escapeHtml(data.device || "-")}</p>
    <p><strong>Message:</strong></p>
    <p>${escapeHtml(data.message).replace(/\n/g, "<br/>")}</p>
  `;

  return { subject, text, html };
};

export const sendContactNotificationEmail = async (
  data: ContactNotificationData,
): Promise<EmailSendResult> => {
  const toEmail = await getContactRecipient();
  if (!toEmail) {
    return {
      success: false,
      error: "No contact notification recipient configured",
    };
  }

  const { subject, text, html } = buildEmailContent(data);

  return sendTransactionalEmail({
    to: toEmail,
    replyTo: data.email || undefined,
    subject,
    text,
    html,
  });
};

const buildRepairRequestConfirmation = (data: RepairRequestEmailData) => {
  const isGerman = data.locale === "de";
  const ticket = formatTicketNumber(data.ticketNumber);
  const subject = isGerman
    ? `Wir haben deine Reparaturanfrage erhalten | ${ticket}`
    : `We received your repair request | ${ticket}`;

  const text = isGerman
    ? [
        `Hallo ${data.customerName},`,
        "",
        `vielen Dank fur deine Reparaturanfrage bei Apfel Park.`,
        `Dein Vorgang wurde unter ${ticket} angelegt.`,
        "",
        `Gerat: ${data.deviceModel}`,
        `Problem: ${data.issueDescription}`,
        `Telefon: ${data.customerPhone}`,
        "",
        "Unser Team meldet sich, sobald wir den Auftrag in Bearbeitung nehmen.",
        "",
        "Apfel Park Repairs",
      ].join("\n")
    : [
        `Hello ${data.customerName},`,
        "",
        `Thank you for your repair request at Apfel Park.`,
        `Your request has been registered under ${ticket}.`,
        "",
        `Device: ${data.deviceModel}`,
        `Issue: ${data.issueDescription}`,
        `Phone: ${data.customerPhone}`,
        "",
        "Our team will contact you as soon as the repair moves into processing.",
        "",
        "Apfel Park Repairs",
      ].join("\n");

  const html = isGerman
    ? `
        <h2>${escapeHtml(subject)}</h2>
        <p>Hallo ${escapeHtml(data.customerName)},</p>
        <p>vielen Dank fur deine Reparaturanfrage bei Apfel Park. Dein Vorgang wurde unter <strong>${escapeHtml(ticket)}</strong> angelegt.</p>
        <p><strong>Gerat:</strong> ${escapeHtml(data.deviceModel)}<br/>
        <strong>Problem:</strong> ${escapeHtml(data.issueDescription)}<br/>
        <strong>Telefon:</strong> ${escapeHtml(data.customerPhone)}</p>
        <p>Unser Team meldet sich, sobald wir den Auftrag in Bearbeitung nehmen.</p>
        <p>Apfel Park Repairs</p>
      `
    : `
        <h2>${escapeHtml(subject)}</h2>
        <p>Hello ${escapeHtml(data.customerName)},</p>
        <p>Thank you for your repair request at Apfel Park. Your request has been registered under <strong>${escapeHtml(ticket)}</strong>.</p>
        <p><strong>Device:</strong> ${escapeHtml(data.deviceModel)}<br/>
        <strong>Issue:</strong> ${escapeHtml(data.issueDescription)}<br/>
        <strong>Phone:</strong> ${escapeHtml(data.customerPhone)}</p>
        <p>Our team will contact you as soon as the repair moves into processing.</p>
        <p>Apfel Park Repairs</p>
      `;

  return { subject, text, html };
};

const buildRepairAdminNotification = (data: RepairRequestEmailData) => {
  const isGerman = data.locale === "de";
  const ticket = formatTicketNumber(data.ticketNumber);
  const subject = isGerman ? `Neue Reparaturanfrage | ${ticket}` : `New repair request | ${ticket}`;
  const text = isGerman
    ? [
        `Ticket: ${ticket}`,
        `Name: ${data.customerName}`,
        `E-Mail: ${data.customerEmail}`,
        `Telefon: ${data.customerPhone}`,
        `Gerat: ${data.deviceModel}`,
        "",
        "Problem:",
        data.issueDescription,
      ].join("\n")
    : [
        `Ticket: ${ticket}`,
        `Name: ${data.customerName}`,
        `Email: ${data.customerEmail}`,
        `Phone: ${data.customerPhone}`,
        `Device: ${data.deviceModel}`,
        "",
        "Issue:",
        data.issueDescription,
      ].join("\n");

  const html = isGerman
    ? `
        <h2>${escapeHtml(subject)}</h2>
        <p><strong>Ticket:</strong> ${escapeHtml(ticket)}</p>
        <p><strong>Name:</strong> ${escapeHtml(data.customerName)}</p>
        <p><strong>E-Mail:</strong> ${escapeHtml(data.customerEmail)}</p>
        <p><strong>Telefon:</strong> ${escapeHtml(data.customerPhone)}</p>
        <p><strong>Gerat:</strong> ${escapeHtml(data.deviceModel)}</p>
        <p><strong>Problem:</strong><br/>${escapeHtml(data.issueDescription).replace(/\n/g, "<br/>")}</p>
      `
    : `
        <h2>${escapeHtml(subject)}</h2>
        <p><strong>Ticket:</strong> ${escapeHtml(ticket)}</p>
        <p><strong>Name:</strong> ${escapeHtml(data.customerName)}</p>
        <p><strong>Email:</strong> ${escapeHtml(data.customerEmail)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(data.customerPhone)}</p>
        <p><strong>Device:</strong> ${escapeHtml(data.deviceModel)}</p>
        <p><strong>Issue:</strong><br/>${escapeHtml(data.issueDescription).replace(/\n/g, "<br/>")}</p>
      `;

  return { subject, text, html };
};

const getStatusCopy = (status: string, locale: string) => {
  const normalized = status.trim().toLowerCase();
  const isGerman = locale === "de";

  switch (normalized) {
    case "in_progress":
      return {
        subject: isGerman ? "Deine Reparatur ist in Bearbeitung" : "Your repair is now in progress",
        intro: isGerman
          ? "Unser Technik-Team arbeitet jetzt an deinem Gerat."
          : "Our technicians are now working on your device.",
      };
    case "waiting_for_parts":
      return {
        subject: isGerman ? "Deine Reparatur wartet auf Teile" : "Your repair is waiting for parts",
        intro: isGerman
          ? "Wir haben den Auftrag gepruft und warten aktuell auf Ersatzteile."
          : "We reviewed your repair and are currently waiting for replacement parts.",
      };
    case "ready":
      return {
        subject: isGerman ? "Deine Reparatur ist abholbereit" : "Your repair is ready for pickup",
        intro: isGerman
          ? "Dein Gerat ist fertig und kann abgeholt werden."
          : "Your device is finished and ready for pickup.",
      };
    case "completed":
      return {
        subject: isGerman ? "Deine Reparatur ist abgeschlossen" : "Your repair is completed",
        intro: isGerman
          ? "Deine Reparatur wurde erfolgreich abgeschlossen."
          : "Your repair has been completed successfully.",
      };
    case "cancelled":
      return {
        subject: isGerman ? "Deine Reparatur wurde storniert" : "Your repair was cancelled",
        intro: isGerman
          ? "Dein Reparaturvorgang wurde storniert. Melde dich gerne bei Fragen."
          : "Your repair request was cancelled. Please contact us if you have questions.",
      };
    default:
      return {
        subject: isGerman ? "Update zu deiner Reparatur" : "Update on your repair",
        intro: isGerman
          ? "Es gibt ein neues Update zu deinem Reparaturauftrag."
          : "There is a new update for your repair request.",
      };
  }
};

const buildRepairStatusUpdate = (data: RepairStatusEmailData) => {
  const ticket = formatTicketNumber(data.ticketNumber);
  const isGerman = data.locale === "de";
  const copy = getStatusCopy(data.status, data.locale);
  const estimatedCost = formatCurrency(data.estimatedCost, data.locale);
  const finalCost = formatCurrency(data.finalCost, data.locale);
  const summaryLabel = isGerman ? "Durchgefuhrte Arbeiten" : "Repair summary";
  const estimateLabel = isGerman ? "Geschaftzte Kosten" : "Estimated cost";
  const finalCostLabel = isGerman ? "Endpreis" : "Final cost";

  const lines = [
    isGerman ? `Hallo ${data.customerName},` : `Hello ${data.customerName},`,
    "",
    copy.intro,
    "",
    `${isGerman ? "Ticket" : "Ticket"}: ${ticket}`,
    `${isGerman ? "Gerat" : "Device"}: ${data.deviceModel}`,
  ];

  if (estimatedCost) {
    lines.push(`${estimateLabel}: ${estimatedCost}`);
  }

  if (finalCost) {
    lines.push(`${finalCostLabel}: ${finalCost}`);
  }

  if (data.repairSummary) {
    lines.push("", `${summaryLabel}:`, data.repairSummary);
  }

  lines.push("", "Apfel Park Repairs");

  const htmlSections = [
    `<h2>${escapeHtml(copy.subject)} | ${escapeHtml(ticket)}</h2>`,
    `<p>${isGerman ? `Hallo ${escapeHtml(data.customerName)},` : `Hello ${escapeHtml(data.customerName)},`}</p>`,
    `<p>${escapeHtml(copy.intro)}</p>`,
    `<p><strong>${isGerman ? "Ticket" : "Ticket"}:</strong> ${escapeHtml(ticket)}<br/>`,
    `<strong>${isGerman ? "Gerat" : "Device"}:</strong> ${escapeHtml(data.deviceModel)}</p>`,
  ];

  if (estimatedCost) {
    htmlSections.push(`<p><strong>${escapeHtml(estimateLabel)}:</strong> ${escapeHtml(estimatedCost)}</p>`);
  }

  if (finalCost) {
    htmlSections.push(`<p><strong>${escapeHtml(finalCostLabel)}:</strong> ${escapeHtml(finalCost)}</p>`);
  }

  if (data.repairSummary) {
    htmlSections.push(
      `<p><strong>${escapeHtml(summaryLabel)}:</strong><br/>${escapeHtml(data.repairSummary).replace(/\n/g, "<br/>")}</p>`,
    );
  }

  htmlSections.push("<p>Apfel Park Repairs</p>");

  return {
    subject: `${copy.subject} | ${ticket}`,
    text: lines.join("\n"),
    html: htmlSections.join(""),
  };
};

export const sendRepairRequestCustomerEmail = async (
  data: RepairRequestEmailData,
): Promise<EmailSendResult> => {
  const { subject, text, html } = buildRepairRequestConfirmation(data);
  return sendTransactionalEmail({
    to: data.customerEmail,
    subject,
    text,
    html,
  });
};

export const sendRepairRequestAdminEmail = async (
  data: RepairRequestEmailData,
): Promise<EmailSendResult> => {
  const recipient = getRepairsRecipient();
  if (!recipient) {
    return { success: false, error: "No repair notification recipient configured" };
  }

  const { subject, text, html } = buildRepairAdminNotification(data);
  return sendTransactionalEmail({
    to: recipient,
    replyTo: data.customerEmail,
    subject,
    text,
    html,
  });
};

export const sendRepairStatusEmail = async (
  data: RepairStatusEmailData,
): Promise<EmailSendResult> => {
  const { subject, text, html } = buildRepairStatusUpdate(data);
  return sendTransactionalEmail({
    to: data.customerEmail,
    subject,
    text,
    html,
  });
};

const buildChatSummaryEmail = (data: ChatSummaryEmailData) => {
  const isGerman = data.locale === "de";
  const subject = isGerman
    ? `Zusammenfassung deines Chats | #${data.conversationId.slice(0, 8)}`
    : `Summary of your chat | #${data.conversationId.slice(0, 8)}`;
  const closedLabel = isGerman ? "Geschlossen am" : "Closed at";
  const sourceLabel = isGerman ? "Seite" : "Page";
  const chatLabel = isGerman ? "Chat-Verlauf" : "Chat transcript";

  const lines = [
    isGerman ? `Hallo ${data.customerName},` : `Hello ${data.customerName},`,
    "",
    isGerman
      ? "dein Chat mit Apfel Park wurde abgeschlossen. Hier ist die Zusammenfassung."
      : "your chat with Apfel Park has been closed. Here is the summary.",
    "",
    `${closedLabel}: ${data.closedAt ?? new Date().toISOString()}`,
  ];

  if (data.sourcePage) {
    lines.push(`${sourceLabel}: ${data.sourcePage}`);
  }

  lines.push("", `${chatLabel}:`, "");

  for (const entry of data.messages) {
    const roleLabel =
      entry.senderRole === "admin"
        ? isGerman
          ? "Apfel Park"
          : "Apfel Park"
        : entry.senderRole === "system"
          ? isGerman
            ? "System"
            : "System"
          : data.customerName;
    lines.push(`[${entry.createdAt}] ${roleLabel}: ${entry.message}`);
  }

  lines.push("", "Apfel Park");

  const messageItems = data.messages
    .map((entry) => {
      const roleLabel =
        entry.senderRole === "admin"
          ? "Apfel Park"
          : entry.senderRole === "system"
            ? isGerman
              ? "System"
              : "System"
            : escapeHtml(data.customerName);
      return `
        <div style="margin:0 0 12px;padding:12px;border:1px solid #e5e7eb;border-radius:12px;background:#ffffff;">
          <p style="margin:0 0 6px;font-size:12px;color:#6b7280;">
            <strong>${roleLabel}</strong> · ${escapeHtml(entry.createdAt)}
          </p>
          <p style="margin:0;font-size:14px;line-height:1.6;color:#111827;">${escapeHtml(entry.message).replace(/\n/g, "<br/>")}</p>
        </div>
      `;
    })
    .join("");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;padding:24px;background:#f8fafc;color:#111827;">
      <h2 style="margin:0 0 12px;">${escapeHtml(subject)}</h2>
      <p>${isGerman ? `Hallo ${escapeHtml(data.customerName)},` : `Hello ${escapeHtml(data.customerName)},`}</p>
      <p>${isGerman ? "dein Chat mit Apfel Park wurde abgeschlossen. Hier ist die Zusammenfassung." : "your chat with Apfel Park has been closed. Here is the summary."}</p>
      <p><strong>${escapeHtml(closedLabel)}:</strong> ${escapeHtml(data.closedAt ?? new Date().toISOString())}</p>
      ${
        data.sourcePage
          ? `<p><strong>${escapeHtml(sourceLabel)}:</strong> ${escapeHtml(data.sourcePage)}</p>`
          : ""
      }
      <h3 style="margin:24px 0 12px;">${escapeHtml(chatLabel)}</h3>
      ${messageItems}
      <p style="margin-top:20px;">Apfel Park</p>
    </div>
  `;

  return {
    subject,
    text: lines.join("\n"),
    html,
  };
};

export const sendChatSummaryEmail = async (
  data: ChatSummaryEmailData,
): Promise<EmailSendResult> => {
  const { subject, text, html } = buildChatSummaryEmail(data);
  return sendTransactionalEmail({
    to: data.customerEmail,
    subject,
    text,
    html,
  });
};

export type WithdrawalEmailData = {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  receivedDate?: string | null;
  reason?: string | null;
  locale: "de" | "en";
  confirmedAt: string;
};

const buildWithdrawalCustomerEmail = (data: WithdrawalEmailData) => {
  const isGerman = data.locale === "de";
  const subject = isGerman
    ? `Eingangsbestätigung: Ihr Widerruf (Bestellung ${data.orderNumber})`
    : `Receipt confirmation: your withdrawal (order ${data.orderNumber})`;
  const timestamp = new Date(data.confirmedAt).toLocaleString(isGerman ? "de-DE" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  });

  const lines = isGerman
    ? [
        `Hallo ${data.customerName},`,
        "",
        `hiermit bestätigen wir den Eingang Ihres Widerrufs am ${timestamp} (Bestellung ${data.orderNumber}).`,
        "",
        "Bitte senden Sie die Ware innerhalb von 14 Tagen an:",
        "Apfel Park, Wilhelm-Strauß-Weg 2b, 21109 Hamburg",
        "",
        "Wichtig vor der Rücksendung eines Telefons: Daten sichern, iPhone: Apple-ID abmelden und 'Wo ist?' deaktivieren (Einstellungen → Name → Abmelden, dann 'Alle Inhalte & Einstellungen löschen'); Android: Google-Konto entfernen.",
        "",
        "Die Erstattung erfolgt spätestens 14 Tage nach Eingang Ihres Widerrufs über dasselbe Zahlungsmittel; wir dürfen sie zurückhalten, bis die Ware bei uns eingegangen ist oder Sie den Versand nachgewiesen haben.",
        "",
        "Apfel Park",
      ]
    : [
        `Hello ${data.customerName},`,
        "",
        `we hereby confirm receipt of your withdrawal on ${timestamp} (order ${data.orderNumber}).`,
        "",
        "Please return the goods within 14 days to:",
        "Apfel Park, Wilhelm-Strauß-Weg 2b, 21109 Hamburg, Germany",
        "",
        "Important before returning a phone: back up your data; iPhone: sign out of your Apple ID and disable Find My (Settings → your name → Sign Out, then 'Erase All Content and Settings'); Android: remove your Google account.",
        "",
        "The refund is made within 14 days of receiving your withdrawal using the same payment method; we may withhold it until we receive the goods or you provide proof of shipment.",
        "",
        "Apfel Park",
      ];

  const html = lines
    .map((line) => (line ? `<p>${escapeHtml(line)}</p>` : ""))
    .join("");

  return { subject, text: lines.join("\n"), html };
};

export const sendWithdrawalCustomerEmail = async (data: WithdrawalEmailData): Promise<EmailSendResult> => {
  const { subject, text, html } = buildWithdrawalCustomerEmail(data);
  return sendTransactionalEmail({ to: data.customerEmail, subject, text, html, identity: "sales" });
};

export const sendWithdrawalAdminEmail = async (
  data: WithdrawalEmailData & { orderMatched: boolean },
): Promise<EmailSendResult> => {
  const contactRecipient = await getContactRecipient();
  // Withdrawals concern both the shop inbox and sales.
  const recipient = Array.from(
    new Set(
      [contactRecipient, "info@apfel-park.de", "sales@apfel-park.de"].filter(
        (value): value is string => Boolean(value),
      ),
    ),
  );
  if (recipient.length === 0) {
    return { success: false, error: "No contact notification recipient configured" };
  }

  const subject = `⚠️ Widerruf eingegangen: Bestellung ${data.orderNumber}${data.orderMatched ? "" : " (keine Bestellung gefunden!)"}`;
  const lines = [
    `Widerruf eingegangen am ${new Date(data.confirmedAt).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Berlin" })}`,
    `Name: ${data.customerName}`,
    `E-Mail: ${data.customerEmail}`,
    `Bestellnummer: ${data.orderNumber}`,
    `Erhalten am: ${data.receivedDate || "-"}`,
    `Grund (freiwillig): ${data.reason || "-"}`,
    `Bestellung im System gefunden: ${data.orderMatched ? "ja" : "NEIN — bitte manuell prüfen"}`,
    "",
    "Frist: Erstattung spätestens 14 Tage nach Eingang (Zurückbehaltung bis Wareneingang/Versandnachweis zulässig).",
  ];
  const html = lines.map((line) => (line ? `<p>${escapeHtml(line)}</p>` : "")).join("");

  return sendTransactionalEmail({ to: recipient, replyTo: data.customerEmail, subject, text: lines.join("\n"), html, identity: "sales" });
};

export const sendRepairEstimateEmail = async (data: {
  recipients: string[];
  estimateNumber: string;
  deviceLabel: string;
  language: "de" | "en";
  attachment: EmailAttachment;
  message?: string;
}): Promise<EmailSendResult> => {
  const isGerman = data.language === "de";
  const subject = isGerman
    ? `Kostenvoranschlag ${data.estimateNumber} | Apfel Park`
    : `Repair cost estimate ${data.estimateNumber} | Apfel Park`;
  const intro = isGerman
    ? `Anbei erhalten Sie den Kostenvoranschlag ${data.estimateNumber} für ${data.deviceLabel}.`
    : `Please find attached repair cost estimate ${data.estimateNumber} for ${data.deviceLabel}.`;
  const closing = isGerman
    ? "Bei Rückfragen antworten Sie bitte direkt auf diese E-Mail."
    : "If you have any questions, please reply directly to this email.";
  const optionalMessage = data.message?.trim();
  const text = [intro, optionalMessage, closing, "", "Apfel Park"].filter(Boolean).join("\n\n");
  const html = `
    <div style="font-family:Arial,sans-serif;color:#202020;line-height:1.6">
      <div style="border-left:4px solid #b88721;padding-left:16px">
        <h2 style="margin:0 0 8px">${escapeHtml(subject)}</h2>
        <p>${escapeHtml(intro)}</p>
      </div>
      ${optionalMessage ? `<p>${escapeHtml(optionalMessage).replace(/\n/g, "<br/>")}</p>` : ""}
      <p>${escapeHtml(closing)}</p>
      <p><strong>Apfel Park</strong><br/>Wilhelm-Strauß-Weg 2b<br/>21109 Hamburg</p>
    </div>
  `;
  return sendTransactionalEmail({
    to: data.recipients,
    subject,
    text,
    html,
    identity: "repairs",
    attachments: [data.attachment],
  });
};

export type ReviewInviteData = {
  email: string;
  name: string;
  locale: "de" | "en";
  orderLabel: string;
  links: Array<{ title: string; url: string }>;
};

/**
 * Asks a customer to review what they bought, a week after payment.
 *
 * Each link is signed, so a review written through it is marked as a verified
 * purchase. One invitation per order -- scripts/review-invites.mjs records the
 * send on the order so nobody is asked twice.
 */
export const sendReviewInviteEmail = async (data: ReviewInviteData): Promise<EmailSendResult> => {
  const de = data.locale === "de";
  const greeting = data.name ? `${de ? "Hallo" : "Hi"} ${data.name},` : de ? "Hallo," : "Hi,";
  const subject = de
    ? `Wie zufrieden bist du mit deiner Bestellung ${data.orderLabel}?`
    : `How happy are you with your order ${data.orderLabel}?`;

  const intro = de
    ? "vielen Dank für deinen Einkauf bei Apfel Park. Wenn du kurz Zeit hast: Deine Bewertung hilft anderen bei der Entscheidung – und uns, besser zu werden."
    : "thank you for shopping at Apfel Park. If you have a moment, your review helps others decide and helps us improve.";
  const outro = de
    ? "Falls etwas nicht in Ordnung war, antworte einfach auf diese E-Mail – wir kümmern uns darum."
    : "If something was not right, just reply to this email and we will sort it out.";

  const text = [
    greeting,
    "",
    intro,
    "",
    ...data.links.map((link) => `${link.title}: ${link.url}`),
    "",
    outro,
    "",
    "Apfel Park · Hamburg-Wilhelmsburg",
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;">
      <p>${greeting}</p>
      <p>${intro}</p>
      ${data.links
        .map(
          (link) => `
        <p style="margin:18px 0;">
          <strong>${link.title}</strong><br />
          <a href="${link.url}" style="display:inline-block;margin-top:8px;background:#c8a862;color:#111;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:600;">
            ${de ? "Jetzt bewerten" : "Write a review"}
          </a>
        </p>`,
        )
        .join("")}
      <p style="color:#555;font-size:14px;">${outro}</p>
      <p style="color:#777;font-size:12px;">Apfel Park · Hamburg-Wilhelmsburg</p>
    </div>
  `;

  return sendTransactionalEmail({ to: data.email, subject, text, html, identity: "sales" });
};
