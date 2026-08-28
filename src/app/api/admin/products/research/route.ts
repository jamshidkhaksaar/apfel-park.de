import { NextRequest, NextResponse } from "next/server";

import sharp from "sharp";
import { canManageProducts } from "@/lib/admin-auth";
import { rejectCrossSiteAdminMutation } from "@/lib/admin-csrf";
import { readSessionUserFromRequest } from "@/lib/session";
import { findSensitiveDataIssues } from "@/lib/product-intake/redaction";
import { uploadProductImage } from "@/lib/blob";
import { sanitizeResearchResult } from "@/lib/product-research";
import { query as dbQuery } from "@/lib/db";
import { eprelAssetRoutes, eprelCycles, eprelEndurance } from "@/lib/eprel";

export const dynamic = "force-dynamic";


function geminiKey(): string {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new Error("GEMINI_API_KEY is not configured");
  return key;
}

const SYSTEM_PROMPT = `You are an expert product intelligence assistant for Apfel Park, a premium smartphone and electronics store in Hamburg. The store language is German; all customer-facing text must be in professional German.

You support ALL smartphone, tablet, and accessory brands worldwide, including Apple, Samsung, Google Pixel, Xiaomi, POCO, Redmi, Nothing, Fairphone, OnePlus, Honor, Sony, Motorola, Asus, and more.

Given a query or device photo, research the REAL device using Google Search grounding and return STRICT JSON with ONLY these keys:
- title: string (German: Brand + Marketing Model + Storage + German Color name, e.g. "Nothing Phone (2) 256 GB Dunkelgrau", "Xiaomi 14 Ultra 512 GB Schwarz", "Fairphone 5 256 GB Moosgrün", "Google Pixel 9 Pro 256 GB Hazel")
- subtitle: string (German: short selling tagline)
- description: string (German: 2-3 professional luxury paragraphs: Design & Materialien, Display & Performance, Kamera-System, Akkulaufzeit & Ladeleistung, Besondere Features)
- brand: string (e.g. "Nothing", "Xiaomi", "POCO", "Fairphone", "Google", "OnePlus", "Sony", "Apple", "Samsung", "Honor")
- model: string (e.g. "Phone (2)", "14 Ultra", "Pixel 9 Pro", "Fairphone 5", "iPhone 16 Pro Max", "Galaxy S24 Ultra")
- category: one of "smartphones", "tablets", "accessories", "consoles", "laptops"
- specs: array of {label, value} (German labels: Display, Prozessor / Chip, Arbeitsspeicher, Interner Speicher, Hauptkamera, Frontkamera, Akku & Laden, Betriebssystem, Konnektivität, Schutzklasse / IP-Zertifizierung, Abmessungen & Gewicht)
- features: array of 4-6 strings (German key selling highlights)
- variants: array of {color, storage} (German color names matching official releases, e.g. "Dunkelgrau", "Weiß", "Obsidian", "Porcelain", "Titan Schwarz", "Moosgrün")
- manufacturer: {name, address, email} (Official legal manufacturer entity for EU GPSR compliance)
  Reference Entities:
  * Nothing: { name: "Nothing Technology Limited", address: "80 Cheapside, London EC2V 6EE, UK", email: "support@nothing.tech" }
  * Fairphone: { name: "Fairphone B.V.", address: "Van Diemenstraat 200, 1013 CP Amsterdam, Netherlands", email: "support@fairphone.com" }
  * Xiaomi / POCO / Redmi: { name: "Xiaomi Technology Netherlands B.V.", address: "Prinses Beatrixlaan 582, 2595BM The Hague, Netherlands", email: "service.de@xiaomi.com" }
  * Google: { name: "Google Ireland Limited", address: "Gordon House, Barrow Street, Dublin 4, Ireland", email: "support-deutschland@google.com" }
  * OnePlus: { name: "Reflection Investment B.V.", address: "Keizersgracht 482, 1017EG Amsterdam, Netherlands", email: "support.de@oneplus.com" }
  * Sony: { name: "Sony Europe B.V.", address: "Da Vincilaan 7-D1, 1930 Zaventem, Belgium", email: "customersupport.de@sony.com" }
  * Samsung: { name: "Samsung Electronics GmbH", address: "Am Kronberger Hang 6, 65824 Schwalbach am Taunus, Germany", email: "hotline@samsung.de" }
  * Apple: { name: "Apple Distribution International Ltd", address: "Hollyhill Industrial Estate, Cork, Ireland", email: "contactus.de@euro.apple.com" }
  * Honor: { name: "Honor Technologies Germany GmbH", address: "Toulouser Allee 27, 40211 Düsseldorf, Germany", email: "de.support@honor.com" }
  * Motorola: { name: "Motorola Mobility Germany GmbH", address: "Meisenstraße 96, 33607 Bielefeld, Germany", email: "de-support@motorola.com" }
- euResponsiblePerson: {name, address, email} (EU Importer or EU Representative)
- eprelRegistrationNumber: string (EPREL EU registration number e.g. "2402623", "2247679" or model identifier like A3090, SM-S931B if known; else omit)
- energyLabel: {efficiencyClass, batteryEndurance, batteryCycles, repairabilityClass, reliabilityClass, ipRating} (EU Energy label rating, e.g. efficiencyClass "A" or "B", batteryEndurance e.g. "41 h 0 min", batteryCycles e.g. 1000)
- countryOfOrigin: two-letter ISO code (e.g. "CN", "VN", "IN", "TW")
- batteryDetails: {included: boolean, wattHours: number}
- safetyWarnings: array of strings (German safety instructions, e.g. "Vor Feuchtigkeit und extremen Temperaturen schützen. Nur mit zertifizierten Ladegeräten laden.")
- gtin: string (GTIN/EAN only if factual; else omit)
- mpn: string (Manufacturer Part Number / Model Identifier only if factual; else omit)

Rules:
- Search and return real facts for ANY brand worldwide.
- Never invent specs.
- Return ONLY valid JSON, no markdown.`;

