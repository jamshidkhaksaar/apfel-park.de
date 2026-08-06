import { NextResponse, type NextRequest } from "next/server";

import { submitProductReview } from "@/lib/product-reviews";

export const dynamic = "force-dynamic";

const MESSAGES = {
  de: {
    invalid_rating: "Bitte vergib eine Bewertung von 1 bis 5 Sternen.",
    missing_fields: "Bitte fülle Name und Bewertungstext aus.",
    too_long: "Die Eingaben sind zu lang.",
    duplicate: "Für diese Bestellung liegt bereits eine Bewertung vor.",
    failed: "Bewertung konnte nicht gespeichert werden.",
  },
  en: {
    invalid_rating: "Please give a rating from 1 to 5 stars.",
    missing_fields: "Please fill in your name and review text.",
    too_long: "The input is too long.",
    duplicate: "A review already exists for this order.",
    failed: "The review could not be saved.",
  },
} as const;

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const locale = payload.locale === "en" ? "en" : "de";

    const result = await submitProductReview({
      productId: typeof payload.productId === "string" ? payload.productId : "",
      authorName: typeof payload.authorName === "string" ? payload.authorName : "",
      rating: typeof payload.rating === "number" ? payload.rating : Number.NaN,
      title: typeof payload.title === "string" ? payload.title : undefined,
      body: typeof payload.body === "string" ? payload.body : "",
      locale,
      orderId: typeof payload.orderId === "string" ? payload.orderId : null,
      token: typeof payload.token === "string" ? payload.token : null,
    });

    if (!result.ok) {
      return NextResponse.json({ success: false, error: MESSAGES[locale][result.error] }, { status: 400 });
    }

    return NextResponse.json({ success: true, verified: result.verified });
  } catch (error) {
    console.error("Submit review failed:", error);
    return NextResponse.json({ success: false, error: MESSAGES.de.failed }, { status: 400 });
  }
}
