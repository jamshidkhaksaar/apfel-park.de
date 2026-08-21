import { NextRequest, NextResponse } from "next/server";

import sharp from "sharp";
import { canManageProducts } from "@/lib/admin-auth";
import { rejectCrossSiteAdminMutation } from "@/lib/admin-csrf";
import { readSessionUserFromRequest } from "@/lib/session";
import { findSensitiveDataIssues } from "@/lib/product-intake/redaction";
import { uploadProductImage } from "@/lib/blob";
import { sanitizeResearchResult } from "@/lib/product-research";

export const dynamic = "force-dynamic";

const GEMINI_MODEL = "gemini-2.5-flash"; // Proven on this server with the configured key

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
- energyLabel: {efficiencyClass, batteryEndurance} (EU Energy label rating, e.g. "A", "B", "C", "D")
- countryOfOrigin: two-letter ISO code (e.g. "CN", "VN", "IN", "TW")
- batteryDetails: {included: boolean, wattHours: number}
- safetyWarnings: array of strings (German safety instructions, e.g. "Vor Feuchtigkeit und extremen Temperaturen schützen. Nur mit zertifizierten Ladegeräten laden.")
- gtin: string (GTIN/EAN only if factual; else omit)
- mpn: string (Manufacturer Part Number only if factual; else omit)

Rules:
- Search and return real facts for ANY brand worldwide.
- Never invent specs.
- Return ONLY valid JSON, no markdown.`;

async function callGemini(payload: { prompt: string; image?: { mime: string; data: string } }): Promise<unknown> {
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [{ text: payload.prompt }];
  if (payload.image) parts.push({ inlineData: { mimeType: payload.image.mime, data: payload.image.data } });
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiKey()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ parts }],
      generationConfig: { temperature: 0.1 },
      tools: [{ google_search: {} }],
    }),
    signal: AbortSignal.timeout(45000),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Gemini request failed (${response.status}) ${detail.slice(0, 300)}`);
  }
  const data = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("");
  if (!text) throw new Error("Gemini returned no content");
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("Gemini returned no valid JSON object");
  }
  const jsonText = text.slice(firstBrace, lastBrace + 1);
  return JSON.parse(jsonText);
}

// Search for candidate official product images from search indexes
async function searchProductOriginalImages(query: string): Promise<string[]> {
  try {
    const searchTerms = `${query} official packshot white background -case -cover -skin -hülle -hulle`;
    const vqdRes = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(searchTerms)}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(3500),
    });
    const vqdHtml = await vqdRes.text();
    const vqdMatch = vqdHtml.match(/vqd=([0-9-]+)/) || vqdHtml.match(/vqd="([^"]+)"/) || vqdHtml.match(/vqd=([^&]+)/);
    if (!vqdMatch) return [];
    const vqd = vqdMatch[1];
    const imgRes = await fetch(`https://duckduckgo.com/i.js?l=de-de&o=json&q=${encodeURIComponent(searchTerms)}&vqd=${vqd}&f=,,,type:photo,`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(3500),
    });
    const data = (await imgRes.json().catch(() => ({}))) as { results?: Array<{ image?: string }> };
    return (data.results || [])
      .map((r) => r.image)
      .filter((url): url is string => typeof url === "string" && url.startsWith("https://") && !url.includes("case") && !url.includes("cover") && !url.includes("hulle") && !url.includes("hülle"))
      .slice(0, 6);
  } catch {
    return [];
  }
}