async function callGemini(payload: { prompt: string; image?: { mime: string; data: string } }): Promise<unknown> {
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [{ text: payload.prompt }];
  if (payload.image) parts.push({ inlineData: { mimeType: payload.image.mime, data: payload.image.data } });

  const tryModel = async (model: string, timeoutMs: number) => {
    const isGemini37 = model.includes("3.7");
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.1,
          ...(isGemini37 ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
        },
        tools: [{ google_search: {} }],
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`Gemini ${model} request failed (${response.status}) ${detail.slice(0, 200)}`);
    }
    const data = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("");
    if (!text) throw new Error(`Gemini ${model} returned no content`);
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new Error(`Gemini ${model} returned no valid JSON object`);
    }
    return JSON.parse(text.slice(firstBrace, lastBrace + 1));
  };

  try {
    return await tryModel("gemini-3.7-flash", 60000);
  } catch (err) {
    console.warn("[product research] Primary model failed, attempting fallback:", err instanceof Error ? err.message : err);
    return await tryModel("gemini-2.5-flash", 45000);
  }
}

// Search for candidate official product images from search indexes
async function searchProductOriginalImages(query: string): Promise<string[]> {
  try {
    const searchTerms = `${query} official packshot white background -case -cover -skin -hülle -hulle`;
    const vqdRes = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(searchTerms)}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: AbortSignal.timeout(1800),
    });
    const vqdHtml = await vqdRes.text();
    const vqdMatch = vqdHtml.match(/vqd=([0-9-]+)/) || vqdHtml.match(/vqd="([^"]+)"/) || vqdHtml.match(/vqd=([^&]+)/);
    if (!vqdMatch) return [];
    const vqd = vqdMatch[1];
    const imgRes = await fetch(`https://duckduckgo.com/i.js?l=de-de&o=json&q=${encodeURIComponent(searchTerms)}&vqd=${vqd}&f=,,,type:photo,`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: AbortSignal.timeout(1800),
    });
    const data = (await imgRes.json().catch(() => ({}))) as { results?: Array<{ image?: string }> };
    return (data.results || [])
      .map((r) => r.image)
      .filter((url): url is string => typeof url === "string" && url.startsWith("https://") && !url.includes("case") && !url.includes("cover") && !url.includes("hulle") && !url.includes("hülle"))
      .slice(0, 3);
  } catch {
    return [];
  }
}

// Inspect candidate packshots and pick the best image buffer
async function pickBestPackshot(
  candidates: string[],
): Promise<Buffer | null> {
  for (const url of candidates.slice(0, 2)) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        },
        signal: AbortSignal.timeout(1500),
      });
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 4000 || buf.length > 10 * 1024 * 1024) continue;

      const meta = await sharp(buf).metadata().catch(() => null);
      if (!meta?.width || meta.width < 250 || !meta?.height || meta.height < 250) continue;

      return buf;
    } catch {
      // try next
    }
  }
  return null;
}

