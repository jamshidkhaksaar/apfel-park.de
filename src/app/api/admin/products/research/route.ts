import { NextRequest, NextResponse } from "next/server";

import { canManageProducts } from "@/lib/admin-auth";
import { rejectCrossSiteAdminMutation } from "@/lib/admin-csrf";
import { readSessionUserFromRequest } from "@/lib/session";
import { findSensitiveDataIssues } from "@/lib/product-intake/redaction";
import { uploadProductImage } from "@/lib/blob";
import { sanitizeResearchResult, type ProductResearchResult } from "@/lib/product-research";

export const dynamic = "force-dynamic";

const GEMINI_MODEL = "gemini-2.5-flash"; // Proven on this server with the configured key

function geminiKey(): string {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new Error("GEMINI_API_KEY is not configured");
  return key;
}

const SYSTEM_PROMPT = `You are a product-research assistant for Apfel Park, a phone store in Hamburg. The store language is German; all product text must be in German (except where English is explicitly requested).

Given a product model name (or a barcode/About photo), research the REAL device and return STRICT JSON with ONLY these keys:
- title: string (German, marketing name + storage + color, e.g. "Apple iPhone 17 Pro Max 256 GB Titan Schwarz")
- subtitle: string (German, short selling line)
- description: string (German, 2-3 professional paragraphs: design, display, camera, chip, battery, features)
- brand: string
- model: string (marketing model name)
- category: one of "smartphones", "tablets", "accessories", "consoles", "laptops"
- specs: array of {label, value} (German labels: Display, Speicher, Kamera, Chip, Akku, Konnektivität, Gewicht, etc.)
- features: array of strings (German, 4-6 selling points)
- variants: array of {color, storage} (German color names, real storage options)
- gallery: array of https URLs (official manufacturer product images, same model+color, 2-6 images)
- batteryDetails: {included: boolean, wattHours: number}
- manufacturer: {name, address, email} (real manufacturer legal entity, e.g. Apple Distribution International Ltd, Hollyhill Industrial Estate, Cork, Ireland; contactus.de@euro.apple.com)
- euResponsiblePerson: {name, address, email} (real EU importer/responsible entity)
- energyLabel: {efficiencyClass, batteryEndurance} (only if the EU energy label applies; else null)
- countryOfOrigin: two-letter ISO code
- safetyWarnings: array of strings (German, e.g. "Nur mit zertifiziertem USB-C-Netzteil laden.")
- gtin: string (real EAN/GTIN only if you are certain; else omit)
- mpn: string (real manufacturer part number only if certain; else omit)

Rules:
- You have access to Google Search. Use it to find the LATEST real product data, official manufacturer specs, and current pricing. Do NOT rely on training data alone.
- Use ONLY factual, verifiable data about the real product. Never invent specs.
- Never include IMEI, serial, EID or MEID values.
- If the product is unknown or not yet announced, still return the best real manufacturer data (Apple may not have announced it; use the official Apple product family facts) and set description to factual German copy.
- Never add placeholder text like "test", "demo", "sample".
- Return ONLY valid JSON, no markdown.`;

async function callGemini(payload: { prompt: string; image?: { mime: string; data: string } }): Promise<unknown> {
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [{ text: payload.prompt }];
  if (payload.image) parts.push({ inlineData: { mimeType: payload.image.mime, data: payload.image.data } });
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiKey()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { temperature: 0.2 },
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
  const jsonText = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  return JSON.parse(jsonText);
}

// Download an official image, convert to small WebP via the existing uploader, return the local URL.
async function downloadAndUploadImage(url: string): Promise<string | null> {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return null;
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length === 0 || bytes.length > 12 * 1024 * 1024) return null;
    const extension = contentType.includes("png") ? ".png" : contentType.includes("webp") ? ".webp" : ".jpg";
    const file = new File([bytes], `research-${Date.now()}${extension}`, { type: contentType.split(";")[0] });
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

    // Download and upload gallery images in parallel with a hard cap so the
    // form fills quickly; failures are non-blocking and never delay the result.
    if (research.gallery && research.gallery.length > 0) {
      const local = (await Promise.all(
        research.gallery.slice(0, 3).map((url) => downloadAndUploadImage(url)),
      )).filter((url): url is string => Boolean(url));
      if (local.length > 0) research.gallery = local;
    }

    return NextResponse.json({ success: true, research });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Research failed";
    console.error("[product research]", message);
    const keyMissing = message.includes("GEMINI_API_KEY");
    return NextResponse.json({ error: keyMissing ? "Gemini API key is not configured" : "Research failed", code: keyMissing ? "gemini_key_missing" : "research_failed" }, { status: keyMissing ? 503 : 500 });
  }
}