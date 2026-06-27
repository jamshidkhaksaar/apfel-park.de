import { NextRequest, NextResponse } from "next/server";

import { rejectCrossSiteAdminMutation } from "@/lib/admin-csrf";
import { canManageProducts } from "@/lib/admin-auth";
import { createAdminServerClient } from "@/lib/admin-auth-server";
import { createAdminDbClient } from "@/lib/admin-db";
import { query } from "@/lib/db";
import { autoPublishProductPromotion } from "@/lib/marketing";
import { isValidInputLength, sanitizeInput } from "@/lib/security";

type ProductPayload = {
  id?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  price?: number;
  compareAtPrice?: number | null;
  category?: string;
  brand?: string;
  model?: string;
  stock?: number;
  sku?: string;
  images?: string[];
  variants?: Array<{
    color?: string;
    storage?: string;
    price?: number | null;
    compareAtPrice?: number | null;
    stock?: number | null;
    sku?: string;
    imageIndex?: number | null;
    isDefault?: boolean;
  }>;
  featureBullets?: string[];
  specs?: Array<{ label: string; value: string }>;
  isActive?: boolean;
  isHomepageFeatured?: boolean;
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

const sanitizeStringArray = (items: unknown, maxLength: number) => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => sanitizeInput(typeof item === "string" ? item : ""))
    .filter((item) => item && isValidInputLength(item, maxLength));
};

const sanitizeSpecs = (items: unknown) => {
  if (!Array.isArray(items)) return [];

  return items
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const candidate = entry as { label?: unknown; value?: unknown };
      const label = sanitizeInput(typeof candidate.label === "string" ? candidate.label : "");
      const value = sanitizeInput(typeof candidate.value === "string" ? candidate.value : "");
      if (!label || !value) return null;
      if (!isValidInputLength(label, 100) || !isValidInputLength(value, 255)) return null;
      return { label, value };
    })
    .filter((entry): entry is { label: string; value: string } => entry !== null);
};

const sanitizeVariants = (items: unknown) => {
  if (!Array.isArray(items)) return [];

  return items
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const candidate = entry as {
        color?: unknown;
        storage?: unknown;
        price?: unknown;
        compareAtPrice?: unknown;
        stock?: unknown;
        sku?: unknown;
        imageIndex?: unknown;
        isDefault?: unknown;
      };

      const color = sanitizeInput(typeof candidate.color === "string" ? candidate.color : "");
      const storage = sanitizeInput(typeof candidate.storage === "string" ? candidate.storage : "");
      if (!color || !storage) return null;
      if (!isValidInputLength(color, 80) || !isValidInputLength(storage, 80)) return null;

      const price = parsePrice(candidate.price);
      const compareAtPrice = parsePrice(candidate.compareAtPrice);
      const stock = candidate.stock === null || candidate.stock === undefined || candidate.stock === "" ? undefined : Number(candidate.stock);
      const sku = sanitizeInput(typeof candidate.sku === "string" ? candidate.sku : "");
      const imageIndex =
        candidate.imageIndex === null || candidate.imageIndex === undefined || candidate.imageIndex === ""
          ? undefined
          : Number(candidate.imageIndex);

      if (price !== null && (Number.isNaN(price) || price < 0)) return null;
      if (compareAtPrice !== null && (Number.isNaN(compareAtPrice) || compareAtPrice < 0)) return null;
      if (compareAtPrice !== null && price !== null && compareAtPrice <= price) return null;
      if (stock !== undefined && (Number.isNaN(stock) || stock < 0)) return null;
      if (!isValidInputLength(sku, 120)) return null;
      if (imageIndex !== undefined && (Number.isNaN(imageIndex) || imageIndex < 0 || imageIndex > 3)) return null;

      return {
        color,
        storage,
        price: price === null ? undefined : price,
        compareAtPrice: compareAtPrice === null ? undefined : compareAtPrice,
        stock,
        sku: sku || undefined,
        imageIndex,
        isDefault: Boolean(candidate.isDefault),
      };
    })
    .filter((entry) => entry !== null)
    .map((entry, index, array) => ({
      ...entry,
      isDefault: array.some((variant) => variant.isDefault) ? entry.isDefault : index === 0,
    })) as Array<{
      color: string;
      storage: string;
      price?: number;
      compareAtPrice?: number;
      stock?: number;
      sku?: string;
      imageIndex?: number;
      isDefault?: boolean;
    }>;
};

const parsePrice = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const hasDiscountPrice = (price: number | null, compareAtPrice: number | null) =>
  typeof price === "number" &&
  typeof compareAtPrice === "number" &&
  compareAtPrice > price;

