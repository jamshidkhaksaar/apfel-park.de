import { createHmac, timingSafeEqual } from "node:crypto";

import { query } from "@/lib/db";
import { sanitizeInput } from "@/lib/security";

/**
 * Product reviews.
 *
 * Nothing here is seeded or invented: a review exists only because a customer
 * wrote it. Reviews are held for moderation before they appear, and only
 * approved reviews feed the rating shown on the product page and the
 * aggregateRating in the Product JSON-LD -- Google requires the markup to
 * match what a visitor can actually see.
 *
 * The existing `reviews` table drives homepage testimonials and has no
 * product_id, so this is a separate table rather than an overload of it.
 */
export type ProductReviewStatus = "pending" | "approved" | "rejected";

export type ProductReview = {
  id: string;
  productId: string;
  authorName: string;
  rating: number;
  title: string | null;
  body: string;
  verified: boolean;
  locale: string;
  createdAt: string;
};

export type ProductRatingSummary = {
  average: number;
  count: number;
};

export const REVIEW_MIN_RATING = 1;
export const REVIEW_MAX_RATING = 5;

/**
 * Signs a review invitation so the link in a post-purchase email proves the
 * sender bought the product, without exposing an editable order id.
 */
// REVIEW_TOKEN_SECRET first: this signs links that go out in emails, and the
// admin session secret must not double as a public link signer -- a leak of one
// should never hand over the other. APP_SESSION_SECRET stays as a fallback so
// existing deployments keep working until the dedicated secret is set.
const reviewTokenSecret = () =>
  process.env.REVIEW_TOKEN_SECRET?.trim() || process.env.APP_SESSION_SECRET?.trim() || "";

export const buildReviewToken = (orderId: string, productId: string): string | null => {
  const secret = reviewTokenSecret();
  if (!secret) return null;
  return createHmac("sha256", secret).update(`${orderId}:${productId}`).digest("hex").slice(0, 32);
};

export const verifyReviewToken = (orderId: string, productId: string, token: string): boolean => {
  const expected = buildReviewToken(orderId, productId);
  if (!expected || !token) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
};

export const isValidRating = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= REVIEW_MIN_RATING &&
  value <= REVIEW_MAX_RATING;

export type SubmitReviewInput = {
  productId: string;
  authorName: string;
  rating: number;
  title?: string;
  body: string;
  locale: string;
  orderId?: string | null;
  token?: string | null;
};

export type SubmitReviewResult =
  | { ok: true; verified: boolean }
  | { ok: false; error: "invalid_rating" | "missing_fields" | "too_long" | "duplicate" | "failed" };

export async function submitProductReview(input: SubmitReviewInput): Promise<SubmitReviewResult> {
  if (!isValidRating(input.rating)) return { ok: false, error: "invalid_rating" };

  const authorName = sanitizeInput(input.authorName);
  const body = sanitizeInput(input.body);
  const title = input.title ? sanitizeInput(input.title) : null;
  if (!authorName || !body || !input.productId) return { ok: false, error: "missing_fields" };
  if (authorName.length > 80 || body.length > 2000 || (title && title.length > 120)) {
    return { ok: false, error: "too_long" };
  }

  // A signed token means the writer actually bought this product in that order.
  const verified = Boolean(
    input.orderId && input.token && verifyReviewToken(input.orderId, input.productId, input.token),
  );

  try {
    const result = await query(
      `INSERT INTO product_reviews (product_id, order_id, author_name, rating, title, body, verified, status, locale)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8)
       ON CONFLICT (order_id, product_id) WHERE order_id IS NOT NULL DO NOTHING
       RETURNING id`,
      [
        input.productId,
        verified ? input.orderId : null,
        authorName,
        input.rating,
        title,
        body,
        verified,
        input.locale === "en" ? "en" : "de",
      ],
    );
    if (result.rowCount === 0) return { ok: false, error: "duplicate" };
    return { ok: true, verified };
  } catch (error) {
    console.error("submitProductReview failed:", error);
    return { ok: false, error: "failed" };
  }
}

export async function getApprovedReviews(productId: string, limit = 20): Promise<ProductReview[]> {
  try {
    const result = await query(
      `SELECT id, product_id, author_name, rating, title, body, verified, locale, created_at
       FROM product_reviews
       WHERE product_id = $1 AND status = 'approved'
       ORDER BY verified DESC, created_at DESC
       LIMIT $2`,
      [productId, limit],
    );
    return (result.rows as Array<Record<string, unknown>>).map((row) => ({
      id: String(row.id),
      productId: String(row.product_id),
      authorName: String(row.author_name),
      rating: Number(row.rating),
      title: row.title ? String(row.title) : null,
      body: String(row.body),
      verified: Boolean(row.verified),
      locale: String(row.locale ?? "de"),
      createdAt: row.created_at ? String(row.created_at) : new Date().toISOString(),
    }));
  } catch (error) {
    console.error("getApprovedReviews failed:", error);
    return [];
  }
}

export async function getRatingSummary(productId: string): Promise<ProductRatingSummary | null> {
  try {
    const result = await query(
      `SELECT round(avg(rating)::numeric, 1)::float AS average, count(*)::int AS count
       FROM product_reviews
       WHERE product_id = $1 AND status = 'approved'`,
      [productId],
    );
    const row = result.rows[0] as { average?: number; count?: number } | undefined;
    if (!row?.count) return null;
    return { average: Number(row.average ?? 0), count: row.count };
  } catch (error) {
    console.error("getRatingSummary failed:", error);
    return null;
  }
}
