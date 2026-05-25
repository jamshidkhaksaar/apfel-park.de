import { NextRequest, NextResponse } from "next/server";

import { rejectCrossSiteAdminMutation } from "@/lib/admin-csrf";
import { isAdminUser } from "@/lib/admin-auth";
import { createAdminServerClient } from "@/lib/admin-auth-server";
import { uploadHeroAsset } from "@/lib/blob";
import { isSecureSvg, validateImageFileExtension } from "@/lib/security";

const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);
const MAX_VIDEO_SIZE = 30 * 1024 * 1024;
const MAX_POSTER_SIZE = 5 * 1024 * 1024;

const validateVideoExtension = (file: File) => {
  const name = file.name.toLowerCase();
  if (file.type === "video/mp4") return name.endsWith(".mp4");
  if (file.type === "video/webm") return name.endsWith(".webm");
  return false;
};

export async function POST(request: NextRequest) {
  const isEnglish = request.cookies.get("admin-lang")?.value === "en";
  const messages = {
    unauthorized: isEnglish ? "Unauthorized" : "Nicht autorisiert",
    invalidKind: isEnglish ? "Invalid upload kind" : "Ungultiger Upload-Typ",
    noFile: isEnglish ? "No file provided" : "Keine Datei ubergeben",
    unsupported: isEnglish ? "Unsupported file type" : "Nicht unterstutzter Dateityp",
    tooLarge: isEnglish ? "File is too large" : "Datei ist zu gross",
    unsafeSvg: isEnglish ? "Unsafe SVG content detected" : "Unsicherer SVG-Inhalt erkannt",
    extensionMismatch: isEnglish ? "File extension does not match content type" : "Dateiendung passt nicht zum Inhaltstyp",
    uploadFailed: isEnglish ? "Upload failed" : "Upload fehlgeschlagen",
  };

  const adminClient = await createAdminServerClient();
  const {
    data: { user },
  } = await adminClient.auth.getUser();

  if (!isAdminUser(user)) {
    return NextResponse.json({ error: messages.unauthorized }, { status: 401 });
  }
  const csrf = rejectCrossSiteAdminMutation(request, messages.unauthorized);
  if (csrf) return csrf;

  try {
    const formData = await request.formData();
    const kind = formData.get("kind");
    const file = formData.get("file");

    if (kind !== "video" && kind !== "poster" && kind !== "mobile") {
      return NextResponse.json({ error: messages.invalidKind }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: messages.noFile }, { status: 400 });
    }

    if (kind === "video") {
      if (!VIDEO_TYPES.has(file.type)) {
        return NextResponse.json({ error: `${messages.unsupported}: ${file.type}` }, { status: 400 });
      }
      if (!validateVideoExtension(file)) {
        return NextResponse.json({ error: messages.extensionMismatch }, { status: 400 });
      }
      if (file.size > MAX_VIDEO_SIZE) {
        return NextResponse.json({ error: messages.tooLarge }, { status: 400 });
      }
    }

    if (kind === "poster" || kind === "mobile") {
      if (!IMAGE_TYPES.has(file.type)) {
        return NextResponse.json({ error: `${messages.unsupported}: ${file.type}` }, { status: 400 });
      }
      if (!validateImageFileExtension(file)) {
        return NextResponse.json({ error: messages.extensionMismatch }, { status: 400 });
      }
      if (file.size > MAX_POSTER_SIZE) {
        return NextResponse.json({ error: messages.tooLarge }, { status: 400 });
      }
      if (file.type === "image/svg+xml") {
        const svg = await file.text();
        if (!isSecureSvg(svg)) {
          return NextResponse.json({ error: messages.unsafeSvg }, { status: 400 });
        }
      }
    }

    const upload = await uploadHeroAsset(file, kind);
    return NextResponse.json(upload);
  } catch (error) {
    console.error("Hero media upload failed:", error);
    return NextResponse.json({ error: messages.uploadFailed }, { status: 500 });
  }
}
