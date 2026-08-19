import { createHash } from "node:crypto";
import { readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";

import { deleteBlobByUrl, resolveUploadPath, uploadProductImage } from "@/lib/blob";
import { withTransaction } from "@/lib/db";
import { buildBaseSlug, uniquifySlug } from "@/lib/product-slug";

import { ProductIntakeError } from "./errors";
import { canonicalJsonHash, scopedIdempotencyKey } from "./json";
import { getProductIntakeRunDetail } from "./repository";
import type { JsonValue, ProductIntakeActor, ProductIntakeAsset, ProductIntakeRun } from "./types";

export const inventoryAdjustmentFor = (
  inventory: { mode: "set" | "add"; quantity: number },
  onHand: number,
): { type: "restock" | "correction"; quantity: number } => ({
  type: inventory.mode === "add" ? "restock" : "correction",
  quantity: inventory.mode === "add" ? inventory.quantity : inventory.quantity - onHand,
});

export const productPriceUpdateForSku = (
  variants: Array<Record<string, unknown>>,
  targetSku: string | null,
  price: number,
): { variants: Array<Record<string, unknown>>; matched: boolean; updateBase: boolean } => {
  const index = targetSku
    ? variants.findIndex((variant) => sameText(variant.sku, targetSku))
    : -1;
  if (index < 0) return { variants, matched: false, updateBase: false };
  const next = variants.map((variant, variantIndex) => variantIndex === index ? { ...variant, price } : variant);
  return { variants: next, matched: true, updateBase: next[index].isDefault === true };
};

const assertLiveReady = (run: ProductIntakeRun): void => {
  if (run.mode !== "live" || process.env.PRODUCT_INTAKE_LIVE_ENABLED !== "true") {
    throw new ProductIntakeError("forbidden", "Live product-intake application is disabled", 403);
  }
  if (!run.validation.valid || !run.proposal) {
    throw new ProductIntakeError("state_conflict", "The proposal is not ready for application", 409);
  }
};

const conditionValue = (condition: ProductIntakeRun["condition"]): "new" | "open_box" | "used" =>
  condition === "open_box" ? "open_box" : condition === "used" ? "used" : "new";

const sameText = (left: unknown, right: unknown): boolean =>
  String(left ?? "").trim().toLowerCase() === String(right ?? "").trim().toLowerCase();

const resolveAssetPath = async (asset: ProductIntakeAsset): Promise<string> => {
  const root = await realpath("/srv/n8n/media");
  const resolved = path.resolve(root, asset.assetKey);
  if (!resolved.startsWith(`${root}${path.sep}`)) {
    throw new ProductIntakeError("forbidden", "Invalid publishable asset path", 403);
  }
  const actual = await realpath(resolved);
  if (!actual.startsWith(`${root}${path.sep}`)) throw new ProductIntakeError("forbidden", "Publishable asset symlink escapes the media root", 403);
  return actual;
};

type PromotedImage = { url: string; originalUrl: string };

const promoteDraftImages = async (runId: string): Promise<PromotedImage[]> => {
  const detail = await getProductIntakeRunDetail(runId);
  const publishable = detail.assets
    .filter((asset) =>
      asset.kind === "shop_photo"
      && asset.rightsBasis === "shop_owned"
      && !asset.containsSensitiveIdentifiers
      && asset.metadata.privacyScanPassed === true
      && asset.metadata.publishable === true
      && (detail.run.condition === "sealed" || asset.metadata.exactItem === true),
    )
    .sort((left, right) => Number(right.metadata.isPrimary === true) - Number(left.metadata.isPrimary === true));
  if (publishable.length === 0) {
    throw new ProductIntakeError("state_conflict", "No publishable shop photo is available", 409);
  }
  const promoted: PromotedImage[] = [];
  try {
    for (const asset of publishable.slice(0, 12)) {
      const bytes = await readFile(await resolveAssetPath(asset));
      const digest = createHash("sha256").update(bytes).digest("hex");
      if (digest !== asset.sha256) throw new ProductIntakeError("conflict", "Publishable asset integrity check failed", 409);
      const file = new File([bytes], path.basename(asset.assetKey), { type: asset.contentType });
      const uploaded = await uploadProductImage(file);
      promoted.push({ url: uploaded.url, originalUrl: uploaded.originalUrl });
    }
    return promoted;
  } catch (error) {
    await Promise.all(promoted.map((image) => deleteBlobByUrl(image.originalUrl).catch(() => undefined)));
    throw error;
  }
};

export const applyApprovedProductUpdate = async (
  run: ProductIntakeRun,
  actor: ProductIntakeActor,
  idempotencyKey: string,
): Promise<ProductIntakeRun> => {
  const proposal = run.proposal;
  if (!proposal || proposal.operation !== "update" || !run.targetProductId) {
    throw new ProductIntakeError("state_conflict", "Only exact existing-product proposals can be applied", 409);
  }
  assertLiveReady(run);
  if (run.status !== "approved_once" || run.approvalCount !== 1) {
    throw new ProductIntakeError("state_conflict", "The update is not ready for application", 409);
  }

  return withTransaction(async (client) => {
    const lockedRun = await client.query(
      "SELECT status,proposal_hash,evidence_hash,target_product_id,applied_at,applied_by,version,updated_at FROM product_intake_runs WHERE id=$1::uuid FOR UPDATE",
      [run.id],
    );
    const liveState = lockedRun.rows[0];
    if (!liveState) throw new ProductIntakeError("not_found", "Product-intake run no longer exists", 404);
    const eventKey = scopedIdempotencyKey("apply", idempotencyKey);
    const payload = {
      productId: run.targetProductId,
      proposalHash: run.proposalHash,
      price: proposal.changes.price,
      inventory: proposal.changes.inventory,
    };
    const requestHash = canonicalJsonHash(payload as unknown as JsonValue);
    const duplicate = await client.query(
      "SELECT request_hash FROM product_intake_events WHERE run_id=$1::uuid AND idempotency_key=$2 LIMIT 1",
      [run.id, eventKey],
    );
    if (duplicate.rows[0]) {
      if (duplicate.rows[0].request_hash !== requestHash) throw new ProductIntakeError("conflict", "Apply idempotency mismatch", 409);
      return {
        ...run,
        status: "applied",
        appliedAt: liveState.applied_at instanceof Date ? liveState.applied_at.toISOString() : String(liveState.applied_at),
        appliedBy: liveState.applied_by,
        version: Number(liveState.version),
        updatedAt: liveState.updated_at instanceof Date ? liveState.updated_at.toISOString() : String(liveState.updated_at),
      };
    }
    if (liveState.status !== "approved_once" || liveState.proposal_hash !== run.proposalHash
      || liveState.evidence_hash !== run.evidenceHash || String(liveState.target_product_id) !== run.targetProductId) {
      throw new ProductIntakeError("state_conflict", "The approved update changed before application", 409);
    }
    await client.query("UPDATE product_intake_runs SET status='apply_pending' WHERE id=$1::uuid", [run.id]);

    const productResult = await client.query(
      "SELECT id, sku, price, variants, condition, gtin, mpn FROM products WHERE id=$1::uuid FOR UPDATE",
      [run.targetProductId],
    );
    const product = productResult.rows[0] as {
      id: string;
      sku: string | null;
      price: string | number;
      variants: Array<Record<string, unknown>> | null;
      condition: string;
      gtin: string | null;
      mpn: string | null;
    } | undefined;
    if (!product) throw new ProductIntakeError("not_found", "Matched product no longer exists", 404);
    const targetSku = proposal.target.sku || product.sku;
    const variants = Array.isArray(product.variants) ? product.variants : [];
    const variantIndex = targetSku
      ? variants.findIndex((variant) => String(variant.sku ?? "").trim().toLowerCase() === targetSku.trim().toLowerCase())
      : -1;
    const targetVariant = variantIndex >= 0 ? variants[variantIndex] : null;
    const actualGtin = String(targetVariant?.gtin ?? product.gtin ?? "").trim();
    const actualMpn = String(targetVariant?.mpn ?? product.mpn ?? "").trim();
    if (product.condition !== conditionValue(proposal.condition)
      || (proposal.target.gtin && actualGtin !== proposal.target.gtin)
      || (proposal.target.mpn && actualMpn.toLowerCase() !== proposal.target.mpn.toLowerCase())) {
      throw new ProductIntakeError("state_conflict", "The matched product identifiers or condition changed before application", 409);
    }

    if (proposal.changes.price !== null) {
      const variantUpdate = productPriceUpdateForSku(variants, targetSku, proposal.changes.price);
      if (variantUpdate.matched) {
        await client.query(
          "UPDATE products SET variants=$2::jsonb, price=case when $3 then $4 else price end, updated_at=now() WHERE id=$1::uuid",
          [product.id, JSON.stringify(variantUpdate.variants), variantUpdate.updateBase, proposal.changes.price],
        );
      } else {
        if (targetSku && product.sku && targetSku.trim().toLowerCase() !== product.sku.trim().toLowerCase()) {
          throw new ProductIntakeError("state_conflict", "The approved price SKU no longer exists on the product", 409);
        }
        await client.query("UPDATE products SET price=$2, updated_at=now() WHERE id=$1::uuid", [product.id, proposal.changes.price]);
      }
      await client.query(
        `INSERT INTO marketplace_jobs (marketplace, operation, sku, payload)
         SELECT listing.marketplace, 'update_price', listing.sku, '{}'::jsonb
           FROM marketplace_listings listing
           JOIN inventory_skus inventory ON inventory.sku=listing.sku AND inventory.location='local'
           JOIN marketplace_channel_settings settings ON settings.marketplace=listing.marketplace
          WHERE inventory.product_id=$1::uuid AND listing.approved_at IS NOT NULL
            AND listing.sync_price=true AND settings.enabled=true AND settings.price_sync_enabled=true
         ON CONFLICT DO NOTHING`,
        [product.id],
      );
    }

    const inventory = proposal.changes.inventory;
    if (inventory) {
      const sku = targetSku;
      if (!sku) throw new ProductIntakeError("state_conflict", "A sellable SKU is required for inventory updates", 409);
      const inventoryResult = await client.query(
        "SELECT on_hand FROM inventory_skus WHERE sku=$1 AND location='local' AND product_id=$2::uuid FOR UPDATE",
        [sku, product.id],
      );
      if (!inventoryResult.rows[0]) throw new ProductIntakeError("not_found", "Inventory SKU was not found", 404);
      const onHand = Number(inventoryResult.rows[0].on_hand);
      const adjustment = inventoryAdjustmentFor(inventory, onHand);
      const quantity = adjustment.quantity;
      if (quantity !== 0) {
        await client.query(
          "SELECT * FROM adjust_inventory($1,$2,$3,$4,$5,$6,$7::jsonb)",
          [
            sku,
            adjustment.type,
            quantity,
            "product_intake",
            run.id,
            actor.id,
            JSON.stringify({ intakeRunId: run.id, quantityMode: inventory.mode }),
          ],
        );
      }
    }

    const applied = await client.query(
      `UPDATE product_intake_runs
          SET status='applied', applied_at=now(), applied_by=$2, last_error=null
        WHERE id=$1::uuid RETURNING applied_at, updated_at, version`,
      [run.id, actor.id],
    );
    const eventPayload = { productId: product.id, priceChanged: proposal.changes.price !== null, inventoryChanged: Boolean(inventory) };
    await client.query(
      `INSERT INTO product_intake_events (
         run_id,event_type,actor_type,actor_id,idempotency_key,request_hash,proposal_hash,payload
       ) VALUES ($1::uuid,'applied',$2,$3,$4,$5,$6,$7::jsonb)`,
      [run.id, actor.type, actor.id, eventKey, requestHash, run.proposalHash, JSON.stringify(eventPayload)],
    );
    const row = applied.rows[0];
    return {
      ...run,
      status: "applied",
      appliedAt: row.applied_at instanceof Date ? row.applied_at.toISOString() : String(row.applied_at),
      appliedBy: actor.id,
      version: Number(row.version),
      updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
    };
  });
};

export const createApprovedProductDraft = async (
  run: ProductIntakeRun,
  actor: ProductIntakeActor,
  idempotencyKey: string,
): Promise<ProductIntakeRun> => {
  const proposal = run.proposal;
  if (!proposal || proposal.operation !== "create") {
    throw new ProductIntakeError("state_conflict", "Only new-product proposals can create a draft", 409);
  }
  assertLiveReady(run);
  if (run.status !== "approved_once" || run.approvalCount !== 1) {
    throw new ProductIntakeError("state_conflict", "The first approval is required before draft creation", 409);
  }
  if (run.targetProductId) return run;
  if (!proposal.target.sku || !proposal.product.title || !proposal.product.category || !proposal.changes.inventory || proposal.changes.price === null) {
    throw new ProductIntakeError("state_conflict", "The new-product proposal is incomplete", 409);
  }
  const inventoryChange = proposal.changes.inventory;
  const proposedPrice = proposal.changes.price;

  const promoted = await promoteDraftImages(run.id);
  try {
    return await withTransaction(async (client) => {
      const current = await client.query(
        "SELECT status, approval_count, proposal_hash, evidence_hash, target_product_id FROM product_intake_runs WHERE id=$1::uuid FOR UPDATE",
        [run.id],
      );
      const currentRun = current.rows[0] as {
        status: string;
        approval_count: number;
        proposal_hash: string | null;
        evidence_hash: string | null;
        target_product_id: string | null;
      } | undefined;
      if (!currentRun || currentRun.proposal_hash !== run.proposalHash || currentRun.evidence_hash !== run.evidenceHash) {
        throw new ProductIntakeError("state_conflict", "The proposal changed before draft creation", 409);
      }
      if (currentRun.target_product_id) {
        throw new ProductIntakeError("conflict", "The inactive draft was created concurrently; retry the decision", 409);
      }
      if (currentRun.status !== "approved_once" || Number(currentRun.approval_count) !== 1) {
        throw new ProductIntakeError("state_conflict", "The draft approval is no longer current", 409);
      }

      const sku = proposal.target.sku;
      const duplicateSku = await client.query(
        `SELECT 1 FROM products WHERE lower(btrim(sku))=lower(btrim($1))
         UNION ALL
         SELECT 1 FROM inventory_skus WHERE lower(btrim(sku))=lower(btrim($1))
         LIMIT 1`,
        [sku],
      );
      if (duplicateSku.rows[0]) throw new ProductIntakeError("conflict", "The proposed SKU already exists", 409);

      const condition = conditionValue(proposal.condition);
      const baseSlug = buildBaseSlug({
        title: proposal.listingPreview.de.title,
        brand: proposal.product.brand,
        model: proposal.product.model,
        condition,
      });
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`product-intake-slug:${baseSlug}`]);
      const slugRows = await client.query("SELECT slug FROM products WHERE slug LIKE $1", [`${baseSlug}%`]);
      const slug = uniquifySlug(baseSlug, new Set(slugRows.rows.map((row) => String(row.slug))));
      const subtitle = [proposal.product.model, proposal.product.storage, proposal.product.color].filter(Boolean).join(" · ");
      const researchedSpecs = proposal.facts
        .filter((fact) => fact.field.startsWith("specs."))
        .map((fact) => ({ label: fact.field.slice("specs.".length).replaceAll("_", " "), value: String(fact.value) }));
      const specs = [
        proposal.product.hardwareModel ? { label: "Hardwaremodell", value: proposal.product.hardwareModel } : null,
        proposal.product.includedAccessories.length > 0
          ? { label: "Lieferumfang", value: proposal.product.includedAccessories.join(", ") }
          : null,
        ...researchedSpecs,
      ].filter(Boolean);
      const identifierStatus = proposal.target.gtin || proposal.target.mpn ? "assigned" : proposal.identifierException ? "not_applicable" : "unknown";
      const draftSnapshot = {
        title: proposal.listingPreview.de.title,
        subtitle: subtitle || null,
        description: proposal.listingPreview.de.description,
        price: proposedPrice,
        category: proposal.product.category,
        brand: proposal.product.brand,
        model: proposal.product.model,
        hardwareModel: proposal.product.hardwareModel,
        sku,
        images: promoted.map((image) => image.url),
        specs,
        condition,
        batteryHealth: proposal.product.batteryHealth,
        hasRealProductPhotos: true,
        conditionNote: proposal.notes,
        mpn: proposal.target.mpn,
        gtin: proposal.target.gtin,
        identifierStatus,
      };
      const metadata = {
        productIntake: {
          runId: run.id,
          proposalHash: run.proposalHash,
          evidence: proposal.facts,
          evidenceHash: run.evidenceHash,
          identifierException: proposal.identifierException,
          promotedImages: promoted.map((image) => image.url),
          draftSnapshotHash: canonicalJsonHash(draftSnapshot as unknown as JsonValue),
          listingPreview: proposal.listingPreview,
        },
        conditionNoteI18n: {
          de: proposal.listingPreview.de.conditionNote,
          en: proposal.listingPreview.en.conditionNote,
        },
      };
      const inserted = await client.query(
        `INSERT INTO products (
           title, subtitle, description, price, category, brand, model, hardware_model,
           sku, stock, slug, images, feature_bullets, specs, is_active, condition,
           battery_health, has_real_product_photos, condition_note, mpn, gtin,
           identifier_status, import_metadata
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,0,$10,$11,$12,$13::jsonb,false,$14,
           $15,true,$16,$17,$18,$19,$20::jsonb
         ) RETURNING id`,
        [
          proposal.listingPreview.de.title,
          subtitle || null,
          proposal.listingPreview.de.description,
          proposedPrice,
          proposal.product.category,
          proposal.product.brand,
          proposal.product.model,
          proposal.product.hardwareModel,
          sku,
          slug,
          promoted.map((image) => image.url),
          [],
          JSON.stringify(specs),
          condition,
          proposal.product.batteryHealth,
          proposal.notes,
          proposal.target.mpn,
          proposal.target.gtin,
          identifierStatus,
          JSON.stringify(metadata),
        ],
      );
      const productId = String(inserted.rows[0].id);
      const inventory = await client.query(
        `INSERT INTO inventory_skus (
           product_id, sku, location, on_hand, reserved, safety_buffer, is_active
         ) VALUES ($1::uuid,$2,'local',$3,0,0,false)
         RETURNING id`,
        [productId, sku, inventoryChange.quantity],
      );
      await client.query(
        `INSERT INTO inventory_adjustments (
           inventory_sku_id,event_type,quantity_delta,reference_type,reference_id,actor,metadata
         ) VALUES ($1::uuid,'seed',$2,'product_intake',$3,$4,$5::jsonb)`,
        [
          inventory.rows[0].id,
          inventoryChange.quantity,
          run.id,
          actor.id,
          JSON.stringify({ quantityMode: inventoryChange.mode, inactiveDraft: true }),
        ],
      );
      await client.query("DELETE FROM inventory_sync_targets WHERE sku=$1", [sku]);
      const updated = await client.query(
        "UPDATE product_intake_runs SET target_product_id=$2::uuid WHERE id=$1::uuid RETURNING updated_at, version",
        [run.id, productId],
      );
      const payload = { productId, slug, inactive: true, inventoryActive: false, proposalHash: run.proposalHash };
      const eventKey = scopedIdempotencyKey("draft", idempotencyKey);
      const eventHash = canonicalJsonHash(payload as unknown as JsonValue);
      await client.query(
        `INSERT INTO product_intake_events (
           run_id,event_type,actor_type,actor_id,idempotency_key,request_hash,proposal_hash,payload
         ) VALUES ($1::uuid,'draft_created',$2,$3,$4,$5,$6,$7::jsonb)`,
        [run.id, actor.type, actor.id, eventKey, eventHash, run.proposalHash, JSON.stringify(payload)],
      );
      const row = updated.rows[0];
      return {
        ...run,
        targetProductId: productId,
        version: Number(row.version),
        updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
      };
    });
  } catch (error) {
    await Promise.all(promoted.map((image) => deleteBlobByUrl(image.originalUrl).catch(() => undefined)));
    throw error;
  }
};

