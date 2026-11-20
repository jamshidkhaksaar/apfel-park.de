"use client";

import { useState, useSyncExternalStore } from "react";

import { code128Width, encodeCode128B, isCode128BText } from "@/lib/barcode-code128";

export type LabelData = {
  model: string;
  storage: string;
  color: string;
  price: number;
  sku: string | null;
  /** What the barcode encodes: the SKU, or a short "LB-…" code for long SKUs (see scan-code.ts). */
  barcode: string | null;
  condition: string;
};

/**
 * Label sizes of the Brother QL-800 rolls, in mm.
 *
 * The QL-800 prints at most 58.9 mm (696 dots at 300 dpi) of the 62 mm tape,
 * about 1.5 mm is lost on each side, and the feed keeps roughly 3 mm free at the
 * top and bottom. Everything on the label therefore stays inside a 3 mm safe
 * margin, so nothing is cut off at the edge. The page size (@page) equals the
 * label exactly; the matching driver paper size is shown in the toolbar.
 */
const SIZES = {
  "62x40": {
    w: 62, h: 40, roll: "DK-22205 (62 mm Endlos)", rollEn: "DK-22205 (62 mm continuous)",
    driver: '2.4" (62 mm Endlos) · Länge 40 mm · Hochformat · Auto Cut an', driverEn: '2.4" (62 mm continuous) · length 40 mm · Portrait · Auto Cut on',
    oneLineTitle: false, title: 4.1, color: 2.4, price: 5.8, warranty: 2.3, sku: 1.7,
  },
  "62x29": {
    w: 62, h: 29, roll: "DK-11209 (62 × 29 mm)", rollEn: "DK-11209 (62 × 29 mm)",
    driver: '2.4" x 1.1" · Hochformat', driverEn: '2.4" x 1.1" · Portrait',
    oneLineTitle: true, title: 3.5, color: 2.1, price: 4.6, warranty: 1.9, sku: 1.5,
  },
  "62x100": {
    w: 62, h: 100, roll: "DK-11202 (62 × 100 mm)", rollEn: "DK-11202 (62 × 100 mm)",
    driver: '2.4" x 3.9" · Hochformat', driverEn: '2.4" x 3.9" · Portrait',
    oneLineTitle: false, title: 6.2, color: 3.4, price: 10, warranty: 3.4, sku: 2.4,
  },
} as const;
type SizeKey = keyof typeof SIZES;

/** Safe margin inside the label edge (mm): top/bottom, left/right. */
const SAFE_Y = 3;
const SAFE_X = 3;
/** One printer dot at 300 dpi, in mm. Barcode modules use whole dots so every bar prints crisp. */
const DOT_MM = 25.4 / 300;
const STORAGE_KEY = "apfel-label-size";

const subscribeStorage = (onChange: () => void) => {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
};
const readSavedSize = (): SizeKey | null => {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved && saved in SIZES ? (saved as SizeKey) : null;
  } catch {
    return null;
  }
};

const WARRANTIES = ["12 Monate Garantie", "24 Monate Garantie", "6 Monate Garantie", "3 Monate Garantie", ""] as const;

const COPY = {
  de: {
    size: "Etikett", warranty: "Garantie", none: "Keine Angabe", price: "Preis (€)", copies: "Anzahl", print: "🖨 Drucken",
    noSku: "Kein gültiger SKU – das Etikett wird ohne Barcode gedruckt. SKU im Produkteditor eintragen.",
    priceNote: "Der Preis hier ändert nur das Etikett, nicht den Shop-Preis.",
    setupTitle: "Drucker-Einstellungen (Brother QL-800, Windows)",
    roll: "Rolle im Drucker", driver: "Druckeinstellungen → Papiergröße",
    browser: "Chrome-Druckdialog: Ränder „Keine“ · Skalierung „Standard“ (100 %) · Kopf- und Fußzeilen aus · Hintergrundgrafiken an",
  },
  en: {
    size: "Label", warranty: "Warranty", none: "None", price: "Price (€)", copies: "Copies", print: "🖨 Print",
    noSku: "No valid SKU – the label prints without a barcode. Add the SKU in the product editor.",
    priceNote: "The price here only changes the label, not the shop price.",
    setupTitle: "Printer settings (Brother QL-800, Windows)",
    roll: "Roll in the printer", driver: "Printing Preferences → Paper Size",
    browser: "Chrome print dialog: Margins “None” · Scale “Default” (100%) · Headers and footers off · Background graphics on",
  },
};

