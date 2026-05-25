import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CheckoutCancelPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = lang === "en" ? "en" : "de";

  return (
    <section className="section-pad bg-background">
      <div className="container-page">
        <div className="glass-panel mx-auto max-w-2xl rounded-2xl p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
            {locale === "de" ? "Zahlung abgebrochen" : "Payment cancelled"}
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-foreground">
            {locale === "de" ? "Deine Bestellung wurde nicht bezahlt." : "Your order was not paid."}
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted">
            {locale === "de"
              ? "Du kannst zum Warenkorb zurückkehren und den Checkout erneut starten."
              : "You can return to the cart and start checkout again."}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href={`/${locale}/cart`} className="btn-primary">
              {locale === "de" ? "Zum Warenkorb" : "Back to cart"}
            </Link>
            <Link href={`/${locale}/contact`} className="btn-secondary">
              {locale === "de" ? "Hilfe anfragen" : "Ask for help"}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

