import nodemailer from "nodemailer";

import { createAdminDbClient } from "@/lib/admin-db";
import { escapeHtml } from "@/lib/security";

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

type OutboundEmail = {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
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

const getMailerConfig = () => {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from = process.env.SMTP_FROM_EMAIL?.trim() || user || process.env.RESEND_FROM_EMAIL?.trim() || null;
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
  const config = getMailerConfig();
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

export const buildEmailContent = (data: ContactNotificationData) => {
  const subject =
    data.locale === "de"
      ? "Neue Kontaktanfrage"
      : "New contact form submission";

  const textLines = [
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Device: ${data.device || "-"}`,
    "",
    data.message,
  ];

  const text = textLines.join("\n");
  const html = `
    <h2>${escapeHtml(subject)}</h2>
    <p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
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
    replyTo: data.email,
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