function Barcode({ value, maxWidthMm }: { value: string; maxWidthMm: number }) {
  const widths = encodeCode128B(value);
  const modules = code128Width(widths) + 20; // 10-module quiet zone each side
  // 3 dots per module when it fits, otherwise 2: never a fraction of a dot.
  const dots = Math.max(1, Math.min(4, Math.floor(maxWidthMm / (modules * DOT_MM))));
  const widthMm = modules * dots * DOT_MM;
  let x = 10;
  const bars: Array<{ x: number; w: number }> = [];
  widths.forEach((width, index) => {
    if (index % 2 === 0) bars.push({ x, w: width });
    x += width;
  });
  return (
    <svg
      viewBox={`0 0 ${modules} 10`}
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      aria-label={value}
      className="block h-full"
      style={{ width: `${widthMm}mm`, maxWidth: "100%" }}
    >
      <rect width={modules} height={10} fill="#fff" />
      {bars.map((bar) => <rect key={bar.x} x={bar.x} y={0} width={bar.w} height={10} fill="#000" />)}
    </svg>
  );
}

/**
 * Shop shelf label like the hand-made ones in the shop: model and storage, a
 * black price bar with the warranty, plus colour and a Code 128 barcode of the
 * SKU for the scanner in the product list. Only the labels print (one per
 * page); the toolbar is screen-only.
 */
