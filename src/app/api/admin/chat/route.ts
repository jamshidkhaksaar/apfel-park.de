import { NextRequest, NextResponse } from "next/server";

import { rejectCrossSiteAdminMutation } from "@/lib/admin-csrf";
import { readSessionUserFromRequest } from "@/lib/session";
import {
  addAdminMessage,
  getAdminConversation,
  listAdminConversations,
  markConversationReadByAdmin,
  setAdminTyping,
  type ChatStatus,
  updateAdminConversationStatus,
  validateChatMessage,
} from "@/lib/chat";
import { sendChatSummaryEmail } from "@/lib/email";

const allowedStatuses = new Set<ChatStatus>(["open", "waiting", "resolved"]);

const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function GET(request: NextRequest) {
  if (!readSessionUserFromRequest(request)) {
    return unauthorized();
  }

  const id = request.nextUrl.searchParams.get("id");

  if (id) {
    const conversation = await getAdminConversation(id);
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
    await markConversationReadByAdmin(id);
    const refreshed = await getAdminConversation(id);
    return NextResponse.json(refreshed);
  }

  const conversations = await listAdminConversations();
  return NextResponse.json({ conversations });
}

export async function POST(request: NextRequest) {
  if (!readSessionUserFromRequest(request)) {
    return unauthorized();
  }
  const csrf = rejectCrossSiteAdminMutation(request);
  if (csrf) return csrf;

  try {
    const body = (await request.json()) as {
      action?: string;
      conversationId?: string;
      message?: string;
      status?: string;
      isTyping?: boolean;
    };

    const conversationId = typeof body.conversationId === "string" ? body.conversationId.trim() : "";
    if (!conversationId) {
      return NextResponse.json({ error: "Conversation id is required" }, { status: 400 });
    }

    if (body.action === "reply") {
      const validated = validateChatMessage(body.message);
      if (validated.error) {
        return NextResponse.json({ error: "Message is invalid" }, { status: 400 });
      }

      const conversation = await addAdminMessage({
        conversationId,
        message: validated.message,
      });

      return NextResponse.json({ success: true, ...conversation });
    }

    if (body.action === "typing") {
      const success = await setAdminTyping(conversationId, body.isTyping === true);
      if (!success) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true });
    }

    if (body.action === "status") {
      const status = typeof body.status === "string" ? (body.status.trim() as ChatStatus) : "open";
      if (!allowedStatuses.has(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }

      const previousConversation = await getAdminConversation(conversationId);

      const conversation = await updateAdminConversationStatus({
        conversationId,
        status,
      });

      if (
        previousConversation?.conversation.status !== "resolved" &&
        conversation?.conversation.status === "resolved" &&
        conversation.conversation.customerEmail
      ) {
        const locale = conversation.conversation.customerLocale === "en" ? "en" : "de";
        sendChatSummaryEmail({
          customerName: conversation.conversation.customerName,
          customerEmail: conversation.conversation.customerEmail,
          locale,
          conversationId: conversation.conversation.id,
          sourcePage: conversation.conversation.sourcePage,
          closedAt: new Date().toISOString(),
          messages: conversation.messages.map((message) => ({
            createdAt: new Date(message.createdAt).toLocaleString(locale === "de" ? "de-DE" : "en-US"),
            senderRole: message.senderRole,
            message: message.message,
          })),
        }).catch((error) => {
          console.error("[Admin Chat API] Failed to send chat summary email:", error);
        });
      }

      return NextResponse.json({ success: true, ...conversation });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[Admin Chat API] Failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
