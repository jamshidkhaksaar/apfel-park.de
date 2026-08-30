import { NextResponse } from "next/server";

import { isAdminUser } from "@/lib/admin-auth";
import { query } from "@/lib/db";
import { serializeOfferSubscribersCsv, type OfferSubscriberRow } from "@/lib/offer-subscribers";
import { readSessionUser } from "@/lib/session";

export async function GET() {
  const user = await readSessionUser();
  if (!isAdminUser(user)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await query(
    `SELECT id, email, locale,
            confirmed_at::text, confirmation_sent_at::text, unsubscribed_at::text,
            created_at::text, updated_at::text
       FROM offer_subscribers
      ORDER BY created_at DESC`,
  );
  const csv = `\uFEFF${serializeOfferSubscribersCsv(result.rows as OfferSubscriberRow[])}`;
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="offer-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
