import { randomBytes } from "node:crypto";

import { query } from "@/lib/db";
import { isValidEmail, isValidInputLength, sanitizeInput } from "@/lib/security";

export type ChatLocale = "de" | "en";
export type ChatStatus = "open" | "waiting" | "resolved";
export type ChatSenderRole = "customer" | "admin" | "system";

export type ChatConversationSummary = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: ChatStatus;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  customerLocale: ChatLocale;
  sourcePage: string | null;
  lastMessagePreview: string | null;
  lastMessageAt: string;
  adminUnreadCount: number;
  customerUnreadCount: number;
  customerTyping: boolean;
  adminTyping: boolean;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  createdAt: string;
  senderRole: ChatSenderRole;
  message: string;
};

export type PublicChatConversation = {
  conversation: ChatConversationSummary;
  messages: ChatMessage[];
};

const MAX_MESSAGE_LENGTH = 2000;
const MAX_NAME_LENGTH = 120;
const MAX_PHONE_LENGTH = 60;
const MAX_SOURCE_LENGTH = 255;
let typingColumnsReady: Promise<void> | null = null;

const ensureTypingColumns = () => {
  if (!typingColumnsReady) {
    typingColumnsReady = query(
      `ALTER TABLE chat_conversations
       ADD COLUMN IF NOT EXISTS customer_typing_until TIMESTAMPTZ,
       ADD COLUMN IF NOT EXISTS admin_typing_until TIMESTAMPTZ`,
    ).then(() => undefined).catch((error) => {
      typingColumnsReady = null;
      throw error;
    });
  }
  return typingColumnsReady;
};

const isTypingUntil = (value: unknown) => {
  if (!value) return false;
  const timestamp = new Date(String(value)).getTime();
  return Number.isFinite(timestamp) && timestamp > Date.now();
};

const toStatus = (value: string | null | undefined): ChatStatus => {
  if (value === "waiting" || value === "resolved") return value;
  return "open";
};

const mapConversation = (row: Record<string, unknown>): ChatConversationSummary => ({
  id: String(row.id),
  createdAt: String(row.created_at),
  updatedAt: String(row.updated_at),
  status: toStatus(typeof row.status === "string" ? row.status : null),
  customerName: String(row.customer_name ?? ""),
  customerEmail: typeof row.customer_email === "string" ? row.customer_email : null,
  customerPhone: typeof row.customer_phone === "string" ? row.customer_phone : null,
  customerLocale: row.customer_locale === "en" ? "en" : "de",
  sourcePage: typeof row.source_page === "string" ? row.source_page : null,
  lastMessagePreview: typeof row.last_message_preview === "string" ? row.last_message_preview : null,
  lastMessageAt: String(row.last_message_at ?? row.updated_at ?? row.created_at),
  adminUnreadCount: Number(row.admin_unread_count ?? 0),
  customerUnreadCount: Number(row.customer_unread_count ?? 0),
  customerTyping: isTypingUntil(row.customer_typing_until),
  adminTyping: isTypingUntil(row.admin_typing_until),
});

export const setCustomerTyping = async (publicToken: string, isTyping: boolean) => {
  await ensureTypingColumns();
  const result = await query(
    `UPDATE chat_conversations
     SET customer_typing_until = CASE WHEN $2 THEN NOW() + INTERVAL '6 seconds' ELSE NULL END
     WHERE public_token = $1
     RETURNING id`,
    [publicToken, isTyping],
  );
  return Boolean(result.rows[0]);
};

export const setAdminTyping = async (conversationId: string, isTyping: boolean) => {
  await ensureTypingColumns();
  const result = await query(
    `UPDATE chat_conversations
     SET admin_typing_until = CASE WHEN $2 THEN NOW() + INTERVAL '6 seconds' ELSE NULL END
     WHERE id = $1
     RETURNING id`,
    [conversationId, isTyping],
  );
  return Boolean(result.rows[0]);
};