const getMessages = (isEnglish: boolean) => ({
  unauthorized: isEnglish ? "Unauthorized" : "Nicht autorisiert",
  titleRequired: isEnglish ? "Title is required" : "Titel ist erforderlich",
  categoryRequired: isEnglish ? "Valid category is required" : "Gültige Kategorie ist erforderlich",
  priceRequired: isEnglish ? "Valid price is required" : "Gültiger Preis ist erforderlich",
  stockRequired: isEnglish ? "Valid stock is required" : "Gültiger Lagerwert ist erforderlich",
  comparePriceInvalid: isEnglish ? "Compare-at price must be higher than the current price" : "Streichpreis muss höher als der aktuelle Preis sein",
  createFailed: isEnglish ? "Failed to save product" : "Produkt konnte nicht gespeichert werden",
  inputTooLong: isEnglish ? "Input too long" : "Eingabe zu lang",
  missingId: isEnglish ? "Product id is required" : "Produkt-ID ist erforderlich",
  deleteFailed: isEnglish ? "Failed to delete product" : "Produkt konnte nicht gelöscht werden",
});

const ensureAdmin = async (request: NextRequest) => {
  const isEnglish = request.cookies.get("admin-lang")?.value === "en";
  const messages = getMessages(isEnglish);
  const adminClient = await createAdminServerClient();
  const {
    data: { user },
  } = await adminClient.auth.getUser();

  if (!canManageProducts(user)) {
    return { ok: false as const, response: NextResponse.json({ error: messages.unauthorized }, { status: 401 }) };
  }
  const csrf = rejectCrossSiteAdminMutation(request, messages.unauthorized);
  if (csrf) {
    return { ok: false as const, response: csrf };
  }

  return { ok: true as const, isEnglish, messages };
};

const buildPayload = (payload: ProductPayload, slug?: string) => {
  const title = sanitizeInput(payload.title);
  const subtitle = payload.subtitle ? sanitizeInput(payload.subtitle) : null;
  const description = payload.description ? sanitizeInput(payload.description) : null;
  const brand = payload.brand ? sanitizeInput(payload.brand) : null;
  const model = payload.model ? sanitizeInput(payload.model) : null;
  const sku = payload.sku ? sanitizeInput(payload.sku) : null;
  const category = payload.category ? normalizeCategory(payload.category) : null;
  const price = parsePrice(payload.price);
  const compareAtPrice = parsePrice(payload.compareAtPrice);
  const stock = payload.stock === undefined ? 0 : Number(payload.stock);
  const images = sanitizeStringArray(payload.images, 1000);
  const variants = sanitizeVariants(payload.variants);
  const featureBullets = sanitizeStringArray(payload.featureBullets, 200);
  const specs = sanitizeSpecs(payload.specs);

  return {
    title,
    subtitle,
    description,
    brand,
    model,
    sku,
    category,
    price,
    compareAtPrice,
    stock,
    images,
    variants,
    featureBullets,
    specs,
    isActive: payload.isActive ?? true,
    isHomepageFeatured: Boolean(payload.isHomepageFeatured),
    slug,
  };
};