export default function ProductLabelPrint({ data, defaultWarranty, locale = "de" }: { data: LabelData; defaultWarranty: string; locale?: "de" | "en" }) {
  const t = COPY[locale] ?? COPY.de;
  // The roll in the printer rarely changes: remember the last size used.
  const savedSize = useSyncExternalStore(subscribeStorage, readSavedSize, () => null);
  const [chosenSize, setChosenSize] = useState<SizeKey | null>(null);
  const size: SizeKey = chosenSize ?? savedSize ?? "62x40";
  const [warranty, setWarranty] = useState(defaultWarranty);
  const [copies, setCopies] = useState(1);
  const [price, setPrice] = useState(data.price);

  const chooseSize = (next: SizeKey) => {
    setChosenSize(next);
    try { window.localStorage.setItem(STORAGE_KEY, next); } catch { /* storage unavailable */ }
  };

  const s = SIZES[size];
  const contentW = s.w - 2 * SAFE_X;
  const barcodeOk = Boolean(data.barcode && isCode128BText(data.barcode));
  const priceText = `${price.toLocaleString("de-DE", { minimumFractionDigits: price % 1 ? 2 : 0, maximumFractionDigits: 2 })}€`;
  const gap = s.h >= 60 ? 1.6 : 0.8;

  return (
    <div className="label-print-root min-h-screen bg-neutral-200 p-6 text-black print:min-h-0 print:bg-white print:p-0">
      <style>{`
        @page { size: ${s.w}mm ${s.h}mm; margin: 0; }
        .label-sheet, .label-sheet * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        @media print {
          html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
          /* Only the labels print: never a cookie dialog, chat button or other
             overlay that happens to be open on this browser. */
          body * { visibility: hidden !important; }
          .label-print-root, .label-print-root * { visibility: visible !important; }
          body > :not(:has(.label-print-root)), [aria-modal="true"], .fixed { display: none !important; }
          .label-toolbar { display: none !important; }
          .label-sheet { box-shadow: none !important; margin: 0 !important; break-after: page; page-break-after: always; }
          .label-sheet:last-child { break-after: auto; page-break-after: auto; }
        }
      `}</style>

      <div className="label-toolbar mx-auto mb-6 max-w-3xl rounded-2xl bg-white p-4 shadow">
        <div className="flex flex-wrap items-end gap-4">
          <label className="text-xs font-semibold text-neutral-600">{t.size}
            <select value={size} onChange={(event) => chooseSize(event.target.value as SizeKey)} className="mt-1 block rounded-lg border border-neutral-300 px-2 py-1.5 text-sm text-black">
              {(Object.keys(SIZES) as SizeKey[]).map((key) => (
                <option key={key} value={key}>{SIZES[key].w} × {SIZES[key].h} mm – {locale === "de" ? SIZES[key].roll : SIZES[key].rollEn}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-neutral-600">{t.warranty}
            <select value={warranty} onChange={(event) => setWarranty(event.target.value)} className="mt-1 block rounded-lg border border-neutral-300 px-2 py-1.5 text-sm text-black">
              {WARRANTIES.map((value) => <option key={value} value={value}>{value || t.none}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-neutral-600">{t.price}
            <input inputMode="decimal" defaultValue={String(data.price).replace(".", ",")} onChange={(event) => { const n = Number(event.target.value.replace(",", ".")); if (Number.isFinite(n) && n > 0) setPrice(n); }} className="mt-1 block w-24 rounded-lg border border-neutral-300 px-2 py-1.5 text-sm text-black" />
          </label>
          <label className="text-xs font-semibold text-neutral-600">{t.copies}
            <input type="number" min={1} max={50} value={copies} onChange={(event) => setCopies(Math.min(50, Math.max(1, Number(event.target.value) || 1)))} className="mt-1 block w-20 rounded-lg border border-neutral-300 px-2 py-1.5 text-sm text-black" />
          </label>
          <button type="button" onClick={() => window.print()} className="ml-auto rounded-xl bg-black px-5 py-2.5 text-sm font-bold text-white">{t.print}</button>
        </div>
        {!barcodeOk ? <p className="mt-3 text-xs text-red-600">{t.noSku}</p> : null}
        <p className="mt-2 text-[11px] text-neutral-500">{t.priceNote}</p>
        <div className="mt-3 rounded-xl bg-neutral-100 p-3 text-xs leading-5 text-neutral-700">
          <p className="font-semibold text-black">{t.setupTitle}</p>
          <p>{t.roll}: <b>{locale === "de" ? s.roll : s.rollEn}</b></p>
          <p>{t.driver}: <b>{locale === "de" ? s.driver : s.driverEn}</b></p>
          <p>{t.browser}</p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-6 print:block print:gap-0">
        {Array.from({ length: copies }, (_, index) => (
          <div
            key={index}
            className="label-sheet flex flex-col overflow-hidden bg-white shadow-xl"
            style={{ width: `${s.w}mm`, height: `${s.h}mm`, padding: `${SAFE_Y}mm ${SAFE_X}mm`, boxSizing: "border-box" }}
          >
            <div className="text-center font-extrabold italic leading-[1.08]" style={{ fontSize: `${s.title}mm` }}>
              {s.oneLineTitle ? (
                <div className="truncate">{[data.model, data.storage].filter(Boolean).join(" ")}</div>
              ) : (
                <>
                  <div className="truncate">{data.model}</div>
                  {data.storage ? <div className="truncate">{data.storage}</div> : null}
                </>
              )}
            </div>
            {data.color ? (
              <div className="truncate text-center font-semibold leading-tight" style={{ fontSize: `${s.color}mm`, marginTop: `${gap / 2}mm` }}>
                Farbe: {data.color}
              </div>
            ) : null}
            <div className="flex shrink-0 flex-col items-center justify-center bg-black text-white" style={{ marginTop: `${gap}mm`, padding: `${s.h >= 60 ? 2 : 0.7}mm 0` }}>
              <div className="font-extrabold leading-none" style={{ fontSize: `${s.price}mm` }}>{priceText}</div>
              {warranty ? <div className="font-semibold leading-none" style={{ fontSize: `${s.warranty}mm`, marginTop: `${s.warranty * 0.25}mm` }}>{warranty}</div> : null}
            </div>
            {barcodeOk ? (
              <div className="flex min-h-0 flex-1 flex-col items-center" style={{ marginTop: `${gap}mm` }}>
                <div className="flex min-h-0 w-full flex-1 justify-center"><Barcode value={data.barcode!} maxWidthMm={contentW} /></div>
                <div className="font-mono leading-none" style={{ fontSize: `${s.sku}mm`, marginTop: "0.4mm" }}>{data.barcode}</div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