export const publishApprovedProductDraft = async (
  run: ProductIntakeRun,
  actor: ProductIntakeActor,
  idempotencyKey: string,
): Promise<ProductIntakeRun> => {
  const proposal = run.proposal;
  if (!proposal || proposal.operation !== "create" || !run.targetProductId) {
    throw new ProductIntakeError("state_conflict", "An inactive intake draft is required before publication", 409);
  }
  assertLiveReady(run);
  if (run.status !== "approved_twice" || run.approvalCount !== 2) {
    throw new ProductIntakeError("state_conflict", "The second approval is required before publication", 409);
  }
  if (!run.validation.readiness.store.ready || !run.validation.readiness.google.ready) {
    throw new ProductIntakeError("state_conflict", "Store and Google readiness blockers must be resolved before publication", 409);
  }
  return withTransaction(async (client) => {
    const lockedRun = await client.query(
      "SELECT status,approval_count,proposal_hash,evidence_hash,target_product_id,applied_at,applied_by,version,updated_at FROM product_intake_runs WHERE id=$1::uuid FOR UPDATE",
      [run.id],
    );
    const liveState = lockedRun.rows[0];
    if (!liveState) throw new ProductIntakeError("not_found", "Product-intake run no longer exists", 404);
    const eventKey = scopedIdempotencyKey("publish", idempotencyKey);
    const eventPayload = { productId: run.targetProductId, proposalHash: run.proposalHash, evidenceHash: run.evidenceHash };
    const requestHash = canonicalJsonHash(eventPayload as unknown as JsonValue);
    const duplicate = await client.query(
      "SELECT request_hash FROM product_intake_events WHERE run_id=$1::uuid AND idempotency_key=$2 LIMIT 1",
      [run.id, eventKey],
    );
    if (duplicate.rows[0]) {
      if (duplicate.rows[0].request_hash !== requestHash) throw new ProductIntakeError("conflict", "Publish idempotency mismatch", 409);
      return {
        ...run,
        status: "applied",
        appliedAt: liveState.applied_at instanceof Date ? liveState.applied_at.toISOString() : String(liveState.applied_at),
        appliedBy: liveState.applied_by,
        version: Number(liveState.version),
        updatedAt: liveState.updated_at instanceof Date ? liveState.updated_at.toISOString() : String(liveState.updated_at),
      };
    }
    if (liveState.status !== "approved_twice" || Number(liveState.approval_count) !== 2
      || liveState.proposal_hash !== run.proposalHash || liveState.evidence_hash !== run.evidenceHash
      || String(liveState.target_product_id) !== run.targetProductId) {
      throw new ProductIntakeError("state_conflict", "The approved draft changed before publication", 409);
    }
    const product = await client.query(
      `SELECT id,is_active,title,subtitle,description,price,category,brand,model,hardware_model,sku,images,specs,condition,
              battery_health,has_real_product_photos,condition_note,mpn,gtin,identifier_status,import_metadata
         FROM products WHERE id=$1::uuid FOR UPDATE`,
      [run.targetProductId],
    );
    const productRow = product.rows[0];
    if (!productRow) throw new ProductIntakeError("not_found", "Inactive product draft was not found", 404);
    const inventory = await client.query(
      "SELECT id,sku,on_hand,reserved,is_active FROM inventory_skus WHERE product_id=$1::uuid AND location='local' FOR UPDATE",
      [run.targetProductId],
    );
    const inventoryRow = inventory.rows[0];
    if (!inventoryRow) throw new ProductIntakeError("not_found", "Inactive inventory draft was not found", 404);
    const metadata = productRow.import_metadata?.productIntake ?? {};
    const actualSnapshot = {
      title: productRow.title,
      subtitle: productRow.subtitle,
      description: productRow.description,
      price: Number(productRow.price),
      category: productRow.category,
      brand: productRow.brand,
      model: productRow.model,
      hardwareModel: productRow.hardware_model,
      sku: productRow.sku,
      images: productRow.images,
      specs: productRow.specs,
      condition: productRow.condition,
      batteryHealth: productRow.battery_health,
      hasRealProductPhotos: productRow.has_real_product_photos,
      conditionNote: productRow.condition_note,
      mpn: productRow.mpn,
      gtin: productRow.gtin,
      identifierStatus: productRow.identifier_status,
    };
    const unchanged = productRow.is_active === false
      && inventoryRow.is_active === false
      && Number(inventoryRow.reserved) === 0
      && Number(inventoryRow.on_hand) === proposal.changes.inventory?.quantity
      && sameText(productRow.title, proposal.listingPreview.de.title)
      && Number(productRow.price) === proposal.changes.price
      && sameText(productRow.category, proposal.product.category)
      && sameText(productRow.brand, proposal.product.brand)
      && sameText(productRow.model, proposal.product.model)
      && sameText(productRow.hardware_model, proposal.product.hardwareModel)
      && sameText(productRow.sku, proposal.target.sku)
      && sameText(inventoryRow.sku, proposal.target.sku)
      && sameText(productRow.condition, conditionValue(proposal.condition))
      && Number(productRow.battery_health ?? 0) === Number(proposal.product.batteryHealth ?? 0)
      && sameText(productRow.condition_note, proposal.notes)
      && sameText(productRow.mpn, proposal.target.mpn)
      && sameText(productRow.gtin, proposal.target.gtin)
      && Array.isArray(productRow.images) && productRow.images.length > 0
      && JSON.stringify(productRow.images) === JSON.stringify(metadata.promotedImages)
      && metadata.proposalHash === run.proposalHash
      && metadata.evidenceHash === run.evidenceHash
      && metadata.draftSnapshotHash === canonicalJsonHash(actualSnapshot as unknown as JsonValue);
    if (!unchanged) throw new ProductIntakeError("state_conflict", "Inactive product draft no longer matches the reviewed proposal", 409);
    for (const imageUrl of productRow.images as string[]) {
      const imagePath = resolveUploadPath(imageUrl);
      let imageExists = false;
      if (imagePath) {
        try { imageExists = (await stat(imagePath)).isFile(); } catch { imageExists = false; }
      }
      if (!imageExists) {
        throw new ProductIntakeError("state_conflict", "A reviewed product image is missing from persistent storage", 409);
      }
    }
    await client.query("UPDATE products SET is_active=true, updated_at=now() WHERE id=$1::uuid", [run.targetProductId]);
    await client.query("UPDATE inventory_skus SET is_active=true WHERE product_id=$1::uuid AND location='local'", [run.targetProductId]);
    await client.query("SELECT queue_inventory_sync($1)", [inventoryRow.sku]);
    const applied = await client.query(
      `UPDATE product_intake_runs
          SET status='applied', applied_at=now(), applied_by=$2, last_error=null
        WHERE id=$1::uuid RETURNING applied_at, updated_at, version`,
      [run.id, actor.id],
    );
    const payload = { productId: run.targetProductId, productActive: true, inventoryActive: true };
    await client.query(
      `INSERT INTO product_intake_events (
         run_id,event_type,actor_type,actor_id,idempotency_key,request_hash,proposal_hash,payload
       ) VALUES ($1::uuid,'published',$2,$3,$4,$5,$6,$7::jsonb)`,
      [run.id, actor.type, actor.id, eventKey, requestHash, run.proposalHash, JSON.stringify(payload)],
    );
    const row = applied.rows[0];
    return {
      ...run,
      status: "applied",
      appliedAt: row.applied_at instanceof Date ? row.applied_at.toISOString() : String(row.applied_at),
      appliedBy: actor.id,
      version: Number(row.version),
      updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
    };
  });
};

