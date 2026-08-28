import TradeInForm from "@/components/TradeInForm";
import { createMetadata } from "@/lib/metadata";
import { requireLocale } from "@/lib/route-locale";

export const generateMetadata = async ({ params }: { params: Promise<{ lang: string }> }) => {
  const { lang } = await params; const locale = requireLocale(lang);
  return createMetadata(locale, locale === "de" ? "Gerät verkaufen | Apfel Park" : "Sell your device | Apfel Park", locale === "de" ? "Fotos senden und ein unverbindliches, manuell geprüftes Trade-in Angebot erhalten." : "Send photos and receive a non-binding, manually reviewed trade-in quote.", "/trade-in");
};

export default async function TradeInPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params; const locale = requireLocale(lang); const de = locale === "de";
  return <div className="bg-store-ground py-10 sm:py-16"><div className="container-page max-w-4xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Trade-in</p><h1 className="mt-2 text-3xl font-semibold text-foreground sm:text-5xl">{de ? "Altes Gerät verkaufen" : "Sell your old device"}</h1><p className="mt-4 max-w-2xl text-base leading-7 text-muted">{de ? "Sende uns die wichtigsten Daten und echte Fotos. Ein Mitarbeiter prüft die Anfrage und erstellt ein unverbindliches Angebot. Der endgültige Preis wird erst nach Geräteprüfung bestätigt." : "Send the key details and real photos. A staff member reviews the request and prepares a non-binding quote. The final price is confirmed only after device inspection."}</p><div className="mt-8"><TradeInForm locale={locale} /></div></div></div>;
}
