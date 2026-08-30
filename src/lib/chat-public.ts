type PublicChatStatus = "open" | "waiting" | "resolved";
type PublicSenderRole = "customer" | "admin" | "system";

const publicStatus = (value: unknown): PublicChatStatus =>
  value === "waiting" || value === "resolved" ? value : "open";

const publicRole = (value: unknown): PublicSenderRole =>
  value === "admin" || value === "system" ? value : "customer";

export const toPublicChatPayload = (payload: {
  conversation?: Record<string, unknown> | null;
  messages?: Array<Record<string, unknown>>;
}) => ({
  conversation: payload.conversation ? {
    status: publicStatus(payload.conversation.status),
    adminTyping: payload.conversation.adminTyping === true,
  } : null,
  messages: (payload.messages ?? []).map((message) => ({
    id: String(message.id ?? ""),
    createdAt: String(message.createdAt ?? ""),
    senderRole: publicRole(message.senderRole),
    message: String(message.message ?? ""),
  })),
});
