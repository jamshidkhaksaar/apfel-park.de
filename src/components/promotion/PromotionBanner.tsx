'use client';
import { useEffect, useId, useState } from 'react';
import { promotionDiscount, promotionScope, type PublicPromotion } from '@/lib/promotion';
import styles from './PromotionBanner.module.css';

export default function PromotionBanner({promotion,locale,compact=false,preview=false}:{promotion:PublicPromotion;locale:'de'|'en';compact?:boolean;preview?:boolean}){
  const de=locale==='de',id=useId();
  const [copied,setCopied]=useState(false),[copyFailed,setCopyFailed]=useState(false);
  const [clock,setClock]=useState({expiry:promotion.endsAt,seconds:promotion.expiresInSeconds});
  useEffect(()=>{
    if(!promotion.endsAt)return;
    const deadline=performance.now()+promotion.expiresInSeconds*1000;
    const tick=()=>setClock({expiry:promotion.endsAt,seconds:Math.max(0,Math.ceil((deadline-performance.now())/1000))});
    const start=setTimeout(tick,0),timer=setInterval(tick,1000);
    return()=>{clearTimeout(start);clearInterval(timer);};
  },[promotion.endsAt,promotion.expiresInSeconds]);
  const seconds=clock.expiry===promotion.endsAt?clock.seconds:promotion.expiresInSeconds;
  if(promotion.endsAt&&seconds<=0&&!preview)return null;
  const days=Math.floor(seconds/86400),hours=Math.floor(seconds%86400/3600),minutes=Math.floor(seconds%3600/60),secs=seconds%60;
  const countdown=`${days?`${days}${de?'T':'d'} `:''}${[hours,minutes,secs].map(n=>String(n).padStart(2,'0')).join(':')}`;
  const endLabel=promotion.endsAt?new Intl.DateTimeFormat(de?'de-DE':'en-GB',{timeZone:'Europe/Berlin',dateStyle:'medium',timeStyle:'short'}).format(new Date(promotion.endsAt)):'';
  const copy=async()=>{try{await navigator.clipboard.writeText(promotion.code);setCopied(true);setCopyFailed(false);}catch{setCopyFailed(true);}};
  return <aside className={`${styles.banner} ${compact?styles.compact:''}`} aria-label={de?'Aktueller Gutschein':'Current coupon'} data-promotion-banner>
    <div className={styles.content}>
      <svg className={styles.ticket} width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M4 5h16v5a2 2 0 0 0 0 4v5H4v-5a2 2 0 0 0 0-4V5Z"/><path d="m9 15 6-6"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="15" r="1"/></svg>
      <div className={styles.message}><p className={styles.headline}>{promotion.headline[locale]|| (de?'Dein Technik-Upgrade. Jetzt günstiger.':'Your next tech upgrade, for less.')}</p><p className={styles.scope}><strong>{promotionDiscount(promotion,locale)} {de?'Rabatt':'off'}</strong><span>{promotionScope(promotion,locale)}</span></p></div>
      <div className={styles.actions}>
        {promotion.endsAt?<div className={styles.timer}><span>{de?'Endet in':'Ends in'}</span><span className={styles.digits} aria-hidden="true">{countdown}</span><time className="sr-only" dateTime={promotion.endsAt}>{endLabel} ({de?'Hamburg-Zeit':'Hamburg time'})</time></div>:null}
        <button type="button" className={styles.copy} onClick={()=>void copy()} aria-describedby={id}><span className={styles.code}>{promotion.code}</span><span aria-hidden="true">{copied?'✓':'⧉'}</span><span>{copied?(de?'Kopiert':'Copied'):(de?'Code kopieren':'Copy code')}</span></button>
      </div>
    </div>
    <div id={id} className={styles.footer}>
      <span>{promotion.minimumOrder>0?(de?`Ab ${new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(promotion.minimumOrder)} Warenwert`:`Minimum basket ${new Intl.NumberFormat('en-GB',{style:'currency',currency:'EUR'}).format(promotion.minimumOrder)}`):(de?'Kein Mindestbestellwert':'No minimum spend')}</span>
      <details><summary>{de?'Bedingungen':'Terms'}</summary><p>{promotionScope(promotion,locale)}. {de?'Zubehör und Reparaturen sind ausgeschlossen. Ein Code pro Bestellung; Versandkosten werden nicht rabattiert. Der Rabatt wird im Checkout geprüft.':'Accessories and repairs are excluded. One code per order; shipping is not discounted. The discount is validated at checkout.'} {promotion.endsAt?`${de?'Gültig bis':'Valid until'} ${endLabel} (${de?'Hamburg-Zeit':'Hamburg time'}).`:(de?'Kein festes Enddatum; gültig solange die Kampagne aktiv und ihr Einlösungslimit nicht erreicht ist.':'No fixed end date; valid while the campaign is active and its redemption limit has not been reached.')}</p></details>
    </div>
    <span className={styles.feedback} role="status">{copyFailed?(de?`Bitte den Code ${promotion.code} markieren und manuell kopieren.`:`Select and copy ${promotion.code} manually.`):copied?(de?'Gutscheincode kopiert. Im Checkout anwenden.':'Coupon copied. Apply it at checkout.'):''}</span>
  </aside>;
}
