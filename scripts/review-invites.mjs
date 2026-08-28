#!/usr/bin/env node
/**
 * Sends one review invitation per paid order, a set number of days after
 * payment, and records that it was sent so nobody is asked twice.
 *
 * Reviews are the single biggest gap against competitors (Clevertronic leads
 * with 15,000 Trustpilot reviews; the local repair shops have none at all), and
 * a review only counts if a real customer writes it -- hence an invitation
 * rather than seeded content.
 *
 * The link carries a signed token, so a review arriving through it is marked
 * as a verified purchase. Run daily from cron:
 *
 *   node scripts/review-invites.mjs            dry run
 *   node scripts/review-invites.mjs --apply    sends
 *   node scripts/review-invites.mjs --days 5   change the delay (default 7)
 */
import { createHmac } from "node:crypto";
import pg from "pg";

const APPLY = process.argv.includes("--apply");
const daysArg = process.argv.indexOf("--days");
const DELAY_DAYS = daysArg !== -1 ? Number(process.argv[daysArg + 1]) || 7 : 7;

const { DATABASE_URL, APP_SESSION_SECRET, REVIEW_TOKEN_SECRET, SITE_URL } = process.env;
if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is not set");
  process.exit(1);
}
const secret = (REVIEW_TOKEN_SECRET || APP_SESSION_SECRET || "").trim();
if (!secret) {
  console.error("ERROR: APP_SESSION_SECRET (or REVIEW_TOKEN_SECRET) is required to sign review links");
  process.exit(1);
}
const siteUrl = (SITE_URL || "https://apfel-park.de").replace(/\/$/, "");

const token = (orderId, productId) =>
  createHmac("sha256", secret).update(`${orderId}:${productId}`).digest("hex").slice(0, 32);

const client = new pg.Client({ connectionString: DATABASE_URL });
await client.connect();

// Store the send marker on the order itself; no extra table for one flag.
const { rows: orders } = await client.query(
  `SELECT id, order_number, customer_email, customer_name, checkout_locale, items
   FROM orders
   WHERE payment_status = 'paid'
     -- An order can be paid and later cancelled or refunded; without this an
     -- refunded customer gets asked to review the product they returned.
     AND status <> 'cancelled'
     AND cancelled_at IS NULL
     AND paid_at IS NOT NULL
     AND paid_at < now() - ($1 || ' days')::interval
     AND coalesce(metadata->>'reviewInviteSentAt', '') = ''
     AND coalesce(customer_email, '') <> ''
   ORDER BY paid_at
   LIMIT 100`,
  [String(DELAY_DAYS)],
);

console.log(`${orders.length} paid orders older than ${DELAY_DAYS} days without an invitation`);

const buildLinks = async (order) => {
  const items = Array.isArray(order.items) ? order.items : [];
  const links = [];
  for (const item of items) {
    const productId = item?.productId;
    if (!productId) continue;
    const { rows } = await client.query(`SELECT slug, title FROM products WHERE id = $1 LIMIT 1`, [productId]);
    const product = rows[0];
    if (!product?.slug) continue;
    const locale = order.checkout_locale === "en" ? "en" : "de";
    links.push({
      title: product.title,
      url: `${siteUrl}/${locale}/store/${product.slug}?order=${order.id}&rt=${token(order.id, productId)}#reviews`,
    });
  }
  return links;
};

let sent = 0;
for (const order of orders) {
  const links = await buildLinks(order);
  if (links.length === 0) continue;
  const locale = order.checkout_locale === "en" ? "en" : "de";
  const label = `#A-${order.order_number ?? order.id.slice(0, 8)}`;

  if (!APPLY) {
    console.log(`  ${label} -> ${order.customer_email} (${links.length} product${links.length === 1 ? "" : "s"}, ${locale})`);
    console.log(`      ${links[0].url}`);
    continue;
  }

  // Mail is sent by the app, which owns the SMTP/Resend config; this script
  // only decides who gets asked and signs the links.
  const response = await fetch(`${siteUrl}/api/reviews/invite`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-review-invite-secret": secret,
    },
    body: JSON.stringify({
      orderId: order.id,
      email: order.customer_email,
      name: order.customer_name,
      locale,
      orderLabel: label,
      links,
    }),
  });

  if (!response.ok) {
    console.error(`  FAILED ${label}: HTTP ${response.status}`);
    continue;
  }

  await client.query(
    `UPDATE orders SET metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('reviewInviteSentAt', now()::text) WHERE id = $1`,
    [order.id],
  );
  sent += 1;
  console.log(`  sent ${label} -> ${order.customer_email}`);
}

if (!APPLY) console.log("\ndry run -- pass --apply to send");
else console.log(`\nsent ${sent} invitations`);
await client.end();
