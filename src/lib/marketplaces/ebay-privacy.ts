import { createHmac } from "node:crypto";

import { query } from "@/lib/db";

const DELETION_TOPIC = "MARKETPLACE_ACCOUNT_DELETION";
const PRIVACY_KEY_CONTEXT = "apfel-park:ebay-account-deletion:v1";

type JsonRecord = Record<string, unknown>;

export type PreparedEbayAccountDeletionRequest = {
  externalEventId: string;
  eventDate: string | null;
  publishDate: string | null;
  publishAttemptCount: number | null;
  usernameHash: string | null;
  userIdHash: string | null;
  eiasTokenHash: string | null;
};

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const requiredString = (value: unknown, field: string): string => {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Invalid eBay account deletion ${field}`);
  }
  return value.trim();
};

const optionalString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const optionalTimestamp = (value: unknown, field: string): string | null => {
  if (value === undefined || value === null || value === "") return null;
  const timestamp = requiredString(value, field);
  if (!Number.isFinite(Date.parse(timestamp))) {
    throw new Error(`Invalid eBay account deletion ${field}`);
  }
  return timestamp;
};

const getPrivacyKey = (encodedKey: string): Buffer => {
  const value = encodedKey.trim();
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value)) {
    throw new Error("MARKETPLACE_TOKEN_ENCRYPTION_KEY must be a Base64-encoded 32-byte key");
  }
  const masterKey = Buffer.from(value, "base64");
  if (masterKey.length !== 32) {
    throw new Error("MARKETPLACE_TOKEN_ENCRYPTION_KEY must decode to 32 bytes");
  }
  return createHmac("sha256", masterKey).update(PRIVACY_KEY_CONTEXT, "utf8").digest();
};

export const hashEbayAccountIdentifier = (
  identifier: string,
  encodedKey = process.env.MARKETPLACE_TOKEN_ENCRYPTION_KEY ?? "",
): string =>
  createHmac("sha256", getPrivacyKey(encodedKey))
    .update(requiredString(identifier, "identifier"), "utf8")
    .digest("hex");

export const prepareEbayAccountDeletionRequest = (
  payload: unknown,
  encodedKey = process.env.MARKETPLACE_TOKEN_ENCRYPTION_KEY ?? "",
): PreparedEbayAccountDeletionRequest => {
  if (!isRecord(payload) || !isRecord(payload.metadata) || !isRecord(payload.notification)) {
    throw new Error("Invalid eBay account deletion payload");
  }
  if (payload.metadata.topic !== DELETION_TOPIC) {
    throw new Error("Unexpected eBay account deletion topic");
  }

  const notification = payload.notification;
  if (!isRecord(notification.data)) {
    throw new Error("Invalid eBay account deletion data");
  }

  const username = optionalString(notification.data.username);
  const userId = optionalString(notification.data.userId);
  const eiasToken = optionalString(notification.data.eiasToken);
  if (!username && !userId && !eiasToken) {
    throw new Error("eBay account deletion payload has no user identifier");
  }

  const publishAttemptCount = notification.publishAttemptCount;
  if (
    publishAttemptCount !== undefined &&
    publishAttemptCount !== null &&
    (!Number.isInteger(publishAttemptCount) || Number(publishAttemptCount) < 0)
  ) {
    throw new Error("Invalid eBay account deletion publishAttemptCount");
  }

  return {
    externalEventId: requiredString(notification.notificationId, "notificationId"),
    eventDate: optionalTimestamp(notification.eventDate, "eventDate"),
    publishDate: optionalTimestamp(notification.publishDate, "publishDate"),
    publishAttemptCount:
      publishAttemptCount === undefined || publishAttemptCount === null
        ? null
        : Number(publishAttemptCount),
    usernameHash: username ? hashEbayAccountIdentifier(username, encodedKey) : null,
    userIdHash: userId ? hashEbayAccountIdentifier(userId, encodedKey) : null,
    eiasTokenHash: eiasToken ? hashEbayAccountIdentifier(eiasToken, encodedKey) : null,
  };
};

export const recordEbayAccountDeletionRequest = async (payload: unknown): Promise<boolean> => {
  const prepared = prepareEbayAccountDeletionRequest(payload);
  const result = await query(
    `WITH marketplace_state AS (
      SELECT
        EXISTS (
          SELECT 1 FROM marketplace_orders WHERE marketplace = 'ebay_de'
        ) OR EXISTS (
          SELECT 1
          FROM marketplace_event_receipts
          WHERE marketplace = 'ebay_de' AND event_type LIKE '%ORDER%'
        ) AS has_customer_data
    )
    INSERT INTO marketplace_account_deletion_requests (
      marketplace,
      external_event_id,
      event_date,
      publish_date,
      publish_attempt_count,
      username_hash,
      user_id_hash,
      eias_token_hash,
      status,
      resolved_at,
      resolution_note
    )
    SELECT
      'ebay_de',
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      $7,
      CASE WHEN has_customer_data THEN 'pending_review' ELSE 'resolved_deleted' END,
      CASE WHEN has_customer_data THEN NULL ELSE now() END,
      CASE
        WHEN has_customer_data THEN NULL
        ELSE 'No eBay order or order-event customer data was stored when this request arrived.'
      END
    FROM marketplace_state
    ON CONFLICT (marketplace, external_event_id) DO NOTHING
    RETURNING id`,
    [
      prepared.externalEventId,
      prepared.eventDate,
      prepared.publishDate,
      prepared.publishAttemptCount,
      prepared.usernameHash,
      prepared.userIdHash,
      prepared.eiasTokenHash,
    ],
  );
  return result.rowCount === 1;
};
