"use client";

import AdminShell from "../../../../components/admin/AdminShell";
import { useAdmin } from "@/lib/admin-context";

import ProductCreateForm from "./product-create-form";

export default function NewProductPage() {
  const { dict } = useAdmin();

  return (
    <AdminShell title={dict.newProductPage.title}>
      <div className="glass-panel rounded-2xl p-6">
        <p className="text-sm text-muted">{dict.newProductPage.description}</p>
        <div className="mt-6">
          <ProductCreateForm />
        </div>
      </div>
    </AdminShell>
  );
}
