import { query } from "@/lib/db";
import { sendUnpaidOrderCustomerEmail } from "@/lib/email";

type DueOrder = {
  id: string;
  order_number: number | null;
  customer_name: string | null;
  customer_email: string;
  checkout_locale: string | null;
  items: unknown;
  total_amount: number | string;
  currency: string | null;
};

export const sendDueUnpaidOrderEmails = async (): Promise<void> => {
  const due = await query(
    `SELECT id FROM orders
     WHERE customer_unpaid_email_eligible = true
       AND customer_unpaid_email_sent_at IS NULL
       AND customer_unpaid_email_attempts < 5
       AND customer_email IS NOT NULL AND customer_email <> ''
       AND (customer_unpaid_email_claimed_at IS NULL
            OR customer_unpaid_email_claimed_at < now() - interval '10 minutes')
       AND ((status = 'cancelled' AND payment_status = 'failed')
            OR (status = 'pending' AND payment_status = 'unpaid'
                AND created_at < now() - interval '24 hours'))
     ORDER BY created_at LIMIT 10`,
  );
  for (const candidate of due.rows as Array<{ id: string }>) {
    const claim = await query(
      `UPDATE orders
       SET customer_unpaid_email_claimed_at = now(),
           customer_unpaid_email_attempts = customer_unpaid_email_attempts + 1,
           customer_unpaid_email_last_error = NULL
       WHERE id = $1 AND customer_unpaid_email_eligible = true
         AND customer_unpaid_email_sent_at IS NULL
         AND customer_unpaid_email_attempts < 5
         AND (customer_unpaid_email_claimed_at IS NULL
              OR customer_unpaid_email_claimed_at < now() - interval '10 minutes')
         AND ((status = 'cancelled' AND payment_status = 'failed')
              OR (status = 'pending' AND payment_status = 'unpaid'
                  AND created_at < now() - interval '24 hours'))
       RETURNING id, order_number, customer_name, customer_email, checkout_locale,
                 items, total_amount, currency`,
      [candidate.id],
    );
    const order = claim.rows[0] as DueOrder | undefined;
    if (!order) continue;
    try {
      const current = await query(
        `SELECT 1 FROM orders WHERE id = $1 AND payment_status IN ('failed', 'unpaid')
         AND status IN ('cancelled', 'pending') LIMIT 1`,
        [order.id],
      );
      if (current.rows.length === 0) continue;
      const result = await sendUnpaidOrderCustomerEmail({
        orderId: order.id,
        orderNumber: order.order_number,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        locale: order.checkout_locale === "en" ? "en" : "de",
        items: order.items,
        totalAmount: order.total_amount,
        currency: order.currency,
      });
      if (!result.success) throw new Error(result.error || "Unpaid email could not be sent");
      await query(
        `UPDATE orders SET customer_unpaid_email_sent_at = now(),
           customer_unpaid_email_claimed_at = NULL,
           customer_unpaid_email_last_error = NULL
         WHERE id = $1`,
        [order.id],
      );
    } catch (error) {
      const message = (error instanceof Error ? error.message : "Unpaid email failed").slice(0, 500);
      await query(
        `UPDATE orders SET customer_unpaid_email_last_error = $2 WHERE id = $1`,
        [order.id, message],
      );
      console.error("[unpaid-order-email] send failed", { orderId: order.id, error: message });
    }
  }
};
