"use client";

import { useState } from "react";

import { code128Width, encodeCode128B, isCode128BText } from "@/lib/barcode-code128";

export type LabelData = {
  model: string;
  storage: string;
  color: string;
  price: number;
  sku: string | null;
  condition: string;
};

const SIZES = {
  "70x50": { w: 70, h: 50, label: "70 × 50 mm" },
  "62x40": { w: 62, h: 40, label: "62 × 40 mm" },
  "100x62": { w: 100, h: 62, label: "100 × 62 mm" },
} as const;
type SizeKey = keyof typeof SIZES;

const WARRANTIES = ["12 Monate Garantie", "24 Monate Garantie", "6 Monate Garantie", "3 Monate Garantie", ""] as const;

function Barcode({ value, height }: { value: string; height: number }) {
  const widths = encodeCode128B(value);
  const total = code128Width(widths) + 20; // 10-module quiet zone each side
  let x = 10;
  const bars: Array<{ x: number; w: number }> = [];
  widths.forEach((width, index) => {
    if (index % 2 === 0) bars.push({ x, w: width });
    x += width;
  });
  return (
    <svg viewBox={`0 0 ${total} ${height}`} preserveAspectRatio="none" className="block h-full w-full" shapeRendering="crispEdges" aria-label={value}>
      <rect width={total} height={height} fill="#fff" />
      {bars.map((bar) => <rect key={bar.x} x={bar.x} y={0} width={bar.w} height={height} fill="#000" />)}
    </svg>
  );
}

/**
 * Shop shelf label: model, storage, colour, price bar with warranty, and a
 * Code 128 barcode of the SKU for the scanner in the product list.
 * Only the label prints (one per page); the toolbar is screen-only.
 */
export default function ProductLabelPrint({ data, defaultWarranty }: { data: LabelData; defaultWarranty: string }) {
  const [size, setSize] = useState<SizeKey>("70x50");
  const [warranty, setWarranty] = useState(defaultWarranty);
  const [copies, setCopies] = useState(1);
  const [price, setPrice] = useState(data.price);
  const s = SIZES[size];
  const scale = s.w / 70;
  const barcodeOk = Boolean(data.sku && isCode128BText(data.sku));
  const priceText = `${price.toLocaleString("de-DE", { minimumFractionDigits: price % 1 ? 2 : 0, maximumFractionDigits: 2 })}€`;

  return (
    <div className="min-h-screen bg-neutral-200 p-6 text-black print:bg-white print:p-0">
      <style>{`
        @page { size: ${s.w}mm ${s.h}mm; margin: 0; }
        @media print {
          html, body { background: #fff !important; }
          .label-toolbar { display: none !important; }
          .label-sheet { box-shadow: none !important; margin: 0 !important; break-after: page; page-break-after: always; }
          .label-sheet:last-child { break-after: auto; page-break-after: auto; }
        }
      `}</style>

      <div className="label-toolbar mx-auto mb-6 flex max-w-3xl flex-wrap items-end gap-4 rounded-2xl bg-white p-4 shadow">
        <label className="text-xs font-semibold text-neutral-600">Größe
          <select value={size} onChange={(event) => setSize(event.target.value as SizeKey)} className="mt-1 block rounded-lg border border-neutral-300 px-2 py-1.5 text-sm text-black">
            {Object.entries(SIZES).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-neutral-600">Garantie
          <select value={warranty} onChange={(event) => setWarranty(event.target.value)} className="mt-1 block rounded-lg border border-neutral-300 px-2 py-1.5 text-sm text-black">
            {WARRANTIES.map((value) => <option key={value} value={value}>{value || "Keine Angabe"}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-neutral-600">Preis (€)
          <input inputMode="decimal" defaultValue={String(data.price).replace(".", ",")} onChange={(event) => { const n = Number(event.target.value.replace(",", ".")); if (Number.isFinite(n) && n > 0) setPrice(n); }} className="mt-1 block w-24 rounded-lg border border-neutral-300 px-2 py-1.5 text-sm text-black" />
        </label>
        <label className="text-xs font-semibold text-neutral-600">Anzahl
          <input type="number" min={1} max={50} value={copies} onChange={(event) => setCopies(Math.min(50, Math.max(1, Number(event.target.value) || 1)))} className="mt-1 block w-20 rounded-lg border border-neutral-300 px-2 py-1.5 text-sm text-black" />
        </label>
        <button type="button" onClick={() => window.print()} className="ml-auto rounded-xl bg-black px-5 py-2.5 text-sm font-bold text-white">🖨 Drucken</button>
        {!barcodeOk ? <p className="basis-full text-xs text-red-600">Kein gültiger SKU – das Etikett wird ohne Barcode gedruckt. SKU im Produkteditor eintragen.</p> : null}
        <p className="basis-full text-[11px] text-neutral-500">Der Preis hier ändert nur das Etikett, nicht den Shop-Preis.</p>
      </div>

      <div className="flex flex-col items-center gap-6 print:block print:gap-0">
        {Array.from({ length: copies }, (_, index) => (
          <div
            key={index}
            className="label-sheet flex flex-col overflow-hidden bg-white shadow-xl"
            style={{ width: `${s.w}mm`, height: `${s.h}mm`, padding: `${2.5 * scale}mm ${3 * scale}mm` }}
          >
            <div className="text-center font-extrabold italic leading-[1.05]" style={{ fontSize: `${4.6 * scale}mm` }}>
              <div className="truncate">{data.model}</div>
              {data.storage ? <div>{data.storage}</div> : null}
            </div>
            {data.color ? (
              <div className="mt-[0.6mm] truncate text-center font-semibold" style={{ fontSize: `${2.7 * scale}mm` }}>
                Farbe: {data.color}
              </div>
            ) : null}
            <div className="mt-[1.2mm] flex flex-col items-center justify-center bg-black text-white" style={{ padding: `${0.8 * scale}mm 0` }}>
              <div className="font-extrabold leading-none" style={{ fontSize: `${6.4 * scale}mm` }}>{priceText}</div>
              {warranty ? <div className="mt-[0.5mm] font-semibold leading-none" style={{ fontSize: `${2.6 * scale}mm` }}>{warranty}</div> : null}
            </div>
            {barcodeOk ? (
              <div className="mt-[1.2mm] flex min-h-0 flex-1 flex-col items-center">
                <div className="min-h-0 w-full flex-1"><Barcode value={data.sku!} height={40} /></div>
                <div className="font-mono leading-none" style={{ fontSize: `${2 * scale}mm`, marginTop: "0.4mm" }}>{data.sku}</div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
