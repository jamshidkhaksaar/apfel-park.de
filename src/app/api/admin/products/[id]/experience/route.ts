import { NextResponse, type NextRequest } from "next/server";

import { canManageProducts } from "@/lib/admin-auth";
import { createAdminServerClient } from "@/lib/admin-auth-server";
import { rejectCrossSiteAdminMutation } from "@/lib/admin-csrf";
import {
  getProductExperienceAdminContext,
  saveProductExperienceBundle,
  saveProductExperienceProfile,
  saveProductFamily,
} from "@/lib/product-experience-repository";

export const dynamic = "force-dynamic";

const allowedId = (value: string) => /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(value);

async function authorize() {
  const client = await createAdminServerClient();
  const { data: { user } } = await client.auth.getUser();
  return canManageProducts(user);
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await authorize())) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!allowedId(id)) return NextResponse.json({ success: false, error: "Invalid product" }, { status: 400 });
  try {
    return NextResponse.json({ success: true, ...(await getProductExperienceAdminContext(id)) });
  } catch (error) {
    console.error("Load product experience failed:", error);
    return NextResponse.json({ success: false, error: "Load failed" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await authorize())) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const csrf = rejectCrossSiteAdminMutation(request, "Unauthorized");
  if (csrf) return csrf;
  const { id } = await params;
  if (!allowedId(id)) return NextResponse.json({ success: false, error: "Invalid product" }, { status: 400 });
  try {
    const payload = await request.json() as { profile?: unknown; family?: Parameters<typeof saveProductFamily>[0] };
    const hasFamily = payload.family !== undefined;
    const atomic = payload.profile !== undefined && hasFamily ? await saveProductExperienceBundle(id, payload.profile, payload.family) : null;
    const profile = atomic ? atomic.profile : (payload.profile === undefined ? undefined : await saveProductExperienceProfile(id, payload.profile));
    const familyId = atomic ? atomic.familyId : (hasFamily && payload.profile === undefined ? await saveProductFamily(payload.family!) : undefined);
    return NextResponse.json({ success: true, profile, familyId });
  } catch (error) {
    console.error("Save product experience failed:", error);
    const message = error instanceof Error ? error.message : "Save failed";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
