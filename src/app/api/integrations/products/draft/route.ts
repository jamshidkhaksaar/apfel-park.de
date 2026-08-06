import { timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextRequest, NextResponse } from "next/server";

import { uploadProductImage } from "@/lib/blob";
import { query } from "@/lib/db";
import { buildBaseSlug, uniquifySlug } from "@/lib/product-slug";
import { isValidInputLength, sanitizeInput, validateImageFileExtension } from "@/lib/security";

export const runtime = "nodejs";

type Localized = { de?: string; en?: string };
type LocalizedList = { de?: string[]; en?: string[] };
type LocalizedSpec = { label?: Localized; value?: Localized };
type ResearchSource = { kind?: string; url?: string };

type DraftPayload = {
  title?: Localized;
  subtitle?: Localized;
  description?: Localized;
  featureBullets?: LocalizedList;
  specs?: LocalizedSpec[];
  price?: number;
  compareAtPrice?: number | null;
  category?: string;
  condition?: string;
  brand?: string;
  model?: string;
  sku?: string;
  stock?: number;
  isActive?: boolean;
  imagePaths?: string[];
  importKey?: string;
  sourceImageSha256?: string;
  confidence?: Record<string, number>;
  researchSources?: ResearchSource[];
  reviewReasons?: string[];
  evidence?: unknown;
  conditionNote?: string;
  conditionNoteI18n?: Localized;
  updateExisting?: boolean;
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

const normalizeCategory = (category: string): string | null => {
  const value = category.toLowerCase().trim();
  if (value === "smartphone" || value === "smartphones") return "smartphones";
  if (value === "tablet" || value === "tablets") return "tablets";
  if (value === "accessory" || value === "accessories") return "accessories";
  if (value === "console" || value === "consoles" || value === "gaming") return "consoles";
  if (value === "laptop" || value === "laptops") return "laptops";
  return null;
};

const normalizeCondition = (condition: string | undefined): "new" | "open_box" | "used" => {
  const value = (condition ?? "").toLowerCase().trim();
  if (value === "open_box" || value === "open-box" || value === "refurbished") return "open_box";
  if (value === "used") return "used";
  return "new";
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

const cleanImportMetadata = (payload: DraftPayload, conditionNoteI18n: { de: string; en: string }) => {
  const confidence = Object.fromEntries(
    Object.entries(payload.confidence ?? {})
      .filter(([key, value]) => key.length <= 40 && Number.isFinite(value) && value >= 0 && value <= 1)
      .slice(0, 24),
  );
  const researchSources = (Array.isArray(payload.researchSources) ? payload.researchSources : [])
    .map((source) => ({
      kind: sanitizeInput(typeof source?.kind === "string" ? source.kind : "").slice(0, 40),
      url: sanitizeInput(typeof source?.url === "string" ? source.url : "").slice(0, 2000),
    }))
    .filter((source) => source.kind && /^https?:\/\//i.test(source.url))
    .slice(0, 12);
  const reviewReasons = (Array.isArray(payload.reviewReasons) ? payload.reviewReasons : [])
    .map((reason) => sanitizeInput(typeof reason === "string" ? reason : "").slice(0, 200))
    .filter(Boolean)
    .slice(0, 24);
  let evidence: unknown = {};
  try {
    const serialized = JSON.stringify(payload.evidence ?? {});
    if (serialized.length <= 10000) evidence = JSON.parse(serialized) as unknown;
  } catch {
    evidence = {};
  }
  return { confidence, researchSources, reviewReasons, evidence, conditionNoteI18n };
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
    const condition = normalizeCondition(payload.condition);
    const price = parsePrice(payload.price);
    const compareAtPrice = parsePrice(payload.compareAtPrice);
    const stock = payload.stock === undefined ? 0 : Number(payload.stock);
    const isActive = payload.isActive === true;
    const importKey = sanitizeInput(typeof payload.importKey === "string" ? payload.importKey.toLowerCase() : "");
    const sourceImageSha256 = sanitizeInput(
      typeof payload.sourceImageSha256 === "string" ? payload.sourceImageSha256.toLowerCase() : "",
    );
    const conditionNote = sanitizeInput(typeof payload.conditionNote === "string" ? payload.conditionNote : "");
    const conditionNoteI18n = cleanLocalized(payload.conditionNoteI18n, 1000);
    const updateExisting = payload.updateExisting === true;
    const importMetadata = cleanImportMetadata(payload, conditionNoteI18n);

    const baseTitle = title.de || title.en;
    if (!baseTitle) return NextResponse.json({ error: "Title (de or en) is required" }, { status: 400 });
    if (!category) return NextResponse.json({ error: "Valid category is required (smartphones, tablets, accessories, consoles, laptops)" }, { status: 400 });
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
    if (importKey && !/^[a-f0-9]{64}$/.test(importKey)) {
      return NextResponse.json({ error: "importKey must be a SHA-256 hex digest" }, { status: 400 });
    }
    if (sourceImageSha256 && !/^[a-f0-9]{64}$/.test(sourceImageSha256)) {
      return NextResponse.json({ error: "sourceImageSha256 must be a SHA-256 hex digest" }, { status: 400 });
    }
    if (importKey && sourceImageSha256 && importKey !== sourceImageSha256) {
      return NextResponse.json({ error: "importKey and sourceImageSha256 must match" }, { status: 400 });
    }
    if (!isValidInputLength(conditionNote, 1000)) {
      return NextResponse.json({ error: "Condition note is too long" }, { status: 400 });
    }

    if (importKey && !updateExisting) {
      const existingResult = await query(
        `SELECT "id","slug","is_active","images" FROM "products" WHERE "import_key" = $1 LIMIT 1`,
        [importKey],
      );
      const existing = existingResult.rows[0] as
        | { id: string; slug: string; is_active: boolean; images: string[] }
        | undefined;
      if (existing?.id) {
        return NextResponse.json({
          success: true,
          duplicate: true,
          id: existing.id,
          slug: existing.slug,
          isActive: existing.is_active,
          images: existing.images ?? [],
          adminUrl: "/admin/products",
          productPath: `/de/store/${existing.slug}`,
        });
      }
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

    if (importKey && updateExisting) {
      const specsBase = specs.map((entry) => ({ label: entry.label.de || entry.label.en, value: entry.value.de || entry.value.en }));
      const updateResult = await query(
        `UPDATE "products" SET
          "title"=$1, "subtitle"=$2, "description"=$3,
          "title_i18n"=$4::jsonb, "subtitle_i18n"=$5::jsonb, "description_i18n"=$6::jsonb,
          "price"=$7, "compare_at_price"=$8, "category"=$9, "brand"=$10, "model"=$11,
          "sku"=$12, "stock"=$13,
          "images"=CASE WHEN cardinality($14::text[]) > 0 THEN $14::text[] ELSE "images" END,
          "feature_bullets"=$15, "feature_bullets_i18n"=$16::jsonb,
          "specs"=$17::jsonb, "specs_i18n"=$18::jsonb,
          "is_active"=$19, "condition"=$20, "condition_note"=$21,
          "import_metadata"=$22::jsonb
        WHERE "import_key"=$23
        RETURNING "id","slug","is_active","images"`,
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
          images,
          featureBullets.de.length ? featureBullets.de : featureBullets.en,
          JSON.stringify(featureBullets),
          JSON.stringify(specsBase),
          JSON.stringify(specs),
          isActive,
          condition,
          conditionNote || null,
          JSON.stringify({ sourceImageSha256: sourceImageSha256 || importKey, ...importMetadata }),
          importKey,
        ],
      );
      const updated = updateResult.rows[0] as
        | { id: string; slug: string; is_active: boolean; images: string[] }
        | undefined;
      if (updated?.id) {
        return NextResponse.json({
          success: true,
          duplicate: true,
          updated: true,
          id: updated.id,
          slug: updated.slug,
          isActive: Boolean(updated.is_active),
          images: updated.images ?? [],
          adminUrl: "/admin/products",
          productPath: `/de/store/${updated.slug}`,
        });
      }
    }

    // Was `slugify(title)-<Date.now()>`: imported drafts would have kept
    // minting timestamped slugs and slowly undone the URL migration.
    const { rows: slugRows } = await query(
      `SELECT slug FROM products WHERE slug LIKE $1`,
      [`${buildBaseSlug({ brand, model, title: baseTitle, condition })}%`],
    );
    const slug = uniquifySlug(
      buildBaseSlug({ brand, model, title: baseTitle, condition }),
      new Set((slugRows as Array<{ slug: string }>).map((row) => row.slug)),
    );
    const specsBase = specs.map((entry) => ({ label: entry.label.de || entry.label.en, value: entry.value.de || entry.value.en }));

    const insertResult = await query(
      `INSERT INTO "products" (
        "title", "subtitle", "description",
        "title_i18n", "subtitle_i18n", "description_i18n",
        "price", "compare_at_price", "category", "brand", "model", "sku", "stock", "slug",
        "images", "variants",
        "feature_bullets", "feature_bullets_i18n",
        "specs", "specs_i18n",
        "is_active", "condition", "condition_note",
        "import_key", "import_metadata"
      ) VALUES (
        $1,$2,$3,$4::jsonb,$5::jsonb,$6::jsonb,$7,$8,$9,$10,$11,$12,$13,$14,$15,'[]'::jsonb,$16,$17::jsonb,$18::jsonb,$19::jsonb,$20,$21,$22,$23,$24::jsonb
      )
      ON CONFLICT ("import_key") WHERE "import_key" IS NOT NULL DO NOTHING
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
        condition,
        conditionNote || null,
        importKey || null,
        JSON.stringify({
          sourceImageSha256: sourceImageSha256 || importKey || null,
          ...importMetadata,
        }),
      ],
    );

    let row = insertResult.rows[0] as { id: string; slug: string; is_active?: boolean; images?: string[] } | undefined;
    let duplicate = false;
    if (!row?.id && importKey) {
      const existingResult = await query(
        `SELECT "id","slug","is_active","images" FROM "products" WHERE "import_key" = $1 LIMIT 1`,
        [importKey],
      );
      row = existingResult.rows[0] as
        | { id: string; slug: string; is_active: boolean; images: string[] }
        | undefined;
      duplicate = Boolean(row?.id);
    }
    if (!row?.id) {
      return NextResponse.json({ error: "Failed to save product" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      duplicate,
      id: row.id,
      slug: row.slug,
      isActive: duplicate ? Boolean(row.is_active) : isActive,
      images: duplicate ? (row.images ?? []) : images,
      adminUrl: "/admin/products",
      productPath: `/de/store/${row.slug}`,
    });
  } catch (error) {
    console.error("Draft product API failed:", error);
    return NextResponse.json({ error: "Failed to create draft product" }, { status: 500 });
  }
}
