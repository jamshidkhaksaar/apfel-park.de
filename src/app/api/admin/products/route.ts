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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as CreateProductPayload;
    const title = payload.title?.trim();
    const category = payload.category ? normalizeCategory(payload.category) : null;
    const price = Number(payload.price);

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!category) {
      return NextResponse.json({ error: "Valid category is required" }, { status: 400 });
    }

    if (Number.isNaN(price) || price < 0) {
      return NextResponse.json({ error: "Valid price is required" }, { status: 400 });
    }

    const stock = payload.stock === undefined ? 0 : Number(payload.stock);
    if (Number.isNaN(stock) || stock < 0) {
      return NextResponse.json({ error: "Valid stock is required" }, { status: 400 });
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
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
