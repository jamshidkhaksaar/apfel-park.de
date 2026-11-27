import { NextRequest, NextResponse } from "next/server";
import { buildAiTextProvenance } from '@/lib/product-text-provenance';

import { rejectCrossSiteAdminMutation } from "@/lib/admin-csrf";
import { canManageProducts } from "@/lib/admin-auth";
import { markOpenIntakeRunsStale } from "@/lib/product-intake/stale-runs";
import { createAdminServerClient } from "@/lib/admin-auth-server";
import { createAdminDbClient } from "@/lib/admin-db";
import { randomUUID } from "node:crypto";
import { query, withTransaction } from "@/lib/db";
import { applyExactOfferUpdateInTransaction, canonicalOfferColor, canonicalOfferStorage, classifyCatalogOfferMatch, ensureModelFamilyMembership, findModelCatalogCandidates, normalizeBatteryTuple, type OfferCondition } from "@/lib/catalog-offer-resolution";
import { validBatteryHealthRange } from "@/lib/product-offer-options";
import { autoPublishProductPromotion } from "@/lib/marketing";
import { sanitizeInput } from "@/lib/security";
import { buildBaseSlug, uniquifySlug } from "@/lib/product-slug";
import { conditionDetailsChanged } from "@/lib/product-condition";
import { eprelAssetRoutes } from "@/lib/eprel";
import { buildPayload, validatePayload, getMessages, type ProductPayload } from '@/lib/product-write-payload';
import { deleteCatalogProduct, ProductDeletionError } from '@/lib/product-deletion';
import { persistProfile } from '@/lib/product-experience-persistence';
import { buildAutoProductExperience } from '@/lib/product-experience-autofill';
class DuplicateSkuError extends Error {}

const hasDiscountPrice = (price: number | null, compareAtPrice: number | null) =>
  typeof price === "number" &&
  typeof compareAtPrice === "number" &&
  compareAtPrice > price;

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

  return { ok: true as const, isEnglish, messages, actor: user!.id };
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

  // node-pg turns JS arrays into Postgres array literals ("{a,b}"), which is
  // invalid for a jsonb column — stringify so the value is stored as JSON.
  const { error } = await admin.from("store_settings").upsert(
    {
      key: "featured_product_ids",
      value: JSON.stringify(nextIds),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );
  if (error) {
    console.error("syncHomepageFeatured failed:", error.message);
  }
};

const productInventoryUnits = (product: ReturnType<typeof buildPayload>) => {
  const units = !product.isActive
    ? []
    : product.variants.length > 0
      ? product.variants.map((variant) => ({ sku: variant.sku, stock: variant.stock ?? product.stock }))
      : [{ sku: product.sku ?? undefined, stock: product.stock }];
  return Array.from(
    new Map(
      units
        .filter((unit): unit is { sku: string; stock: number } => Boolean(unit.sku))
        .map((unit) => [unit.sku, unit]),
    ).values(),
  );
};

const assertInventorySkuAvailability = async (productId: string | null, product: ReturnType<typeof buildPayload>) => {
  const skus = productInventoryUnits(product).map((unit) => unit.sku);
  if (skus.length === 0) return;
  const result = productId
    ? await query(
        `SELECT sku FROM inventory_skus
          WHERE location = 'local' AND sku = ANY($1::text[]) AND product_id IS DISTINCT FROM $2::uuid
          LIMIT 1`,
        [skus, productId],
      )
    : await query(
        `SELECT sku FROM inventory_skus WHERE location = 'local' AND sku = ANY($1::text[]) LIMIT 1`,
        [skus],
      );
  if (result.rows[0]) throw new DuplicateSkuError(`SKU is already assigned to another product: ${String(result.rows[0].sku)}`);
};

