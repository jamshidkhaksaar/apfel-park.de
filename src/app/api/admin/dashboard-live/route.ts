import { NextRequest, NextResponse } from "next/server";

import { query } from "@/lib/db";
import { loadDashboardStats } from "@/lib/admin-dashboard";
import { readActiveVisitors } from "@/lib/admin-live-visitors";
import { readSessionUserFromRequest } from "@/lib/session";
import { canManageOrders } from "@/lib/admin-auth";

const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function GET(request: NextRequest) {
  const user = await readSessionUserFromRequest(request);
  if (!canManageOrders(user)) return unauthorized();

  try {
    const [activeUsers, recentRepairs, recentOrders] =
      await Promise.all([
        readActiveVisitors(),
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

    const stats = await loadDashboardStats(activeUsers);

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
      stats,
      recentActivity,
    });
  } catch (error) {
    console.error("[Admin Dashboard Live API] Failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
