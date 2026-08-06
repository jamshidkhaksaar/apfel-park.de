import { beforeAll, describe, expect, it } from "vitest";

import { buildReviewToken, isValidRating, verifyReviewToken } from "../product-reviews";

const ORDER = "3f1c1c1e-0000-4000-8000-000000000001";
const PRODUCT = "3f1c1c1e-0000-4000-8000-000000000002";

describe("isValidRating", () => {
  it.each([1, 2, 3, 4, 5])("accepts %i", (value) => {
    expect(isValidRating(value)).toBe(true);
  });

  it.each([0, 6, -1, 4.5, Number.NaN, "5", null, undefined])("rejects %s", (value) => {
    expect(isValidRating(value)).toBe(false);
  });
});

describe("review invitation tokens", () => {
  beforeAll(() => {
    process.env.APP_SESSION_SECRET = "test-secret-for-review-tokens";
  });

  it("verifies a token it issued", () => {
    const token = buildReviewToken(ORDER, PRODUCT)!;
    expect(token).toHaveLength(32);
    expect(verifyReviewToken(ORDER, PRODUCT, token)).toBe(true);
  });

  it("binds the token to both the order and the product", () => {
    const token = buildReviewToken(ORDER, PRODUCT)!;
    // A token for one product must not unlock a review of another.
    expect(verifyReviewToken(ORDER, "3f1c1c1e-0000-4000-8000-000000000009", token)).toBe(false);
    expect(verifyReviewToken("3f1c1c1e-0000-4000-8000-000000000009", PRODUCT, token)).toBe(false);
  });

  it("rejects a tampered or empty token", () => {
    const token = buildReviewToken(ORDER, PRODUCT)!;
    expect(verifyReviewToken(ORDER, PRODUCT, `${token.slice(0, 31)}0`)).toBe(false);
    expect(verifyReviewToken(ORDER, PRODUCT, "")).toBe(false);
    expect(verifyReviewToken(ORDER, PRODUCT, "short")).toBe(false);
  });

  it("issues different tokens for different orders", () => {
    expect(buildReviewToken(ORDER, PRODUCT)).not.toBe(
      buildReviewToken("3f1c1c1e-0000-4000-8000-000000000003", PRODUCT),
    );
  });
});
