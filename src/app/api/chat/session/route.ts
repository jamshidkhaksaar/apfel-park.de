import { NextRequest, NextResponse } from "next/server";

import {
  createConversation,
  getConversationByToken,
  setCustomerTyping,
  type ChatLocale,
  validateChatStart,
} from "@/lib/chat";
import { verifyReCaptcha } from "@/lib/recaptcha";

type StartPayload = {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  locale?: string;
  sourcePage?: string;
  message?: string;
  recaptchaToken?: string;
};

const messages = {
  de: {
    invalid: "Bitte prüfe deine Eingaben.",
    failed: "Chat konnte gerade nicht gestartet werden.",
    captcha: "Sicherheitsprüfung fehlgeschlagen.",
  },
  en: {
    invalid: "Please review your input.",
    failed: "Chat could not be started right now.",
    captcha: "Security verification failed.",
  },
} as const;

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  if (!token) {
    return NextResponse.json({ conversation: null, messages: [] });
  }

  const conversation = await getConversationByToken(token);
  if (!conversation) {
    return NextResponse.json({ conversation: null, messages: [] });
  }

  return NextResponse.json(conversation);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as StartPayload;
    const locale: ChatLocale = body.locale === "en" ? "en" : "de";
    const dictionary = messages[locale];
    const validated = validateChatStart(body);

    if (Object.keys(validated.errors).length > 0) {
      return NextResponse.json(
        { success: false, error: dictionary.invalid, errors: validated.errors },
        { status: 400 },
      );
    }

    const captchaResult = await verifyReCaptcha(body.recaptchaToken ?? "", "chat_request");
    if (!captchaResult.success) {
      return NextResponse.json(
        { success: false, error: captchaResult.error || dictionary.captcha },
        { status: 403 },
      );
    }

    const created = await createConversation({
      customerName: validated.customerName,
      customerEmail: validated.customerEmail,
      customerPhone: validated.customerPhone,
      locale,
      sourcePage: validated.sourcePage,
      message: validated.message,
    });

    const fullConversation = await getConversationByToken(created.publicToken);

    return NextResponse.json({
      success: true,
      token: created.publicToken,
      ...(fullConversation ?? { conversation: created.conversation, messages: [] }),
    });
  } catch (error) {
    console.error("[Chat Session API] Failed:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as { token?: string; isTyping?: boolean };
    const token = typeof body.token === "string" ? body.token.trim() : "";
    if (!token) {
      return NextResponse.json({ success: false, error: "Missing token" }, { status: 400 });
    }
    const success = await setCustomerTyping(token, body.isTyping === true);
    if (!success) {
      return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Chat Session API] Typing update failed:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
