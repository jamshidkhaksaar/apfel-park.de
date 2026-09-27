import { NextRequest, NextResponse } from 'next/server';
import { rejectCrossSiteAdminMutation } from '@/lib/admin-csrf';
import { requireInvoiceUser } from '@/lib/order-invoice-auth';
import { getCustomerInvoiceSettings, getIssuedCustomerInvoice, issueAndSendCustomerInvoice, previewCustomerInvoice } from '@/lib/order-invoice-service';

export const runtime = 'nodejs';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireInvoiceUser();
  if (auth.response) return auth.response;
  const { id } = await params;
  if (!uuid.test(id)) return NextResponse.json({ error: 'Invalid order' }, { status: 400 });
  const [settings, invoice] = await Promise.all([getCustomerInvoiceSettings(), getIssuedCustomerInvoice(id)]);
  if (request.nextUrl.searchParams.get('pdf') === '1') {
    if (!invoice) return NextResponse.json({ error: 'Invoice not issued' }, { status: 404 });
    return new NextResponse(new Uint8Array(invoice.pdf_content), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="${invoice.invoice_number}.pdf"`, 'Cache-Control': 'private, no-store' } });
  }
  return NextResponse.json({ approved: Boolean(settings.approvedAt && settings.taxConfirmed), invoice: invoice ? { number: invoice.invoice_number, issuedAt: invoice.issued_at, sentAt: invoice.email_sent_at, sending: Boolean(invoice.email_claimed_at), needsReview: Boolean(invoice.email_last_error) } : null }, { headers: { 'Cache-Control': 'private, no-store' } });
}
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireInvoiceUser();
  if (auth.response) return auth.response;
  const csrf = rejectCrossSiteAdminMutation(request, 'Unauthorized');
  if (csrf) return csrf;
  const { id } = await params;
  if (!uuid.test(id)) return NextResponse.json({ error: 'Invalid order' }, { status: 400 });
  try {
    const data = await request.json() as Record<string, unknown>;
    const options = { supplyDate: typeof data.supplyDate === 'string' ? data.supplyDate : '', billingAddress: data.billingAddress };
    if (data.action === 'preview') {
      const pdf = await previewCustomerInvoice(id, options);
      return new NextResponse(new Uint8Array(pdf), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'inline; filename="invoice-draft.pdf"', 'Cache-Control': 'private, no-store' } });
    }
    if (data.action !== 'issue-send' && data.action !== 'resend') return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    if (data.confirm !== true) return NextResponse.json({ error: 'Confirm issuing and emailing this invoice' }, { status: 400 });
    const result = await issueAndSendCustomerInvoice(id, auth.user.id, options, data.action === 'resend');
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invoice failed' }, { status: 400 });
  }
}
