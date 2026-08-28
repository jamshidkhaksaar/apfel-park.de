import { NextRequest, NextResponse } from "next/server";

import { query } from "@/lib/db";
import { readSessionUserFromRequest } from "@/lib/session";

const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function GET(request: NextRequest) {
  if (!(await readSessionUserFromRequest(request))) {
    return unauthorized();
  }

  try {
    const [chatResult, repairsResult, ordersResult] = await Promise.all([
      query(
        `SELECT COALESCE(SUM(admin_unread_count), 0)::int AS count
         FROM chat_conversations`,
      ),
      query(
        `SELECT COUNT(*)::int AS count
         FROM repairs
         WHERE LOWER(COALESCE(status, 'new')) = 'new'`,
      ),
      query(
        `SELECT COUNT(*)::int AS count
         FROM orders
         WHERE LOWER(COALESCE(status, 'pending')) IN ('pending', 'neu', 'ausstehend')`,
      ),
    ]);

    return NextResponse.json({
      chat: Number(chatResult.rows[0]?.count ?? 0),
      repairs: Number(repairsResult.rows[0]?.count ?? 0),
      orders: Number(ordersResult.rows[0]?.count ?? 0),
    });
  } catch (error) {
    console.error("[Admin Badges API] Failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