const mapMessage = (row: Record<string, unknown>): ChatMessage => ({
  id: String(row.id),
  conversationId: String(row.conversation_id),
  createdAt: String(row.created_at),
  senderRole:
    row.sender_role === "admin" || row.sender_role === "system"
      ? (row.sender_role as ChatSenderRole)
      : "customer",
  message: String(row.message ?? ""),
});

const buildPreview = (message: string) => {
  const normalized = message.replace(/\s+/g, " ").trim();
  return normalized.length > 180 ? `${normalized.slice(0, 177)}...` : normalized;
};

const createPublicToken = () => randomBytes(24).toString("hex");

export const validateChatStart = (payload: {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  message?: string;
  sourcePage?: string;
}) => {
  const customerName = sanitizeInput(payload.customerName);
  const customerEmail = sanitizeInput(payload.customerEmail).toLowerCase();
  const customerPhone = sanitizeInput(payload.customerPhone);
  const message = sanitizeInput(payload.message);
  const sourcePage = sanitizeInput(payload.sourcePage);

  const errors: Record<string, string> = {};

  if (!customerName) errors.customerName = "required";
  if (customerEmail && !isValidEmail(customerEmail)) errors.customerEmail = "invalid";
  if (!message) errors.message = "required";
  if (!isValidInputLength(customerName, MAX_NAME_LENGTH)) errors.customerName = "too_long";
  if (!isValidInputLength(customerPhone, MAX_PHONE_LENGTH)) errors.customerPhone = "too_long";
  if (!isValidInputLength(message, MAX_MESSAGE_LENGTH)) errors.message = "too_long";
  if (!isValidInputLength(sourcePage, MAX_SOURCE_LENGTH)) errors.sourcePage = "too_long";

  return {
    customerName,
    customerEmail,
    customerPhone,
    message,
    sourcePage,
    errors,
  };
};

export const validateChatMessage = (message: unknown) => {
  const sanitized = sanitizeInput(message);
  if (!sanitized) return { message: "", error: "required" as const };
  if (!isValidInputLength(sanitized, MAX_MESSAGE_LENGTH)) {
    return { message: sanitized, error: "too_long" as const };
  }
  return { message: sanitized, error: null };
};

export const createConversation = async (payload: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  locale: ChatLocale;
  sourcePage: string;
  message: string;
}) => {
  const publicToken = createPublicToken();
  const preview = buildPreview(payload.message);

  const conversationResult = await query(
    `INSERT INTO chat_conversations (
      public_token,
      status,
      customer_name,
      customer_email,
      customer_phone,
      customer_locale,
      source_page,
      last_message_preview,
      last_message_at
    ) VALUES ($1, 'open', $2, $3, $4, $5, $6, $7, NOW())
    RETURNING *`,
    [
      publicToken,
      payload.customerName,
      payload.customerEmail || null,
      payload.customerPhone || null,
      payload.locale,
      payload.sourcePage || null,
      preview,
    ],
  );

  const conversationRow = conversationResult.rows[0] as Record<string, unknown> | undefined;
  if (!conversationRow) {
    throw new Error("Failed to create chat conversation");
  }

  await query(
    `INSERT INTO chat_messages (conversation_id, sender_role, message)
     VALUES ($1, 'customer', $2)`,
    [conversationRow.id, payload.message],
  );

  await query(
    `UPDATE chat_conversations
     SET admin_unread_count = 1, updated_at = NOW()
     WHERE id = $1`,
    [conversationRow.id],
  );

  return {
    publicToken,
    conversation: {
      ...mapConversation({ ...conversationRow, admin_unread_count: 1 }),
    },
  };
};

export const getConversationByToken = async (publicToken: string): Promise<PublicChatConversation | null> => {
  const conversationResult = await query(
    `SELECT * FROM chat_conversations WHERE public_token = $1 LIMIT 1`,
    [publicToken],
  );

  const conversationRow = conversationResult.rows[0] as Record<string, unknown> | undefined;
  if (!conversationRow) return null;

  const messagesResult = await query(
    `SELECT id, conversation_id, created_at, sender_role, message
     FROM chat_messages
     WHERE conversation_id = $1
     ORDER BY created_at ASC`,
    [conversationRow.id],
  );

  return {
    conversation: mapConversation(conversationRow),
    messages: messagesResult.rows.map((row) => mapMessage(row as Record<string, unknown>)),
  };
};

