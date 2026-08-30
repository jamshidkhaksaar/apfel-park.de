import { NextRequest, NextResponse } from "next/server";

import {
  addCustomerMessage,
  markConversationReadByCustomer,
  validateChatMessage,
} from "@/lib/chat";
import { toPublicChatPayload } from "@/lib/chat-public";
import { CHAT_SESSION_COOKIE } from "@/lib/chat-session";
import { consumePublicRateLimit } from "@/lib/public-rate-limit";

const sessionToken = (request: NextRequest) =>
  request.cookies.get(CHAT_SESSION_COOKIE)?.value.trim() ?? "";

const limited = (retryAfter: number) =>
  NextResponse.json(
    { success: false, error: "Too many chat requests" },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );

export async function POST(request: NextRequest) {
  const limit = await consumePublicRateLimit(request.headers, "chat_message", 30, 15 * 60);
  if (!limit.allowed) return limited(limit.retryAfter);
  try {
    const body = (await request.json()) as { message?: string };
    const token = sessionToken(request);
    const validated = validateChatMessage(body.message);
    if (!token || validated.error) {
      return NextResponse.json({ success: false, error: "Invalid chat message" }, { status: 400 });
    }

    const conversation = await addCustomerMessage({
      publicToken: token,
      message: validated.message,
    });
    if (!conversation) {
      return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, ...toPublicChatPayload(conversation) });
  } catch (error) {
    console.error("[Chat Messages API] Failed:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const limit = await consumePublicRateLimit(request.headers, "chat_read", 120, 5 * 60);
  if (!limit.allowed) return limited(limit.retryAfter);
  try {
    const token = sessionToken(request);
    if (!token) {
      return NextResponse.json({ success: false, error: "Missing chat session" }, { status: 401 });
    }
    const result = await markConversationReadByCustomer(token);
    if (!result) {
      return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Chat Read API] Failed:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