export const discardRejectedProductDraft = async (
  run: ProductIntakeRun,
  actor: ProductIntakeActor,
  idempotencyKey: string,
): Promise<ProductIntakeRun> => {
  if (run.mode !== "live" || run.status !== "rejected" || run.proposal?.operation !== "create" || !run.targetProductId) {
    return run;
  }
  const images: string[] = await withTransaction(async (client) => {
    const locked = await client.query(
      "SELECT status,target_product_id FROM product_intake_runs WHERE id=$1::uuid FOR UPDATE",
      [run.id],
    );
    if (locked.rows[0]?.status !== "rejected" || String(locked.rows[0]?.target_product_id) !== run.targetProductId) {
      throw new ProductIntakeError("state_conflict", "Rejected draft state changed before cleanup", 409);
    }
    const product = await client.query("SELECT is_active,images FROM products WHERE id=$1::uuid FOR UPDATE", [run.targetProductId]);
    if (!product.rows[0]) return [] as string[];
    if (product.rows[0].is_active) throw new ProductIntakeError("state_conflict", "A live product cannot be discarded as an intake draft", 409);
    const inventory = await client.query(
      "SELECT id,sku,reserved,is_active FROM inventory_skus WHERE product_id=$1::uuid AND location='local' FOR UPDATE",
      [run.targetProductId],
    );
    if (inventory.rows.some((row) => row.is_active || Number(row.reserved) > 0)) {
      throw new ProductIntakeError("state_conflict", "Draft inventory is active or reserved and cannot be discarded", 409);
    }
    const listing = await client.query(
      "SELECT 1 FROM marketplace_listings listing JOIN inventory_skus inventory ON inventory.sku=listing.sku WHERE inventory.product_id=$1::uuid LIMIT 1",
      [run.targetProductId],
    );
    if (listing.rows[0]) throw new ProductIntakeError("state_conflict", "Draft already has marketplace state and requires manual cleanup", 409);
    const skus = inventory.rows.map((row) => String(row.sku));
    if (skus.length > 0) await client.query("DELETE FROM inventory_sync_targets WHERE sku=any($1::text[])", [skus]);
    const ids = inventory.rows.map((row) => String(row.id));
    if (ids.length > 0) await client.query("DELETE FROM inventory_adjustments WHERE inventory_sku_id=any($1::uuid[])", [ids]);
    await client.query("DELETE FROM inventory_skus WHERE product_id=$1::uuid", [run.targetProductId]);
    await client.query("DELETE FROM products WHERE id=$1::uuid", [run.targetProductId]);
    const payload = { productId: run.targetProductId, discarded: true };
    await client.query(
      `INSERT INTO product_intake_events (
         run_id,event_type,actor_type,actor_id,idempotency_key,request_hash,proposal_hash,payload
       ) VALUES ($1::uuid,'draft_discarded',$2,$3,$4,$5,$6,$7::jsonb)
       ON CONFLICT (run_id,idempotency_key) DO NOTHING`,
      [
        run.id, actor.type, actor.id, scopedIdempotencyKey("discard", idempotencyKey),
        canonicalJsonHash(payload as unknown as JsonValue), run.proposalHash, JSON.stringify(payload),
      ],
    );
    return Array.isArray(product.rows[0].images) ? product.rows[0].images.map((value: unknown) => String(value)) : [];
  });
  await Promise.all(images.map((url) => deleteBlobByUrl(url).catch(() => undefined)));
  return { ...run, targetProductId: null };
};
