import { offerEditorText, type Locale } from '@/lib/i18n';
import { localizedText, type PackageContentItem } from '@/lib/product-experience';
import { packageItemIcon } from '@/lib/product-offer-options';
import OfferItemIcon from './OfferItemIcon';

export default function ProductOfferContents({ locale, items = [], chargerIncluded, usbPdSupported }: {
  locale: Locale; items?: PackageContentItem[]; chargerIncluded?: boolean; usbPdSupported?: boolean;
}) {
  const t = offerEditorText[locale];
  const gifts = items.filter(item => item.included && item.isGift && packageItemIcon(item) !== 'charger');
  if (chargerIncluded == null && !gifts.length && !usbPdSupported) return null;
  return <section className="mt-4 rounded-2xl border border-border/70 bg-surface/40 p-4" aria-label={t.contents}>
    <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{t.contents}</h3>
    <div className="mt-3 flex flex-wrap gap-2">
      {chargerIncluded != null ? <span className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium ${chargerIncluded ? 'border-green/30 bg-green/5 text-foreground' : 'border-border text-muted'}`}><OfferItemIcon kind="charger" excluded={!chargerIncluded}/>{chargerIncluded ? t.chargerIncluded : t.chargerExcluded}{chargerIncluded && items.some(item => item.included && item.isGift && packageItemIcon(item) === 'charger') ? <span className="text-[10px] text-gold">{t.giftBadge}</span> : null}</span> : null}
      {gifts.map((item, index) => <span key={`${item.presetId ?? localizedText(item.label, locale)}-${index}`} className="inline-flex items-center gap-2 rounded-xl border border-gold/30 bg-gold/5 px-3 py-2 text-xs font-medium text-foreground"><OfferItemIcon kind={packageItemIcon(item)}/>{localizedText(item.label, locale)}<span className="text-[10px] text-gold">{t.giftBadge}</span></span>)}
      {usbPdSupported ? <span className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs text-muted"><OfferItemIcon kind="usb"/>{t.usbSupported}</span> : null}
    </div>
  </section>;
}
