import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { canManageProducts } from "@/lib/admin-auth";
import { getAdminLocale } from "@/lib/admin-i18n-server";
import {
  loadStockReport,
  parseStockReportFilters,
  type StockReportFilters,
  type StockReportRow,
} from "@/lib/admin-stock-report";
import { readSessionUser } from "@/lib/session";

import PrintReportButton from "./PrintReportButton";

export const dynamic = "force-dynamic";

const COPY = {
  de: {
    numberLocale: "de-DE",
    titles: {
      smartphones: "Smartphones", tablets: "Tablets", accessories: "Zubehör", parts: "Ersatzteile", laptops: "Laptops", consoles: "Gaming", "": "Produkte",
    },
    inShop: "im Online-Shop", drafts: "– Entwürfe (nicht veröffentlicht)", allStatus: "– aktiv und Entwürfe",
    stand: (date: string) => `Stand ${date} Uhr · apfel-park.de`,
    filters: "Filter", conditions: { new: "Neu", open_box: "Open Box", used: "Gebraucht A+" } as Record<string, string>,
    conditionFilter: { new: "Neu", open_box: "Open Box", used: "Gebraucht" } as Record<string, string>,
    stockFilter: { in_stock: "nur auf Lager", sold_out: "nur ausverkauft" } as Record<string, string>,
    search: "Suche", brands: "Marken",
    print: "Drucken / Als PDF speichern", back: "← Filter ändern",
    summaryBrand: "Marke", summaryProducts: "Angebote", summarySoldOut: "davon ausverkauft", summaryUnits: "Stück auf Lager", total: "Gesamt",
    note: (products: number, units: number, soldOut: number) =>
      `${products} Angebote mit zusammen ${units} Stück. ${soldOut} Zeilen sind ausverkauft (rot, Menge 0). Jede Zeile ist ein Modell in einer Farbe und Speichergröße.`,
    campaign: "Black-Week-Preis gilt bis 30. November, 23:59 Uhr.",
    head: { ref: "Nr.", image: "Bild", model: "Modell", color: "Farbe", storage: "Speicher", condition: "Zustand", price: "Preis", sale: "Black Week", qty: "Menge", status: "Status", check: "OK" },
    active: "Aktiv", draft: "Entwurf",
    groupMeta: (products: number, units: number) => `${products} ${products === 1 ? "Angebot" : "Angebote"} · ${units} Stück`,
    empty: "Keine Produkte für diese Filter.",
    footer: "Apfel Park · Bestandsbericht",
    truncated: "Die Liste wurde nach 5.000 Produkten gekürzt – Filter enger setzen.",
  },
  en: {
    numberLocale: "en-GB",
    titles: {
      smartphones: "Smartphones", tablets: "Tablets", accessories: "Accessories", parts: "Spare parts", laptops: "Laptops", consoles: "Gaming", "": "Products",
    },
    inShop: "in the online shop", drafts: "– drafts (not published)", allStatus: "– active and drafts",
    stand: (date: string) => `As of ${date} · apfel-park.de`,
    filters: "Filters", conditions: { new: "New", open_box: "Open box", used: "Used A+" } as Record<string, string>,
    conditionFilter: { new: "New", open_box: "Open box", used: "Used" } as Record<string, string>,
    stockFilter: { in_stock: "in stock only", sold_out: "sold out only" } as Record<string, string>,
    search: "Search", brands: "Brands",
    print: "Print / save as PDF", back: "← Change filters",
    summaryBrand: "Brand", summaryProducts: "Offers", summarySoldOut: "sold out", summaryUnits: "Units in stock", total: "Total",
    note: (products: number, units: number, soldOut: number) =>
      `${products} offers with ${units} units in total. ${soldOut} rows are sold out (red, quantity 0). Each row is one model in one colour and storage size.`,
    campaign: "Black Week price valid until 30 November, 23:59.",
    head: { ref: "No.", image: "Photo", model: "Model", color: "Colour", storage: "Storage", condition: "Condition", price: "Price", sale: "Black Week", qty: "Qty", status: "Status", check: "OK" },
    active: "Active", draft: "Draft",
    groupMeta: (products: number, units: number) => `${products} ${products === 1 ? "offer" : "offers"} · ${units} units`,
    empty: "No products match these filters.",
    footer: "Apfel Park · Stock report",
    truncated: "The list was cut at 5,000 products – narrow the filters.",
  },
};

