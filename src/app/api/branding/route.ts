import { NextRequest, NextResponse } from "next/server";

import { isAdminUser } from "@/lib/admin-auth";
import { rejectCrossSiteAdminMutation } from "@/lib/admin-csrf";
import { uploadBrandingAsset } from "@/lib/blob";
import { createAdminDbClient } from "@/lib/admin-db";
import { createAdminServerClient } from "@/lib/admin-auth-server";
import { defaultSocialLinks } from "@/lib/site";
import { isSecureSvg, validateImageFileExtension } from "@/lib/security";

const ALLOWED_TYPES: Record<string, string[]> = {
  logo: ["image/png", "image/jpeg", "image/svg+xml", "image/webp"],
  "logo-white": ["image/png", "image/svg+xml", "image/webp"],
  favicon: [
    "image/x-icon",
    "image/vnd.microsoft.icon",
    "application/octet-stream",
    "image/png",
    "image/svg+xml",
  ],
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

const SOCIAL_FIELDS = ["instagram", "facebook", "tiktok", "whatsapp"] as const;
type SocialField = (typeof SOCIAL_FIELDS)[number];

const getExtension = (mimeType: string): string => {
  const extensions: Record<string, string> = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/svg+xml": ".svg",
    "image/webp": ".webp",
    "image/x-icon": ".ico",
    "image/vnd.microsoft.icon": ".ico",
    "application/octet-stream": ".ico",
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
    extensionMismatch:
      isEnglish
        ? "File extension does not match content type for"
        : "Dateiendung passt nicht zum Inhaltstyp fur",
  };

  const adminClient = await createAdminServerClient();
  const {
    data: { user },
  } = await adminClient.auth.getUser();

  if (!isAdminUser(user)) {
    return NextResponse.json({ error: messages.unauthorized }, { status: 401 });
  }
  const csrf = rejectCrossSiteAdminMutation(request);
  if (csrf) return csrf;

  try {
    const formData = await request.formData();
    const savedFiles: string[] = [];
    const uploadedUrls: Partial<Record<"logo" | "logoWhite" | "favicon" | "ogImage", string>> = {};
    const submittedSocialLinks: Partial<Record<SocialField, string>> = {};

    for (const field of SOCIAL_FIELDS) {
      const value = formData.get(field);
      if (typeof value === "string") {
        submittedSocialLinks[field] = value.trim();
      }
    }

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

      // Validate file extension matches content type
      let isValidExtension = false;
      if (fieldName === "favicon" && !file.type && file.name.toLowerCase().endsWith(".ico")) {
        isValidExtension = true;
      } else {
        isValidExtension = validateImageFileExtension(file);
      }

      if (!isValidExtension) {
        return NextResponse.json(
          { error: `${messages.extensionMismatch} ${fieldName}` },
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

      try {
        const uploadedUrl = await uploadBrandingAsset(`${baseName}${extension}`, buffer);
        if (fieldName === "logo") uploadedUrls.logo = uploadedUrl;
        if (fieldName === "logo-white") uploadedUrls.logoWhite = uploadedUrl;
        if (fieldName === "favicon") uploadedUrls.favicon = uploadedUrl;
        if (fieldName === "og-image") uploadedUrls.ogImage = uploadedUrl;
      } catch (error) {
        const detail = error instanceof Error ? error.message : "Unknown upload error";
        throw new Error(`${fieldName}: ${detail}`);
      }
      savedFiles.push(fieldName);
    }

    if (savedFiles.length === 0) {
      const hasSocialUpdates = Object.values(submittedSocialLinks).some((value) => typeof value === "string");
      if (!hasSocialUpdates) {
        return NextResponse.json({ error: messages.noFiles }, { status: 400 });
      }
    }

    let existingValue: Record<string, string> | null = null;
    let existingSocialLinks: Record<string, string> | null = null;
    try {
      const admin = createAdminDbClient();
      const { data: existingRow } = await admin
        .from("store_settings")
        .select("value")
        .eq("key", "branding_assets")
        .maybeSingle();
      existingValue = (existingRow?.value as Record<string, string> | null) ?? null;

      const { data: socialRow } = await admin
        .from("store_settings")
        .select("value")
        .eq("key", "site_social_links")
        .maybeSingle();
      existingSocialLinks = (socialRow?.value as Record<string, string> | null) ?? null;
    } catch (error) {
      console.error("Failed to read existing branding settings:", error);
    }

    const mergedBranding = {
      ...DEFAULT_BRANDING,
      ...(existingValue ?? {}),
      ...uploadedUrls,
    };

    const mergedSocialLinks = {
      ...defaultSocialLinks,
      ...(existingSocialLinks ?? {}),
      ...submittedSocialLinks,
    };

    try {
      const admin = createAdminDbClient();
      const { error: saveSettingsError } = await admin.from("store_settings").upsert(
        {
          key: "branding_assets",
          value: mergedBranding,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" },
      );

      const { error: saveSocialError } = await admin.from("store_settings").upsert(
        {
          key: "site_social_links",
          value: mergedSocialLinks,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" },
      );

      if (saveSettingsError || saveSocialError) {
        return NextResponse.json(
          { error: saveSettingsError?.message || saveSocialError?.message || messages.saveError },
          { status: 500 },
        );
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : messages.saveError;
      return NextResponse.json({ error: `${messages.saveError} (${detail})` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `${messages.saved}: ${savedFiles.join(", ")}`,
      files: savedFiles,
      branding: mergedBranding,
      socialLinks: mergedSocialLinks,
    });
  } catch (error) {
    console.error("Branding upload error:", error);
    const detail = error instanceof Error ? error.message : messages.saveError;
    return NextResponse.json({ error: `${messages.saveError} (${detail})` }, { status: 500 });
  }
}

export async function GET() {
  const adminClient = await createAdminServerClient();
  const {
    data: { user },
  } = await adminClient.auth.getUser();

  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminDbClient();
    const { data } = await admin
      .from("store_settings")
      .select("value")
      .eq("key", "branding_assets")
      .maybeSingle();

    const { data: socialData } = await admin
      .from("store_settings")
      .select("value")
      .eq("key", "site_social_links")
      .maybeSingle();

    const stored = (data?.value as Record<string, string> | null) ?? null;
    const socialLinks = (socialData?.value as Record<string, string> | null) ?? null;
    return NextResponse.json({
      ...DEFAULT_BRANDING,
      ...(stored ?? {}),
      socialLinks: {
        ...defaultSocialLinks,
        ...(socialLinks ?? {}),
      },
    });
  } catch {
    return NextResponse.json({
      ...DEFAULT_BRANDING,
      socialLinks: defaultSocialLinks,
    });
  }
}