const syncHomepageFeatured = async (productId: string, shouldFeature: boolean) => {
  const admin = createAdminDbClient();
  const { data: row } = await admin
    .from<{ value: unknown }>("store_settings")
    .select("value")
    .eq("key", "featured_product_ids")
    .maybeSingle();

  const currentIds = Array.isArray(row?.value)
    ? row.value.filter((item): item is string => typeof item === "string")
    : [];

  const nextIds = shouldFeature
    ? Array.from(new Set([...currentIds, productId]))
    : currentIds.filter((id) => id !== productId);

  await admin.from("store_settings").upsert(
    {
      key: "featured_product_ids",
      value: nextIds,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );
};

const validatePayload = (data: ReturnType<typeof buildPayload>, messages: ReturnType<typeof getMessages>) => {
  if (!data.title) return messages.titleRequired;
  if (!data.category) return messages.categoryRequired;
  if (data.price === null || Number.isNaN(data.price) || data.price < 0) return messages.priceRequired;
  if (Number.isNaN(data.stock) || data.stock < 0) return messages.stockRequired;
  if (data.compareAtPrice !== null && (Number.isNaN(data.compareAtPrice) || data.compareAtPrice <= data.price)) {
    return messages.comparePriceInvalid;
  }

  if (
    !isValidInputLength(data.title, 255) ||
    !isValidInputLength(data.subtitle || "", 255) ||
    !isValidInputLength(data.description || "", 5000) ||
    !isValidInputLength(data.brand || "", 100) ||
    !isValidInputLength(data.model || "", 100) ||
    !isValidInputLength(data.sku || "", 120) ||
    data.images.some((item) => !isValidInputLength(item, 1000))
  ) {
    return messages.inputTooLong;
  }

  return null;
};

export async function POST(request: NextRequest) {
  const auth = await ensureAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const payload = (await request.json()) as ProductPayload;
    const title = sanitizeInput(payload.title);
    const slug = `${slugify(title)}-${Date.now()}`;
    const product = buildPayload(payload, slug);
    const validationError = validatePayload(product, auth.messages);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const insertResult = await query(
      `INSERT INTO "products" (
        "title",
        "subtitle",
        "description",
        "price",
        "compare_at_price",
        "category",
        "brand",
        "model",
        "sku",
        "stock",
        "slug",
        "images",
        "variants",
        "feature_bullets",
        "specs",
        "is_active"
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14,$15::jsonb,$16
      )
      RETURNING "id"`,
      [
        product.title,
        product.subtitle,
        product.description,
        product.price,
        product.compareAtPrice,
        product.category,
        product.brand,
        product.model,
        product.sku,
        product.stock,
        product.slug,
        product.images,
        JSON.stringify(product.variants),
        product.featureBullets,
        JSON.stringify(product.specs),
        product.isActive,
      ],
    );

    const data = insertResult.rows[0] as { id: string } | undefined;
    if (!data?.id) {
      return NextResponse.json({ error: auth.messages.createFailed }, { status: 400 });
    }

    await syncHomepageFeatured(data.id, product.isHomepageFeatured);

    const socialPublishing = await autoPublishProductPromotion(
      {
        id: data.id,
        title: product.title,
        subtitle: product.subtitle,
        description: product.description,
        slug: product.slug || slug,
        imageUrl: product.images[0] || null,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        locale: auth.isEnglish ? "en" : "de",
      },
      hasDiscountPrice(product.price, product.compareAtPrice) ? "discount" : "new",
    );

    return NextResponse.json({ success: true, id: data.id, socialPublishing });
  } catch (error) {
    console.error("Create product failed:", error);
    return NextResponse.json({ error: auth.messages.createFailed }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await ensureAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const payload = (await request.json()) as ProductPayload;
    if (!payload.id) {
      return NextResponse.json({ error: auth.messages.missingId }, { status: 400 });
    }

    const product = buildPayload(payload);
    const validationError = validatePayload(product, auth.messages);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const admin = createAdminDbClient();
    const { data: existing } = await admin
      .from<{ slug: string | null }>("products")
      .select("slug")
      .eq("id", payload.id)
      .maybeSingle();

    const nextSlug = existing?.slug || `${slugify(product.title)}-${Date.now()}`;

    await query(
      `UPDATE "products"
       SET
         "title" = $2,
         "subtitle" = $3,
         "description" = $4,
         "price" = $5,
         "compare_at_price" = $6,
         "category" = $7,
         "brand" = $8,
         "model" = $9,
         "sku" = $10,
        "stock" = $11,
        "slug" = $12,
        "images" = $13,
        "variants" = $14::jsonb,
        "feature_bullets" = $15,
        "specs" = $16::jsonb,
        "is_active" = $17
       WHERE "id" = $1`,
      [
        payload.id,
        product.title,
        product.subtitle,
        product.description,
        product.price,
        product.compareAtPrice,
        product.category,
        product.brand,
        product.model,
        product.sku,
        product.stock,
        nextSlug,
        product.images,
        JSON.stringify(product.variants),
        product.featureBullets,
        JSON.stringify(product.specs),
        product.isActive,
      ],
    );

    await syncHomepageFeatured(payload.id, product.isHomepageFeatured);

    const socialPublishing = await autoPublishProductPromotion(
      {
        id: payload.id,
        title: product.title,
        subtitle: product.subtitle,
        description: product.description,
        slug: nextSlug,
        imageUrl: product.images[0] || null,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        locale: auth.isEnglish ? "en" : "de",
      },
      hasDiscountPrice(product.price, product.compareAtPrice) ? "discount" : "new",
    );

    return NextResponse.json({ success: true, socialPublishing });
  } catch (error) {
    console.error("Update product failed:", error);
    return NextResponse.json({ error: auth.messages.createFailed }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await ensureAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: auth.messages.missingId }, { status: 400 });
    }

    await query('DELETE FROM "products" WHERE "id" = $1', [id]);
    await syncHomepageFeatured(id, false);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete product failed:", error);
    return NextResponse.json({ error: auth.messages.deleteFailed }, { status: 500 });
  }
}
