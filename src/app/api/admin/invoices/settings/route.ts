import { NextRequest, NextResponse } from 'next/server';
import { rejectCrossSiteAdminMutation } from '@/lib/admin-csrf';
import { isAdminUser } from '@/lib/admin-auth';
import { requireInvoiceUser } from '@/lib/order-invoice-auth';
import { getCustomerInvoiceSettings, saveCustomerInvoiceSettings } from '@/lib/order-invoice-service';

export async function GET() {
  const auth = await requireInvoiceUser();
  if (auth.response) return auth.response;
  return NextResponse.json(await getCustomerInvoiceSettings(), { headers: { 'Cache-Control': 'private, no-store' } });
}
export async function POST(request: NextRequest) {
  const auth = await requireInvoiceUser();
  if (auth.response) return auth.response;
  if (!isAdminUser(auth.user)) return NextResponse.json({ error: 'Only an administrator can approve invoice settings' }, { status: 403 });
  const csrf = rejectCrossSiteAdminMutation(request, 'Unauthorized');
  if (csrf) return csrf;
  try {
    const data = await request.json() as Record<string, unknown>;
    await saveCustomerInvoiceSettings(typeof data.taxId === 'string' ? data.taxId.trim() : '', data.taxConfirmed === true, data.approve === true);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid invoice settings' }, { status: 400 });
  }
}
