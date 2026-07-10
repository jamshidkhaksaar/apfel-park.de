import { timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextRequest, NextResponse } from "next/server";

import { uploadProductImage } from "@/lib/blob";
import { query } from "@/lib/db";
import { isValidInputLength, sanitizeInput, validateImageFileExtension } from "@/lib/security";

export const runtime = "nodejs";

type Localized = { de?: string; en?: string };
type LocalizedList = { de?: string[]; en?: string[] };
type LocalizedSpec = { label?: Localized; value?: Localized };

type DraftPayload = {
  title?: Localized;
  subtitle?: Localized;
  description?: Localized;
  featureBullets?: LocalizedList;
  specs?: LocalizedSpec[];
  price?: number;
  compareAtPrice?: number | null;
  category?: string;
  brand?: string;
  model?: string;
  sku?: string;
  stock?: number;
  isActive?: boolean;
  imagePaths?: string[];
};

const PIPELINE_MEDIA_ROOT = "/srv/n8n/media";

const mimeFromExtension = (filePath: string): string | null => {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return null;
};

const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_IMAGES = 6;

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

const isAuthorized = (request: NextRequest): boolean => {
  const expected = process.env.PRODUCT_DRAFT_API_TOKEN;
  if (!expected) return false;
  const header = request.headers.get("authorization") || "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(provided);
  if (expectedBuf.length !== providedBuf.length) return false;
  return timingSafeEqual(expectedBuf, providedBuf);
};

const cleanLocalized = (value: Localized | undefined, maxLength: number): { de: string; en: string } => {
  const de = sanitizeInput(typeof value?.de === "string" ? value.de : "");
  const en = sanitizeInput(typeof value?.en === "string" ? value.en : "");
  return {
    de: isValidInputLength(de, maxLength) ? de : "",
    en: isValidInputLength(en, maxLength) ? en : "",
  };
};

const cleanLocalizedList = (value: LocalizedList | undefined, maxLength: number) => {
  const clean = (items: unknown) =>
    Array.isArray(items)
      ? items
          .map((item) => sanitizeInput(typeof item === "string" ? item : ""))
          .filter((item) => item && isValidInputLength(item, maxLength))
      : [];
  return { de: clean(value?.de), en: clean(value?.en) };
};

const cleanSpecs = (items: LocalizedSpec[] | undefined) => {
  if (!Array.isArray(items)) return [];
  return items
    .map((entry) => {
      const label = cleanLocalized(entry?.label, 100);
      const value = cleanLocalized(entry?.value, 255);
      if (!label.de && !label.en) return null;
      if (!value.de && !value.en) return null;
      return { label, value };
    })
    .filter((entry): entry is { label: { de: string; en: string }; value: { de: string; en: string } } => entry !== null);
};

