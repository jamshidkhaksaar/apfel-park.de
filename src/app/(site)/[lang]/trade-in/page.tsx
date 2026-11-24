import TradeInForm from "@/components/TradeInForm";
import { createMetadata } from "@/lib/metadata";
import { tradeInCopy } from "@/lib/page-copy/trade-in";
import { requireLocale } from "@/lib/route-locale";

export const generateMetadata = async ({ params }: { params: Promise<{ lang: string }> }) => {
  const { lang } = await params; const locale = requireLocale(lang);
  return createMetadata(locale, locale === "de" ? "Gerät verkaufen | Apfel Park" : "Sell your device | Apfel Park", locale === "de" ? "Smartphone bei Apfel Park in Hamburg zum Ankauf anbieten: Modell, Zustand und Fotos senden und ein unverbindliches, manuell geprüftes Angebot erhalten." : "Offer your smartphone to Apfel Park in Hamburg: send the model, condition and photos to receive a non-binding trade-in quote reviewed by our team.", "/trade-in");
};

export default async function TradeInPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params; const locale = requireLocale(lang); const copy = tradeInCopy(locale);
  return <div className="bg-store-ground py-10 sm:py-16"><div className="container-page max-w-4xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Trade-in</p><h1 className="mt-2 text-3xl font-semibold text-foreground sm:text-5xl">{copy.title}</h1><p className="mt-4 max-w-2xl text-base leading-7 text-muted">{copy.intro}</p><section className="mt-8" aria-labelledby="trade-in-details"><h2 id="trade-in-details" className="mb-5 text-xl font-semibold text-foreground">{copy.detailsTitle}</h2><TradeInForm locale={locale} /></section></div></div>;
}
