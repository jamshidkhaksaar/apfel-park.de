import { NextRequest, NextResponse } from "next/server";

import { isSecureSvg, validateFileExtension } from "@/lib/security";
import { uploadProductImage } from "@/lib/blob";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const isEnglish = request.cookies.get("admin-lang")?.value === "en";
  const messages = {
    unauthorized: isEnglish ? "Unauthorized" : "Nicht autorisiert",
    noFile: isEnglish ? "No file provided" : "Keine Datei ubergeben",
    unsupported: isEnglish ? "Unsupported file type" : "Nicht unterstutzter Dateityp",
    tooLarge: isEnglish ? "File exceeds 5MB limit" : "Datei uberschreitet 5MB Limit",
    unsafeSvg: isEnglish ? "Unsafe SVG content detected" : "Unsicherer SVG-Inhalt erkannt",
    invalidExtension: isEnglish ? "File extension does not match content type" : "Dateiendung stimmt nicht mit Dateityp überein",
    uploadFailed: isEnglish ? "Upload failed" : "Upload fehlgeschlagen",
  };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: messages.unauthorized }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: messages.noFile }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `${messages.unsupported}: ${file.type}` }, { status: 400 });
    }

    if (!validateFileExtension(file.name, file.type)) {
      return NextResponse.json({ error: messages.invalidExtension }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: messages.tooLarge }, { status: 400 });
    }

    if (file.type === "image/svg+xml") {
      const svgText = await file.text();
      if (!isSecureSvg(svgText)) {
        return NextResponse.json({ error: messages.unsafeSvg }, { status: 400 });
      }
    }

    const url = await uploadProductImage(file);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Product image upload failed:", error);
    return NextResponse.json({ error: messages.uploadFailed }, { status: 500 });
  }
}
