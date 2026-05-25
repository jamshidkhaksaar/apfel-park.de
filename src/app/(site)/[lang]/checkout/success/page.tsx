import Link from "next/link";

import CheckoutSuccessClient from "@/components/checkout/CheckoutSuccessClient";
import { getOrderForConfirmation } from "@/lib/checkout";

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ order_id?: string; provider?: string; token?: string }>;
}) {
  const [{ lang }, query] = await Promise.all([params, searchParams]);
  const locale = lang === "en" ? "en" : "de";
  const order = query.order_id ? await getOrderForConfirmation(query.order_id).catch(() => null) : null;
  const paid = order?.payment_status === "paid";

  return (
    <section className="section-pad bg-background">
      <div className="container-page">
        <CheckoutSuccessClient
          locale={locale}
          orderId={query.order_id ?? null}
          provider={query.provider ?? null}
          paypalToken={query.token ?? null}
          initiallyPaid={paid}
          totalAmount={order ? Number(order.total_amount) : null}
          currency={order?.currency ?? "EUR"}
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

