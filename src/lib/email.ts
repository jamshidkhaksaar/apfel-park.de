import { createAdminClient } from "@/lib/supabase/admin";

type ContactNotificationData = {
  name: string;
  email: string;
  device?: string;
  message: string;
  locale?: string;
};

type EmailSendResult = {
  success: boolean;
  error?: string;
};

const getContactRecipient = async (): Promise<string | null> => {
  const admin = createAdminClient();
  const { data } = await admin
    .from("store_settings")
    .select("value")
    .eq("key", "general")
    .single();

  const settingsEmail = data?.value?.email?.trim();
  if (settingsEmail) {
    return settingsEmail;
  }

  return process.env.CONTACT_NOTIFICATION_EMAIL || null;
};

const buildEmailContent = (data: ContactNotificationData) => {
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

  const text = textLines.join("
");
  const html = `
    <h2>${subject}</h2>
    <p><strong>Name:</strong> ${data.name}</p>
    <p><strong>Email:</strong> ${data.email}</p>
    <p><strong>Device:</strong> ${data.device || "-"}</p>
    <p><strong>Message:</strong></p>
    <p>${data.message.replace(/
/g, "<br/>")}</p>
  `;

  return { subject, text, html };
};

export const sendContactNotificationEmail = async (
  data: ContactNotificationData,
): Promise<EmailSendResult> => {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    return {
      success: false,
      error: "Resend is not configured",
    };
  }

  const toEmail = await getContactRecipient();
  if (!toEmail) {
    return {
      success: false,
      error: "No contact notification recipient configured",
    };
  }

  const { subject, text, html } = buildEmailContent(data);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject,
        text,
        html,
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
    console.error("[Email] Error sending contact notification:", error);
    return { success: false, error: "Failed to send email" };
  }
};