const syncProductInventory = async (productId: string, product: ReturnType<typeof buildPayload>) => {
  const sellable = productInventoryUnits(product);
  // Preserve legacy active products that predate SKU enforcement. They can be
  // completed in the admin without silently zeroing an existing reservation row.
  if (product.isActive && sellable.length === 0) return;

  for (const unit of sellable) {
    const result = await query(
      `INSERT INTO inventory_skus (product_id, sku, location, on_hand, reserved, safety_buffer, is_active)
       VALUES ($1, $2, 'local', greatest($3, 0), 0, 0, true)
       ON CONFLICT (sku, location) DO UPDATE
         -- The legacy product form edits the sellable mirror. Preserve any
         -- units already reserved (and the configured buffer) when converting
         -- that value back into physical on-hand stock.
         SET on_hand = greatest(
               excluded.on_hand + inventory_skus.reserved + inventory_skus.safety_buffer,
               inventory_skus.reserved + inventory_skus.safety_buffer
             ),
             product_id = excluded.product_id,
             is_active = true,
             updated_at = now()
         WHERE inventory_skus.product_id = excluded.product_id
       RETURNING id`,
      [productId, unit.sku, Math.max(0, Math.floor(unit.stock))],
    );
    if (result.rowCount !== 1) throw new DuplicateSkuError(`SKU is already assigned to another product: ${unit.sku}`);
  }

  const activeSkus = sellable.map((unit) => unit.sku);
  await query(
    `UPDATE inventory_skus
        SET on_hand = reserved, is_active = false, updated_at = now()
      WHERE product_id = $1
        AND location = 'local'
        AND NOT (sku = ANY($2::text[]))`,
    [productId, activeSkus],
  );
};


