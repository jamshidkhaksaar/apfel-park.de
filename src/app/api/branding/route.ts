import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

import { createClient } from "@/lib/supabase/server";

const BRANDING_DIR = path.join(process.cwd(), "public", "branding");
const PUBLIC_DIR = path.join(process.cwd(), "public");

const ALLOWED_TYPES: Record<string, string[]> = {
  logo: ["image/png", "image/jpeg", "image/svg+xml", "image/webp"],
  favicon: ["image/x-icon", "image/png", "image/svg+xml"],
  "og-image": ["image/png", "image/jpeg", "image/webp"],
};

const FILE_NAMES: Record<string, string> = {
  logo: "logo",
  favicon: "favicon",
  "og-image": "og-image",
};

const getExtension = (mimeType: string): string => {
  const extensions: Record<string, string> = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/svg+xml": ".svg",
    "image/webp": ".webp",
    "image/x-icon": ".ico",
  };
  return extensions[mimeType] || ".png";
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const savedFiles: string[] = [];

    // Ensure branding directory exists
    if (!existsSync(BRANDING_DIR)) {
      await mkdir(BRANDING_DIR, { recursive: true });
    }

    for (const [fieldName, file] of formData.entries()) {
      if (!(file instanceof File)) {
        continue;
      }

      // Validate field name
      if (!ALLOWED_TYPES[fieldName]) {
        return NextResponse.json(
          { error: `Unbekanntes Feld: ${fieldName}` },
          { status: 400 }
        );
      }

      // Validate file type
      if (!ALLOWED_TYPES[fieldName].includes(file.type)) {
        return NextResponse.json(
          { error: `Ungultiger Dateityp fur ${fieldName}: ${file.type}` },
          { status: 400 }
        );
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: `Datei ${fieldName} ist zu gros (max 5MB)` },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const extension = getExtension(file.type);
      const baseName = FILE_NAMES[fieldName];

      // Favicon goes to public root, others to branding folder
      let filePath: string;
      if (fieldName === "favicon") {
        // For favicon, save as favicon.ico in public root
        filePath = path.join(PUBLIC_DIR, "favicon.ico");
      } else {
        filePath = path.join(BRANDING_DIR, `${baseName}${extension}`);
      }

      await writeFile(filePath, buffer);
      savedFiles.push(fieldName);
    }

    if (savedFiles.length === 0) {
      return NextResponse.json(
        { error: "Keine Dateien hochgeladen" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Erfolgreich gespeichert: ${savedFiles.join(", ")}`,
      files: savedFiles,
    });
  } catch (error) {
    console.error("Branding upload error:", error);
    return NextResponse.json(
      { error: "Fehler beim Speichern der Dateien" },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return current branding configuration
  const brandingConfig = {
    logo: existsSync(path.join(BRANDING_DIR, "logo.png"))
      ? "/branding/logo.png"
      : existsSync(path.join(BRANDING_DIR, "logo.jpg"))
        ? "/branding/logo.jpg"
        : existsSync(path.join(BRANDING_DIR, "logo.svg"))
          ? "/branding/logo.svg"
          : null,
    favicon: existsSync(path.join(PUBLIC_DIR, "favicon.ico"))
      ? "/favicon.ico"
      : null,
    ogImage: existsSync(path.join(BRANDING_DIR, "og-image.png"))
      ? "/branding/og-image.png"
      : existsSync(path.join(BRANDING_DIR, "og-image.jpg"))
        ? "/branding/og-image.jpg"
        : null,
  };

  return NextResponse.json(brandingConfig);
}
