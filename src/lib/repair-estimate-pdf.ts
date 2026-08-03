import { access } from 'node:fs/promises';
import path from 'node:path';

import PDFDocument from 'pdfkit';
import sharp from 'sharp';

import { resolveUploadPath } from '@/lib/blob';
import { createAdminDbClient } from '@/lib/admin-db';
import { siteInfo } from '@/lib/site';
import {
  calculateEstimateTotals,
  type RepairEstimatePayload,
} from '@/lib/repair-estimates';

const gold = '#b88721';
const charcoal = '#202020';
const muted = '#666666';
const line = '#ded8ca';
const paperTint = '#f8f5ed';
const regularFontPath = path.join(process.cwd(), 'public', 'fonts', 'NotoSans-Regular.ttf');
const boldFontPath = path.join(process.cwd(), 'public', 'fonts', 'NotoSans-Bold.ttf');
const regularFont = 'ApfelSans';
const boldFont = 'ApfelSansBold';

const formatMoney = (cents: number, language: 'de' | 'en'): string =>
  new Intl.NumberFormat(language === 'de' ? 'de-DE' : 'en-GB', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);

const formatDate = (date: string, language: 'de' | 'en'): string =>
  new Intl.DateTimeFormat(language === 'de' ? 'de-DE' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00Z`));

const getLogoPath = async (): Promise<string | null> => {
  const admin = createAdminDbClient();
  const { data } = await admin.from('store_settings').select('value').eq('key', 'branding_assets').maybeSingle();
  const value = data?.value as { logo?: unknown } | null | undefined;
  const logoUrl = typeof value?.logo === 'string' ? value.logo : '/branding/logo.jpg';
  const uploadPath = resolveUploadPath(logoUrl);
  const fallbackPath = path.join(process.cwd(), 'public', logoUrl.replace(/^\//, ''));
  const candidates = [uploadPath, fallbackPath].filter((candidate): candidate is string => Boolean(candidate));
  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next local branding asset.
    }
  }
  return null;
};

const addressLines = (payload: RepairEstimatePayload): string[] => {
  const recipient = payload.insurer.enabled ? payload.insurer : payload.customer;
  const lines = [recipient.name];
  if (payload.insurer.enabled && payload.insurer.contactName) lines.push(payload.insurer.contactName);
  if (recipient.street) lines.push(recipient.street);
  const city = [recipient.postalCode, recipient.city].filter(Boolean).join(' ');
  if (city) lines.push(city);
  if (recipient.country) lines.push(recipient.country);
  return lines.filter(Boolean);
};

export const renderRepairEstimatePdf = async (
  estimateNumber: string,
  revision: number,
  payload: RepairEstimatePayload,
): Promise<Buffer> => {
  const logoPath = await getLogoPath();
  const logoBuffer = logoPath
    ? await sharp(logoPath).resize(220, 220, { fit: 'inside', withoutEnlargement: true }).png({ compressionLevel: 9 }).toBuffer().catch(() => null)
    : null;
  const totals = calculateEstimateTotals(payload);
  const isGerman = payload.language === 'de';
  const labels = isGerman ? {
    title: 'KOSTENVORANSCHLAG',
    estimateNo: 'Nummer',
    issueDate: 'Ausgestellt',
    validUntil: 'Gültig bis',
    repairTicket: 'Reparaturticket',
    recipient: payload.insurer.enabled ? 'Versicherung / Garantiegeber' : 'Empfänger',
    customer: 'Kunde',
    claim: 'Schadennummer',
    device: 'Gerät',
    serial: 'Seriennummer / IMEI',
    assessment: 'Schadensfeststellung',
    description: 'Leistung / Ersatzteil',
    qty: 'Menge',
    unitNet: 'Einzel netto',
    totalNet: 'Gesamt netto',
    subtotal: 'Zwischensumme netto',
    vat: 'MwSt.',
    total: 'Gesamtsumme brutto',
    payment: 'Zahlungsinformationen',
    accountHolder: 'Kontoinhaber',
    reference: 'Verwendungszweck',
    page: 'Seite',
  } : {
    title: 'REPAIR COST ESTIMATE',
    estimateNo: 'Estimate no.',
    issueDate: 'Issued',
    validUntil: 'Valid until',
    repairTicket: 'Repair ticket',
    recipient: payload.insurer.enabled ? 'Insurance / warranty company' : 'Recipient',
    customer: 'Customer',
    claim: 'Claim number',
    device: 'Device',
    serial: 'Serial number / IMEI',
    assessment: 'Damage assessment',
    description: 'Service / replacement part',
    qty: 'Qty',
    unitNet: 'Unit net',
    totalNet: 'Total net',
    subtotal: 'Subtotal (net)',
    vat: 'VAT',
    total: 'Total (gross)',
    payment: 'Payment information',
    accountHolder: 'Account holder',
    reference: 'Payment reference',
    page: 'Page',
  };

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size: 'A4',
      font: regularFontPath,
      margins: { top: 46, right: 50, bottom: 62, left: 50 },
      bufferPages: true,
      info: {
        Title: `${labels.title} ${estimateNumber}`,
        Author: 'Apfel Park',
        Subject: `${payload.device.brand} ${payload.device.model}`.trim(),
      },
    });
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('error', reject);
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.registerFont(regularFont, regularFontPath);
    doc.registerFont(boldFont, boldFontPath);

    const contentWidth = doc.page.width - 100;
    const bottomLimit = () => doc.page.height - 78;

    const drawContinuationHeader = () => {
      doc.fillColor(charcoal).font(boldFont).fontSize(9)
        .text(`APFEL PARK  ·  ${estimateNumber}${revision > 1 ? `  ·  R${revision}` : ''}`, 50, 34, { width: contentWidth });
      doc.moveTo(50, 50).lineTo(doc.page.width - 50, 50).lineWidth(0.7).strokeColor(gold).stroke();
      doc.y = 66;
    };

    const ensureSpace = (height: number) => {
      if (doc.y + height <= bottomLimit()) return;
      doc.addPage();
      drawContinuationHeader();
    };

    if (logoBuffer) {
      try {
        doc.image(logoBuffer, 50, 38, { fit: [76, 76], valign: 'center' });
      } catch {
        // The company name below remains a complete fallback letterhead.
      }
    }
    doc.fillColor(charcoal).font(boldFont).fontSize(15).text('APFEL PARK', 138, 43);
    doc.fillColor(muted).font(regularFont).fontSize(8.5)
      .text(payload.issuerText, 138, 65, { width: 190, lineGap: 2 });
    doc.text(`${siteInfo.address.street} · ${siteInfo.address.postalCode} ${siteInfo.address.city}`, 138, doc.y + 4, { width: 250 });
    doc.text(`${siteInfo.phone} · ${siteInfo.email}`, 138, doc.y + 3, { width: 270 });
    doc.text(`USt-IdNr. / VAT ID: ${siteInfo.vatId}`, 138, doc.y + 3, { width: 250 });

    doc.fillColor(gold).font(boldFont).fontSize(16)
      .text(labels.title, 346, 44, { width: 199, align: 'right' });
    doc.fillColor(charcoal).font(regularFont).fontSize(8.5);
    const meta = [
      [labels.estimateNo, `${estimateNumber}${revision > 1 ? ` / R${revision}` : ''}`],
      [labels.issueDate, formatDate(payload.issueDate, payload.language)],
      [labels.validUntil, formatDate(payload.validUntil, payload.language)],
      ...(payload.repairTicket ? [[labels.repairTicket, payload.repairTicket]] : []),
    ];
    let metaY = 70;
    for (const [label, value] of meta) {
      doc.font(boldFont).text(`${label}:`, 350, metaY, { width: 82, align: 'right' });
      doc.font(regularFont).text(value, 438, metaY, { width: 107, align: 'right' });
      metaY += 13;
    }

    doc.moveTo(50, 131).lineTo(doc.page.width - 50, 131).lineWidth(1.2).strokeColor(gold).stroke();
    const recipientY = 151;
    const recipientLines = addressLines(payload);
    doc.fillColor(gold).font(boldFont).fontSize(8)
      .text(labels.recipient.toUpperCase(), 50, recipientY, { width: 240 });
    doc.fillColor(charcoal).font(boldFont).fontSize(10.5)
      .text(recipientLines[0] || '-', 50, recipientY + 14, { width: 240 });
    doc.font(regularFont).fontSize(9)
      .text(recipientLines.slice(1).join('\n'), 50, recipientY + 29, { width: 240, lineGap: 1 });
    if (payload.insurer.enabled) {
      doc.fillColor(gold).font(boldFont).fontSize(8)
        .text(labels.customer.toUpperCase(), 330, recipientY, { width: 215 });
      doc.fillColor(charcoal).font(boldFont).fontSize(10)
        .text(payload.customer.name || '-', 330, recipientY + 14, { width: 215 });
      doc.font(regularFont).fontSize(9)
        .text(payload.customer.email || payload.customer.phone || '', 330, recipientY + 29, { width: 215 });
      if (payload.insurer.claimNumber) {
        doc.text(`${labels.claim}: ${payload.insurer.claimNumber}`, 330, recipientY + 43, { width: 215 });
      }
    }
    doc.y = 222;

    const deviceY = doc.y;
    doc.roundedRect(50, deviceY, contentWidth, 48, 5).fillAndStroke(paperTint, line);
    doc.fillColor(gold).font(boldFont).fontSize(8).text(labels.device.toUpperCase(), 64, deviceY + 10);
    doc.fillColor(charcoal).font(boldFont).fontSize(11)
      .text([payload.device.brand, payload.device.model].filter(Boolean).join(' ') || '-', 64, deviceY + 24, { width: 300 });
    if (payload.device.serialNumber) {
      doc.fillColor(muted).font(regularFont).fontSize(8.5)
        .text(`${labels.serial}: ${payload.device.serialNumber}`, 350, deviceY + 24, { width: 180, align: 'right' });
    }
    doc.y = deviceY + 62;

    const assessmentY = doc.y;
    doc.fillColor(gold).font(boldFont).fontSize(8)
      .text(labels.assessment.toUpperCase(), 50, assessmentY, { width: contentWidth });
    const assessmentHeight = doc.heightOfString(payload.damageAssessment || '-', { width: contentWidth, lineGap: 3 });
    doc.fillColor(charcoal).font(regularFont).fontSize(9.5)
      .text(payload.damageAssessment || '-', 50, assessmentY + 14, { width: contentWidth, lineGap: 3 });
    doc.y = assessmentY + 14 + assessmentHeight + 18;

    ensureSpace(70);
    const tableX = 50;
    const widths = [291, 45, 80, 79];
    const headers = [labels.description, labels.qty, labels.unitNet, labels.totalNet];
    const drawTableHeader = () => {
      const headerY = doc.y;
      doc.rect(tableX, headerY, contentWidth, 24).fill(gold);
      let x = tableX;
      headers.forEach((header, index) => {
        doc.fillColor('#ffffff').font(boldFont).fontSize(8)
          .text(header, x + 7, headerY + 8, { width: widths[index] - 14, align: index > 1 ? 'right' : index === 1 ? 'center' : 'left' });
        x += widths[index];
      });
      doc.y = headerY + 24;
    };
    drawTableHeader();

    payload.items.forEach((item, index) => {
      const lineTotals = totals.lines[index];
      const descriptionHeight = doc.heightOfString(item.description || '-', { width: widths[0] - 14, lineGap: 1 });
      const rowHeight = Math.max(27, descriptionHeight + 14);
      if (doc.y + rowHeight + 30 > bottomLimit()) {
        doc.addPage();
        drawContinuationHeader();
        drawTableHeader();
      }
      const rowY = doc.y;
      if (index % 2 === 0) doc.rect(tableX, rowY, contentWidth, rowHeight).fill('#fbfaf7');
      doc.rect(tableX, rowY, contentWidth, rowHeight).lineWidth(0.4).strokeColor(line).stroke();
      doc.fillColor(charcoal).font(regularFont).fontSize(8.7)
        .text(item.description || '-', tableX + 7, rowY + 7, { width: widths[0] - 14, lineGap: 1 });
      doc.text(String(item.quantity), tableX + widths[0], rowY + 8, { width: widths[1], align: 'center' });
      doc.text(formatMoney(Math.round(lineTotals.netCents / item.quantity), payload.language), tableX + widths[0] + widths[1] + 5, rowY + 8, { width: widths[2] - 12, align: 'right' });
      doc.font(boldFont).text(formatMoney(lineTotals.netCents, payload.language), tableX + widths[0] + widths[1] + widths[2] + 5, rowY + 8, { width: widths[3] - 12, align: 'right' });
      doc.y = rowY + rowHeight;
    });

    ensureSpace(125);
    doc.y += 10;
    const totalsX = 315;
    const totalsWidth = 230;
    const totalRows: Array<[string, string, boolean]> = [
      [labels.subtotal, formatMoney(totals.netCents, payload.language), false],
      [`${labels.vat} (${(payload.vatRateBps / 100).toFixed(isGerman ? 0 : 0)}%)`, formatMoney(totals.vatCents, payload.language), false],
      [labels.total, formatMoney(totals.grossCents, payload.language), true],
    ];
    totalRows.forEach(([label, value, prominent]) => {
      const rowY = doc.y;
      doc.rect(totalsX, rowY, totalsWidth, prominent ? 31 : 25).fill(prominent ? gold : paperTint);
      doc.fillColor(prominent ? '#ffffff' : charcoal).font(boldFont).fontSize(prominent ? 10 : 8.5)
        .text(label, totalsX + 10, rowY + (prominent ? 10 : 8), { width: 130 });
      doc.text(value, totalsX + 140, rowY + (prominent ? 9 : 8), { width: 78, align: 'right' });
      doc.y = rowY + (prominent ? 31 : 25) + 2;
    });

    ensureSpace(132);
    doc.y += 16;
    const paymentY = doc.y;
    doc.roundedRect(50, paymentY, contentWidth, 83, 6).fillAndStroke(paperTint, line);
    doc.fillColor(gold).font(boldFont).fontSize(8).text(labels.payment.toUpperCase(), 64, paymentY + 12);
    const bankLines = [
      `${payload.bankName}`,
      `${labels.accountHolder}: ${payload.accountHolder}`,
      `IBAN: ${payload.iban}`,
      `BIC: ${payload.bic}`,
    ];
    doc.fillColor(charcoal).font(regularFont).fontSize(8.6).text(bankLines.join('\n'), 64, paymentY + 28, { width: 270, lineGap: 2 });
    const reference = payload.paymentReference || payload.insurer.claimNumber || estimateNumber;
    doc.fillColor(gold).font(boldFont).fontSize(8).text(labels.reference.toUpperCase(), 353, paymentY + 27, { width: 174, align: 'right' });
    doc.fillColor(charcoal).font(boldFont).fontSize(9.5).text(reference, 353, paymentY + 43, { width: 174, align: 'right' });
    doc.y = paymentY + 99;

    if (payload.footerNote) {
      ensureSpace(55);
      doc.fillColor(muted).font(regularFont).fontSize(8.3)
        .text(payload.footerNote, 50, doc.y, { width: contentWidth, lineGap: 2 });
    }

    const range = doc.bufferedPageRange();
    for (let index = range.start; index < range.start + range.count; index += 1) {
      doc.switchToPage(index);
      const footerY = doc.page.height - 79;
      doc.moveTo(50, footerY - 8).lineTo(doc.page.width - 50, footerY - 8).lineWidth(0.4).strokeColor(line).stroke();
      doc.fillColor(muted).font(regularFont).fontSize(7.5)
        .text(`${siteInfo.name} · ${siteInfo.address.street} · ${siteInfo.address.postalCode} ${siteInfo.address.city} · ${siteInfo.url.replace(/^https?:\/\//, '')}`, 50, footerY, { width: 410, lineBreak: false });
      doc.text(`${labels.page} ${index + 1} / ${range.count}`, 470, footerY, { width: 75, align: 'right', lineBreak: false });
    }

    doc.end();
  });
};
