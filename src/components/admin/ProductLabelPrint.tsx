"use client";

import Image from "next/image";
import { useState, useSyncExternalStore } from "react";

import { code128Width, encodeCode128B, isCode128BText } from "@/lib/barcode-code128";

export type LabelData = {
  /** Printed small above the model ("Samsung"); empty when unknown. */
  brand: string;
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
  // Default: like the hand-made shop stickers, close to half the back of a phone.
  "62x58": {
    w: 62, h: 58, name: "Smartphone", nameEn: "Smartphone",
    roll: "DK-22205 (62 mm Endlos)", rollEn: "DK-22205 (62 mm continuous)",
    driver: '2.4" (62 mm Endlos) · Länge 58 mm (2.28") · Hochformat · Auto Cut an', driverEn: '2.4" (62 mm continuous) · length 58 mm (2.28") · Portrait · Auto Cut on',
    // Fits 51 mm (58 mm minus the driver's 3 mm feed at each end), even with a two-line model name.
    safeY: 3.5, titleLines: 2, title: 6.6, titleMin: 5, brand: 2.4, price: 10, warranty: 2.6, details: 3.2, barcode: 7, code: 2, gap: 1, barPad: 1,
  },
  "62x40": {
    w: 62, h: 40, name: "Klein / Zubehör", nameEn: "Small / accessories",
    roll: "DK-22205 (62 mm Endlos)", rollEn: "DK-22205 (62 mm continuous)",
    driver: '2.4" (62 mm Endlos) · Länge 40 mm · Hochformat · Auto Cut an', driverEn: '2.4" (62 mm continuous) · length 40 mm · Portrait · Auto Cut on',
    // One title line on the small label, so the barcode keeps its height.
    safeY: 3.5, titleLines: 1, title: 5, titleMin: 2.8, brand: 2, price: 6.4, warranty: 2.2, details: 2.5, barcode: 6, code: 1.7, gap: 0.8, barPad: 0.6,
  },
  "62x100": {
    w: 62, h: 100, name: "Groß", nameEn: "Large",
    roll: "DK-11202 (62 × 100 mm)", rollEn: "DK-11202 (62 × 100 mm)",
    driver: '2.4" x 3.9" · Hochformat', driverEn: '2.4" x 3.9" · Portrait',
    safeY: 2, titleLines: 2, title: 9.5, titleMin: 6, brand: 3.6, price: 16, warranty: 3.6, details: 4.2, barcode: 16, code: 2.6, gap: 2.4, barPad: 2.4,
  },
} as const;
type SizeKey = keyof typeof SIZES;

/**
 * Safe margin inside the label edge (mm). The sides keep 3 mm (printable
 * width). Top and bottom come per size (safeY): on continuous tape the Brother
 * driver's "Feed" (0.12" = 3 mm) is not printed at either end, so the layout
 * keeps 3.5 mm free there or the brand line and the barcode text get cut off.
 */
const SAFE_X = 3;
/** The shop logo next to the barcode: width ÷ height of the black/white mark. */
const LOGO_RATIO = 354 / 520;
const LOGO_GAP_MM = 1;
/** One printer dot at 300 dpi, in mm. Barcode modules use whole dots so every bar prints crisp. */
const DOT_MM = 25.4 / 300;
// v4: the default changed to the 62 × 58 mm smartphone label.
const STORAGE_KEY = "apfel-label-size-v4";

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

/** "256", "256GB" or "256 gb" → "256 GB"; anything else unchanged. */
const formatStorage = (value: string): string => {
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) return `${trimmed} GB`;
  return trimmed.replace(/(\d)\s*(gb|tb)\b/i, (_, digit: string, unit: string) => `${digit} ${unit.toUpperCase()}`);
};

/**
 * Font size (mm) and line count for the model name: as big as the size allows,
 * on one line when it fits, else on two. Bold italic Inter is about 0.6 em per
 * character, which is what the estimate uses.
 */
