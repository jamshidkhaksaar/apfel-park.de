import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type CreateProductPayload = {
  title?: string;
  description?: string;
  price?: number;
  category?: string;
  brand?: string;
  stock?: number;
  imageUrl?: string;
  isActive?: boolean;
};

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const normalizeCategory = (category: string): string | null => {
  const value = category.toLowerCase().trim();
  if (value === "smartphone" || value === "smartphones") return "smartphones";
  if (value === "accessory" || value === "accessories") return "accessories";
  if (value === "console" || value === "consoles" || value === "gaming") return "consoles";
  if (value === "laptop" || value === "laptops") return "laptops";
  return null;
};

export async function POST(request: NextRequest) {
  const isEnglish = request.cookies.get("admin-lang")?.value === "en";
  const messages = {
    unauthorized: isEnglish ? "Unauthorized" : "Nicht autorisiert",
    titleRequired: isEnglish ? "Title is required" : "Titel ist erforderlich",
    categoryRequired: isEnglish ? "Valid category is required" : "Gultige Kategorie ist erforderlich",
    priceRequired: isEnglish ? "Valid price is required" : "Gultiger Preis ist erforderlich",
    stockRequired: isEnglish ? "Valid stock is required" : "Gultiger Lagerwert ist erforderlich",
    createFailed: isEnglish ? "Failed to create product" : "Produkt konnte nicht erstellt werden",
  };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: messages.unauthorized }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as CreateProductPayload;
    const title = payload.title?.trim();
    const category = payload.category ? normalizeCategory(payload.category) : null;
    const price = Number(payload.price);

    if (!title) {
      return NextResponse.json({ error: messages.titleRequired }, { status: 400 });
    }

    if (!category) {
      return NextResponse.json({ error: messages.categoryRequired }, { status: 400 });
    }

    if (Number.isNaN(price) || price < 0) {
      return NextResponse.json({ error: messages.priceRequired }, { status: 400 });
    }

    const stock = payload.stock === undefined ? 0 : Number(payload.stock);
    if (Number.isNaN(stock) || stock < 0) {
      return NextResponse.json({ error: messages.stockRequired }, { status: 400 });
    }

    const baseSlug = slugify(title);
    const slug = `${baseSlug}-${Date.now()}`;

    const { data, error } = await supabase
      .from("products")
      .insert({
        title,
        description: payload.description?.trim() || null,
        price,
        category,
        brand: payload.brand?.trim() || null,
        stock,
        slug,
        images: payload.imageUrl ? [payload.imageUrl] : [],
        is_active: payload.isActive ?? true,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (error) {
    console.error("Create product failed:", error);
    return NextResponse.json({ error: messages.createFailed }, { status: 500 });
  }
}
