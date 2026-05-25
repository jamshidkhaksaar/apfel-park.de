import { createAdminServerClient } from "@/lib/admin-auth-server";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

type DashboardActivity = {
  id: string;
  type: "repair" | "order";
  label: string;
  sub: string;
  status: string | null;
  createdAt: string;
};

const normalizeCreatedAt = (value: unknown): string => {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  if (value && typeof value === "object" && "toString" in value) {
    const asString = String(value);
    if (asString && asString !== "[object Object]") {
      return asString;
    }
  }

  return new Date(0).toISOString();
};

const toTimestamp = (value: string): number => {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export default async function AdminPage() {
  const adminClient = await createAdminServerClient();

  // Fetch stats in parallel
  const [
    { count: repairsCount },
    { count: ordersCount },
    { count: productsCount },
    { count: reviewsCount },
    { data: recentRepairs },
    { data: recentOrders },
  ] = await Promise.all([
    adminClient
      .from("repairs")
      .select("*", { count: "exact", head: true })
      .in("status", ["new", "neu", "Neu"]),
    adminClient
      .from("orders")
      .select("*", { count: "exact", head: true })
      .in("status", ["pending", "ausstehend", "neu", "Ausstehend", "Neu"]),
    adminClient.from("products").select("*", { count: "exact", head: true }).eq("is_active", true),
    adminClient.from("reviews").select("*", { count: "exact", head: true }),
    adminClient
      .from("repairs")
      .select("id,ticket_number,device_model,status,created_at")
      .order("created_at", { ascending: false })
      .limit(4),
    adminClient
      .from("orders")
      .select("id,order_number,customer_name,status,created_at")
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  const stats = {
    repairs: repairsCount || 0,
    orders: ordersCount || 0,
    products: productsCount || 0,
    reviews: reviewsCount || 0,
    liveUsers: 0,
    unreadChats: 0,
  };

  const activity: DashboardActivity[] = [
    ...((recentRepairs ?? []) as Array<{
      id: string;
      ticket_number: number | null;
      device_model: string | null;
      status: string | null;
      created_at: string | null;
    }>).map((repair) => ({
      id: repair.id,
      type: "repair" as const,
      label: repair.device_model?.trim() || "Repair",
      sub: repair.ticket_number ? `R-${repair.ticket_number}` : `R-${repair.id.slice(0, 6)}`,
      status: repair.status,
      createdAt: normalizeCreatedAt(repair.created_at),
    })),
    ...((recentOrders ?? []) as Array<{
      id: string;
      order_number: number | null;
      customer_name: string | null;
      status: string | null;
      created_at: string | null;
    }>).map((order) => ({
      id: order.id,
      type: "order" as const,
      label: order.customer_name?.trim() || "Order",
      sub: order.order_number ? `#A-${order.order_number}` : `#${order.id.slice(0, 8)}`,
      status: order.status,
      createdAt: normalizeCreatedAt(order.created_at),
    })),
  ]
    .sort((left, right) => toTimestamp(right.createdAt) - toTimestamp(left.createdAt))
    .slice(0, 6);

  return <DashboardClient stats={stats} recentActivity={activity} />;
}
