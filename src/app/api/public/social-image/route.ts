import { readFile } from "node:fs/promises";

import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

import { resolveUploadPath } from "@/lib/blob";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get("src") ?? "";
  const filePath = resolveUploadPath(source);

  if (!filePath) {
    return NextResponse.json({ error: "Invalid image source" }, { status: 400 });
  }

  try {
    const input = await readFile(filePath);
    const image = await sharp(input, { failOn: "warning" })
      .rotate()
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 90, progressive: true })
      .toBuffer();

    return new NextResponse(new Uint8Array(image), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("[SocialImage] Failed to render JPEG:", error);
    return NextResponse.json({ error: "Image unavailable" }, { status: 404 });
  }
}
