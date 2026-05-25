import { NextRequest, NextResponse } from "next/server";

import {
  addCustomerMessage,
  markConversationReadByCustomer,
  validateChatMessage,
} from "@/lib/chat";

type MessagePayload = {
  token?: string;
  message?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as MessagePayload;
    const token = typeof body.token === "string" ? body.token.trim() : "";
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

    return NextResponse.json({ success: true, ...conversation });
  } catch (error) {
    console.error("[Chat Messages API] Failed:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as { token?: string };
    const token = typeof body.token === "string" ? body.token.trim() : "";
    if (!token) {
      return NextResponse.json({ success: false, error: "Missing token" }, { status: 400 });
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
