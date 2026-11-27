"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";

import { addStoredCartItem } from "@/components/checkout/cart";
import { MINI_CART_OPEN_EVENT } from "@/components/checkout/MiniCart";
import { formatPrice } from "@/lib/format";
import OfferItemIcon from './OfferItemIcon';
import { conditionLabel } from "@/lib/condition-labels";
import { formatBatteryHealth, packageItemIcon } from '@/lib/product-offer-options';
import { catalogToolsText } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { shouldBypassImageOptimization } from "@/lib/image";
import { formatStorageLabel, familyOptionValue, getFamilyOptionTarget, localizedText, type ExperienceProductSummary, type ProductExperienceProfile, type ProductFamilyView } from "@/lib/product-experience";

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

/** Swatch colours for the canonical (German) colour names. */
const SWATCHES: Record<string, string> = {
  schwarz: '#141416', 'weiß': '#f4f4f2', rot: '#c3172b', blau: '#3b6ab3', 'grün': '#4d7f5d', violett: '#9a86c9',
  gelb: '#f2d15a', gold: '#d8b46a', silber: '#cfd1d4', grau: '#8b8e93', 'space grau': '#5a5d62', mitternacht: '#1f2734',
  polarstern: '#efe6d6', graphit: '#4b4c4f', pink: '#f3c3cf', orange: '#e9823a', 'titan natur': '#b8ad9c',
  'titan blau': '#3f4b5e', 'titan schwarz': '#2e2e30', 'titan weiß': '#e6e3dd', 'titan wüstensand': '#c9a988',
};
const swatchFor = (value: string) => SWATCHES[value.toLowerCase()];

/**
 * Variant selector for one model family (each colour/storage/condition is its
 * own purchasable offer). Every option the model offers is clickable: if the
 * exact combination does not exist, it opens the closest offer and shows what
 * changes ("→ Schwarz"). Only options with nothing in stock are greyed out.
 * Links keep the scroll position, so switching feels like an in-page change.
 */