const fitTitle = (text: string, widthMm: number, maxMm: number, minMm: number, maxLines: number) => {
  const perChar = 0.6;
  const oneLine = widthMm / (Math.max(1, text.length) * perChar);
  if (maxLines === 1) return { size: Math.max(minMm, Math.min(maxMm, oneLine)), lines: 1 };
  if (oneLine >= maxMm * 0.82) return { size: Math.min(maxMm, oneLine), lines: 1 };
  const twoLines = (2 * widthMm * 0.92) / (Math.max(1, text.length) * perChar);
  return { size: Math.max(minMm, Math.min(maxMm, twoLines)), lines: 2 };
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
 * Shop sticker like the hand-made ones in the shop, in this order: the brand
 * small and the model in big bold text, the price big in a black bar (warranty underneath), then
 * storage and colour small, and a Code 128 barcode for the scanner with the
 * shop logo beside it. Only
 * the labels print (one per page); the toolbar is screen-only.
 */
export default function ProductLabelPrint({ data, defaultWarranty, locale = "de" }: { data: LabelData; defaultWarranty: string; locale?: "de" | "en" }) {
  const t = COPY[locale] ?? COPY.de;
  // The roll in the printer rarely changes: remember the last size used.
  const savedSize = useSyncExternalStore(subscribeStorage, readSavedSize, () => null);
  const [chosenSize, setChosenSize] = useState<SizeKey | null>(null);
  const size: SizeKey = chosenSize ?? savedSize ?? "62x58";
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
  const title = fitTitle(data.model, contentW, s.title, s.titleMin, s.titleLines);
  // Logo as tall as the barcode bars (at most 10 mm), so the barcode keeps its width.
  const logoH = Math.min(s.barcode, 10);
  const logoW = Math.round(logoH * LOGO_RATIO * 10) / 10;
  const details = [data.storage ? formatStorage(data.storage) : "", data.color].filter(Boolean).join(" · ");

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
          /* Chrome prints on the paper chosen in its dialog (e.g. the driver's
             "2.4"" continuous entry), whose length can differ from the label.
             Filling exactly one page keeps every label on one piece of tape:
             the barcode takes up the difference, nothing spills over. */
          .label-sheet { width: 100vw !important; height: calc(100vh - 0.2mm) !important; overflow: hidden !important; }
          .label-sheet:last-child { break-after: auto; page-break-after: auto; }
        }
      `}</style>

      <div className="label-toolbar mx-auto mb-6 max-w-3xl rounded-2xl bg-white p-4 shadow">
        <div className="flex flex-wrap items-end gap-4">
          <label className="text-xs font-semibold text-neutral-600">{t.size}
            <select value={size} onChange={(event) => chooseSize(event.target.value as SizeKey)} className="mt-1 block rounded-lg border border-neutral-300 px-2 py-1.5 text-sm text-black">
              {(Object.keys(SIZES) as SizeKey[]).map((key) => (
                <option key={key} value={key}>{locale === "de" ? SIZES[key].name : SIZES[key].nameEn} – {SIZES[key].w} × {SIZES[key].h} mm</option>
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
            className="label-sheet flex flex-col justify-between overflow-hidden bg-white shadow-xl"
            style={{ width: `${s.w}mm`, height: `${s.h}mm`, padding: `${s.safeY}mm ${SAFE_X}mm`, boxSizing: "border-box" }}
          >
            {/* 1. Model: the biggest text on the label, the brand small above
                it, lined up with the model's left edge. */}
            <div className="flex shrink-0 justify-center">
              <div className="min-w-0 max-w-full">
                {data.brand ? (
                  <div className="truncate text-left font-bold uppercase leading-none tracking-[0.12em]" style={{ fontSize: `${s.brand}mm`, marginBottom: `${s.brand * 0.25}mm` }}>
                    {data.brand}
                  </div>
                ) : null}
                <div
                  className="text-center font-extrabold italic leading-[1.05] [overflow-wrap:anywhere]"
                  style={{ fontSize: `${title.size}mm`, display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: title.lines, overflow: "hidden", paddingRight: "0.12em" }}
                >
                  {data.model}
                </div>
              </div>
            </div>
            {/* 2. Price in the black bar, warranty small underneath. */}
            <div className="flex shrink-0 flex-col items-center justify-center bg-black text-white" style={{ marginTop: `${s.gap}mm`, padding: `${s.barPad}mm 0` }}>
              <div className="font-extrabold leading-none tracking-tight" style={{ fontSize: `${s.price}mm` }}>{priceText}</div>
              {warranty ? <div className="font-semibold leading-none" style={{ fontSize: `${s.warranty}mm`, marginTop: `${s.warranty * 0.35}mm` }}>{warranty}</div> : null}
            </div>
            {/* 3. Storage and colour, small. */}
            {details ? (
              <div className="shrink-0 truncate text-center font-semibold leading-tight" style={{ fontSize: `${s.details}mm`, marginTop: `${s.gap}mm` }}>
                {details}
              </div>
            ) : null}
            {/* 4. Barcode (wide bars, compact height; it may shrink a little if
                the printer page is shorter) with the shop logo beside it. */}
            <div className="flex min-h-0 shrink items-start justify-center" style={{ marginTop: `${s.gap}mm`, gap: `${LOGO_GAP_MM}mm` }}>
              {barcodeOk ? (
                <div className="flex min-h-0 shrink flex-col items-center">
                  <div className="flex shrink justify-center" style={{ height: `${s.barcode}mm`, minHeight: "5mm" }}><Barcode value={data.barcode!} maxWidthMm={contentW - logoW - LOGO_GAP_MM} /></div>
                  <div className="font-mono leading-none" style={{ fontSize: `${s.code}mm`, marginTop: "0.5mm" }}>{data.barcode}</div>
                </div>
              ) : null}
              <Image
                src="/branding/apfel-park-label-mark.png"
                alt="Apfel Park"
                width={354}
                height={520}
                unoptimized
                loading="eager"
                className="shrink-0"
                style={{ height: `${logoH}mm`, width: `${logoW}mm` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
