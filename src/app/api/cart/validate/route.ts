import { NextRequest, NextResponse } from "next/server";

import { normalizeShippingMethod, validateCartItems, type CartInputItem } from "@/lib/checkout";
import { getProductBySlug, getRelatedProducts } from "@/lib/products";

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as {
      items?: CartInputItem[];
      shippingMethod?: string;
      locale?: string;
    };
    const locale = payload.locale === "en" ? "en" : "de";

    const cart = await validateCartItems(
      payload.items ?? [],
      normalizeShippingMethod(payload.shippingMethod),
    );

    // Accessory upsell: for each phone/tablet in the cart, the related-product
    // query already finds accessories that fit that device. Keep only the
    // accessories, de-duplicate, and cap at four so the strip stays quiet.
    const byId = new Map<string, string>();
    const seen = new Set<string>();
    const suggestions: Array<{ id: string; slug: string; title: string; image: string; price: number; subcategory?: string }> = [];
    for (const line of cart.items) {
      if (line.category !== "smartphones" && line.category !== "tablets") continue;
      byId.set(line.productId, line.slug);
    }
    if (byId.size > 0) {
      const products = await Promise.all(
        [...byId.entries()].map(async ([, slug]) => getProductBySlug(slug, locale)),
      );
      for (const product of products) {
        if (!product) continue;
        const related = await getRelatedProducts(product, 4, locale);
        for (const candidate of related) {
          if (candidate.category !== "accessories") continue;
          if (seen.has(candidate.id)) continue;
          seen.add(candidate.id);
          suggestions.push({
            id: candidate.id,
            slug: candidate.slug,
            title: candidate.title,
            image: candidate.image,
            price: candidate.price,
            subcategory: candidate.subcategory,
          });
        }
      }
    }

    return NextResponse.json(
      { success: true, cart, suggestions },
      { headers: { "Cache-Control": "no-store" } },
    );
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