// Google Merchant Center standard: 1500x1500px, 1:1 square, 88% scale, WebP
async function standardizePackshotBuffer(inputBuffer: Buffer, targetSize = 1500): Promise<Buffer> {
  try {
    let pipeline = sharp(inputBuffer, { failOn: "warning" }).rotate();
    try {
      pipeline = pipeline.trim({ threshold: 12 });
    } catch {
      // trim is non-fatal
    }
    const productSize = Math.round(targetSize * 0.88);
    const trimmedBuf = await pipeline.toBuffer();

    return await sharp(trimmedBuf)
      .resize({
        width: productSize,
        height: productSize,
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .extend({
        top: Math.round((targetSize - productSize) / 2),
        bottom: Math.round((targetSize - productSize) / 2),
        left: Math.round((targetSize - productSize) / 2),
        right: Math.round((targetSize - productSize) / 2),
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .webp({ quality: 85, effort: 2 })
      .toBuffer();
  } catch {
    return inputBuffer;
  }
}

// Convert standardized buffer to WebP and upload to blob storage
async function uploadPackshotBuffer(buffer: Buffer): Promise<string | null> {
  try {
    const standardized = await standardizePackshotBuffer(buffer, 1500);
    const file = new File([standardized as unknown as BlobPart], `research-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.webp`, { type: "image/webp" });
    const uploaded = await uploadProductImage(file);
    return uploaded.url;
  } catch {
    return null;
  }
}

function generateProductSku(brand: string, model: string, storage?: string): string {
  const brandCode = brand.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4) || "DEV";
  const modelCode = model.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10) || "MODEL";
  const storageCode = storage ? storage.trim().toUpperCase().replace(/[^A-Z0-9]/g, "") : "";
  const randomExt = Math.floor(100 + Math.random() * 900);
  return `AP-${brandCode}-${modelCode}${storageCode ? `-${storageCode}` : ""}-${randomExt}`;
}

function generateVariantSku(brand: string, model: string, color?: string, storage?: string): string {
  const brandCode = brand.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4) || "DEV";
  const modelCode = model.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10) || "MODEL";
  const storageCode = storage ? storage.trim().toUpperCase().replace(/[^A-Z0-9]/g, "") : "";
  const colorCode = color ? color.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) : "";
  return `AP-${brandCode}-${modelCode}${storageCode ? `-${storageCode}` : ""}${colorCode ? `-${colorCode}` : ""}`;
}

