"use client";

export default function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print-hidden rounded border border-black px-6 py-2 text-sm font-semibold"
    >
      {label}
    </button>
  );
}