// Uses Gemini 2.5 Flash Vision to inspect multiple candidate packshots and pick the cleanest, genuine device photo
async function pickBestPackshotWithVision(
  candidates: string[],
  brand: string,
  model: string,
  color: string,
  angle: string,
): Promise<Buffer | null> {
  const validCandidates: Array<{ url: string; buf: Buffer; base64: string }> = [];

  for (const url of candidates.slice(0, 4)) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        },
        signal: AbortSignal.timeout(3500),
      });
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 4000 || buf.length > 15 * 1024 * 1024) continue;

      const meta = await sharp(buf).metadata().catch(() => null);
      if (!meta?.width || meta.width < 300 || !meta?.height || meta.height < 300) continue;

      const thumbBuf = await sharp(buf).resize(400, 400, { fit: "inside" }).jpeg({ quality: 80 }).toBuffer();
      validCandidates.push({ url, buf, base64: thumbBuf.toString("base64") });
    } catch {
      // ignore network errors for individual image candidates
    }
  }

  if (validCandidates.length === 0) return null;

  try {
    const prompt = `You are an expert art director and hardware validator for a luxury smartphone store in Germany.
Target Smartphone: ${brand} ${model}
Target Color: ${color}
Target Angle: ${angle} (front, back, side, or angle)

Compare the ${validCandidates.length} attached candidate images (labeled Image 0 to Image ${validCandidates.length - 1} in order).
Select the SINGLE BEST image that:
1. Is genuinely the REAL ${brand} ${model} (NOT a protective case, NOT an accessory, NOT a different model generation, NOT a concept render).
2. Is a clean studio packshot (white, neutral, or transparent background, NO human hands holding it, NO retail box packaging, NO big review logos/watermarks).
3. Matches the color "${color}" and angle "${angle}" as closely as possible.

Return ONLY a JSON object:
{
  "best_index": number (0 to ${validCandidates.length - 1}, or -1 if NONE are acceptable),
  "is_exact_device": boolean,
  "is_clean_packshot": boolean,
  "confidence_score": number (0-100),
  "reason": string
}`;

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [{ text: prompt }];
    validCandidates.forEach((c, idx) => {
      parts.push({ text: `Image ${idx}:` });
      parts.push({ inlineData: { mimeType: "image/jpeg", data: c.base64 } });
    });

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiKey()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      // Fallback: return the first valid buffer if Gemini call fails
      return validCandidates[0]?.buf ?? null;
    }

    const data = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return validCandidates[0]?.buf ?? null;

    const decision = JSON.parse(text) as {
      best_index: number;
      is_exact_device?: boolean;
      is_clean_packshot?: boolean;
      confidence_score?: number;
    };

    if (decision.best_index >= 0 && decision.best_index < validCandidates.length && (decision.confidence_score ?? 100) >= 60) {
      return validCandidates[decision.best_index].buf;
    }

    return null;
  } catch {
    return validCandidates[0]?.buf ?? null;
  }
}

async function standardizePackshotBuffer(inputBuffer: Buffer, targetSize = 1400): Promise<Buffer> {
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
      .sharpen({ sigma: 1.0, m1: 0.8, m2: 2.0 })
      .webp({ quality: 90, effort: 4 })
      .toBuffer();
  } catch {
    return inputBuffer;
  }
}

// Convert standardized buffer to WebP and upload to blob storage
async function uploadPackshotBuffer(buffer: Buffer): Promise<string | null> {
  try {
    const standardized = await standardizePackshotBuffer(buffer, 1400);
    const file = new File([standardized as unknown as BlobPart], `research-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.webp`, { type: "image/webp" });
    const uploaded = await uploadProductImage(file);
    return uploaded.url;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const user = readSessionUserFromRequest(request);
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

    // Multi-angle photo discovery with Gemini Vision validation
    const brand = research.brand || "";
    const model = research.model || query;
    const gallerySet = new Set<string>();

    if (research.variants && research.variants.length > 0) {
      const uniqueColors = Array.from(
        new Set(research.variants.map((v) => v.color.trim()).filter(Boolean)),
      ).slice(0, 4);

      const colorImagesMap = new Map<string, string[]>();

      await Promise.all(
        uniqueColors.map(async (color) => {
          const angleQueries = [
            { angle: "front", query: `${brand} ${model} ${color} front packshot white background` },
            { angle: "back", query: `${brand} ${model} ${color} back rear packshot white background` },
            { angle: "side", query: `${brand} ${model} ${color} side profile packshot white background` },
            { angle: "angle", query: `${brand} ${model} ${color} angled 3d packshot white background` },
          ];

          const downloadedForColor: string[] = [];

          await Promise.all(
            angleQueries.map(async ({ angle, query: angleQuery }) => {
              const candidates = await searchProductOriginalImages(angleQuery);
              if (candidates.length === 0) return;

              const winnerBuf = await pickBestPackshotWithVision(candidates, brand, model, color, angle);
              if (!winnerBuf) return;

              const uploadedUrl = await uploadPackshotBuffer(winnerBuf);
              if (uploadedUrl && !downloadedForColor.includes(uploadedUrl)) {
                downloadedForColor.push(uploadedUrl);
                gallerySet.add(uploadedUrl);
              }
            }),
          );

          if (downloadedForColor.length > 0) {
            colorImagesMap.set(color, downloadedForColor);
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

    // If gallery is still empty or has few images, fetch general model renders with vision validation
    if (gallerySet.size < 3) {
      const generalCandidates = await searchProductOriginalImages(`${brand} ${model} official press packshot white background`);
      if (generalCandidates.length > 0) {
        const winnerBuf = await pickBestPackshotWithVision(generalCandidates, brand, model, "", "front");
        if (winnerBuf) {
          const uploaded = await uploadPackshotBuffer(winnerBuf);
          if (uploaded) gallerySet.add(uploaded);
        }
      }
    }

    research.gallery = Array.from(gallerySet).slice(0, 8);

    return NextResponse.json({ success: true, research });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Research failed";
    console.error("[product research]", message);
    const keyMissing = message.includes("GEMINI_API_KEY");
    return NextResponse.json({ error: keyMissing ? "Gemini API key is not configured" : "Research failed", code: keyMissing ? "gemini_key_missing" : "research_failed" }, { status: keyMissing ? 503 : 500 });
  }
}