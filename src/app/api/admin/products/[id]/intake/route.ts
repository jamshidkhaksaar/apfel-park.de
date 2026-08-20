import { NextRequest, NextResponse } from "next/server";

import { authorizeProductStaff } from "@/lib/product-intake/admin-auth";
import { productIntakeErrorResponse } from "@/lib/product-intake/http";
import { listIntakeRunsForProduct, listProductRevisions, loadCatalogSnapshot } from "@/lib/product-intake/workspace-repository";
import { SchemaValidationError } from "@/lib/product-intake/errors";

export const dynamic = "force-dynamic";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    authorizeProductStaff(request);
    const { id } = await context.params;
    if (!uuidPattern.test(id)) throw new SchemaValidationError(["product id must be a UUID"]);
    const [snapshot, runs, revisions] = await Promise.all([
      loadCatalogSnapshot(id),
      listIntakeRunsForProduct(id, 50),
      listProductRevisions(id, 50),
    ]);
    return NextResponse.json({ success: true, snapshot, runs, revisions });
  } catch (error) {
    return productIntakeErrorResponse(error);
  }
}