async function matchEprelData(brand: string, model: string, mpn?: string | null, eprelInput?: string | null) {
  try {
    const cleanInput = (eprelInput || "").trim();
    if (cleanInput) {
      const res = await dbQuery(
        `SELECT * FROM eprel_models WHERE registration_number = $1 OR model_identifier ILIKE $2 LIMIT 1`,
        [cleanInput, `%${cleanInput}%`],
      );
      if (res.rows[0]) return res.rows[0];
    }
    const cleanMpn = (mpn || "").trim();
    if (cleanMpn.length >= 3) {
      const res = await dbQuery(
        `SELECT * FROM eprel_models WHERE model_identifier ILIKE $1 LIMIT 1`,
        [`%${cleanMpn}%`],
      );
      if (res.rows[0]) return res.rows[0];
    }
    if (brand && model) {
      const cleanModel = model.replace(/^(iPhone|Galaxy|Phone|Xiaomi|Redmi|POCO|Google|Pixel|Nothing)\s*/i, "").trim();
      const res = await dbQuery(
        `SELECT * FROM eprel_models WHERE supplier ILIKE $1 AND (model_identifier ILIKE $2 OR model_identifier ILIKE $3) ORDER BY on_market_start DESC NULLS LAST LIMIT 1`,
        [`%${brand.trim()}%`, `%${model.trim()}%`, `%${cleanModel}%`],
      );
      if (res.rows[0]) return res.rows[0];
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const user = await readSessionUserFromRequest(request);
  if (!canManageProducts(user)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const csrf = rejectCrossSiteAdminMutation(request);
  if (csrf) return csrf;

  try {
    const contentType = request.headers.get("content-type") ?? "";
    let query = "";
    let image: { mime: string; data: string } | undefined;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      query = String(form.get("query") ?? "").trim().slice(0, 200);
      const file = form.get("photo");
      if (file instanceof File && file.size > 0 && file.size <= 8 * 1024 * 1024) {
        const bytes = Buffer.from(await file.arrayBuffer());
        const mime = file.type.startsWith("image/") ? file.type : "image/jpeg";
        image = { mime, data: bytes.toString("base64") };
      }
    } else {
      const body = (await request.json().catch(() => ({}))) as { query?: string };
      query = String(body.query ?? "").trim().slice(0, 200);
    }

    if (!query && !image) return NextResponse.json({ error: "Provide a model name or photo" }, { status: 400 });
    if (query && findSensitiveDataIssues({ query }).length > 0) {
      return NextResponse.json({ error: "Query contains sensitive identifiers" }, { status: 400 });
    }

    const prompt = `Research this product and return the JSON. Model/query: ${query || "from photo"}`;
    const raw = await callGemini({ prompt, image });
    const research = sanitizeResearchResult(raw);

    const brand = research.brand || "";
    const model = research.model || query;

    // 1. Auto-generate SKU based on phone model + extension
    const firstStorage = research.variants?.[0]?.storage || "";
    const productSku = generateProductSku(brand, model, firstStorage);
    research.skuSuggestion = productSku;

    if (research.variants && research.variants.length > 0) {
      research.variants = research.variants.map((v) => ({
        ...v,
        sku: v.sku || generateVariantSku(brand, model, v.color, v.storage),
      }));
    }

    // 2. Auto-match EPREL EU Energy Label (from local register or AI findings)
    const eprelMatch = await matchEprelData(brand, model, research.mpnSuggestion, research.eprelId);
    if (eprelMatch) {
      const routes = eprelAssetRoutes(String(eprelMatch.registration_number));
      research.eprelId = String(eprelMatch.registration_number);
      research.energyLabel = {
        efficiencyClass: eprelMatch.energy_class || research.energyLabel?.efficiencyClass || "A",
        batteryEndurance: eprelEndurance(eprelMatch.battery_endurance_minutes) || research.energyLabel?.batteryEndurance || undefined,
        batteryCycles: eprelCycles(eprelMatch.battery_endurance_cycles) || 1000,
        repairabilityClass: eprelMatch.repairability_class || undefined,
        reliabilityClass: eprelMatch.reliability_class || undefined,
        ipRating: eprelMatch.ingress_protection || undefined,
        labelImage: routes.labelImage,
        ficheDe: routes.ficheDe,
        ficheEn: routes.ficheEn,
      };
    }

    // Fast bounded packshot discovery (capped at 4 seconds total to prevent timeouts)
    const gallerySet = new Set<string>();

    const enrichImages = async () => {
      if (research.variants && research.variants.length > 0) {
        const uniqueColors = Array.from(
          new Set(research.variants.map((v) => v.color.trim()).filter(Boolean)),
        ).slice(0, 2);

        const colorImagesMap = new Map<string, string[]>();

        await Promise.allSettled(
          uniqueColors.map(async (color) => {
            try {
              const candidates = await searchProductOriginalImages(`${brand} ${model} ${color}`);
              if (candidates.length === 0) return;

              const winnerBuf = await pickBestPackshot(candidates);
              if (!winnerBuf) return;

              const uploadedUrl = await uploadPackshotBuffer(winnerBuf);
              if (uploadedUrl) {
                colorImagesMap.set(color, [uploadedUrl]);
                gallerySet.add(uploadedUrl);
              }
            } catch {
              // non-fatal
            }
          }),
        );

        research.variants = research.variants.map((variant) => {
          const colorImages = colorImagesMap.get(variant.color.trim());
          return {
            ...variant,
            images: colorImages && colorImages.length > 0 ? colorImages : variant.images ?? [],
          };
        });
      }

      if (gallerySet.size === 0) {
        try {
          const generalCandidates = await searchProductOriginalImages(`${brand} ${model} official packshot`);
          if (generalCandidates.length > 0) {
            const winnerBuf = await pickBestPackshot(generalCandidates);
            if (winnerBuf) {
              const uploaded = await uploadPackshotBuffer(winnerBuf);
              if (uploaded) gallerySet.add(uploaded);
            }
          }
        } catch {
          // non-fatal
        }
      }
    };

    // Race image enrichment with a 4-second timeout so API response is never delayed
    const timeoutPromise = new Promise<void>((resolve) => setTimeout(resolve, 4000));
    await Promise.race([enrichImages(), timeoutPromise]);

    research.gallery = Array.from(gallerySet).slice(0, 6);

    return NextResponse.json({ success: true, research });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Research failed";
    console.error("[product research]", message);
    const keyMissing = message.includes("GEMINI_API_KEY");
    return NextResponse.json({ error: keyMissing ? "Gemini API key is not configured" : "Research failed", code: keyMissing ? "gemini_key_missing" : "research_failed" }, { status: keyMissing ? 503 : 500 });
  }
}