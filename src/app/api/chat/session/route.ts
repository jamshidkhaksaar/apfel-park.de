import { NextRequest, NextResponse } from "next/server";

import {
  createConversation,
  getConversationByToken,
  setCustomerTyping,
  type ChatLocale,
  validateChatStart,
} from "@/lib/chat";
import { toPublicChatPayload } from "@/lib/chat-public";
import { CHAT_SESSION_COOKIE, getChatSessionCookieOptions } from "@/lib/chat-session";
import { consumePublicRateLimit } from "@/lib/public-rate-limit";
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

const sessionToken = (request: NextRequest) =>
  request.cookies.get(CHAT_SESSION_COOKIE)?.value.trim() ?? "";

const limited = (retryAfter: number) =>
  NextResponse.json(
    { success: false, error: "Too many chat requests" },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );

export async function GET(request: NextRequest) {
  const token = sessionToken(request);
  if (!token) return NextResponse.json({ conversation: null, messages: [] });
  const limit = await consumePublicRateLimit(request.headers, "chat_poll", 180, 5 * 60);
  if (!limit.allowed) return limited(limit.retryAfter);

  const conversation = await getConversationByToken(token);
  if (!conversation) {
    const response = NextResponse.json({ conversation: null, messages: [] });
    response.cookies.set(CHAT_SESSION_COOKIE, "", { ...getChatSessionCookieOptions(), maxAge: 0 });
    return response;
  }
  return NextResponse.json(toPublicChatPayload(conversation));
}

export async function POST(request: NextRequest) {
  const limit = await consumePublicRateLimit(request.headers, "chat_start", 5, 15 * 60);
  if (!limit.allowed) return limited(limit.retryAfter);
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
    const response = NextResponse.json({
      success: true,
      ...toPublicChatPayload(fullConversation ?? { conversation: created.conversation, messages: [] }),
    });
    response.cookies.set(
      CHAT_SESSION_COOKIE,
      created.publicToken,
      getChatSessionCookieOptions(),
    );
    return response;
  } catch (error) {
    console.error("[Chat Session API] Failed:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const limit = await consumePublicRateLimit(request.headers, "chat_typing", 120, 5 * 60);
  if (!limit.allowed) return limited(limit.retryAfter);
  try {
    const body = (await request.json()) as { isTyping?: boolean };
    const token = sessionToken(request);
    if (!token) return NextResponse.json({ success: false, error: "Missing chat session" }, { status: 401 });
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
