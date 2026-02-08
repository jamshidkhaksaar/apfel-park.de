"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type FormState = {
  title: string;
  description: string;
  category: "smartphones" | "accessories" | "consoles" | "laptops";
  price: string;
  stock: string;
  brand: string;
  isActive: boolean;
};

const initialState: FormState = {
  title: "",
  description: "",
  category: "smartphones",
  price: "",
  stock: "0",
  brand: "",
  isActive: true,
};

export default function ProductCreateForm() {
  const router = useRouter();
  const [state, setState] = useState<FormState>(initialState);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      let imageUrl: string | undefined;

      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append("file", imageFile);

        const uploadResponse = await fetch("/api/admin/products/upload", {
          method: "POST",
          body: uploadData,
        });

        const uploadPayload = await uploadResponse.json();
        if (!uploadResponse.ok) {
          throw new Error(uploadPayload.error || "Image upload failed");
        }

        imageUrl = uploadPayload.url as string;
      }

      const createResponse = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: state.title,
          description: state.description,
          category: state.category,
          price: Number(state.price),
          stock: Number(state.stock),
          brand: state.brand,
          imageUrl,
          isActive: state.isActive,
        }),
      });

      const createPayload = await createResponse.json();
      if (!createResponse.ok) {
        throw new Error(createPayload.error || "Product creation failed");
      }

      router.push("/admin/products");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Titel</label>
        <input
          required
          type="text"
          value={state.title}
          onChange={(event) => setState((prev) => ({ ...prev, title: event.target.value }))}
          className="mt-2 w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground"
        />
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Beschreibung</label>
        <textarea
          rows={3}
          value={state.description}
          onChange={(event) => setState((prev) => ({ ...prev, description: event.target.value }))}
          className="mt-2 w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Kategorie</label>
          <select
            value={state.category}
            onChange={(event) =>
              setState((prev) => ({
                ...prev,
                category: event.target.value as FormState["category"],
              }))
            }
            className="mt-2 w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground"
          >
            <option value="smartphones">Smartphones</option>
            <option value="accessories">Accessories</option>
            <option value="consoles">Consoles / Gaming</option>
            <option value="laptops">Laptops</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Marke</label>
          <input
            type="text"
            value={state.brand}
            onChange={(event) => setState((prev) => ({ ...prev, brand: event.target.value }))}
            className="mt-2 w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Preis (EUR)</label>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={state.price}
            onChange={(event) => setState((prev) => ({ ...prev, price: event.target.value }))}
            className="mt-2 w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Lager</label>
          <input
            required
            type="number"
            min="0"
            step="1"
            value={state.stock}
            onChange={(event) => setState((prev) => ({ ...prev, stock: event.target.value }))}
            className="mt-2 w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Produktbild (Vercel Blob)
        </label>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
          className="mt-2 block w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={state.isActive}
          onChange={(event) => setState((prev) => ({ ...prev, isActive: event.target.checked }))}
        />
        Produkt ist aktiv
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-gold px-6 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-black hover:bg-gold-deep disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? "Speichern..." : "Produkt erstellen"}
      </button>
    </form>
  );
}
