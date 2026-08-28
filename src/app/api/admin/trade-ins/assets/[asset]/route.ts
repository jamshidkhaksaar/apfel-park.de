import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";

import { canManageOrders } from "@/lib/admin-auth";
import { createAdminServerClient } from "@/lib/admin-auth-server";

const privateRoot = process.env.TRADE_IN_PRIVATE_DIR || path.join(path.dirname(process.env.UPLOADS_DIR || "/srv/apfel-park/app/shared/uploads"), "private", "trade-ins");

export async function GET(_: NextRequest, { params }: { params: Promise<{ asset: string }> }) {
  const client = await createAdminServerClient(); const { data: { user } } = await client.auth.getUser();
  if (!canManageOrders(user)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { asset } = await params;
  if (!/^[0-9a-f-]{36}\.webp$/i.test(asset)) return NextResponse.json({ error: "Invalid asset" }, { status: 400 });
  try {
    const buffer = await readFile(path.join(privateRoot, asset));
    return new NextResponse(buffer, { headers: { "Content-Type": "image/webp", "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff" } });
  } catch { return NextResponse.json({ error: "Not found" }, { status: 404 }); }
}
