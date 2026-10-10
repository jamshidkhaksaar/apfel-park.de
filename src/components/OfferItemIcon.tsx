import type { OfferIcon } from '@/lib/product-offer-options';

/** Consistent, original line icons. No user-supplied SVG markup is rendered. */
export default function OfferItemIcon({ kind, excluded = false, className = 'size-5' }: { kind: OfferIcon; excluded?: boolean; className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className={className}>
    {kind === 'charger' ? <><path d="M9 3v4m6-4v4M8 7h8a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Zm4 11v3" /><path d="m13 10-3 4h4l-2 3" /></> : null}
    {kind === 'usb' ? <><rect x="8" y="2" width="8" height="7" rx="1.5"/><path d="M10 5h.01M14 5h.01M12 9v4c0 3 7 1 7 5a3 3 0 0 1-6 0v-1c0-3-8-1-8-5"/><path d="M3 9h4v3H3z"/></> : null}
    {kind === 'screen-protector' ? <><rect x="5" y="2" width="12" height="20" rx="2.5"/><path d="M9 5h4m-3 14h2M18 7l3 2v4c0 2-1.5 4-3 5-1.5-1-3-3-3-5V9l3-2Z"/></> : null}
    {kind === 'case' ? <><rect x="5" y="2" width="14" height="20" rx="3"/><rect x="8" y="5" width="5" height="5" rx="1.2"/><path d="M10 19h4m-11-9v4m18-4v4"/></> : null}
    {kind === 'box' ? <><path d="m3 7 9-4 9 4v10l-9 4-9-4V7Zm0 0 9 4 9-4M12 11v10M7.5 5l9 4"/></> : null}
    {kind === 'headphones' ? <><path d="M4 14v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="12" width="5" height="8" rx="2"/><rect x="16" y="12" width="5" height="8" rx="2"/></> : null}
    {kind === 'gift' ? <><path d="M4 10h16v11H4zM3 6h18v4H3zM12 6v15"/><path d="M12 6H8a2 2 0 1 1 2-2l2 2Zm0 0h4a2 2 0 1 0-2-2l-2 2Z"/></> : null}
    {excluded ? <path d="M3 3l18 18" strokeWidth="2"/> : null}
  </svg>;
}
