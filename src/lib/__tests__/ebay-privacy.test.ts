import { describe, expect, it } from "vitest";

import {
  hashEbayAccountIdentifier,
  prepareEbayAccountDeletionRequest,
} from "../marketplaces/ebay-privacy";

const encryptionKey = Buffer.alloc(32, 11).toString("base64");

const payload = {
  metadata: {
    topic: "MARKETPLACE_ACCOUNT_DELETION",
    schemaVersion: "1.0",
    deprecated: false,
  },
  notification: {
    notificationId: "test-notification-id",
    eventDate: "2026-08-11T10:00:00.000Z",
    publishDate: "2026-08-11T10:00:01.000Z",
    publishAttemptCount: 1,
    data: {
      username: "private-ebay-username",
      userId: "private-ebay-user-id",
      eiasToken: "private-eias-token",
    },
  },
};

describe("eBay marketplace account deletion privacy", () => {
  it("creates deterministic, key-separated identifier hashes", () => {
    const first = hashEbayAccountIdentifier("private-ebay-user-id", encryptionKey);
    const second = hashEbayAccountIdentifier("private-ebay-user-id", encryptionKey);
    const other = hashEbayAccountIdentifier("another-ebay-user-id", encryptionKey);

    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(first).toBe(second);
    expect(first).not.toBe(other);
    expect(first).not.toContain("private-ebay-user-id");
  });

  it("prepares only hashed identifiers for persistence", () => {
    const prepared = prepareEbayAccountDeletionRequest(payload, encryptionKey);
    const serialized = JSON.stringify(prepared);

    expect(prepared).toMatchObject({
      externalEventId: "test-notification-id",
      eventDate: "2026-08-11T10:00:00.000Z",
      publishDate: "2026-08-11T10:00:01.000Z",
      publishAttemptCount: 1,
    });
    expect(prepared.usernameHash).toMatch(/^[a-f0-9]{64}$/);
    expect(prepared.userIdHash).toMatch(/^[a-f0-9]{64}$/);
    expect(prepared.eiasTokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(serialized).not.toContain("private-ebay-username");
    expect(serialized).not.toContain("private-ebay-user-id");
    expect(serialized).not.toContain("private-eias-token");
  });

  it("rejects deletion events without an identifier", () => {
    expect(() =>
      prepareEbayAccountDeletionRequest(
        {
          ...payload,
          notification: { ...payload.notification, data: {} },
        },
        encryptionKey,
      ),
    ).toThrow("no user identifier");
  });
});
