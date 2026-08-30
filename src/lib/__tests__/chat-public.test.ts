import { describe, expect, it } from "vitest";

import { toPublicChatPayload } from "@/lib/chat-public";

describe("public chat serialization", () => {
  it("returns only the status needed by the widget and redacts customer PII", () => {
    const publicPayload = toPublicChatPayload({
      conversation: {
        id: "conversation-id",
        status: "open",
        customerName: "Customer",
        customerEmail: "customer@example.com",
        customerPhone: "+49123",
        sourcePage: "/private",
        adminTyping: true,
      },
      messages: [{
        id: "message-id",
        conversationId: "conversation-id",
        createdAt: "2026-08-29T00:00:00.000Z",
        senderRole: "customer",
        message: "Hello",
      }],
    });

    expect(publicPayload.conversation).toEqual({ status: "open", adminTyping: true });
    expect(publicPayload.messages[0]).toEqual({
      id: "message-id",
      createdAt: "2026-08-29T00:00:00.000Z",
      senderRole: "customer",
      message: "Hello",
    });
    expect(JSON.stringify(publicPayload)).not.toContain("customer@example.com");
    expect(JSON.stringify(publicPayload)).not.toContain("+49123");
    expect(JSON.stringify(publicPayload)).not.toContain("conversation-id");
  });
});
