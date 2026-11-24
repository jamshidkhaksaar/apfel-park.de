"use client";

export default function PrintReportButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 print:hidden"
    >
      {label}
    </button>
  );
}
