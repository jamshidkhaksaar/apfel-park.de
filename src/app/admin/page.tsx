import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();

  // Fetch stats in parallel
  const [
    { count: repairsCount },
    { count: ordersCount },
    { count: productsCount },
    { count: reviewsCount },
  ] = await Promise.all([
    supabase
      .from("repairs")
      .select("*", { count: "exact", head: true })
      .in("status", ["new", "neu", "Neu"]),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .in("status", ["pending", "ausstehend", "neu", "Ausstehend", "Neu"]),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("reviews").select("*", { count: "exact", head: true }),
  ]);

  const stats = {
    repairs: repairsCount || 0,
    orders: ordersCount || 0,
    products: productsCount || 0,
    reviews: reviewsCount || 0,
  };

  return <DashboardClient stats={stats} />;
}
