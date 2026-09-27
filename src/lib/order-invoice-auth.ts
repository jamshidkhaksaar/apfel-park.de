import { NextResponse } from 'next/server';
import { canManageOrders } from '@/lib/admin-auth';
import { readSessionUser } from '@/lib/session';

export const requireInvoiceUser = async () => {
  const user = await readSessionUser();
  if (!user || !canManageOrders(user)) return { user: null, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  return { user, response: null };
};
