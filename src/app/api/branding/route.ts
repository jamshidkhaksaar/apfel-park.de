import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isSecureSvg } from "@/lib/security";

const ALLOWED_TYPES: Record<string, string[]> = {
  logo: ["image/png", "image/jpeg", "image/svg+xml", "image/webp"],
  "logo-white": ["image/png", "image/svg+xml", "image/webp"],
  favicon: ["image/x-icon", "image/vnd.microsoft.icon", "image/png", "image/svg+xml"],
  "og-image": ["image/png", "image/jpeg", "image/webp"],
};

const FILE_NAMES: Record<string, string> = {
  logo: "logo",
  "logo-white": "logo-white",
  favicon: "favicon",
  "og-image": "og-image",
};

const DEFAULT_BRANDING = {
  logo: "/branding/logo.jpg",
  logoWhite: "/branding/apfel-park-white.png",
  favicon: "/favicon.ico",
  ogImage: "/images/shop2.jpg",
} as const;

const getExtension = (mimeType: string): string => {
  const extensions: Record<string, string> = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/svg+xml": ".svg",
    "image/webp": ".webp",
    "image/x-icon": ".ico",
    "image/vnd.microsoft.icon": ".ico",
  };
  return extensions[mimeType] || ".png";
};

export async function POST(request: NextRequest) {
  const isEnglish = request.cookies.get("admin-lang")?.value === "en";
  const messages = {
    unauthorized: isEnglish ? "Unauthorized" : "Nicht autorisiert",
    unknownField: isEnglish ? "Unknown field" : "Unbekanntes Feld",
    invalidType: isEnglish ? "Invalid file type for" : "Ungultiger Dateityp fur",
    tooLarge: isEnglish ? "File is too large (max 5MB)" : "Datei ist zu gross (max 5MB)",
    unsafeSvg: isEnglish ? "The SVG file contains unsafe code." : "Die SVG-Datei enthalt unsicheren Code.",
    noFiles: isEnglish ? "No files uploaded" : "Keine Dateien hochgeladen",
    saved: isEnglish ? "Saved successfully" : "Erfolgreich gespeichert",
    saveError: isEnglish ? "Failed to save files" : "Fehler beim Speichern der Dateien",
    blobMissing:
      isEnglish
        ? "BLOB_READ_WRITE_TOKEN is not configured"
        : "BLOB_READ_WRITE_TOKEN ist nicht konfiguriert",
  };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: messages.unauthorized }, { status: 401 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: messages.blobMissing }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const savedFiles: string[] = [];
    const uploadedUrls: Partial<Record<"logo" | "logoWhite" | "favicon" | "ogImage", string>> = {};

    for (const [fieldName, file] of formData.entries()) {
      if (!(file instanceof File)) {
        continue;
      }

      // Validate field name
        if (!ALLOWED_TYPES[fieldName]) {
          return NextResponse.json(
          { error: `${messages.unknownField}: ${fieldName}` },
          { status: 400 }
        );
      }

      const normalizedType =
        fieldName === "favicon" && !file.type && file.name.toLowerCase().endsWith(".ico")
          ? "image/x-icon"
          : file.type;

      // Validate file type
      if (!ALLOWED_TYPES[fieldName].includes(normalizedType)) {
        return NextResponse.json(
          { error: `${messages.invalidType} ${fieldName}: ${normalizedType || "unknown"}` },
          { status: 400 }
        );
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: `${fieldName} ${messages.tooLarge}` },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      // Validate SVG content for XSS
      if (file.type === "image/svg+xml") {
        const text = buffer.toString("utf-8");
        if (!isSecureSvg(text)) {
          return NextResponse.json(
            { error: `${fieldName}: ${messages.unsafeSvg}` },
            { status: 400 }
          );
        }
      }

      const extension = getExtension(normalizedType);
      const baseName = FILE_NAMES[fieldName];

      const blob = await put(`branding/${baseName}${extension}`, buffer, {
        access: "public",
        contentType: normalizedType,
        token: process.env.BLOB_READ_WRITE_TOKEN,
        addRandomSuffix: false,
        allowOverwrite: true,
      });

      if (fieldName === "logo") uploadedUrls.logo = blob.url;
      if (fieldName === "logo-white") uploadedUrls.logoWhite = blob.url;
      if (fieldName === "favicon") uploadedUrls.favicon = blob.url;
      if (fieldName === "og-image") uploadedUrls.ogImage = blob.url;
      savedFiles.push(fieldName);
    }

    if (savedFiles.length === 0) {
      return NextResponse.json(
        { error: messages.noFiles },
        { status: 400 }
      );
    }

    let existingValue: Record<string, string> | null = null;
    try {
      const admin = createAdminClient();
      const { data: existingRow } = await admin
        .from("store_settings")
        .select("value")
        .eq("key", "branding_assets")
        .maybeSingle();
      existingValue = (existingRow?.value as Record<string, string> | null) ?? null;
    } catch (error) {
      console.error("Failed to read existing branding settings:", error);
    }

    const mergedBranding = {
      ...DEFAULT_BRANDING,
      ...(existingValue ?? {}),
      ...uploadedUrls,
    };

    try {
      const admin = createAdminClient();
      const { error: saveSettingsError } = await admin.from("store_settings").upsert(
        {
          key: "branding_assets",
          value: mergedBranding,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" },
      );

      if (saveSettingsError) {
        console.error("Failed to save branding asset settings:", saveSettingsError);
      }
    } catch (error) {
      console.error("Failed to persist branding asset settings:", error);
    }

    return NextResponse.json({
      success: true,
      message: `${messages.saved}: ${savedFiles.join(", ")}`,
      files: savedFiles,
      branding: mergedBranding,
    });
  } catch (error) {
    console.error("Branding upload error:", error);
    return NextResponse.json(
      { error: messages.saveError },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("store_settings")
      .select("value")
      .eq("key", "branding_assets")
      .maybeSingle();

    const stored = (data?.value as Record<string, string> | null) ?? null;
    return NextResponse.json({
      ...DEFAULT_BRANDING,
      ...(stored ?? {}),
    });
  } catch {
    return NextResponse.json(DEFAULT_BRANDING);
  }
}
