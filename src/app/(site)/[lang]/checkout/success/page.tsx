import type { Metadata } from "next";
import Link from "next/link";

import CheckoutSuccessClient from "@/components/checkout/CheckoutSuccessClient";
import { getOrderForConfirmation, getOrderProductGtins } from "@/lib/checkout";
import { deliveryCountryCode, estimatedDeliveryDate } from "@/lib/delivery-estimate";
import { siteInfo } from "@/lib/site";
import { requireLocale } from "@/lib/route-locale";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ order_id?: string; provider?: string; token?: string }>;
}) {
  const [{ lang: rawLang }, query] = await Promise.all([params, searchParams]);
  const locale = requireLocale(rawLang);
  const order = query.order_id ? await getOrderForConfirmation(query.order_id).catch(() => null) : null;
  const paid = order?.payment_status === "paid";
  // orders.items is the JSON snapshot taken when the order was created, so the
  // recap shows what was actually bought even if a price changes later.
  const orderItems = Array.isArray(order?.items)
    ? (order.items as Array<{ title?: unknown; quantity?: unknown; lineAmount?: unknown; sku?: unknown }>)
        .map((item) => ({
          title: typeof item?.title === "string" ? item.title : "",
          quantity: typeof item?.quantity === "number" ? item.quantity : 1,
          lineAmount: typeof item?.lineAmount === "number" ? item.lineAmount : null,
          sku: typeof item?.sku === "string" ? item.sku : null,
        }))
        .filter((item) => item.title)
    : [];

  // Google Customer Reviews enrols the buyer from this page. Only a paid order
  // is enrolled, so a failed payment never triggers a survey.
  const productIds = Array.isArray(order?.items)
    ? (order.items as Array<{ productId?: unknown }>)
        .map((item) => (typeof item?.productId === "string" ? item.productId : null))
        .filter((id): id is string => Boolean(id))
    : [];
  const productGtins = paid ? await getOrderProductGtins(productIds) : [];
  const placedAt = order?.created_at ? new Date(order.created_at as string) : null;
  const deliveryEstimate =
    placedAt && !Number.isNaN(placedAt.getTime())
      ? estimatedDeliveryDate(
          placedAt,
          typeof order?.shipping_method === "string" ? order.shipping_method : null,
        )
      : "";

  return (
    <section className="section-pad bg-background">
      <div className="container-page">
        <CheckoutSuccessClient
          locale={locale}
          orderId={query.order_id ?? null}
          orderNumber={order?.order_number ?? null}
          provider={query.provider ?? null}
          paypalToken={query.token ?? null}
          initiallyPaid={paid}
          totalAmount={order ? Number(order.total_amount) : null}
          currency={order?.currency ?? "EUR"}
          items={orderItems}
          shippingMethod={typeof order?.shipping_method === "string" ? order.shipping_method : null}
          customerEmail={typeof order?.customer_email === "string" ? order.customer_email : null}
          customerName={typeof order?.customer_name === "string" ? order.customer_name : null}
          trustpilotInviteKey={process.env.NEXT_PUBLIC_TRUSTPILOT_INVITE_KEY?.trim() || ""}
          googleMerchantId={siteInfo.googleMerchantId}
          deliveryCountry={deliveryCountryCode(
            (order?.customer_address as { country?: unknown } | null | undefined)?.country,
          )}
          estimatedDeliveryDate={deliveryEstimate}
          productGtins={productGtins}
        />
        <div className="mt-8 flex justify-center gap-3">
          <Link href={`/${locale}/store`} className="btn-secondary">
            {locale === "de" ? "Weiter einkaufen" : "Continue shopping"}
          </Link>
          <Link href={`/${locale}/contact`} className="btn-primary">
            {locale === "de" ? "Kontakt" : "Contact"}
          </Link>
        </div>
      </div>
    </section>
  );
}

