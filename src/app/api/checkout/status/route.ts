import { NextRequest, NextResponse } from 'next/server';

import { CHECKOUT_RETURN_COOKIE, readCheckoutReturnSession } from '@/lib/checkout-return-session';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

const privateHeaders = {
  'Cache-Control': 'private, no-store, max-age=0',
  Pragma: 'no-cache',
  Vary: 'Cookie, X-Checkout-Order',
};

/** Read the webhook-confirmed local status. Never capture, refund or mutate. */
export async function GET(request: NextRequest) {
  const session = readCheckoutReturnSession(request.cookies.get(CHECKOUT_RETURN_COOKIE)?.value);
  // A newer checkout in another tab may replace the cookie. Never confirm an
  // older receipt using the newer order's status; bind both references exactly.
  if (!session || request.headers.get('X-Checkout-Order') !== session.orderId) {
    return NextResponse.json({ success: false, error: 'Confirmation session unavailable' }, { status: 401, headers: privateHeaders });
  }

  try {
    const result = await query('SELECT payment_status, status FROM orders WHERE id = $1 LIMIT 1', [session.orderId]);
    const order = result.rows[0];
    if (!order) {
      return NextResponse.json({ success: false, error: 'Confirmation unavailable' }, { status: 404, headers: privateHeaders });
    }
    const state = order.status === 'cancelled' ? 'cancelled'
      : ['refunded', 'partially_refunded'].includes(order.payment_status) ? 'refunded'
        : order.payment_status === 'paid' ? 'paid'
          : order.payment_status === 'failed' ? 'failed' : 'pending';
    // No identity, address, tokens, line items or provider references leave here.
    return NextResponse.json({ success: true, state }, { headers: privateHeaders });
  } catch {
    return NextResponse.json({ success: false, error: 'Payment status temporarily unavailable' }, {
      status: 503, headers: { ...privateHeaders, 'Retry-After': '3' },
    });
  }
}
