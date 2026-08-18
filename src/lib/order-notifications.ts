import { query } from "@/lib/db";
import { sendPaidOrderAdminEmail, type PaidOrderAdminEmailData } from "@/lib/email";

export type PaidOrderNotificationResult =
  | { status: "sent"; attempts: number }
  | { status: "already-sent" }
  | { status: "in-progress" }
  | { status: "not-paid" }
  | { status: "missing" }
  | { status: "failed"; error: string };

type NotificationOrderRow = {
  id: string;
  order_number: number | null;
  paid_at: string | null;
  provider: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  shipping_method: string | null;
  customer_address: PaidOrderAdminEmailData["customerAddress"];
  items: unknown;
  subtotal_amount: number | string | null;
  shipping_amount: number | string | null;
  total_amount: number | string;
  currency: string | null;
  admin_notification_attempts: number;
};

const MAX_STORED_ERROR_LENGTH = 500;

const toEmailData = (order: NotificationOrderRow): PaidOrderAdminEmailData => ({
  id: order.id,
  orderNumber: order.order_number,
  paidAt: order.paid_at,
  provider: order.provider,
  customerName: order.customer_name,
  customerEmail: order.customer_email,
  customerPhone: order.customer_phone,
  shippingMethod: order.shipping_method,
  customerAddress: order.customer_address,
  items: order.items,
  subtotalAmount: order.subtotal_amount,
  shippingAmount: order.shipping_amount,
  totalAmount: order.total_amount,
  currency: order.currency,
});

export async function notifyPaidOrderAdmin(
  orderId: string,
  options: { force?: boolean } = {},
): Promise<PaidOrderNotificationResult> {
  const claimed = await query(
    `UPDATE orders
     SET admin_notification_claimed_at = now(),
         admin_notification_last_error = NULL,
         admin_notification_attempts = admin_notification_attempts + 1,
         updated_at = now()
     WHERE id = $1
       AND payment_status = 'paid'
       AND (admin_notification_sent_at IS NULL OR $2::boolean)
       AND (
         admin_notification_claimed_at IS NULL
         OR admin_notification_claimed_at < now() - interval '10 minutes'
       )
     RETURNING id, order_number, paid_at, provider, customer_name, customer_email, customer_phone,
               shipping_method, customer_address, items, subtotal_amount, shipping_amount,
               total_amount, currency, admin_notification_attempts`,
    [orderId, options.force === true],
  );
  const order = claimed.rows[0] as NotificationOrderRow | undefined;

  if (!order) {
    const status = await query(
      `SELECT payment_status, admin_notification_sent_at, admin_notification_claimed_at
       FROM orders
       WHERE id = $1`,
      [orderId],
    );
    const row = status.rows[0] as {
      payment_status?: string | null;
      admin_notification_sent_at?: string | null;
      admin_notification_claimed_at?: string | null;
    } | undefined;
    if (!row) return { status: "missing" };
    if (row.payment_status !== "paid") return { status: "not-paid" };
    if (row.admin_notification_sent_at && !options.force) return { status: "already-sent" };
    return { status: "in-progress" };
  }

  try {
    const result = await sendPaidOrderAdminEmail(toEmailData(order));
    if (!result.success) {
      throw new Error(result.error || "Order notification could not be sent");
    }

    await query(
      `UPDATE orders
       SET admin_notification_sent_at = now(),
           admin_notification_claimed_at = NULL,
           admin_notification_last_error = NULL,
           updated_at = now()
       WHERE id = $1`,
      [order.id],
    );
    return { status: "sent", attempts: order.admin_notification_attempts };
  } catch (error) {
    const message = (error instanceof Error ? error.message : "Order notification failed")
      .slice(0, MAX_STORED_ERROR_LENGTH);
    await query(
      `UPDATE orders
       SET admin_notification_claimed_at = NULL,
           admin_notification_last_error = $2,
           updated_at = now()
       WHERE id = $1`,
      [order.id, message],
    );
    console.error("Paid order admin notification failed", {
      orderId: order.id,
      attempt: order.admin_notification_attempts,
      error: message,
    });
    return { status: "failed", error: message };
  }
}
