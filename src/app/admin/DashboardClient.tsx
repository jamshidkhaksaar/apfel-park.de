"use client";

import Link from "next/link";
import { useAdmin } from "@/lib/admin-context";
import AdminShell from "@/components/admin/AdminShell";

type DashboardStats = {
  repairs: number;
  orders: number;
  products: number;
  reviews: number;
};

export default function DashboardClient({ stats }: { stats: DashboardStats }) {
  const { dict } = useAdmin();

  const statItems = [
    { label: dict.dashboard.stats.repairs, value: stats.repairs, color: "text-blue-400" },
    { label: dict.dashboard.stats.orders, value: stats.orders, color: "text-green-400" },
    { label: dict.dashboard.stats.products, value: stats.products, color: "text-gold" },
    { label: dict.dashboard.stats.reviews, value: stats.reviews, color: "text-purple-400" },
  ];

  const quickActions = [
    { 
      title: dict.dashboard.quickActions.addProduct, 
      path: "/admin/products/new", 
      desc: dict.dashboard.quickActions.addProductDesc 
    },
    { 
      title: dict.dashboard.quickActions.addRepair, 
      path: "/admin/repairs/new", 
      desc: dict.dashboard.quickActions.addRepairDesc 
    },
    { 
      title: dict.dashboard.quickActions.checkOrders, 
      path: "/admin/orders", 
      desc: dict.dashboard.quickActions.checkOrdersDesc 
    },
  ];

  return (
    <AdminShell title={dict.dashboard.title}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statItems.map((stat) => (
          <div key={stat.label} className="glass-panel rounded-2xl p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              {stat.label}
            </p>
            <p className={`mt-4 text-3xl font-semibold ${stat.color || "text-foreground"}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>
      <div className="glass-panel rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-foreground">{dict.dashboard.quickActions.title}</h2>
        <p className="mt-3 text-sm text-muted">
          {dict.dashboard.quickActions.subtitle}
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {quickActions.map((item) => (
            <Link key={item.title} href={item.path} className="group cursor-pointer rounded-xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10">
              <p className="font-medium text-foreground group-hover:text-gold">{item.title}</p>
              <p className="mt-1 text-xs text-muted">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
