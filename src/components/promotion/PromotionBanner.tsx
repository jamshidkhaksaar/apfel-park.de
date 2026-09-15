'use client';
import Link from 'next/link';
import { useEffect, useId, useState } from 'react';
import { bannerCategories, promotionDiscount, promotionExclusions, promotionScope, type PublicPromotion } from '@/lib/promotion';
import styles from './PromotionBanner.module.css';

export default function PromotionBanner({promotion,locale,compact=false,preview=false}:{promotion:PublicPromotion;locale:'de'|'en';compact?:boolean;preview?:boolean}){
  const de=locale==='de',id=useId(),repairs=promotion.categories.includes('repairs'),storageKey=`apfel-promotion-dismissed:${promotion.id}`;
  const [copied,setCopied]=useState(false),[copyFailed,setCopyFailed]=useState(false),[dismissed,setDismissed]=useState(false);
  const [clock,setClock]=useState({expiry:promotion.endsAt,seconds:promotion.expiresInSeconds});
  useEffect(()=>{
    if(preview)return;
    let stored=false;
    try{stored=sessionStorage.getItem(storageKey)==='1';}catch{}
    if(!stored)return;
    const timer=setTimeout(()=>setDismissed(true),0);
    return()=>clearTimeout(timer);
  },[preview,storageKey]);
  useEffect(()=>{
    if(!promotion.endsAt)return;
    const deadline=performance.now()+promotion.expiresInSeconds*1000;
    const tick=()=>setClock({expiry:promotion.endsAt,seconds:Math.max(0,Math.ceil((deadline-performance.now())/1000))});
    const start=setTimeout(tick,0),timer=setInterval(tick,1000);
    return()=>{clearTimeout(start);clearInterval(timer);};
  },[promotion.endsAt,promotion.expiresInSeconds]);
  const seconds=clock.expiry===promotion.endsAt?clock.seconds:promotion.expiresInSeconds;
  const dismiss=()=>{try{sessionStorage.setItem(storageKey,'1');}catch{}setDismissed(true);};
  if(!preview&&dismissed)return null;
  if(promotion.endsAt&&seconds<=0&&!preview)return null;
  const days=Math.floor(seconds/86400),hours=Math.floor(seconds%86400/3600),minutes=Math.floor(seconds%3600/60),secs=seconds%60;
  const countdown=`${days?`${days}${de?'T':'d'} `:''}${[hours,minutes,secs].map(n=>String(n).padStart(2,'0')).join(':')}`;
  const endDate=promotion.endsAt?new Date(promotion.endsAt):null;
  const endLabel=endDate?new Intl.DateTimeFormat(de?'de-DE':'en-GB',{timeZone:'Europe/Berlin',dateStyle:'medium',timeStyle:'short'}).format(endDate):'';
  const endTime=endDate?new Intl.DateTimeFormat(de?'de-DE':'en-GB',{timeZone:'Europe/Berlin',hour:'2-digit',minute:'2-digit'}).format(endDate):'';
  const dayKey=(value:Date)=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(value);
  const endsToday=endDate?dayKey(endDate)===dayKey(new Date()):false;
  const urgent=seconds>0&&seconds<=3600,soon=seconds>0&&seconds<=21600;
  const timerLabel=soon?(endsToday?(de?`Endet heute ${endTime}`:`Ends today ${endTime}`):(de?`Endet ${endLabel}`:`Ends ${endLabel}`)):(de?'Endet in':'Ends in');
  const selectedDevices=promotion.categories.filter(category=>(bannerCategories as readonly string[]).includes(category));
  const shopHref=selectedDevices.length===1?`/${locale}/store?category=${encodeURIComponent(selectedDevices[0])}`:`/${locale}/store`;
  const copy=async()=>{try{await navigator.clipboard.writeText(promotion.code);setCopied(true);setCopyFailed(false);}catch{setCopyFailed(true);}};
  return <aside className={`${styles.banner} ${compact?styles.compact:''}`} aria-label={de?'Aktueller Gutschein':'Current coupon'} data-promotion-banner>
    <div className={styles.content}>
      <svg className={styles.ticket} width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M4 5h16v5a2 2 0 0 0 0 4v5H4v-5a2 2 0 0 0 0-4V5Z"/><path d="m9 15 6-6"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="15" r="1"/></svg>
      <div className={styles.message}><p className={styles.headline}>{promotion.headline[locale]|| (repairs?(de?'Deine Reparatur. Jetzt günstiger.':'Your repair, for less.'):(de?'Dein Technik-Upgrade. Jetzt günstiger.':'Your next tech upgrade, for less.'))}</p><p className={styles.scope}><strong>{promotionDiscount(promotion,locale)} {de?'Rabatt':'off'}</strong><span>{promotionScope(promotion,locale)}</span></p></div>
      <div className={styles.actions}>
        {promotion.endsAt?<div className={`${styles.timer} ${urgent?styles.urgent:''}`}><span>{timerLabel}</span><span className={styles.digits} aria-hidden="true">{countdown}</span><time className="sr-only" dateTime={promotion.endsAt}>{endLabel} ({de?'Hamburg-Zeit':'Hamburg time'})</time></div>:null}
        <div className={styles.ctas}>
          {repairs
            ?<a href={`/${locale}/repairs?coupon=${encodeURIComponent(promotion.code)}#repair-request`} className={styles.primary}>{de?'Reparatur anfragen':'Request repair'}</a>
            :<Link href={shopHref} className={styles.primary}>{de?'Jetzt shoppen':'Shop now'}</Link>}
          <button type="button" className={styles.copy} onClick={()=>void copy()} aria-describedby={id}><span className={styles.code}>{promotion.code}</span><span aria-hidden="true">{copied?'✓':'⧉'}</span><span>{copied?(de?'Kopiert':'Copied'):(de?'Code kopieren':'Copy code')}</span></button>
        </div>
      </div>
      {preview?null:<button type="button" className={styles.dismiss} onClick={dismiss} aria-label={de?'Aktion ausblenden':'Dismiss promotion'}><span aria-hidden="true">✕</span></button>}
    </div>
    <div id={id} className={styles.footer}>
      {promotion.repairRules?<span>{de?'Aktionstage':'Promotion dates'}: {promotion.repairRules.dates.join(', ')} · {promotion.repairRules.dateBasis==='repair_date'?(de?'Wunschtermin der Reparatur':'Requested repair date'):(de?'Tag der Online-Anfrage':'Online request date')}</span>:null}
      <span>{promotion.minimumOrder>0?(de?`Ab ${new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(promotion.minimumOrder)} Warenwert`:`Minimum basket ${new Intl.NumberFormat('en-GB',{style:'currency',currency:'EUR'}).format(promotion.minimumOrder)}`):(de?'Kein Mindestbestellwert':'No minimum spend')}</span>
      <details><summary>{de?'Bedingungen':'Terms'}</summary><p>{promotionScope(promotion,locale)}. {repairs?(de?'Nur bepreiste Katalog-Reparaturen an den angegebenen Aktionstagen. Gerätekäufe und Zubehör ausgeschlossen. Ein Code pro Anfrage; Termin und Endpreis werden vom Team bestätigt. Solange Einlösungen verfügbar sind.':'Priced catalog repairs on the specified dates only. Device purchases and accessories excluded. One code per request; appointment and final price require staff confirmation. Subject to remaining redemptions.'):(de?`${promotionExclusions(promotion,locale)} Ein Code pro Bestellung; Versandkosten werden nicht rabattiert. Der Rabatt wird im Checkout geprüft.`:`${promotionExclusions(promotion,locale)} One code per order; shipping is not discounted. The discount is validated at checkout.`)} {promotion.endsAt?`${de?'Gültig bis':'Valid until'} ${endLabel} (${de?'Hamburg-Zeit':'Hamburg time'}).`:(de?'Kein festes Enddatum; gültig solange die Kampagne aktiv und ihr Einlösungslimit nicht erreicht ist.':'No fixed end date; valid while the campaign is active and its redemption limit has not been reached.')}</p></details>
    </div>
    <span className={styles.feedback} role="status">{copyFailed?(de?`Bitte den Code ${promotion.code} markieren und manuell kopieren.`:`Select and copy ${promotion.code} manually.`):copied?(repairs?(de?'Gutscheincode kopiert. In der Reparaturanfrage eingeben.':'Coupon copied. Enter it in the repair request.'):(de?'Gutscheincode kopiert. Im Checkout anwenden.':'Coupon copied. Apply it at checkout.')):''}</span>
  </aside>;
}
