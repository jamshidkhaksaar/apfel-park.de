"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";

import { addStoredCartItem } from "@/components/checkout/cart";
import { MINI_CART_OPEN_EVENT } from "@/components/checkout/MiniCart";
import { formatPrice } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { shouldBypassImageOptimization } from "@/lib/image";
import { getFamilyOptionTarget, localizedText, type ExperienceProductSummary, type ProductExperienceProfile, type ProductFamilyView } from "@/lib/product-experience";

const sectionClass = "rounded-2xl border border-border bg-store-card p-5 sm:p-7";
const WISHLIST_KEY = "apfel-wishlist-v1";
const wishlistEvent = "apfel-wishlist-change";
const readWishlistSnapshot = () => {
  if (typeof window === "undefined") return "[]";
  try { return localStorage.getItem(WISHLIST_KEY) || "[]"; } catch { return "[]"; }
};
const parseWishlist = (raw: string): string[] => {
  try { const value = JSON.parse(raw); return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string").slice(0, 100) : []; } catch { return []; }
};
const subscribeWishlist = (listener: () => void) => {
  const notify = () => listener();
  window.addEventListener("storage", notify);
  window.addEventListener(wishlistEvent, notify);
  return () => { window.removeEventListener("storage", notify); window.removeEventListener(wishlistEvent, notify); };
};

export function ProductWishlistButton({ productId, title, locale }: { productId: string; title: string; locale: Locale }) {
  const raw = useSyncExternalStore(subscribeWishlist, readWishlistSnapshot, () => "[]");
  const saved = useMemo(() => parseWishlist(raw).includes(productId), [productId, raw]);
  const toggle = () => {
    const ids = parseWishlist(readWishlistSnapshot());
    const next = ids.includes(productId) ? ids.filter((id) => id !== productId) : [...ids, productId];
    try { localStorage.setItem(WISHLIST_KEY, JSON.stringify(next.slice(0, 100))); window.dispatchEvent(new Event(wishlistEvent)); } catch { /* Restricted storage: keep the page functional. */ }
  };
  return <button type="button" onClick={toggle} aria-pressed={saved} aria-label={saved ? (locale === "de" ? `${title} von Wunschliste entfernen` : `Remove ${title} from wishlist`) : (locale === "de" ? `${title} zur Wunschliste hinzufügen` : `Add ${title} to wishlist`)} className="grid size-11 place-items-center rounded-full border border-border bg-surface text-xl text-gold transition hover:border-gold/50 active:scale-95">{saved ? "♥" : "♡"}</button>;
}

export function ProductFamilyConfigurator({ family, locale }: { family: ProductFamilyView; locale: Locale }) {
  const axes = family.optionAxes.filter((axis) => family.members.some((member) => member.optionValues[axis]));
  if (axes.length === 0 || family.members.length < 2) return null;
  return <section className="mt-5 rounded-2xl border border-border/60 bg-surface/50 p-4" aria-label={locale === "de" ? "Produktvarianten" : "Product variants"}>
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{family.name}</p>
    <div className="mt-4 space-y-4">{axes.map((axis) => <div key={axis}><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{axis}</p><div className="mt-2 flex flex-wrap gap-2">{Array.from(new Set(family.members.map(member=>member.optionValues[axis]).filter(Boolean))).map(value=>{const member=getFamilyOptionTarget(family,axis,value);const classes=`min-h-11 rounded-xl border px-4 py-2.5 text-sm font-medium ${member?.selected?"border-gold bg-gold/10 text-foreground ring-1 ring-gold/30":member&&member.stock>0?"border-border bg-background/50 text-foreground hover:border-gold/50":"border-border text-muted opacity-55"}`;return member?<Link key={value} href={`/${locale}/store/${member.slug}`} aria-current={member.selected?"page":undefined} className={classes}>{value}{member.stock<=0?<span className="ml-2 text-[10px] uppercase">{locale==="de"?"nicht verfügbar":"unavailable"}</span>:null}</Link>:<span key={value} aria-disabled="true" className={classes}>{value}<span className="ml-2 text-[10px] uppercase">{locale==="de"?"Kombination fehlt":"combination unavailable"}</span></span>})}</div></div>)}</div>
  </section>;
}

function DeviceSilhouette({ product, active }: { product: ExperienceProductSummary; active?: boolean }) {
  const height = product.dimensions?.heightMm ?? 150;
  const width = product.dimensions?.widthMm ?? 72;
  const scale = Math.min(1, 165 / height);
  return <div className="flex flex-col items-center gap-2"><div className={`relative rounded-[18px] border-2 ${active ? "border-gold bg-gold/5" : "border-border bg-background"}`} style={{ height: `${height * scale}px`, width: `${width * scale}px` }}><span className="absolute left-1/2 top-2 h-1.5 w-8 -translate-x-1/2 rounded-full bg-muted/40" /></div><p className="max-w-40 text-center text-xs font-medium text-foreground">{product.title}</p><p className="text-[11px] text-muted">{height} × {width} mm</p></div>;
}

export default function ProductExperienceSections({
  profile, comparisons, bundles, current, locale,
}: {
  profile: ProductExperienceProfile;
  comparisons: ExperienceProductSummary[];
  bundles: ExperienceProductSummary[];
  current: ExperienceProductSummary;
  locale: Locale;
}) {
  const de = locale === "de";
  const [bundleAdded, setBundleAdded] = useState(false);
  const packageItems = profile.enabledSections.packageContents ? profile.packageContents : [];
  const conditions = profile.enabledSections.conditionGuide ? profile.conditionGuide : [];
  const compareItems = useMemo(() => [current, ...comparisons].filter((item, index, list) => list.findIndex((candidate) => candidate.id === item.id) === index), [comparisons, current]);
  const addBundle = () => {
    for (const product of bundles.filter((item) => item.stock > 0 && !item.requiresVariantSelection)) addStoredCartItem({ productId: product.id, variantColor: product.variantColor ?? null, variantStorage: product.variantStorage ?? null, quantity: 1 });
    setBundleAdded(true); window.dispatchEvent(new Event(MINI_CART_OPEN_EVENT));
  };
  const visible = packageItems.length || conditions.length || (profile.enabledSections.refurbishment && (profile.refurbishmentSteps.length || profile.trustPoints.length)) || ((profile.enabledSections.sizeComparison || profile.enabledSections.modelComparison) && comparisons.length) || (profile.enabledSections.bundles && bundles.length) || profile.enabledSections.tradeIn;
  if (!visible) return null;

  return <div className="mt-8 space-y-6">
    {packageItems.length ? <section className={sectionClass}><h2 className="text-2xl font-semibold text-foreground">{de ? "Was ist enthalten?" : "What is included?"}</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{packageItems.map((item, index) => <div key={`${localizedText(item.label, locale)}-${index}`} className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 p-3"><span className={item.included ? "text-green" : "text-red"}>{item.included ? "✓" : "×"}</span><span className="text-sm text-foreground">{localizedText(item.label, locale)}</span></div>)}</div></section> : null}

    {conditions.length ? <section className={sectionClass}><h2 className="text-2xl font-semibold text-foreground">{de ? "Zustände vergleichen" : "Compare conditions"}</h2><p className="mt-2 text-sm text-muted">{de ? "Beispielbilder erklären die Kategorie. Die Produktgalerie zeigt das konkrete Gerät." : "Example images explain the category. The product gallery shows the actual unit."}</p><div className="mt-5 grid gap-4 md:grid-cols-3">{conditions.map((item) => <article key={item.condition} className="overflow-hidden rounded-xl border border-border/60"><div className="grid h-36 grid-cols-2 bg-white">{item.imageUrls.slice(0, 2).map((url) => <div key={url} className="relative"><Image src={url} alt="" fill sizes="220px" className="object-contain p-2" unoptimized={shouldBypassImageOptimization(url)} /></div>)}</div><div className="p-4"><h3 className="font-semibold text-foreground">{localizedText(item.label, locale)}</h3><p className="mt-2 text-sm leading-6 text-muted">{localizedText(item.description, locale)}</p></div></article>)}</div></section> : null}

    {profile.enabledSections.refurbishment && (profile.refurbishmentSteps.length || profile.trustPoints.length) ? <section className={sectionClass}><h2 className="text-2xl font-semibold text-foreground">{de ? "Prüfung & Aufbereitung" : "Testing & refurbishment"}</h2><div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{profile.refurbishmentSteps.map((step, index) => <article key={`${localizedText(step.title, locale)}-${index}`} className="rounded-xl border border-border/60 bg-background/40 p-4"><span className="text-sm font-bold text-gold">{String(index + 1).padStart(2, "0")}</span><h3 className="mt-2 font-semibold text-foreground">{localizedText(step.title, locale)}</h3><p className="mt-2 text-sm leading-6 text-muted">{localizedText(step.description, locale)}</p></article>)}{profile.trustPoints.map((point, index) => <article key={`${localizedText(point.title, locale)}-${index}`} className="rounded-xl border border-green/30 bg-green/5 p-4"><h3 className="font-semibold text-foreground">✓ {localizedText(point.title, locale)}</h3><p className="mt-2 text-sm leading-6 text-muted">{localizedText(point.description, locale)}</p></article>)}</div></section> : null}

    {(profile.enabledSections.sizeComparison || profile.enabledSections.modelComparison) && comparisons.length ? <section className={sectionClass}><h2 className="text-2xl font-semibold text-foreground">{de ? "Größe & Modelle vergleichen" : "Compare size & models"}</h2>{profile.enabledSections.sizeComparison ? <div className="mt-6 flex flex-wrap items-end justify-center gap-8 overflow-x-auto pb-2">{compareItems.filter((item) => item.dimensions?.heightMm && item.dimensions?.widthMm).map((item) => <DeviceSilhouette key={item.id} product={item} active={item.id === current.id} />)}</div> : null}{profile.enabledSections.modelComparison ? <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead><tr className="border-b border-border text-muted"><th className="p-3">{de ? "Modell" : "Model"}</th><th className="p-3">{de ? "Zustand" : "Condition"}</th><th className="p-3">{de ? "Größe" : "Size"}</th><th className="p-3">{de ? "Gewicht" : "Weight"}</th><th className="p-3">{de ? "Preis" : "Price"}</th></tr></thead><tbody>{compareItems.map((item) => <tr key={item.id} className="border-b border-border/50"><td className="p-3"><Link href={`/${locale}/store/${item.slug}`} className="font-semibold text-foreground hover:text-gold">{item.title}</Link></td><td className="p-3 text-muted">{item.condition}</td><td className="p-3 text-muted">{item.dimensions?.heightMm && item.dimensions?.widthMm ? `${item.dimensions.heightMm} × ${item.dimensions.widthMm} mm` : "—"}</td><td className="p-3 text-muted">{item.dimensions?.weightG ? `${item.dimensions.weightG} g` : "—"}</td><td className="p-3 font-semibold text-foreground">{formatPrice(locale, item.price)}</td></tr>)}</tbody></table></div> : null}</section> : null}

    {profile.enabledSections.bundles && bundles.length ? <section className={sectionClass}><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-2xl font-semibold text-foreground">{de ? "Passt perfekt dazu" : "Perfectly compatible"}</h2><p className="mt-2 text-sm text-muted">{de ? "Vom Shop manuell als kompatibel bestätigt." : "Manually confirmed as compatible by the shop."}</p></div><button type="button" onClick={addBundle} className="btn-primary min-h-11 px-5">{bundleAdded ? (de ? "Hinzugefügt ✓" : "Added ✓") : (de ? "Verfügbare Artikel hinzufügen" : "Add available items")}</button></div><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{bundles.map((item) => <Link key={item.id} href={`/${locale}/store/${item.slug}`} className="overflow-hidden rounded-xl border border-border/60 bg-background/40"><div className="relative h-36 bg-white"><Image src={item.image} alt={item.title} fill sizes="280px" className="object-contain p-3" unoptimized={shouldBypassImageOptimization(item.image)} /></div><div className="p-3"><p className="line-clamp-2 text-sm font-semibold text-foreground">{item.title}</p><p className="mt-2 font-semibold text-foreground">{formatPrice(locale, item.price)}</p><p className={`mt-1 text-xs ${item.stock > 0 ? "text-green" : "text-red"}`}>{item.requiresVariantSelection ? (de ? "Optionen wählen" : "Choose options") : item.stock > 0 ? (de ? "Verfügbar" : "Available") : (de ? "Ausverkauft" : "Sold out")}</p></div></Link>)}</div></section> : null}

    {profile.enabledSections.tradeIn ? <section className={`${sectionClass} flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center`}><div><h2 className="text-2xl font-semibold text-foreground">{de ? "Altes Gerät verkaufen?" : "Sell your old device?"}</h2><p className="mt-2 text-sm text-muted">{de ? "Fotos senden, manuelles Angebot erhalten und erst nach Prüfung entscheiden." : "Send photos, receive a manual quote, and decide after inspection."}</p></div><Link href={`/${locale}/trade-in`} className="btn-secondary min-h-11">{de ? "Trade-in anfragen" : "Request trade-in quote"}</Link></section> : null}
  </div>;
}