const parsePrice = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
};

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    console.warn("Draft product API: rejected request with invalid token");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const rawPayload = formData.get("payload");
    if (typeof rawPayload !== "string") {
      return NextResponse.json({ error: "Missing payload field" }, { status: 400 });
    }

    let payload: DraftPayload;
    try {
      payload = JSON.parse(rawPayload) as DraftPayload;
    } catch {
      return NextResponse.json({ error: "Invalid payload JSON" }, { status: 400 });
    }

    const title = cleanLocalized(payload.title, 255);
    const subtitle = cleanLocalized(payload.subtitle, 255);
    const description = cleanLocalized(payload.description, 5000);
    const featureBullets = cleanLocalizedList(payload.featureBullets, 200);
    const specs = cleanSpecs(payload.specs);
    const brand = sanitizeInput(typeof payload.brand === "string" ? payload.brand : "");
    const model = sanitizeInput(typeof payload.model === "string" ? payload.model : "");
    const sku = sanitizeInput(typeof payload.sku === "string" ? payload.sku : "");
    const category = payload.category ? normalizeCategory(payload.category) : null;
    const price = parsePrice(payload.price);
    const compareAtPrice = parsePrice(payload.compareAtPrice);
    const stock = payload.stock === undefined ? 0 : Number(payload.stock);
    const isActive = payload.isActive === true;

    const baseTitle = title.de || title.en;
    if (!baseTitle) return NextResponse.json({ error: "Title (de or en) is required" }, { status: 400 });
    if (!category) return NextResponse.json({ error: "Valid category is required (smartphones, accessories, consoles, laptops)" }, { status: 400 });
    if (price === null || Number.isNaN(price) || price < 0) {
      return NextResponse.json({ error: "Valid price is required" }, { status: 400 });
    }
    if (Number.isNaN(stock) || stock < 0) return NextResponse.json({ error: "Valid stock is required" }, { status: 400 });
    if (compareAtPrice !== null && (Number.isNaN(compareAtPrice) || compareAtPrice <= price)) {
      return NextResponse.json({ error: "Compare-at price must be higher than the price" }, { status: 400 });
    }
    if (!isValidInputLength(brand, 100) || !isValidInputLength(model, 100) || !isValidInputLength(sku, 120)) {
      return NextResponse.json({ error: "Input too long" }, { status: 400 });
    }

    const files = formData.getAll("image").filter((entry): entry is File => entry instanceof File);
    if (files.length > MAX_IMAGES) {
      return NextResponse.json({ error: `Too many images (max ${MAX_IMAGES})` }, { status: 400 });
    }

    const images: string[] = [];
    for (const file of files) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return NextResponse.json({ error: `Unsupported image type: ${file.type}` }, { status: 400 });
      }
      if (!validateImageFileExtension(file)) {
        return NextResponse.json({ error: `Image extension does not match content type: ${file.name}` }, { status: 400 });
      }
      if (file.size > MAX_IMAGE_SIZE) {
        return NextResponse.json({ error: `Image exceeds 10MB limit: ${file.name}` }, { status: 400 });
      }
      const uploaded = await uploadProductImage(file);
      images.push(uploaded.url);
    }

    const imagePaths = Array.isArray(payload.imagePaths) ? payload.imagePaths : [];
    if (files.length + imagePaths.length > MAX_IMAGES) {
      return NextResponse.json({ error: `Too many images (max ${MAX_IMAGES})` }, { status: 400 });
    }
    for (const imagePath of imagePaths) {
      const resolved = path.resolve(String(imagePath));
      if (!resolved.startsWith(PIPELINE_MEDIA_ROOT + path.sep)) {
        return NextResponse.json({ error: `Image path outside ${PIPELINE_MEDIA_ROOT}: ${imagePath}` }, { status: 400 });
      }
      const mime = mimeFromExtension(resolved);
      if (!mime) {
        return NextResponse.json({ error: `Unsupported image extension: ${imagePath}` }, { status: 400 });
      }
      let buffer: Buffer;
      try {
        buffer = await readFile(resolved);
      } catch {
        return NextResponse.json({ error: `Image not found: ${imagePath}` }, { status: 400 });
      }
      if (buffer.length > MAX_IMAGE_SIZE) {
        return NextResponse.json({ error: `Image exceeds 10MB limit: ${imagePath}` }, { status: 400 });
      }
      const uploaded = await uploadProductImage(new File([new Uint8Array(buffer)], path.basename(resolved), { type: mime }));
      images.push(uploaded.url);
    }

    const slug = `${slugify(baseTitle)}-${Date.now()}`;
    const specsBase = specs.map((entry) => ({ label: entry.label.de || entry.label.en, value: entry.value.de || entry.value.en }));

    const insertResult = await query(
      `INSERT INTO "products" (
        "title", "subtitle", "description",
        "title_i18n", "subtitle_i18n", "description_i18n",
        "price", "compare_at_price", "category", "brand", "model", "sku", "stock", "slug",
        "images", "variants",
        "feature_bullets", "feature_bullets_i18n",
        "specs", "specs_i18n",
        "is_active"
      ) VALUES (
        $1,$2,$3,$4::jsonb,$5::jsonb,$6::jsonb,$7,$8,$9,$10,$11,$12,$13,$14,$15,'[]'::jsonb,$16,$17::jsonb,$18::jsonb,$19::jsonb,$20
      )
      RETURNING "id","slug"`,
      [
        baseTitle,
        subtitle.de || subtitle.en || null,
        description.de || description.en || null,
        JSON.stringify(title),
        JSON.stringify(subtitle),
        JSON.stringify(description),
        price,
        compareAtPrice,
        category,
        brand || null,
        model || null,
        sku || null,
        stock,
        slug,
        images,
        featureBullets.de.length ? featureBullets.de : featureBullets.en,
        JSON.stringify(featureBullets),
        JSON.stringify(specsBase),
        JSON.stringify(specs),
        isActive,
      ],
    );

    const row = insertResult.rows[0] as { id: string; slug: string } | undefined;
    if (!row?.id) {
      return NextResponse.json({ error: "Failed to save product" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      id: row.id,
      slug: row.slug,
      isActive,
      images,
      adminUrl: "/admin/products",
      productPath: `/de/store/${row.slug}`,
    });
  } catch (error) {
    console.error("Draft product API failed:", error);
    return NextResponse.json({ error: "Failed to create draft product" }, { status: 500 });
  }
}
