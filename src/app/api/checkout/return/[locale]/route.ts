import { NextRequest, NextResponse } from "next/server";

import {
  CHECKOUT_RETURN_COOKIE,
  readCheckoutReturnSession,
} from "@/lib/checkout-return-session";

export const dynamic = "force-dynamic";

const publicBaseUrl = () => {
  try {
    return new URL(process.env.SITE_URL || "https://apfel-park.de");
  } catch {
    return new URL("https://apfel-park.de");
  }
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === "en" ? "en" : rawLocale === "de" ? "de" : null;
  const orderId = request.nextUrl.searchParams.get("order_id") ?? "";
  const provider = request.nextUrl.searchParams.get("provider");
  const paypalOrderId = provider === "paypal" ? request.nextUrl.searchParams.get("token") : null;
  const returnSession = readCheckoutReturnSession(request.cookies.get(CHECKOUT_RETURN_COOKIE)?.value);

  if (
    !locale
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId)
    || (provider !== "stripe" && provider !== "paypal")
    || returnSession?.orderId !== orderId
    || (provider === "paypal" && (!paypalOrderId || paypalOrderId !== returnSession.paypalOrderId))
  ) {
    return NextResponse.redirect(new URL(`/${locale ?? "de"}/checkout/success`, publicBaseUrl()), 303);
  }

  const destination = new URL(`/${locale}/checkout/success`, publicBaseUrl());
  destination.searchParams.set("order_id", orderId);
  destination.searchParams.set("provider", provider);
  const response = NextResponse.redirect(destination, 303);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