export function ProductFamilyConfigurator({ family, locale }: { family: ProductFamilyView; locale: Locale }) {
  const t = catalogToolsText[locale];
  const de = locale === 'de';
  const current = family.members.find(member => member.selected);
  const order: Record<string,number> = {condition:0,color:1,storage:2,configuration:3,batteryhealth:4};
  const currentCondition = familyOptionValue(current,'condition');
  const axes = family.optionAxes
    .filter(axis => axis.toLowerCase() !== 'device')
    .filter(axis => axis.toLowerCase() !== 'batteryhealth' || currentCondition === 'used' || (currentCondition === 'open_box' && family.members.some(member => familyOptionValue(member, 'condition') === 'open_box' && Boolean(familyOptionValue(member, 'batteryHealth')))))
    .filter(axis => family.members.some(member => familyOptionValue(member,axis)))
    .sort((a,b) => (order[a.toLowerCase()] ?? 5)-(order[b.toLowerCase()] ?? 5));
  const devices = family.members.filter(member => axes.every(axis => familyOptionValue(member,axis) === familyOptionValue(current,axis)));
  const labels: Record<string,string> = de
    ? {configuration:'Konfiguration',color:'Farbe',storage:'Speicher',condition:'Zustand',new:'Neu',used:'Gebraucht A+',open_box:'Open Box',batteryhealth:t.batteryHealth,unspecified:t.notSpecified}
    : {configuration:'Configuration',color:'Colour',storage:'Storage',condition:'Condition',new:'New',used:'Used A+',open_box:'Open box',batteryhealth:t.batteryHealth,unspecified:t.notSpecified};
  const labelFor = (axis: string, value: string) => axis.toLowerCase() === 'storage' ? formatStorageLabel(value) : labels[value] ?? value;
  if (!current || axes.length === 0 || family.members.length < 2) return null;

  const valuesFor = (axis: string): string[] => {
    const key = axis.toLowerCase();
    // Colours, storage and battery tiers are listed for the chosen condition;
    // a different condition is one click on the condition row.
    const pool = key === 'condition' ? family.members : family.members.filter(member => familyOptionValue(member,'condition') === currentCondition);
    const values = Array.from(new Set(pool.map(member => familyOptionValue(member,axis)).filter((value): value is string => Boolean(value))));
    if (key === 'condition') return values.sort((a,b) => ['new','open_box','used'].indexOf(a)-['new','open_box','used'].indexOf(b));
    if (key === 'storage') return values.sort((a,b) => (Number.parseInt(a) * (/tb/i.test(a) ? 1024 : 1) || 0)-(Number.parseInt(b) * (/tb/i.test(b) ? 1024 : 1) || 0));
    if (key === 'batteryhealth') return values.sort((a,b) => (Number.parseInt(a) || 0)-(Number.parseInt(b) || 0));
    return values;
  };
  const lowestInStock = (axis: string, value: string) => {
    const prices = family.members.filter(member => familyOptionValue(member,axis) === value && member.stock > 0).map(member => member.price);
    return prices.length ? Math.min(...prices) : null;
  };

  return <section className="mt-5 rounded-2xl border border-border/60 bg-surface/50 p-4 sm:p-5" aria-label={de ? 'Produktvarianten' : 'Product variants'}>
    <p className="text-sm font-semibold text-foreground">{de ? 'Variante wählen' : 'Choose your version'}</p>
    <div className="mt-4 space-y-5">{axes.map(axis => {
      const key = axis.toLowerCase();
      const selectedValue = familyOptionValue(current,axis);
      return <div key={axis} role="group" aria-label={labels[key] ?? axis}>
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
          {labels[key] ?? axis}{selectedValue ? <span className="ml-1.5 normal-case tracking-normal text-foreground">{labelFor(axis,selectedValue)}</span> : null}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">{valuesFor(axis).map(value => {
          const member = getFamilyOptionTarget(family,axis,value);
          const selected = selectedValue === value;
          const soldOut = !member || member.stock <= 0;
          const changes = member && !selected ? ['condition','color','storage','configuration','batteryHealth']
            .filter(other => other.toLowerCase() !== key && familyOptionValue(member,other) && familyOptionValue(member,other) !== familyOptionValue(current,other))
            .map(other => labelFor(other,familyOptionValue(member,other)!)) : [];
          const price = key === 'condition' ? lowestInStock(axis,value) : member && member.stock > 0 ? member.price : null;
          const swatch = key === 'color' ? swatchFor(value) : undefined;
          const classes = `group relative flex min-h-12 min-w-[5.5rem] max-w-full flex-col justify-center rounded-xl border px-3.5 py-2 text-left text-sm transition ${
            selected ? 'border-gold bg-gold/10 text-foreground ring-1 ring-gold' : 'border-border text-foreground hover:border-gold/60'
          } ${soldOut ? 'cursor-not-allowed border-dashed opacity-45' : ''}`;
          const content = <>
            <span className="flex items-center gap-2 font-semibold">
              {key === 'color' ? <span aria-hidden="true" className="size-4 shrink-0 rounded-full border border-black/15 shadow-inner" style={{ background: swatch ?? 'conic-gradient(#ccc,#888,#ccc)' }} /> : null}
              {labelFor(axis,value)}
            </span>
            {soldOut
              ? <span className="mt-0.5 text-[11px] leading-4 text-muted">{t.optionSoldOut}</span>
              : <>
                  {price !== null && !selected ? <span className="mt-0.5 text-[11px] leading-4 text-muted tabular-nums">{key === 'condition' ? (de ? 'ab ' : 'from ') : ''}{formatPrice(locale,price)}</span> : null}
                  {changes.length ? <span className="mt-0.5 text-[11px] leading-4 text-gold">→ {changes.join(' · ')}</span> : null}
                </>}
          </>;
          return soldOut || !member
            ? <button key={value} type="button" disabled aria-pressed={selected} title={t.optionSoldOut} className={classes}>{content}</button>
            : <Link key={value} href={`/${locale}/store/${member.slug}`} scroll={false} prefetch aria-current={selected ? 'page' : undefined} aria-label={`${labels[key] ?? axis}: ${labelFor(axis,value)}${changes.length ? ` (${changes.join(', ')})` : ''}`} className={classes}>{content}</Link>;
        })}</div>
      </div>;
    })}</div>
    {devices.length > 1 ? <div className="mt-5">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{de ? `${devices.length} Geräte in dieser Ausführung` : `${devices.length} units in this version`}</p>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">{devices.map(device => {
        const content = <>{device.image ? <Image src={device.image} alt={device.title} width={80} height={100} unoptimized className="h-24 w-20 object-contain" /> : null}<div className="text-sm text-foreground"><p className="font-semibold">{formatPrice(locale,device.price)}</p>{formatBatteryHealth(device.batteryHealth,device.batteryHealthRange) ? <p>{de ? 'Akku' : 'Battery'}: {formatBatteryHealth(device.batteryHealth,device.batteryHealthRange)}</p> : null}<p className="text-muted">{device.conditionNote}</p>{device.stock <= 0 ? <p>{t.optionSoldOut}</p> : null}</div></>;
        const classes = `flex gap-3 rounded-xl border p-3 ${device.selected ? 'border-gold ring-1 ring-gold' : 'border-border'} ${device.stock <= 0 ? 'opacity-50' : ''}`;
        return device.stock > 0 ? <Link key={device.productId} href={`/${locale}/store/${device.slug}`} scroll={false} aria-current={device.selected ? 'page' : undefined} className={classes}>{content}</Link> : <div key={device.productId} aria-disabled="true" className={classes}>{content}</div>;
      })}</div>
    </div> : null}
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
    {packageItems.length ? <section className={sectionClass}><h2 className="text-2xl font-semibold text-foreground">{de ? "Was ist enthalten?" : "What is included?"}</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{packageItems.map((item, index) => <div key={`${localizedText(item.label, locale)}-${index}`} className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 p-3"><OfferItemIcon kind={packageItemIcon(item)} excluded={!item.included}/><span className={item.included ? "text-green" : "text-red"}>{item.included ? "✓" : "×"}</span><span className="text-sm text-foreground">{localizedText(item.label, locale)}</span></div>)}</div></section> : null}

    {conditions.length ? <section className={sectionClass}><h2 className="text-2xl font-semibold text-foreground">{de ? "Zustände vergleichen" : "Compare conditions"}</h2><p className="mt-2 text-sm text-muted">{de ? "Beispielbilder erklären die Kategorie. Die Produktgalerie zeigt das konkrete Gerät." : "Example images explain the category. The product gallery shows the actual unit."}</p><div className="mt-5 grid gap-4 md:grid-cols-3">{conditions.map((item) => <article key={item.condition} className="overflow-hidden rounded-xl border border-border/60"><div className="grid h-36 grid-cols-2 bg-white">{item.imageUrls.slice(0, 2).map((url) => <div key={url} className="relative"><Image src={url} alt="" fill sizes="220px" className="object-contain p-2" unoptimized={shouldBypassImageOptimization(url)} /></div>)}</div><div className="p-4"><h3 className="font-semibold text-foreground">{item.condition === "used" ? localizedText(item.label, locale).replace(/^(?:used|gebraucht)(?:\s+A\+)?/i, "A+") : localizedText(item.label, locale)}</h3><p className="mt-2 text-sm leading-6 text-muted">{localizedText(item.description, locale)}</p></div></article>)}</div></section> : null}

    {profile.enabledSections.refurbishment && (profile.refurbishmentSteps.length || profile.trustPoints.length) ? <section className={sectionClass}><h2 className="text-2xl font-semibold text-foreground">{de ? "Prüfung & Aufbereitung" : "Testing & refurbishment"}</h2><div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{profile.refurbishmentSteps.map((step, index) => <article key={`${localizedText(step.title, locale)}-${index}`} className="rounded-xl border border-border/60 bg-background/40 p-4"><span className="text-sm font-bold text-gold">{String(index + 1).padStart(2, "0")}</span><h3 className="mt-2 font-semibold text-foreground">{localizedText(step.title, locale)}</h3><p className="mt-2 text-sm leading-6 text-muted">{localizedText(step.description, locale)}</p></article>)}{profile.trustPoints.map((point, index) => <article key={`${localizedText(point.title, locale)}-${index}`} className="rounded-xl border border-green/30 bg-green/5 p-4"><h3 className="font-semibold text-foreground">✓ {localizedText(point.title, locale)}</h3><p className="mt-2 text-sm leading-6 text-muted">{localizedText(point.description, locale)}</p></article>)}</div></section> : null}

    {(profile.enabledSections.sizeComparison || profile.enabledSections.modelComparison) && comparisons.length ? <section className={sectionClass}><h2 className="text-2xl font-semibold text-foreground">{de ? "Größe & Modelle vergleichen" : "Compare size & models"}</h2>{profile.enabledSections.sizeComparison ? <div className="mt-6 flex flex-wrap items-end justify-center gap-8 overflow-x-auto pb-2">{compareItems.filter((item) => item.dimensions?.heightMm && item.dimensions?.widthMm).map((item) => <DeviceSilhouette key={item.id} product={item} active={item.id === current.id} />)}</div> : null}{profile.enabledSections.modelComparison ? <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead><tr className="border-b border-border text-muted"><th className="p-3">{de ? "Modell" : "Model"}</th><th className="p-3">{de ? "Zustand" : "Condition"}</th><th className="p-3">{de ? "Größe" : "Size"}</th><th className="p-3">{de ? "Gewicht" : "Weight"}</th><th className="p-3">{de ? "Preis" : "Price"}</th></tr></thead><tbody>{compareItems.map((item) => <tr key={item.id} className="border-b border-border/50"><td className="p-3"><Link href={`/${locale}/store/${item.slug}`} className="font-semibold text-foreground hover:text-gold">{item.title}</Link></td><td className="p-3 text-muted">{conditionLabel(locale, item.condition)}</td><td className="p-3 text-muted">{item.dimensions?.heightMm && item.dimensions?.widthMm ? `${item.dimensions.heightMm} × ${item.dimensions.widthMm} mm` : "—"}</td><td className="p-3 text-muted">{item.dimensions?.weightG ? `${item.dimensions.weightG} g` : "—"}</td><td className="p-3 font-semibold text-foreground">{formatPrice(locale, item.price)}</td></tr>)}</tbody></table></div> : null}</section> : null}

    {profile.enabledSections.bundles && bundles.length ? <section className={sectionClass}><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-2xl font-semibold text-foreground">{de ? "Passt perfekt dazu" : "Perfectly compatible"}</h2><p className="mt-2 text-sm text-muted">{de ? "Vom Shop manuell als kompatibel bestätigt." : "Manually confirmed as compatible by the shop."}</p></div><button type="button" onClick={addBundle} className="btn-primary min-h-11 px-5">{bundleAdded ? (de ? "Hinzugefügt ✓" : "Added ✓") : (de ? "Verfügbare Artikel hinzufügen" : "Add available items")}</button></div><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{bundles.map((item) => <Link key={item.id} href={`/${locale}/store/${item.slug}`} className="overflow-hidden rounded-xl border border-border/60 bg-background/40"><div className="relative h-36 bg-white"><Image src={item.image} alt={item.title} fill sizes="280px" className="object-contain p-3" unoptimized={shouldBypassImageOptimization(item.image)} /></div><div className="p-3"><p className="line-clamp-2 text-sm font-semibold text-foreground">{item.title}</p><p className="mt-2 font-semibold text-foreground">{formatPrice(locale, item.price)}</p><p className={`mt-1 text-xs ${item.stock > 0 ? "text-green" : "text-red"}`}>{item.requiresVariantSelection ? (de ? "Optionen wählen" : "Choose options") : item.stock > 0 ? (de ? "Verfügbar" : "Available") : (de ? "Ausverkauft" : "Sold out")}</p></div></Link>)}</div></section> : null}

    {profile.enabledSections.tradeIn ? <section className={`${sectionClass} flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center`}><div><h2 className="text-2xl font-semibold text-foreground">{de ? "Altes Gerät verkaufen?" : "Sell your old device?"}</h2><p className="mt-2 text-sm text-muted">{de ? "Fotos senden, manuelles Angebot erhalten und erst nach Prüfung entscheiden." : "Send photos, receive a manual quote, and decide after inspection."}</p></div><Link href={`/${locale}/trade-in`} className="btn-secondary min-h-11">{de ? "Trade-in anfragen" : "Request trade-in quote"}</Link></section> : null}
  </div>;
}