export const addCustomerMessage = async (payload: {
  publicToken: string;
  message: string;
}) => {
  const conversation = await getConversationByToken(payload.publicToken);
  if (!conversation) return null;

  await query(
    `INSERT INTO chat_messages (conversation_id, sender_role, message)
     VALUES ($1, 'customer', $2)`,
    [conversation.conversation.id, payload.message],
  );

  await query(
    `UPDATE chat_conversations
     SET status = 'open',
         admin_unread_count = admin_unread_count + 1,
         last_message_preview = $2,
         last_message_at = NOW(),
         updated_at = NOW()
     WHERE id = $1`,
    [conversation.conversation.id, buildPreview(payload.message)],
  );

  return getConversationByToken(payload.publicToken);
};

export const markConversationReadByCustomer = async (publicToken: string) => {
  const conversation = await getConversationByToken(publicToken);
  if (!conversation) return null;

  await query(
    `UPDATE chat_messages
     SET read_by_customer_at = NOW()
     WHERE conversation_id = $1
       AND sender_role = 'admin'
       AND read_by_customer_at IS NULL`,
    [conversation.conversation.id],
  );

  await query(
    `UPDATE chat_conversations
     SET customer_unread_count = 0,
         updated_at = NOW()
     WHERE id = $1`,
    [conversation.conversation.id],
  );

  return true;
};

export const listAdminConversations = async (): Promise<ChatConversationSummary[]> => {
  const result = await query(
    `SELECT *
     FROM chat_conversations
     ORDER BY last_message_at DESC, created_at DESC`,
  );

  return result.rows.map((row) => mapConversation(row as Record<string, unknown>));
};

export const getAdminConversation = async (id: string): Promise<PublicChatConversation | null> => {
  const conversationResult = await query(`SELECT * FROM chat_conversations WHERE id = $1 LIMIT 1`, [id]);
  const conversationRow = conversationResult.rows[0] as Record<string, unknown> | undefined;
  if (!conversationRow) return null;

  const messagesResult = await query(
    `SELECT id, conversation_id, created_at, sender_role, message
     FROM chat_messages
     WHERE conversation_id = $1
     ORDER BY created_at ASC`,
    [id],
  );

  return {
    conversation: mapConversation(conversationRow),
    messages: messagesResult.rows.map((row) => mapMessage(row as Record<string, unknown>)),
  };
};

export const addAdminMessage = async (payload: {
  conversationId: string;
  message: string;
}) => {
  await query(
    `INSERT INTO chat_messages (conversation_id, sender_role, message)
     VALUES ($1, 'admin', $2)`,
    [payload.conversationId, payload.message],
  );

  await query(
    `UPDATE chat_conversations
     SET status = 'open',
         customer_unread_count = customer_unread_count + 1,
         last_message_preview = $2,
         last_message_at = NOW(),
         updated_at = NOW()
     WHERE id = $1`,
    [payload.conversationId, buildPreview(payload.message)],
  );

  return getAdminConversation(payload.conversationId);
};

export const updateAdminConversationStatus = async (payload: {
  conversationId: string;
  status: ChatStatus;
}) => {
  await query(
    `UPDATE chat_conversations
     SET status = $2,
         updated_at = NOW()
     WHERE id = $1`,
    [payload.conversationId, payload.status],
  );

  return getAdminConversation(payload.conversationId);
};

export const markConversationReadByAdmin = async (conversationId: string) => {
  await query(
    `UPDATE chat_messages
     SET read_by_admin_at = NOW()
     WHERE conversation_id = $1
       AND sender_role = 'customer'
       AND read_by_admin_at IS NULL`,
    [conversationId],
  );

  await query(
    `UPDATE chat_conversations
     SET admin_unread_count = 0,
         updated_at = NOW()
     WHERE id = $1`,
    [conversationId],
  );
};