type Copy = (typeof COPY)["de"];

const reportTitle = (t: Copy, filters: StockReportFilters): string => {
  const subject = t.titles[filters.category];
  if (filters.status === "draft") return `${subject} ${t.drafts}`;
  if (filters.status === "all") return `${subject} ${t.allStatus}`;
  return `${subject} ${t.inShop}`;
};

const filterSummary = (t: Copy, filters: StockReportFilters): string[] => [
  ...(filters.condition ? [t.conditionFilter[filters.condition]] : []),
  ...(filters.stock !== "all" ? [t.stockFilter[filters.stock]] : []),
  ...(filters.brands.length ? [`${t.brands}: ${filters.brands.join(", ")}`] : []),
  ...(filters.search ? [`${t.search}: „${filters.search}“`] : []),
];

export default async function StockReportPrintPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await readSessionUser();
  if (!canManageProducts(user)) redirect("/admin?error=forbidden");
  const locale = await getAdminLocale();
  const t = COPY[locale] ?? COPY.de;
  const filters = parseStockReportFilters(await searchParams);
  const report = await loadStockReport(filters);
  const money = (value: number) => value.toLocaleString(t.numberLocale, { style: "currency", currency: "EUR" });
  const stand = new Intl.DateTimeFormat(t.numberLocale, {
    dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Berlin",
  }).format(new Date(report.generatedAt));
  const title = reportTitle(t, filters);
  const showStatus = filters.status === "all";
  const showSale = report.campaignLive;
  const chips = filterSummary(t, filters);

  const cells = (row: StockReportRow) => {
    const soldOut = row.stock <= 0;
    return (
      <tr key={`${row.productId}-${row.color}-${row.storage}`} className={`report-row ${soldOut ? "bg-red-50" : "even:bg-neutral-50"}`}>
        <td className="px-1.5 py-1 font-mono text-[9px] font-semibold text-neutral-700">{row.ref}</td>
        {filters.images ? (
          <td className="px-1 py-0.5">
            {row.image ? (
              <Image src={row.image} alt="" width={34} height={34} unoptimized loading="eager" className="size-[34px] object-contain" />
            ) : null}
          </td>
        ) : null}
        <td className="px-1.5 py-1">
          <span className="block font-semibold text-neutral-900">{row.model}</span>
          {row.title && row.title !== row.model ? <span className="block text-[8.5px] leading-tight text-neutral-500">{row.title}</span> : null}
        </td>
        <td className="px-1.5 py-1">{row.color || "–"}</td>
        <td className="whitespace-nowrap px-1.5 py-1">{row.storage || "–"}</td>
        <td className="whitespace-nowrap px-1.5 py-1">{t.conditions[row.condition] ?? row.condition}</td>
        <td className="whitespace-nowrap px-1.5 py-1 text-right tabular-nums">{row.price > 0 ? money(row.price) : "–"}</td>
        {showSale ? (
          <td className="whitespace-nowrap px-1.5 py-1 text-right font-semibold tabular-nums text-[#8a6d22]">{row.salePrice ? money(row.salePrice) : "–"}</td>
        ) : null}
        <td className={`px-1.5 py-1 text-right text-[11px] font-bold tabular-nums ${soldOut ? "text-red-700" : "text-neutral-900"}`}>{row.stock}</td>
        {showStatus ? <td className="px-1.5 py-1">{row.active ? t.active : t.draft}</td> : null}
        {filters.checkColumn ? <td className="w-8 border-l border-neutral-300 px-1.5 py-1" /> : null}
      </tr>
    );
  };

  return (
    <main className="min-h-screen bg-white px-6 py-6 text-[10px] text-neutral-900 print:p-0">
      <style>{`
        @page { size: A4; margin: 12mm 10mm 14mm; }
        @media print {
          .report-row { break-inside: avoid; }
          .report-group h2 { break-after: avoid; }
          thead { display: table-header-group; }
        }
      `}</style>

      <div className="mx-auto max-w-[190mm]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link href="/admin/products/reports" className="text-sm font-semibold text-neutral-600 hover:text-black">{t.back}</Link>
          <PrintReportButton label={t.print} />
        </div>

        <header className="border-t-2 border-[#a88a3c] pt-4">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1 text-[11px] text-neutral-500">{t.stand(stand)}</p>
          {chips.length ? <p className="mt-1 text-[11px] text-neutral-600">{t.filters}: {chips.join(" · ")}</p> : null}
        </header>

        {report.groups.length === 0 ? (
          <p className="mt-8 text-sm text-neutral-600">{t.empty}</p>
        ) : (
          <>
            <table className="mt-5 w-full border-collapse text-[10px]">
              <thead>
                <tr className="border-b-2 border-neutral-900 text-left text-[9px] uppercase tracking-wide text-neutral-500">
                  <th className="py-1.5 pr-2">{t.summaryBrand}</th>
                  <th className="py-1.5 pr-2 text-right">{t.summaryProducts}</th>
                  <th className="py-1.5 pr-2 text-right">{t.summarySoldOut}</th>
                  <th className="py-1.5 text-right">{t.summaryUnits}</th>
                </tr>
              </thead>
              <tbody>
                {report.groups.map((group) => (
                  <tr key={group.brand} className="border-b border-neutral-200">
                    <td className="py-1 pr-2 font-semibold">{group.brand}</td>
                    <td className="py-1 pr-2 text-right tabular-nums">{group.products}</td>
                    <td className="py-1 pr-2 text-right tabular-nums">{group.soldOut || "–"}</td>
                    <td className="py-1 text-right tabular-nums">{group.units}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-neutral-900 bg-neutral-100 font-bold">
                  <td className="py-1.5 pr-2">{t.total}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums">{report.totals.products}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums">{report.totals.soldOut || "–"}</td>
                  <td className="py-1.5 text-right tabular-nums">{report.totals.units}</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-2 text-[10px] text-neutral-600">
              {t.note(report.totals.products, report.totals.units, report.totals.soldOut)} {showSale ? t.campaign : ""}
            </p>
            {report.totals.products >= 5000 ? <p className="mt-1 text-[10px] font-semibold text-red-700">{t.truncated}</p> : null}

            {report.groups.map((group) => (
              <section key={group.brand} className="report-group mt-6">
                <h2 className="text-base font-bold">
                  {group.brand} <span className="text-[11px] font-semibold text-neutral-500">· {t.groupMeta(group.products, group.units)}</span>
                </h2>
                <table className="mt-1.5 w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-neutral-900 text-left text-[8.5px] uppercase tracking-wide text-neutral-500">
                      <th className="px-1.5 py-1">{t.head.ref}</th>
                      {filters.images ? <th className="px-1 py-1">{t.head.image}</th> : null}
                      <th className="px-1.5 py-1">{t.head.model}</th>
                      <th className="px-1.5 py-1">{t.head.color}</th>
                      <th className="px-1.5 py-1">{t.head.storage}</th>
                      <th className="px-1.5 py-1">{t.head.condition}</th>
                      <th className="px-1.5 py-1 text-right">{t.head.price}</th>
                      {showSale ? <th className="px-1.5 py-1 text-right">{t.head.sale}</th> : null}
                      <th className="px-1.5 py-1 text-right">{t.head.qty}</th>
                      {showStatus ? <th className="px-1.5 py-1">{t.head.status}</th> : null}
                      {filters.checkColumn ? <th className="px-1.5 py-1 text-center">{t.head.check}</th> : null}
                    </tr>
                  </thead>
                  <tbody className="[&>tr]:border-b [&>tr]:border-neutral-200">{group.rows.map(cells)}</tbody>
                </table>
              </section>
            ))}
          </>
        )}
        <p className="mt-8 border-t border-neutral-200 pt-2 text-[9px] text-neutral-400">{t.footer} · {t.stand(stand)}</p>
      </div>
    </main>
  );
}
