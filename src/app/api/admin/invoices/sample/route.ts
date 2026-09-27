import { NextRequest, NextResponse } from 'next/server';
import { requireInvoiceUser } from '@/lib/order-invoice-auth';
import { invoiceDesignSample } from '@/lib/order-invoice';
import { renderOrderInvoicePdf } from '@/lib/order-invoice-pdf';
import { buildCustomerInvoiceEmail } from '@/lib/order-invoice-template';

export const runtime = 'nodejs';
export async function GET(request: NextRequest) {
  const auth = await requireInvoiceUser();
  if (auth.response) return auth.response;
  const sample = invoiceDesignSample(request.nextUrl.searchParams.get('lang') === 'en' ? 'en' : 'de');
  if (request.nextUrl.searchParams.get('format') === 'html') {
    return new NextResponse(buildCustomerInvoiceEmail(sample).html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; img-src https://apfel-park.de; base-uri 'none'; frame-ancestors 'self'" } });
  }
  const pdf = await renderOrderInvoicePdf(sample);
  return new NextResponse(new Uint8Array(pdf), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'inline; filename="Apfel-Park-Invoice-Design-Preview.pdf"', 'Cache-Control': 'private, no-store' } });
}
