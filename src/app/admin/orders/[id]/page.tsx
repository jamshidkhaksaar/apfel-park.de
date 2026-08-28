import Link from "next/link";
import { notFound } from "next/navigation";

import { getAdminDictionary, getAdminNumberLocale } from "@/lib/admin-i18n-server";
import AdminShell from "../../../../components/admin/AdminShell";
import { resendOrderNotification, updateOrderFulfillment } from "../actions";
import { formatVariant, getOrderDetail } from "../order-data";

export const dynamic = "force-dynamic";

const STATUS_OPTIONS = ["pending", "paid", "shipped", "delivered", "cancelled"] as const;

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string; notified?: string; notifyError?: string }>;
}) {
  const { id } = await params;
  const { updated, notified, notifyError } = await searchParams;
  const [order, dict, numberLocale] = await Promise.all([
    getOrderDetail(id),
    getAdminDictionary(),
    getAdminNumberLocale(),
  ]);

  if (!order) {
    notFound();
  }

  const t = dict.ordersPage.detail;
  const currency = new Intl.NumberFormat(numberLocale, {
    style: "currency",
    currency: order.currency || "EUR",
  });
  const dateFormat = new Intl.DateTimeFormat(numberLocale, { dateStyle: "medium", timeStyle: "short" });
  const formatDate = (value: string | null) => (value ? dateFormat.format(new Date(value)) : "-");
  const items = Array.isArray(order.items) ? order.items : [];
  const address = order.customer_address;
  const orderLabel = order.order_number ? `#A-${order.order_number}` : `#${order.id.slice(0, 8)}`;
  const isShipping = order.shipping_method === "germany";

  const infoRows: Array<[string, string]> = [
    [t.createdAt, formatDate(order.created_at)],
    [t.paidAt, formatDate(order.paid_at)],
    [dict.ordersPage.table.status, order.status ?? "-"],
    ["Payment", order.payment_status ?? "-"],
    [t.provider, order.provider ?? "-"],
    [t.paymentId, order.provider_payment_id ?? "-"],
    [t.sessionId, order.provider_session_id ?? "-"],
    [
      t.orderEmail,
      order.admin_notification_sent_at
        ? `${t.emailSent}: ${formatDate(order.admin_notification_sent_at)}`
        : t.emailNotSent,
    ],
    [t.trackingId, order.tracking_id ?? "-"],
    [
      "Condition consent",
      order.condition_consent?.accepted
        ? `✓ ${order.condition_consent.at ? formatDate(order.condition_consent.at) : ""} (${(order.condition_consent.items ?? [])
            .map((item) => `${item.title ?? "?"}: ${item.condition ?? "?"}`)
            .join(", ")})`
        : "-",
    ],
    [t.locale, order.checkout_locale?.toUpperCase() ?? "-"],
  ];

  return (
    <AdminShell title={`${dict.ordersPage.title} ${orderLabel}`}>
      {updated ? (
        <div className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600">
          {dict.ordersPage.saved}
        </div>
      ) : null}
      {notified ? (
        <div className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600">
          {t.notificationSent}
        </div>
      ) : null}
      {notifyError ? (
        <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-600">
          {t.notificationError}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/admin/orders"
          className="text-xs font-semibold uppercase tracking-[0.25em] text-muted underline-offset-4 hover:underline"
        >
          &larr; {t.back}
        </Link>
        <Link
          href={`/admin/orders/${order.id}/packing-slip`}
          target="_blank"
          className="rounded-full bg-foreground px-6 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-background"
        >
          {t.printSlip}
        </Link>
      </div>

      <div className="mt-6 glass-panel rounded-2xl p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{t.fulfillment}</p>
        <form action={updateOrderFulfillment} className="mt-4 flex flex-wrap items-end gap-4">
          <input type="hidden" name="id" value={order.id} />
          <input type="hidden" name="returnTo" value="detail" />
          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            {dict.ordersPage.table.status}
            <select
              name="status"
              defaultValue={order.status ?? "pending"}
              className="rounded-lg border border-border/60 bg-surface-strong/40 px-3 py-2.5 text-sm normal-case tracking-normal text-foreground focus:outline-none"
            >
              {STATUS_OPTIONS.filter((option) =>
                order.payment_status === "paid"
                  ? option === "paid" || option === "shipped" || option === "delivered"
                  : option === "pending" || option === "cancelled",
              ).map((option) => (
                <option key={option} value={option} disabled={option === "paid"}>
                  {dict.ordersPage.status[option]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-[260px] flex-1 flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            {t.trackingId}
            <input
              type="text"
              name="trackingId"
              defaultValue={order.tracking_id ?? ""}
              placeholder={t.trackingPlaceholder}
              className="rounded-lg border border-border/60 bg-surface-strong/40 px-3 py-2.5 text-sm normal-case tracking-normal text-foreground placeholder:text-muted focus:outline-none"
            />
          </label>
          <button
            type="submit"
            className="rounded-full bg-foreground px-6 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-background"
          >
            {t.save}
          </button>
        </form>
        {order.payment_status === "paid" ? (
          <form action={resendOrderNotification} className="mt-4 border-t border-border/60 pt-4">
            <input type="hidden" name="id" value={order.id} />
            <button
              type="submit"
              className="rounded-full border border-border/60 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-foreground"
            >
              {t.resendEmail}
            </button>
          </form>
        ) : null}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="glass-panel rounded-2xl p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{t.orderInfo}</p>
          <dl className="mt-4 space-y-3 text-sm">
            {infoRows.map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-4">
                <dt className="text-muted">{label}</dt>
                <dd className="break-all text-right font-medium text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{t.customer}</p>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted">{t.customer}</dt>
              <dd className="text-right font-medium text-foreground">{order.customer_name ?? "-"}</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted">{t.email}</dt>
              <dd className="break-all text-right font-medium text-foreground">{order.customer_email ?? "-"}</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted">{t.phone}</dt>
              <dd className="text-right font-medium text-foreground">
                {order.customer_phone || t.notProvided}
              </dd>
            </div>
          </dl>

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-muted">{t.shippingAddress}</p>
          {isShipping && address ? (
            <address className="mt-3 text-sm not-italic leading-relaxed text-foreground">
              {order.customer_name}
              <br />
              {address.line1}
              {address.line2 ? (
                <>
                  <br />
                  {address.line2}
                </>
              ) : null}
              <br />
              {address.postalCode} {address.city}
              <br />
              {address.country === "DE" ? "Deutschland" : address.country}
            </address>
          ) : (
            <p className="mt-3 text-sm text-muted">{t.pickupNote}</p>
          )}
        </div>
      </div>

      <div className="mt-6 glass-panel rounded-2xl p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{t.items}</p>
        <div className="mt-4 overflow-hidden rounded-xl border border-border/60">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-strong/60 text-xs uppercase tracking-[0.2em] text-muted">
              <tr>
                <th className="px-4 py-3">{dict.ordersPage.stats.product}</th>
                <th className="px-4 py-3">{t.sku}</th>
                <th className="px-4 py-3 text-right">{t.quantity}</th>
                <th className="px-4 py-3 text-right">{t.unitPrice}</th>
                <th className="px-4 py-3 text-right">{t.lineTotal}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="border-t border-border/50">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {item.title ?? "-"}
                    {formatVariant(item) ? (
                      <span className="ml-2 text-xs text-muted">{formatVariant(item)}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-muted">{item.sku ?? "-"}</td>
                  <td className="px-4 py-3 text-right text-muted">{item.quantity ?? "-"}</td>
                  <td className="px-4 py-3 text-right text-muted">
                    {typeof item.unitAmount === "number" ? currency.format(item.unitAmount) : "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-muted">
                    {typeof item.lineAmount === "number" ? currency.format(item.lineAmount) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="ml-auto mt-6 w-full max-w-xs space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted">{t.subtotal}</dt>
            <dd className="font-medium text-foreground">
              {order.subtotal_amount != null ? currency.format(Number(order.subtotal_amount)) : "-"}
            </dd>
          </div>
          {Number(order.discount_amount ?? 0)>0?<div className="flex items-center justify-between text-emerald-500"><dt>{order.coupon_code?`Coupon ${order.coupon_code}`:"Discount"}</dt><dd className="font-medium">−{currency.format(Number(order.discount_amount))}</dd></div>:null}
          <div className="flex items-center justify-between">
            <dt className="text-muted">{t.shipping}</dt>
            <dd className="font-medium text-foreground">
              {order.shipping_amount != null ? currency.format(Number(order.shipping_amount)) : "-"}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted">{t.vat}</dt>
            <dd className="font-medium text-foreground">
              {order.vat_amount != null ? currency.format(Number(order.vat_amount)) : "-"}
            </dd>
          </div>
          <div className="flex items-center justify-between border-t border-border/60 pt-2 text-base">
            <dt className="font-semibold text-foreground">{t.total}</dt>
            <dd className="font-semibold text-foreground">{currency.format(Number(order.total_amount))}</dd>
          </div>
        </dl>
      </div>
    </AdminShell>
  );
}
