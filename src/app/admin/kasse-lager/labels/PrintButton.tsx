'use client';
export default function PrintButton({label}:{label:string}) {
  return <button type="button" onClick={()=>window.print()} className="print:hidden rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white">{label}</button>;
}
