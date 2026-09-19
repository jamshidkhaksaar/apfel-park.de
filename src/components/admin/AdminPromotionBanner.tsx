'use client';
import Link from 'next/link';
import { normalizeRepairRules } from '@/lib/repair-campaign-rules';
import { useEffect, useState } from 'react';
import { emptyPromotion, promotionCampaignIssue, type PromotionCampaign, type PublicPromotion } from '@/lib/promotion';
import PromotionBanner from '@/components/promotion/PromotionBanner';

export default function AdminPromotionBanner({locale}:{locale:'de'|'en'}){
  const de=locale==='de';
  const [settings,setSettings]=useState(emptyPromotion),[campaigns,setCampaigns]=useState<PromotionCampaign[]>([]);
  const [products,setProducts]=useState<Array<{id:string;category:string}>>([]);
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[failed,setFailed]=useState(false);
  const [now,setNow]=useState(0);
  useEffect(()=>{
    const controller=new AbortController();
    const load=async()=>{try{
      const [a,b]=await Promise.all([fetch('/api/admin/promotion-banner',{cache:'no-store',signal:controller.signal}),fetch('/api/admin/campaigns',{cache:'no-store',signal:controller.signal})]);
      if(!a.ok||!b.ok)throw new Error('load_failed');
      const [s,c]=await Promise.all([a.json(),b.json()]);
      setSettings(s.settings);setCampaigns(c.campaigns);setProducts(c.products);setNow(Date.now());
    }catch{if(!controller.signal.aborted){setFailed(true);setMessage(de?'Aktionsbanner konnte nicht geladen werden. Bitte die Seite neu laden.':'Could not load the banner. Please reload the page.');}}finally{if(!controller.signal.aborted)setLoading(false);}};
    void load();return()=>controller.abort();
  },[de]);
  const selected=campaigns.find(c=>c.id===settings.campaignId)??null;
  const selectedCategories=selected?[...new Set(products.filter(p=>selected.eligible_product_ids.includes(p.id)).map(p=>p.category))]:[];
  const issue=promotionCampaignIssue(selected,selectedCategories,now);
  const issueText:Record<string,[string,string]>={
    missing_campaign:['Bitte zuerst eine Kampagne auswählen.','Select a campaign first.'],
    inactive:['Diese Kampagne ist inaktiv. Zuerst unter Kampagnen & Gutscheine aktivieren.','This campaign is inactive. Activate it under Campaigns & coupons first.'],
    expired:['Diese Kampagne ist abgelaufen. Der Banner bleibt verborgen.','This campaign has expired. The banner stays hidden.'],
    limit_reached:['Das Einlösungslimit ist erreicht.','The redemption limit has been reached.'],
    scheduled:['Geplant: Der Banner erscheint erst zum Kampagnenstart.','Scheduled: the banner appears when the campaign starts.'],
    invalid_window:['Der Kampagnenzeitraum ist ungültig. Bitte unter Kampagnen & Gutscheine korrigieren.','The campaign dates are invalid. Correct them under Campaigns & coupons.'],
    device_scope_required:['Bitte eine Kampagne für Geräte, Zubehör oder eine reine Reparaturkampagne mit Aktionstagen wählen. Leere Kategorien und Produkte bedeuten alle Artikel und sind für den Banner nicht erlaubt.','Choose a campaign scoped to devices, accessories, or a repair-only campaign with specific dates. Empty category and product selections mean all items and are not allowed on the banner.'],
    invalid_campaign:['Die Kampagnendaten sind ungültig.','The campaign data is invalid.'],
  };
  const preview:PublicPromotion|null=selected?{repairRules:selected.eligible_categories.includes('repairs')?normalizeRepairRules(selected.repair_rules):undefined,id:selected.id,code:selected.code,discountType:selected.discount_type as 'percent'|'fixed',discountValue:Number(selected.discount_value),minimumOrder:Number(selected.minimum_order),
    startsAt:selected.starts_at?new Date(selected.starts_at).toISOString():null,endsAt:selected.ends_at?new Date(selected.ends_at).toISOString():null,
    headline:settings.headline,categories:[...new Set([...selected.eligible_categories,...selectedCategories])],categoryWide:selected.eligible_categories,selectedProductIds:products.filter(p=>selected.eligible_product_ids.includes(p.id)).map(p=>p.id),includesSelected:selected.eligible_product_ids.length>0,selectedOnly:selected.eligible_categories.length===0,
    expiresInSeconds:selected.ends_at?Math.max(0,Math.floor((new Date(selected.ends_at).getTime()-now)/1000)):0}:null;
  const save=async()=>{setBusy(true);setMessage('');try{
    const response=await fetch('/api/admin/promotion-banner',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(settings)});
    const data=await response.json();
    if(!response.ok){setFailed(true);setMessage(issueText[data.error]?.[de?0:1]||(de?'Speichern fehlgeschlagen. Bitte erneut versuchen.':'Save failed. Please try again.'));return;}
    setSettings(data.settings);setFailed(false);setMessage(de?'Aktionsbanner gespeichert. Änderungen erscheinen innerhalb von 30 Sekunden.':'Banner saved. Changes appear within 30 seconds.');
  }catch{setFailed(true);setMessage(de?'Netzwerkfehler. Deine Eingaben bleiben erhalten.':'Network error. Your changes are preserved.');}finally{setBusy(false);}};
  const field='mt-2 min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground';
  if(loading)return <p role="status">{de?'Aktionsbanner wird geladen…':'Loading promotion banner…'}</p>;
  return <div className="space-y-6">
    <p className="max-w-3xl text-sm leading-6 text-muted">{de?'Hier steuerst du den Gutscheinbanner auf der Startseite, im Shop und auf passenden Geräteseiten. Rabatt, Zeitraum und Bedingungen stammen immer aus der verknüpften Kampagne. Eine Reparaturkampagne erscheint auf Reparaturseiten; Produktkampagnen erscheinen auf passenden Shopseiten.':'Control the coupon banner on the homepage, store and eligible device pages. Discount, dates and terms always come from the linked campaign. Repair campaigns appear on repair pages; product campaigns appear on eligible store pages.'}</p>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <section className="space-y-4 rounded-xl border border-border p-5" aria-label={de?'Banner-Einstellungen':'Banner settings'}>
        <label className="flex min-h-11 items-center justify-between gap-3 font-semibold"><span>{de?'Banner veröffentlichen':'Publish banner'}</span><input type="checkbox" checked={settings.enabled} onChange={e=>setSettings({...settings,enabled:e.target.checked})} className="h-5 w-5 accent-gold"/></label>
        <label className="block text-sm">{de?'Verknüpfter Gutscheincode':'Linked coupon code'}<select className={field} value={settings.campaignId||''} onChange={e=>setSettings({...settings,campaignId:e.target.value||null})}><option value="">{de?'Kampagne auswählen':'Select campaign'}</option>{campaigns.map(c=><option key={c.id} value={c.id}>{c.code} · {c.discount_value}{c.discount_type==='percent'?' %':' €'} · {c.is_active?(de?'aktiv':'active'):(de?'inaktiv':'inactive')}</option>)}</select></label>
        <Link href="/admin/campaigns" className="inline-flex min-h-11 items-center text-sm font-semibold text-gold underline">{de?'Kampagnen & Gutscheine bearbeiten':'Edit campaigns & coupons'}</Link>
        <label className="block text-sm">{de?'Überschrift Deutsch (optional)':'German headline (optional)'}<input className={field} maxLength={100} value={settings.headline.de} onChange={e=>setSettings({...settings,headline:{...settings.headline,de:e.target.value}})}/></label>
        <label className="block text-sm">{de?'Überschrift Englisch (optional)':'English headline (optional)'}<input className={field} maxLength={100} value={settings.headline.en} onChange={e=>setSettings({...settings,headline:{...settings.headline,en:e.target.value}})}/></label>
        <p className="text-xs leading-5 text-muted">{de?'Leer lassen für den Standardtext. Rabatt und Produktgruppen werden automatisch ergänzt. Der Timer zählt bis zum echten Enddatum in Hamburg-Zeit; bei Ablauf, Deaktivierung oder erreichtem Limit wird der Banner ausgeblendet.':'Leave blank for the default text. Discount and product groups are added automatically. The timer uses the real Hamburg-time expiry; the banner hides at expiry, deactivation or the redemption limit.'}</p>
        {issue?<p role="status" className="rounded-lg bg-gold/10 p-3 text-sm leading-6">{issueText[issue]?.[de?0:1]}</p>:null}
        <button type="button" onClick={()=>void save()} disabled={busy||(settings.enabled&&Boolean(issue)&&issue!=='scheduled')} className="btn-primary min-h-11 disabled:opacity-50">{busy?(de?'Speichert…':'Saving…'):(de?'Banner speichern':'Save banner')}</button>
      </section>
      <section className="min-w-0" aria-label={de?'Banner-Vorschau':'Banner preview'}><h2 className="mb-3 text-lg font-semibold">{de?'Vorschau':'Preview'}</h2>
        {preview?<PromotionBanner key={`${preview.id}-${preview.endsAt}`} promotion={preview} locale={locale} preview/>:<p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted">{de?'Wähle einen gespeicherten Gutscheincode für die Vorschau.':'Select a saved coupon to preview the banner.'}</p>}
        <p className="mt-3 text-xs text-muted">{de?'Die Vorschau veröffentlicht nichts. Desktop und Mobil verwenden denselben responsiven Banner.':'Preview does not publish anything. Desktop and mobile use the same responsive banner.'}</p>
      </section>
    </div>
    {message?<p role={failed?'alert':'status'} className="text-sm">{message}</p>:null}
  </div>;
}
