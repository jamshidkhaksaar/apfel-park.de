import { notFound } from "next/navigation";

import { getAdminDictionary } from "@/lib/admin-i18n-server";
import { siteInfo } from "@/lib/site";
import { formatVariant, getOrderDetail } from "../../order-data";
import PrintButton from "./print-button";

export const dynamic = "force-dynamic";

export default async function PackingSlipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, dict] = await Promise.all([getOrderDetail(id), getAdminDictionary()]);

  if (!order) {
    notFound();
  }

  const t = dict.ordersPage.print;
  const items = Array.isArray(order.items) ? order.items : [];
  const address = order.customer_address;
  const orderLabel = order.order_number ? `A-${order.order_number}` : order.id.slice(0, 8);
  const isShipping = order.shipping_method === "germany";
  const orderDate = order.paid_at ?? order.created_at;

  return (
    <div className="min-h-screen bg-white p-10 font-sans text-black">
      <style>{`
        @media print {
          .print-hidden { display: none !important; }
          body { background: #fff !important; }
        }
        @page { size: A4; margin: 12mm; }
      `}</style>

      <div className="mx-auto max-w-[180mm]">
        <div className="print-hidden mb-8 flex justify-end">
          <PrintButton label={t.printButton} />
        </div>

        <div className="flex items-start justify-between border-b-2 border-black pb-4">
          <div>
            <p className="text-2xl font-bold">{siteInfo.name}</p>
            <p className="text-sm">{siteInfo.tagline}</p>
          </div>
          <div className="text-right text-sm">
            <p>
              <span className="font-semibold">{t.order}:</span> #{orderLabel}
            </p>
            <p>
              <span className="font-semibold">{t.date}:</span>{" "}
              {orderDate ? new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(new Date(orderDate)) : "-"}
            </p>
            <p className="mt-1 font-semibold">{isShipping ? t.standardShipment : t.pickup}</p>
            {order.tracking_id ? (
              <p className="mt-1 break-all font-mono text-xs font-semibold">{order.tracking_id}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest">{t.sender}</p>
            <p className="mt-2 text-sm leading-relaxed">
              {siteInfo.name}
              <br />
              {siteInfo.owner.roleDe}: {siteInfo.legalName}
              <br />
              {siteInfo.address.street}
              <br />
              {siteInfo.address.postalCode} {siteInfo.address.city}
              <br />
              {siteInfo.address.country}
              <br />
              {siteInfo.phone}
            </p>
          </div>
          <div className="rounded border-2 border-black p-4">
            <p className="text-xs font-semibold uppercase tracking-widest">{t.shipTo}</p>
            <p className="mt-2 text-xl font-bold leading-relaxed">
              {order.customer_name}
              {isShipping && address ? (
                <>
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
                </>
              ) : null}
            </p>
            {order.customer_phone ? <p className="mt-2 text-sm">{order.customer_phone}</p> : null}
          </div>
        </div>

        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-widest">{t.itemsHeading}</p>
          <table className="mt-2 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-black text-left">
                <th className="py-2 pr-4">{t.qty}</th>
                <th className="py-2 pr-4">Artikel</th>
                <th className="py-2">SKU</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="border-b border-gray-400">
                  <td className="py-2 pr-4 font-semibold">{item.quantity ?? 1}x</td>
                  <td className="py-2 pr-4">
                    {item.title ?? "-"}
                    {formatVariant(item) ? ` (${formatVariant(item)})` : ""}
                  </td>
                  <td className="py-2">{item.sku ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-10 text-xs text-gray-700">
          {siteInfo.name} · {siteInfo.address.street}, {siteInfo.address.postalCode} {siteInfo.address.city} ·{" "}
          {siteInfo.email} · {siteInfo.url.replace("https://", "")} · USt-IdNr. {siteInfo.vatId}
        </p>
      </div>
    </div>
  );
}
