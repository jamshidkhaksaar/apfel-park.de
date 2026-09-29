import { escapeHtml } from '@/lib/security';

export const shippingCarriers = ['dhl', 'hermes', 'dpd', 'gls', 'ups', 'deutsche_post', 'other'] as const;
export type ShippingCarrier = typeof shippingCarriers[number];
export const fulfillmentStages = ['paid', 'packed', 'shipping', 'shipped', 'delivered'] as const;
export type FulfillmentStage = typeof fulfillmentStages[number];

export const carrierLabel = (carrier: ShippingCarrier): string => ({
  dhl: 'DHL', hermes: 'Hermes', dpd: 'DPD', gls: 'GLS', ups: 'UPS', deutsche_post: 'Deutsche Post', other: 'Anderer Versanddienst',
})[carrier];

export const trackingLink = (carrier: ShippingCarrier, tracking: string): string | null => {
  const code = encodeURIComponent(tracking);
  const urls: Partial<Record<ShippingCarrier, string>> = {
    dhl: `https://www.dhl.de/de/privatkunden/dhl-sendungsverfolgung.html?piececode=${code}`,
    hermes: 'https://www.myhermes.de/empfangen/sendungsverfolgung/',
    dpd: 'https://www.dpd.com/de/de/empfangen/sendungsverfolgung-und-live-tracking/',
    gls: 'https://track.gls-group.com/',
    ups: 'https://www.ups.com/de/de/track',
    deutsche_post: 'https://www.deutschepost.de/de/s/sendungsverfolgung.html',
  };
  return urls[carrier] ?? null;
};

export type ShippingEmailData = {
  customerName: string;
  orderNumber: number;
  stage: FulfillmentStage;
  carrier: ShippingCarrier | null;
  tracking: string | null;
  preview?: boolean;
};

export const buildShippingEmail = (data: ShippingEmailData): { subject: string; html: string; text: string } => {
  const stageNames: Record<FulfillmentStage, string> = { paid: 'Bestellung bestätigt', packed: 'Paket verpackt', shipping: 'Versand vorbereitet', shipped: 'Paket versendet', delivered: 'Zugestellt' };
  const title = stageNames[data.stage];
  const tracking = data.tracking?.trim() ?? '';
  const carrier = data.carrier ? carrierLabel(data.carrier) : 'Noch nicht zugewiesen';
  const link = data.carrier && tracking ? trackingLink(data.carrier, tracking) : null;
  const e = escapeHtml;
  const preview = data.preview ? '<tr><td style="padding:10px 24px;background:#fff3d7;color:#7b4b00;font:700 12px Arial">DESIGN-VORSCHAU · KEINE KUNDENBENACHRICHTIGUNG</td></tr>' : '';
  const steps = fulfillmentStages.slice(1).map((step, index) => {
    const active = fulfillmentStages.indexOf(step) <= fulfillmentStages.indexOf(data.stage);
    const label = ({ packed: 'Verpackt', shipping: 'Versandbereit', shipped: 'Versendet', delivered: 'Zugestellt' } as Record<string, string>)[step];
    return `<td width="25%" style="padding:10px 4px;text-align:center;vertical-align:top;border-top:4px solid ${active ? '#b89451' : '#e8e3d9'}"><span style="display:inline-block;border:1px solid ${active ? '#b89451' : '#d8d3c8'};border-radius:50%;width:25px;line-height:25px;color:${active ? '#6e5123' : '#999'};font:700 12px/25px Arial">${index + 1}</span><br><span style="font:12px/22px Arial;color:${active ? '#222' : '#999'}">${label}</span></td>`;
  }).join('');
  const button = link ? `<a href="${e(link)}" style="display:inline-block;margin:20px 0 4px;background:#222;color:#fff;text-decoration:none;padding:13px 22px;border-radius:6px;font:700 14px Arial">Sendung verfolgen →</a>` : '';
  const parcelSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72" role="img" aria-label="Paket"><rect x="7" y="11" width="58" height="50" rx="12" fill="#f7edd9"/><path d="M18 26l18-9 18 9v22l-18 9-18-9V26z" fill="#fff" stroke="#a87e39" stroke-width="2.5" stroke-linejoin="round"/><path d="M18 26l18 9 18-9M36 35v22M27 21l18 9v9" fill="none" stroke="#a87e39" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const safeName = e(data.customerName);
  const html = `<!doctype html><html lang="de"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f5f3ee;color:#252525"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f3ee;padding:28px 10px"><tr><td align="center"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#fff;border:1px solid #e9e3d7;border-radius:12px;overflow:hidden"><tr><td style="padding:28px 30px 20px;border-top:5px solid #b89451"><img src="https://apfel-park.de/branding/apfel-park-white.png" width="155" alt="Apfel Park" style="display:block;max-width:155px;height:auto"></td></tr>${preview}<tr><td style="padding:24px 30px 8px"><table role="presentation" width="100%"><tr><td><p style="margin:0 0 8px;color:#987743;font:700 12px Arial;letter-spacing:2px">DEINE BESTELLUNG #A-${data.orderNumber}</p><h1 style="margin:0;font:700 28px/1.25 Arial">${title}</h1></td><td width="76" align="right">${parcelSvg}</td></tr></table><p style="font:15px/1.65 Arial;color:#555;margin:18px 0 0">Hallo ${safeName},<br>${data.stage === 'packed' ? 'deine Bestellung wurde sorgfältig verpackt.' : data.stage === 'shipping' ? 'dein Paket ist für den Versand vorbereitet.' : data.stage === 'delivered' ? 'laut Versandstatus wurde dein Paket zugestellt.' : 'dein Paket ist unterwegs.'}</p></td></tr><tr><td style="padding:14px 30px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>${steps}</tr></table></td></tr><tr><td style="padding:8px 30px 28px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#faf8f3;border:1px solid #e7ddc9;border-radius:8px"><tr><td style="padding:18px 20px;font:14px/1.8 Arial"><strong>Versanddienst:</strong> ${e(carrier)}<br><strong>Sendungsnummer:</strong> <span style="word-break:break-all">${e(tracking || 'Folgt nach Versand')}</span></td></tr></table>${button}<p style="font:12px/1.5 Arial;color:#777">${tracking ? 'Die Sendungsverfolgung kann erst nach dem ersten Scan durch den Versanddienst verfügbar sein.' : 'Die Sendungsnummer erhältst du, sobald dein Paket versendet wird.'}</p></td></tr><tr><td style="padding:22px 30px;background:#252525;color:#eee;font:13px/1.6 Arial">Fragen zu deiner Bestellung? <a href="mailto:info@apfel-park.de" style="color:#d6b778">info@apfel-park.de</a><br>Apfel Park · Hamburg</td></tr></table></td></tr></table></body></html>`;
  const text = `${data.preview ? 'DESIGN-VORSCHAU · KEINE KUNDENBENACHRICHTIGUNG\n\n' : ''}${title} | Bestellung #A-${data.orderNumber}\n\nHallo ${data.customerName},\nVersandstatus: ${title}\nVersanddienst: ${carrier}\nSendungsnummer: ${tracking || 'Folgt nach Versand'}${link ? `\nSendung verfolgen: ${link}` : ''}\n\nFragen? info@apfel-park.de`;
  return { subject: `${data.preview ? '[DESIGN-VORSCHAU] ' : ''}${title} | Bestellung #A-${data.orderNumber} | Apfel Park`, html, text };
};
