import { NextRequest, NextResponse } from "next/server";

import { rejectCrossSiteAdminMutation } from "@/lib/admin-csrf";
import { isAdminUser } from "@/lib/admin-auth";
import { createAdminServerClient } from "@/lib/admin-auth-server";
import { uploadRepairBrandLogo, uploadRepairDeviceImage } from "@/lib/blob";
import { isSecureSvg, validateImageFileExtension } from "@/lib/security";

const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const adminClient = await createAdminServerClient();
  const {
    data: { user },
  } = await adminClient.auth.getUser();

  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const csrf = rejectCrossSiteAdminMutation(request);
  if (csrf) return csrf;

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "brand" | null (device)

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!IMAGE_TYPES.has(file.type)) {
      return NextResponse.json({ error: `Unsupported file type: ${file.type}` }, { status: 400 });
    }

    if (!validateImageFileExtension(file)) {
      return NextResponse.json({ error: "File extension does not match content type" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 400 });
    }

    if (file.type === "image/svg+xml") {
      const svg = await file.text();
      if (!isSecureSvg(svg)) {
        return NextResponse.json({ error: "Unsafe SVG content detected" }, { status: 400 });
      }
    }

    if (type === "brand") {
      const result = await uploadRepairBrandLogo(file);
      return NextResponse.json(result);
    }

    const result = await uploadRepairDeviceImage(file);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Repair image upload failed:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
