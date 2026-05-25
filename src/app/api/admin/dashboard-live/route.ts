import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { NextRequest, NextResponse } from "next/server";

import { query } from "@/lib/db";
import { readSessionUserFromRequest } from "@/lib/session";

const execFileAsync = promisify(execFile);
const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

const parseLogDate = (value: string): number | null => {
  const match = value.match(/^(\d{2})\/([A-Za-z]{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2})/);
  if (!match) return null;
  const [, day, monthName, year, hour, minute, second] = match;
  const months: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };
  const month = months[monthName];
  if (month === undefined) return null;
  return Date.UTC(Number(year), month, Number(day), Number(hour), Number(minute), Number(second));
};

const readActiveVisitors = async () => {
  try {
    const { stdout } = await execFileAsync("tail", ["-n", "8000", "/var/log/nginx/access.log"], {
      maxBuffer: 4 * 1024 * 1024,
    });
    const lines = stdout.split("\n").filter(Boolean);
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    const visitors = new Set<string>();

    for (const line of lines) {
      const match = line.match(/^(\S+) \S+ \S+ \[([^\]]+)\] "(\S+)\s([^"]*?)\sHTTP\/[^"]+"/);
      if (!match) continue;
      const [, ip, rawDate, method, rawPath] = match;
      if (method !== "GET") continue;
      if (rawPath.startsWith("/_next") || rawPath.startsWith("/api")) continue;
      const timestamp = parseLogDate(rawDate);
      if (!timestamp || timestamp < fiveMinutesAgo) continue;
      visitors.add(ip);
    }

    return visitors.size;
  } catch {
    return 0;
  }
};

export async function GET(request: NextRequest) {
  if (!readSessionUserFromRequest(request)) {
    return unauthorized();
  }

  try {
    const [activeUsers, repairsCount, ordersCount, productsCount, reviewsCount, unreadChats, recentRepairs, recentOrders] =
      await Promise.all([
        readActiveVisitors(),
        query(`SELECT COUNT(*)::int AS count FROM repairs WHERE LOWER(COALESCE(status, 'new')) IN ('new', 'neu')`),
        query(`SELECT COUNT(*)::int AS count FROM orders WHERE LOWER(COALESCE(status, 'pending')) IN ('pending', 'neu', 'ausstehend')`),
        query(`SELECT COUNT(*)::int AS count FROM products WHERE is_active = true`),
        query(`SELECT COUNT(*)::int AS count FROM reviews`),
        query(`SELECT COALESCE(SUM(admin_unread_count), 0)::int AS count FROM chat_conversations`),
        query(
          `SELECT id, ticket_number, device_model, status, created_at
           FROM repairs
           ORDER BY created_at DESC
           LIMIT 4`,
        ),
        query(
          `SELECT id, order_number, customer_name, status, created_at
           FROM orders
           ORDER BY created_at DESC
           LIMIT 4`,
        ),
      ]);

    const recentActivity = [
      ...recentRepairs.rows.map((repair) => ({
        id: String(repair.id),
        type: "repair",
        label: String(repair.device_model ?? "Repair"),
        sub: repair.ticket_number ? `R-${repair.ticket_number}` : `R-${String(repair.id).slice(0, 6)}`,
        status: typeof repair.status === "string" ? repair.status : null,
        createdAt: String(repair.created_at ?? ""),
      })),
      ...recentOrders.rows.map((order) => ({
        id: String(order.id),
        type: "order",
        label: String(order.customer_name ?? "Order"),
        sub: order.order_number ? `#A-${order.order_number}` : `#${String(order.id).slice(0, 8)}`,
        status: typeof order.status === "string" ? order.status : null,
        createdAt: String(order.created_at ?? ""),
      })),
    ]
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, 6);

    return NextResponse.json({
      stats: {
        repairs: Number(repairsCount.rows[0]?.count ?? 0),
        orders: Number(ordersCount.rows[0]?.count ?? 0),
        products: Number(productsCount.rows[0]?.count ?? 0),
        reviews: Number(reviewsCount.rows[0]?.count ?? 0),
        liveUsers: activeUsers,
        unreadChats: Number(unreadChats.rows[0]?.count ?? 0),
      },
      recentActivity,
    });
  } catch (error) {
    console.error("[Admin Dashboard Live API] Failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
