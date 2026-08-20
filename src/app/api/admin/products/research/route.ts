import { NextRequest, NextResponse } from "next/server";

import { canManageProducts } from "@/lib/admin-auth";
import { rejectCrossSiteAdminMutation } from "@/lib/admin-csrf";
import { readSessionUserFromRequest } from "@/lib/session";
import { findSensitiveDataIssues } from "@/lib/product-intake/redaction";
import { sanitizeResearchResult, type ProductResearchResult } from "@/lib/product-research";

export const dynamic = "force-dynamic";

const GEMINI_MODEL = "gemini-3-flash"; // Gemini Flash 3.x (current stable; user asked for flash 3.7)

function geminiKey(): string {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new Error("GEMINI_API_KEY is not configured");
  return key;
}

const SYSTEM_PROMPT = `You are a product-research assistant for a German phone store.
Given a product model name (or a barcode/About image), return STRICT JSON with ONLY these keys:
title, subtitle, description, brand, model, category, specs (array of {label,value}),
features (array of strings), variants (array of {color,storage}), gallery (array of https URLs),
batteryDetails ({included, wattHours}), manufacturer ({name,address,email}),
euResponsiblePerson ({name,address,email}), energyLabel ({efficiencyClass,batteryEndurance}),
gtin (string, optional suggestion), mpn (string, optional suggestion).
Never invent GTIN/MPN; if unknown, omit them. Never include IMEI, serial, EID or MEID.`;

async function callGemini(payload: { prompt: string; image?: { mime: string; data: string } }): Promise<ProductResearchResult> {
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [{ text: payload.prompt }];
  if (payload.image) parts.push({ inlineData: { mimeType: payload.image.mime, data: payload.image.data } });
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiKey()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
    }),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Gemini request failed (${response.status}) ${detail.slice(0, 300)}`);
  }
  const data = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("");
  if (!text) throw new Error("Gemini returned no content");
  const jsonText = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  return sanitizeResearchResult(JSON.parse(jsonText));
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
    const research = await callGemini({ prompt, image });
    return NextResponse.json({ success: true, research });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Research failed";
    console.error("[product research]", message);
    const keyMissing = message.includes("GEMINI_API_KEY");
    return NextResponse.json({ error: keyMissing ? "Gemini API key is not configured" : "Research failed", code: keyMissing ? "gemini_key_missing" : "research_failed" }, { status: keyMissing ? 503 : 500 });
  }
}