export async function POST(request: NextRequest) {
  const auth = await ensureAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const payload = (await request.json()) as ProductPayload;
    if (payload.autoResolveVariant) {
      const normCondition: OfferCondition =
        payload.condition === "open_box" || payload.condition === "refurbished"
          ? "open_box"
          : payload.condition === "used"
            ? "used"
            : "new";
      const batteryTuple = normalizeBatteryTuple(
        normCondition,
        payload.batteryHealthRange?.min ?? payload.batteryHealth ?? null,
        payload.batteryHealthRange?.max ?? null,
      );
      const firstVar = Array.isArray(payload.variants) && payload.variants.length > 0 ? payload.variants[0] : null;
      const color = canonicalOfferColor(payload.color ?? firstVar?.color);
      const storage = canonicalOfferStorage(payload.storage ?? firstVar?.storage);
      const configEntries =
        payload.configuration && typeof payload.configuration === "object"
          ? Object.fromEntries(
              Object.entries(payload.configuration)
                .map(([k, v]) => [sanitizeInput(k), sanitizeInput(String(v ?? ""))])
                .filter(([k, v]) => Boolean(k && v)),
            )
          : undefined;
      const cleanConfig = configEntries && Object.keys(configEntries).length > 0 ? configEntries : undefined;

      const resolved = await withTransaction(async (client) => {
        const candidates = await findModelCatalogCandidates(client, {
          productId: payload.id ?? null,
          sku: payload.sku ?? null,
          gtin: payload.gtin ?? null,
          category: payload.category ?? "smartphones",
          brand: payload.brand ?? null,
          model: payload.model ?? null,
          title: payload.title ?? null,
        });
        const match = classifyCatalogOfferMatch(
          {
            productId: payload.id ?? null,
            sku: payload.sku ?? null,
            gtin: payload.gtin ?? null,
            mpn: payload.mpn ?? null,
            category: payload.category ?? "smartphones",
            brand: payload.brand ?? null,
            model: payload.model ?? null,
            title: payload.title ?? null,
            condition: normCondition,
            color,
            storage,
            configuration: cleanConfig ?? null,
            batteryHealth: batteryTuple.min,
            batteryHealthMax: batteryTuple.max,
          },
          candidates,
        );

        if (match.kind === "exact_offer") {
          const parsedPrice = Number(payload.price);
          if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
            return { error: auth.messages.priceRequired, status: 400 as const };
          }
          const rawQty = Number(payload.stock ?? 1);
          if (!Number.isFinite(rawQty) || rawQty < 0) {
            return { error: auth.messages.stockRequired, status: 400 as const };
          }
          const updated = await applyExactOfferUpdateInTransaction(client, {
            candidate: match.candidate,
            price: parsedPrice,
            compareAtPrice: payload.compareAtPrice,
            addedQuantity: payload.quantityMode === "set" ? undefined : Math.floor(rawQty),
            targetQuantity: payload.quantityMode === "set" ? Math.floor(rawQty) : null,
            conditionNote: payload.conditionNote ?? null,
            batteryHealth: batteryTuple.max ? null : batteryTuple.min,
            batteryHealthRange:
              batteryTuple.max && validBatteryHealthRange({ min: batteryTuple.min!, max: batteryTuple.max })
                ? { min: batteryTuple.min!, max: batteryTuple.max }
                : null,
            images: Array.isArray(payload.images) ? payload.images : undefined,
            hasRealProductPhotos: payload.hasRealProductPhotos,
            actor: auth.actor,
            referenceType: "admin_wizard",
            referenceId: match.candidate.id,
          });
          return {
            ok: true as const,
            id: updated.productId,
            resolution: "restocked" as const,
            previousStock: updated.previousStock,
            newStock: updated.newStock,
            addedQuantity: updated.addedQuantity,
            price: updated.price,
            familyId: updated.familyId,
          };
        }

        const tpl = match.kind === "next_variant" ? match.templateCandidate : null;
        const generatedSku = sanitizeInput(payload.sku || "") || `AP-${randomUUID()}`;
        const inheritedPayload: ProductPayload = {
          ...payload,
          id: undefined,
          subtitle: payload.subtitle || tpl?.subtitle || [payload.model || tpl?.model, storage, color].filter(Boolean).join(" · "),
          description: payload.description || tpl?.description || "",
          brand: payload.brand || tpl?.brand || "",
          model: payload.model || tpl?.model || "",
          hardwareModel: payload.hardwareModel || tpl?.hardwareModel || "",
          category: payload.category || tpl?.category || "smartphones",
          sku: generatedSku,
          specs: payload.specs?.length ? payload.specs : tpl?.specs ?? [],
          featureBullets: payload.featureBullets?.length ? payload.featureBullets : tpl?.featureBullets ?? [],
          manufacturer: payload.manufacturer ?? (tpl?.manufacturer as ProductPayload["manufacturer"]) ?? null,
          euResponsiblePerson: payload.euResponsiblePerson ?? (tpl?.euResponsiblePerson as ProductPayload["euResponsiblePerson"]) ?? null,
          safetyWarnings: payload.safetyWarnings?.length ? payload.safetyWarnings : tpl?.safetyWarnings ?? [],
          safetyDocuments: payload.safetyDocuments?.length ? payload.safetyDocuments : tpl?.safetyDocuments ?? [],
          eprelId: payload.eprelId || tpl?.eprelId || "",
          energyLabel: payload.energyLabel ?? (tpl?.energyLabel as ProductPayload["energyLabel"]) ?? null,
          countryOfOrigin: payload.countryOfOrigin || tpl?.countryOfOrigin || undefined,
          packageWeightKg: payload.packageWeightKg ?? tpl?.packageWeightKg ?? null,
          packageLengthCm: payload.packageLengthCm ?? tpl?.packageLengthCm ?? null,
          packageWidthCm: payload.packageWidthCm ?? tpl?.packageWidthCm ?? null,
          packageHeightCm: payload.packageHeightCm ?? tpl?.packageHeightCm ?? null,
          chargerIncluded: payload.chargerIncluded ?? tpl?.chargerIncluded ?? null,
          chargingPowerMinW: payload.chargingPowerMinW ?? tpl?.chargingPowerMinW ?? null,
          chargingPowerMaxW: payload.chargingPowerMaxW ?? tpl?.chargingPowerMaxW ?? null,
          usbPdSupported: payload.usbPdSupported ?? tpl?.usbPdSupported ?? null,
          batteryDetails: payload.batteryDetails ?? (tpl?.batteryDetails as ProductPayload["batteryDetails"]) ?? null,
          batteryHealth: batteryTuple.max ? null : batteryTuple.min,
          batteryHealthRange:
            batteryTuple.max && validBatteryHealthRange({ min: batteryTuple.min!, max: batteryTuple.max })
              ? { min: batteryTuple.min!, max: batteryTuple.max }
              : null,
          variants: payload.variants?.length
            ? payload.variants
            : color || storage
              ? [
                  {
                    color: color || "Standard",
                    storage: storage || "Standard",
                    price: payload.price,
                    compareAtPrice: payload.compareAtPrice ?? undefined,
                    stock: payload.stock,
                    sku: generatedSku,
                    mpn: payload.mpn || undefined,
                    gtin: payload.gtin || undefined,
                    identifierStatus: payload.identifierStatus,
                    images: payload.images,
                    isDefault: true,
                  },
                ]
              : [],
        };

        const resolvedTitle = sanitizeInput(inheritedPayload.title);
        const base = buildBaseSlug({
          brand: inheritedPayload.brand,
          model: inheritedPayload.model,
          title: resolvedTitle,
          subtitle: inheritedPayload.subtitle,
          condition: inheritedPayload.condition,
          variants: inheritedPayload.variants,
        });
        const { rows: slugRows } = await client.query(`SELECT slug FROM products WHERE slug LIKE $1`, [`${base}%`]);
        const takenSlugs = new Set((slugRows as Array<{ slug: string }>).map((r) => r.slug));
        const slug = uniquifySlug(base, takenSlugs);
        const product = buildPayload(inheritedPayload, slug);
        const validationError = validatePayload(product, auth.messages);
        if (validationError) {
          return { error: validationError, status: 400 as const };
        }
        const units = productInventoryUnits(product);
        const unitSkus = units.map((u) => u.sku);
        if (unitSkus.length > 0) {
          const dupSku = await client.query(
            `SELECT sku FROM inventory_skus WHERE location = 'local' AND sku = ANY($1::text[]) LIMIT 1`,
            [unitSkus],
          );
          if (dupSku.rows[0]) {
            throw new DuplicateSkuError(`SKU is already assigned to another product: ${String(dupSku.rows[0].sku)}`);
          }
        }
        const metaObj = {
          contentProvenance: buildAiTextProvenance(null, {}, product, product.aiGeneratedFields),
          ...(product.batteryHealthRange ? { batteryHealthRange: product.batteryHealthRange } : {}),
          ...(cleanConfig ? { smartphoneEditor: { configuration: cleanConfig } } : {}),
        };
        const inserted = await client.query(
          `INSERT INTO "products" (
            "title","subtitle","description","price","compare_at_price","category","brand","model","sku","stock","slug",
            "images","variants","feature_bullets","specs","is_active","condition","battery_health","has_real_product_photos",
            "condition_note","subcategory","mpn","gtin","manufacturer","eu_responsible_person","safety_warnings","safety_documents",
            "eprel_id","energy_label","faq","asin","ebay_epid","identifier_status","country_of_origin","package_weight_kg",
            "package_length_cm","package_width_cm","package_height_cm","charger_included","charging_power_min_w","charging_power_max_w",
            "usb_pd_supported","battery_details","marketplace_category_mappings","marketplace_attributes","amazon_gtin_exemption",
            "amazon_renewed_approved","catalog_enabled","import_metadata"
          ) VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14,$15::jsonb,$16,$17,$18,$19,$20,$21,$22,$23,$24::jsonb,$25::jsonb,$26,$27,$28,$29::jsonb,$30::jsonb,
            $31,$32,$33,$34,$35,$36,$37,$38,$39,$40,$41,$42,$43::jsonb,$44::jsonb,$45::jsonb,$46,$47,true,$48::jsonb
          ) RETURNING "id"`,
          [
            product.title, product.subtitle, product.description, product.price, product.compareAtPrice,
            product.category, product.brand, product.model, product.sku, product.stock, product.slug,
            product.images, JSON.stringify(product.variants), product.featureBullets, JSON.stringify(product.specs),
            product.isActive, product.condition, product.batteryHealth, product.hasRealProductPhotos, product.conditionNote,
            product.subcategory, product.mpn, product.gtin, JSON.stringify(product.manufacturer),
            JSON.stringify(product.euResponsiblePerson), product.safetyWarnings, product.safetyDocuments, product.eprelId,
            JSON.stringify(product.energyLabel), product.faq ? JSON.stringify(product.faq) : null, product.asin, product.ebayEpid,
            product.identifierStatus, product.countryOfOrigin, product.packageWeightKg, product.packageLengthCm,
            product.packageWidthCm, product.packageHeightCm, product.chargerIncluded, product.chargingPowerMinW,
            product.chargingPowerMaxW, product.usbPdSupported, JSON.stringify(product.batteryDetails),
            JSON.stringify(product.marketplaceCategoryMappings), JSON.stringify(product.marketplaceAttributes),
            product.amazonGtinExemption, product.amazonRenewedApproved, JSON.stringify(metaObj),
          ],
        );
        const productId = String(inserted.rows[0].id);
        for (const unit of units) {
          await client.query(
            `INSERT INTO inventory_skus (product_id, sku, location, on_hand, reserved, safety_buffer, is_active)
             VALUES ($1, $2, 'local', greatest($3, 0), 0, 0, true)`,
            [productId, unit.sku, Math.max(0, Math.floor(unit.stock))],
          );
        }
        const familyId = await ensureModelFamilyMembership(client, {
          productId,
          category: product.category || "smartphones",
          brand: product.brand ?? undefined,
          model: product.model ?? undefined,
          title: product.title,
          condition: normCondition,
          color: color || null,
          storage: storage || null,
          configuration: cleanConfig ?? null,
          existingFamilyId: match.kind === "next_variant" ? match.familyId : null,
        });
        const autoProfile = payload.experience ?? buildAutoProductExperience({
          category: product.category || "smartphones",
          brand: product.brand ?? undefined,
          model: product.model ?? undefined,
          title: product.title,
          condition: normCondition,
          specs: product.specs,
          chargerIncluded: product.chargerIncluded,
          chargingPowerMaxW: product.chargingPowerMaxW,
          usbPdSupported: product.usbPdSupported,
          batteryDetails: product.batteryDetails ?? undefined,
          comparisonProductIds: match.kind === "next_variant" && tpl ? [tpl.id] : [],
        });
        await persistProfile(client, productId, autoProfile);
        if (product.hardwareModel) {
          await client.query("UPDATE products SET hardware_model = $2 WHERE id = $1 AND (hardware_model IS NULL OR btrim(hardware_model) = '')", [productId, product.hardwareModel]);
        }
        return {
          ok: true as const,
          id: productId,
          slug: product.slug || slug,
          title: product.title,
          subtitle: product.subtitle,
          description: product.description,
          imageUrl: product.images[0] || null,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          isActive: product.isActive,
          resolution: match.kind === "next_variant" ? ("next_variant" as const) : ("created" as const),
          familyId,
        };
      });

      if ("error" in resolved) {
        return NextResponse.json({ error: resolved.error }, { status: resolved.status });
      }
      if (resolved.resolution !== "restocked") {
        await syncHomepageFeatured(resolved.id, Boolean(payload.isHomepageFeatured));
      }
      const socialPublishing =
        resolved.resolution !== "restocked" && resolved.isActive
          ? await autoPublishProductPromotion(
              {
                id: resolved.id,
                title: resolved.title,
                subtitle: resolved.subtitle,
                description: resolved.description,
                slug: resolved.slug,
                imageUrl: resolved.imageUrl,
                price: resolved.price,
                compareAtPrice: resolved.compareAtPrice,
                locale: auth.isEnglish ? "en" : "de",
              },
              hasDiscountPrice(resolved.price, resolved.compareAtPrice) ? "discount" : "new",
            )
          : [];
      return NextResponse.json({
        success: true,
        id: resolved.id,
        resolution: resolved.resolution,
        previousStock: "previousStock" in resolved ? resolved.previousStock : undefined,
        newStock: "newStock" in resolved ? resolved.newStock : undefined,
        addedQuantity: "addedQuantity" in resolved ? resolved.addedQuantity : undefined,
        price: resolved.price,
        familyId: resolved.familyId,
        socialPublishing,
      });
    }
    const title = sanitizeInput(payload.title);
    const base = buildBaseSlug({
      brand: payload.brand,
      model: payload.model,
      title,
      subtitle: payload.subtitle,
      condition: payload.condition,
      variants: payload.variants,
    });
    // Only the slugs that could actually collide with this base, rather than
    // every slug in a 2,900-row table on each create. products.slug is UNIQUE,
    // so a lost race surfaces as a constraint error rather than a duplicate.
    const { rows } = await query(`SELECT slug FROM products WHERE slug LIKE $1`, [`${base}%`]);
    const taken = new Set((rows as Array<{ slug: string }>).map((r) => r.slug));
    const slug = uniquifySlug(base, taken);
    const product = buildPayload(payload, slug);
    const validationError = validatePayload(product, auth.messages);
    if (validationError) {
      console.warn("Product create rejected", {
        title: product.title,
        condition: product.condition,
        reason: validationError,
        hasRealProductPhotos: product.hasRealProductPhotos,
        imageCount: product.images.length,
        conditionNoteLength: (product.conditionNote ?? "").length,
        batteryHealth: product.batteryHealth,
      });
      return NextResponse.json({ error: validationError }, { status: 400 });
    }
    await assertInventorySkuAvailability(null, product);

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
        "is_active",
        "condition",
        "battery_health",
        "has_real_product_photos",
        "condition_note",
        "subcategory",
        "mpn",
        "gtin",
        "manufacturer",
        "eu_responsible_person",
        "safety_warnings",
        "safety_documents",
        "eprel_id",
        "energy_label",
        "faq",
        "asin",
        "ebay_epid",
        "identifier_status",
        "country_of_origin",
        "package_weight_kg",
        "package_length_cm",
        "package_width_cm",
        "package_height_cm",
        "charger_included",
        "charging_power_min_w",
        "charging_power_max_w",
        "usb_pd_supported",
        "battery_details",
        "marketplace_category_mappings",
        "marketplace_attributes",
        "amazon_gtin_exemption",
        "amazon_renewed_approved",
        "catalog_enabled",
        "import_metadata"
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14,$15::jsonb,$16,$17,$18,$19,$20,$21,$22,$23,$24::jsonb,$25::jsonb,$26,$27,$28,$29::jsonb,$30::jsonb,
        $31,$32,$33,$34,$35,$36,$37,$38,$39,$40,$41,$42,$43::jsonb,$44::jsonb,$45::jsonb,$46,$47,true,$48::jsonb
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
        product.condition,
        product.batteryHealth,
        product.hasRealProductPhotos,
        product.conditionNote,
        product.subcategory,
        product.mpn,
        product.gtin,
        JSON.stringify(product.manufacturer),
        JSON.stringify(product.euResponsiblePerson),
        product.safetyWarnings,
        product.safetyDocuments,
        product.eprelId,
        JSON.stringify(product.energyLabel),
        product.faq ? JSON.stringify(product.faq) : null,
        product.asin,
        product.ebayEpid,
        product.identifierStatus,
        product.countryOfOrigin,
        product.packageWeightKg,
        product.packageLengthCm,
        product.packageWidthCm,
        product.packageHeightCm,
        product.chargerIncluded,
        product.chargingPowerMinW,
        product.chargingPowerMaxW,
        product.usbPdSupported,
        JSON.stringify(product.batteryDetails),
        JSON.stringify(product.marketplaceCategoryMappings),
        JSON.stringify(product.marketplaceAttributes),
        product.amazonGtinExemption,
        product.amazonRenewedApproved,
        JSON.stringify({ contentProvenance: buildAiTextProvenance(null, {}, product, product.aiGeneratedFields), ...(product.batteryHealthRange ? { batteryHealthRange: product.batteryHealthRange } : {}) }),
      ],
    );

    const data = insertResult.rows[0] as { id: string } | undefined;
    if (!data?.id) {
      return NextResponse.json({ error: auth.messages.createFailed }, { status: 400 });
    }

    await syncHomepageFeatured(data.id, product.isHomepageFeatured);
    await withTransaction(async (client) => {
      const stdCondition = product.condition === "open_box" ? "open_box" : product.condition === "used" ? "used" : "new";
      const autoProfile = payload.experience ?? buildAutoProductExperience({
        category: product.category || "smartphones",
        brand: product.brand ?? undefined,
        model: product.model ?? undefined,
        title: product.title,
        condition: stdCondition,
        specs: product.specs,
        chargerIncluded: product.chargerIncluded,
        chargingPowerMaxW: product.chargingPowerMaxW,
        usbPdSupported: product.usbPdSupported,
        batteryDetails: product.batteryDetails ?? undefined,
      });
      await persistProfile(client, data.id, autoProfile);
      if (product.hardwareModel) {
        await client.query("UPDATE products SET hardware_model = $2 WHERE id = $1 AND (hardware_model IS NULL OR btrim(hardware_model) = '')", [data.id, product.hardwareModel]);
      }
    });
    await syncProductInventory(data.id, product);

    const socialPublishing = product.isActive
      ? await autoPublishProductPromotion(
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
        )
      : [];

    return NextResponse.json({ success: true, id: data.id, socialPublishing });
  } catch (error) {
    console.error("Create product failed:", error);
    if (error instanceof DuplicateSkuError) return NextResponse.json({ error: error.message }, { status: 400 });
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
      console.warn("Product update rejected", {
        id: payload.id,
        condition: product.condition,
        reason: validationError,
        hasRealProductPhotos: product.hasRealProductPhotos,
        imageCount: product.images.length,
        conditionNoteLength: (product.conditionNote ?? "").length,
        batteryHealth: product.batteryHealth,
      });
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const admin = createAdminDbClient();
    const { data: existing, error: existingError } = await admin
      .from<{
        slug: string | null;
        is_active: boolean | null;
        condition: string | null;
        condition_note: string | null;
        eprel_id: string | null;
        energy_label: unknown;
        title: string | null;
        description: string | null;
        import_metadata: unknown;
      }>("products")
      .select("slug,is_active,condition,condition_note,eprel_id,energy_label,title,description,import_metadata")
      .eq("id", payload.id)
      .maybeSingle();
    if (existingError) throw new Error(`Could not load existing product: ${existingError.message}`);
    if (existing?.import_metadata && typeof existing.import_metadata === "object" && "catalogDeletedAt" in existing.import_metadata) return NextResponse.json({ error: "not_found" }, { status: 404 });

    // Editing an unrelated field must not remove the mirrored official label
    // or product-information sheets already attached to this EPREL model.
    if (
      existing?.eprel_id
      && existing.eprel_id === product.eprelId
      && existing.energy_label
      && typeof existing.energy_label === "object"
      && !Array.isArray(existing.energy_label)
    ) {
      const expected = eprelAssetRoutes(existing.eprel_id);
      const previous = existing.energy_label as Record<string, unknown>;
      for (const key of ["labelImage", "ficheDe", "ficheEn"] as const) {
        if (!product.energyLabel[key] && previous[key] === expected[key]) {
          product.energyLabel[key] = expected[key];
        }
      }
    }

    await assertInventorySkuAvailability(payload.id, product);
    const invalidateConditionNoteTranslations = conditionDetailsChanged(
      { condition: existing?.condition, conditionNote: existing?.condition_note },
      { condition: product.condition, conditionNote: product.conditionNote },
    );

    // An existing slug is never rewritten on edit: a live URL that changes
    // under an editor's feet costs the ranking it already earned. Re-slugging
    // is a deliberate migration (scripts/migrate-slugs.mjs), which records the
    // old value in product_slug_history so the old URL keeps resolving.
    const nextSlug =
      existing?.slug ||
      uniquifySlug(
        buildBaseSlug({
          brand: payload.brand,
          model: payload.model,
          title: product.title,
          subtitle: product.subtitle,
          condition: product.condition,
          variants: payload.variants,
        }),
        new Set(),
      );

    await query(
      `UPDATE "products"
       SET
         "title" = $2,
         "subtitle" = $3,
         "description" = $4,
         "title_i18n" = CASE WHEN "title" IS DISTINCT FROM $2 THEN '{}'::jsonb ELSE "title_i18n" END,
         "subtitle_i18n" = CASE WHEN "subtitle" IS DISTINCT FROM $3 THEN '{}'::jsonb ELSE "subtitle_i18n" END,
         "description_i18n" = CASE WHEN "description" IS DISTINCT FROM $4 THEN '{}'::jsonb ELSE "description_i18n" END,
         "feature_bullets_i18n" = CASE WHEN "feature_bullets" IS DISTINCT FROM $15 THEN '{}'::jsonb ELSE "feature_bullets_i18n" END,
         "specs_i18n" = CASE WHEN "specs" IS DISTINCT FROM $16::jsonb THEN '{}'::jsonb ELSE "specs_i18n" END,
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
        "is_active" = $17,
        "condition" = $18,
        "battery_health" = $19,
        "has_real_product_photos" = $20,
        "condition_note" = $21,
        "subcategory" = $22,
        "mpn" = $23,
        "gtin" = $24,
        "manufacturer" = $25::jsonb,
        "eu_responsible_person" = $26::jsonb,
        "safety_warnings" = $27,
        "safety_documents" = $28,
        "eprel_id" = $29,
        "energy_label" = $30::jsonb,
        "faq" = $31::jsonb,
        "asin" = $32,
        "ebay_epid" = $33,
        "identifier_status" = $34,
        "country_of_origin" = $35,
        "package_weight_kg" = $36,
        "package_length_cm" = $37,
        "package_width_cm" = $38,
        "package_height_cm" = $39,
        "charger_included" = $40,
        "charging_power_min_w" = $41,
        "charging_power_max_w" = $42,
        "usb_pd_supported" = $43,
        "battery_details" = $44::jsonb,
        "marketplace_category_mappings" = $45::jsonb,
        "marketplace_attributes" = $46::jsonb,
        "amazon_gtin_exemption" = $47,
        "amazon_renewed_approved" = $48,
        "import_metadata" = coalesce(CASE
          WHEN $49::boolean AND ("import_metadata" ? 'conditionNoteI18n')
            THEN "import_metadata" - 'conditionNoteI18n'
          ELSE "import_metadata"
        END,'{}'::jsonb) || jsonb_build_object('contentProvenance',
          CASE WHEN jsonb_typeof("import_metadata"->'contentProvenance')='object' THEN "import_metadata"->'contentProvenance' ELSE '{}'::jsonb END || $50::jsonb) || $51::jsonb,
        "updated_at" = now()
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
        product.condition,
        product.batteryHealth,
        product.hasRealProductPhotos,
        product.conditionNote,
        product.subcategory,
        product.mpn,
        product.gtin,
        JSON.stringify(product.manufacturer),
        JSON.stringify(product.euResponsiblePerson),
        product.safetyWarnings,
        product.safetyDocuments,
        product.eprelId,
        JSON.stringify(product.energyLabel),
        product.faq ? JSON.stringify(product.faq) : null,
        product.asin,
        product.ebayEpid,
        product.identifierStatus,
        product.countryOfOrigin,
        product.packageWeightKg,
        product.packageLengthCm,
        product.packageWidthCm,
        product.packageHeightCm,
        product.chargerIncluded,
        product.chargingPowerMinW,
        product.chargingPowerMaxW,
        product.usbPdSupported,
        JSON.stringify(product.batteryDetails),
        JSON.stringify(product.marketplaceCategoryMappings),
        JSON.stringify(product.marketplaceAttributes),
        product.amazonGtinExemption,
        product.amazonRenewedApproved,
        invalidateConditionNoteTranslations,
        JSON.stringify(buildAiTextProvenance(existing?.import_metadata, existing ?? {}, product, product.aiGeneratedFields)),
        JSON.stringify(payload.batteryHealthRange !== undefined ? { batteryHealthRange: product.batteryHealthRange } : payload.batteryHealth != null ? { batteryHealthRange: null } : {}),
      ],
    );

    // Keep every sellable variant in the reservation ledger. on_hand never
    // drops below quantities already reserved for open orders.
    await syncProductInventory(payload.id, product);

    await syncHomepageFeatured(payload.id, product.isHomepageFeatured);
    await markOpenIntakeRunsStale(payload.id, "Manual catalog edit");

    const socialPublishing = product.isActive
      ? await autoPublishProductPromotion(
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
        )
      : [];

    return NextResponse.json({ success: true, socialPublishing });
  } catch (error) {
    console.error("Update product failed:", error);
    if (error instanceof DuplicateSkuError) return NextResponse.json({ error: error.message }, { status: 400 });
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

    const body = await request.json().catch(() => ({}));
    await deleteCatalogProduct(id, body, auth.actor);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ProductDeletionError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Delete product failed:", error);
    return NextResponse.json({ error: auth.messages.deleteFailed }, { status: 500 });
  }
}
