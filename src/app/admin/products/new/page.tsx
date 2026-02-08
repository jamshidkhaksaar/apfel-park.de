import AdminShell from "../../../../components/admin/AdminShell";

import ProductCreateForm from "./product-create-form";

export default function NewProductPage() {
  return (
    <AdminShell title="Neues Produkt">
      <div className="glass-panel rounded-2xl p-6">
        <p className="text-sm text-muted">Lege ein neues Produkt an und lade ein Bild in Vercel Blob hoch.</p>
        <div className="mt-6">
          <ProductCreateForm />
        </div>
      </div>
    </AdminShell>
  );
}
