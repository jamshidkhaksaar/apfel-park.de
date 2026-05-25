import { NextRequest, NextResponse } from "next/server";

import { normalizeShippingMethod, validateCartItems, type CartInputItem } from "@/lib/checkout";

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as {
      items?: CartInputItem[];
      shippingMethod?: string;
    };

    const cart = await validateCartItems(
      payload.items ?? [],
      normalizeShippingMethod(payload.shippingMethod),
    );

    return NextResponse.json({ success: true, cart }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Cart could not be validated",
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
}

