import path from 'node:path';
import PDFDocument from 'pdfkit';
import sharp from 'sharp';
import type { InvoiceSnapshot } from '@/lib/order-invoice';
import { invoiceDisplayDate, invoiceLabels, invoiceMoney } from '@/lib/order-invoice-template';

const gold = '#b88721';
const ink = '#242424';
const muted = '#737373';
const pale = '#f8f5ee';
const regular = path.join(process.cwd(), 'public/fonts/NotoSans-Regular.ttf');
const bold = path.join(process.cwd(), 'public/fonts/NotoSans-Bold.ttf');

export const renderOrderInvoicePdf = async (invoice: InvoiceSnapshot): Promise<Buffer> => {
  const logo = await sharp(path.join(process.cwd(), 'public/branding/apfel-park-white.png')).resize(180, 180, { fit: 'inside' }).png().toBuffer();
  const l = invoiceLabels[invoice.locale];
  const money = (value: number) => invoiceMoney(value, invoice.locale);
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ size: 'A4', font: regular, margins: { top: 42, bottom: 72, left: 42, right: 42 }, bufferPages: true, info: { Title: `${l.title} ${invoice.number}`, Author: `${invoice.issuer.owner} · Apfel Park`, Subject: invoice.preview ? l.preview : invoice.orderLabel } });
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('error', reject);
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.registerFont('regular', regular).registerFont('bold', bold);
    const right = doc.page.width - 42;
    const width = right - 42;
    const rule = (y: number) => doc.moveTo(42, y).lineTo(right, y).lineWidth(0.6).strokeColor('#e5dfd2').stroke();
    const write = (value: string, x: number, y: number, w: number, size = 9, weight = false, color = ink, align: 'left' | 'right' = 'left') => {
      doc.font(weight ? 'bold' : 'regular').fontSize(size).fillColor(color).text(value, x, y, { width: w, align, lineGap: 2 });
    };
    const continuation = () => {
      doc.addPage();
      write(`APFEL PARK  /  ${invoice.number}`, 42, 32, width, 9, true, gold);
      rule(54);
      doc.y = 72;
    };
    const room = (height: number) => { if (doc.y + height > doc.page.height - 80) continuation(); };
    doc.rect(0, 0, doc.page.width, 5).fill(gold);
    const start = invoice.preview ? 64 : 40;
    if (invoice.preview) {
      doc.rect(42, 23, width, 23).fill(pale);
      write(l.preview, 50, 29, width - 16, 8, true, gold);
    }
    doc.image(logo, 42, start, { fit: [67, 67] });
    write('APFEL PARK', 124, start + 1, 220, 16, true);
    write('SMART PHONE. SMART SERVICE. SMART PRICE.', 124, start + 27, 242, 6.5, true, gold);
    write(invoice.issuer.owner, 124, start + 43, 240, 9, false, muted);
    write(l.title, 348, start + 1, right - 348, 25, true, ink, 'right');
    write(invoice.kind === 'advance' ? l.advance : invoice.number, 330, start + 36, right - 330, 8, false, gold, 'right');
    rule(start + 87);
    const metaY = start + 106;
    write(l.billTo, 42, metaY, 268, 8, true, gold);
    const address = [invoice.customer.name, invoice.customer.line1, invoice.customer.line2, `${invoice.customer.postalCode} ${invoice.customer.city}`, invoice.customer.country].filter(Boolean);
    let addressY = metaY + 19;
    for (const [i, line] of address.entries()) {
      write(line, 42, addressY, 255, i === 0 ? 11 : 9.5, i === 0);
      addressY = doc.y + 4;
    }
    const fields = [[l.number, invoice.number], [l.date, invoiceDisplayDate(invoice.issueDate, invoice.locale)], [l.order, invoice.orderLabel], [invoice.kind === 'advance' ? l.receipt : l.supply, invoiceDisplayDate(invoice.supplyDate, invoice.locale)]];
    let y = metaY;
    for (const [label, value] of fields) {
      write(label, 318, y, 113, 8, false, muted);
      write(value, 422, y, right - 422, 8.5, true, ink, 'right');
      y += 23;
    }
    y = Math.max(addressY + 23, y + 18);
    doc.roundedRect(42, y, width, 45, 7).fill(pale);
    doc.circle(58, y + 21, 3).fill('#287048');
    write(l.paid, 68, y + 14, 90, 10, true, '#287048');
    write(`${invoice.paymentMethod} · ${invoiceDisplayDate(invoice.paidDate, invoice.locale)}`, 159, y + 15, width - 176, 9, false, muted, 'right');
    doc.y = y + 60;
    const tableHeader = () => {
      const top = doc.y;
      doc.rect(42, top, width, 25).fill(ink);
      write(l.description, 53, top + 7, 270, 8, true, '#ffffff');
      write(l.qty, 319, top + 7, 38, 8, true, '#ffffff', 'right');
      write(l.unit, 362, top + 7, 83, 8, true, '#ffffff', 'right');
      write(l.amount, 452, top + 7, right - 463, 8, true, '#ffffff', 'right');
      doc.y = top + 32;
    };
    tableHeader();
    for (const item of invoice.lines) {
      doc.font('bold').fontSize(9.5);
      const titleHeight = doc.heightOfString(item.title, { width: 255, lineGap: 2 });
      const condition = item.condition === 'used' ? l.used : item.condition === 'open_box' ? l.openBox : item.condition === 'new' ? l.new : '';
      const detail = [item.detail, condition, item.sku ? `SKU: ${item.sku}` : ''].filter(Boolean).join(' · ');
      doc.font('regular').fontSize(7.5);
      const detailHeight = detail ? doc.heightOfString(detail, { width: 255, lineGap: 2 }) : 0;
      const height = titleHeight + detailHeight + 20;
      if (doc.y + height > doc.page.height - 90) { continuation(); tableHeader(); }
      const top = doc.y;
      write(item.title, 53, top + 6, 255, 9.5, true);
      if (detail) write(detail, 53, top + 9 + titleHeight, 255, 7.5, false, muted);
      write(String(item.quantity), 319, top + 7, 38, 9, false, ink, 'right');
      write(money(item.unitCents), 362, top + 7, 83, 9, false, ink, 'right');
      write(money(item.grossCents), 452, top + 7, right - 463, 9, true, ink, 'right');
      rule(top + height);
      doc.y = top + height + 2;
    }
    doc.y += 13;
    room(205);
    const totalsTop = doc.y;
    write(invoice.taxMode === 'margin' ? l.margin : l.gross, 42, totalsTop, 228, 7.5, false, muted);
    if (invoice.kind === 'advance') write(l.advanceNote, 42, doc.y + 14, 228, 8, false, muted);
    const totals: Array<[string, string]> = [[l.subtotal, money(invoice.subtotalCents)], [l.shipping, money(invoice.shippingCents)]];
    if (invoice.discountCents) totals.push([l.discount, `−${money(invoice.discountCents)}`]);
    if (invoice.taxMode === 'standard') totals.push([l.net, money(invoice.netCents ?? 0)], [`${l.vat} (${invoice.vatRateBps / 100}%)`, money(invoice.vatCents ?? 0)]);
    let totalsY = totalsTop;
    for (const [label, value] of totals) {
      write(label, 303, totalsY, 141, 8.5, false, muted);
      write(value, 450, totalsY, right - 450, 9, false, ink, 'right');
      totalsY += 21;
    }
    doc.moveTo(303, totalsY).lineTo(right, totalsY).lineWidth(1).strokeColor(gold).stroke();
    write(l.total, 303, totalsY + 12, 135, 10.5, true);
    write(money(invoice.totalCents), 428, totalsY + 7, right - 428, 18, true, ink, 'right');
    write(l.paidAmount, 303, totalsY + 43, 141, 8.5, false, muted);
    write(money(invoice.totalCents), 450, totalsY + 43, right - 450, 9, false, ink, 'right');
    write(l.balance, 303, totalsY + 65, 141, 9, true, '#287048');
    write(money(0), 450, totalsY + 65, right - 450, 10, true, '#287048', 'right');
    doc.y = Math.max(doc.y, totalsY + 102);
    room(32);
    rule(doc.y);
    write(l.thanks, 42, doc.y + 16, width, 10, true);
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i);
      const previousBottomMargin = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      const footerY = doc.page.height - 67;
      rule(footerY);
      write(`${invoice.issuer.owner} · ${invoice.issuer.name}`, 42, footerY + 10, width - 50, 7.3, true);
      write(`${invoice.issuer.address}  |  ${l.taxId}: ${invoice.issuer.taxId}`, 42, footerY + 24, width, 6.8, false, muted);
      write(`${invoice.issuer.email}  ·  ${invoice.issuer.phone}  ·  apfel-park.de`, 42, footerY + 38, width - 55, 6.8, false, muted);
      write(`${l.page} ${i + 1}/${range.count}`, right - 55, footerY + 38, 55, 6.8, false, muted, 'right');
      doc.page.margins.bottom = previousBottomMargin;
    }
    doc.end();
  });
};
