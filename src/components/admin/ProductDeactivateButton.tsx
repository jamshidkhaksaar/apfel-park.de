"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { adminDictionary, type AdminLocale } from "@/lib/admin-i18n";

export default function ProductDeactivateButton({ id, title, isActive, locale }: {
  id: string; title: string; isActive: boolean; locale: AdminLocale;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);
  const text = adminDictionary[locale].productActivation;

  const deactivate = () => startTransition(async () => {
    setError(false);
    try {
      const response = await fetch(`/api/admin/products/${id}/deactivate`, { method: 'POST' });
      if (!response.ok) throw new Error('Deactivation failed');
      router.refresh();
    } catch { setError(true); }
  });

  return (
    <div className="flex flex-col items-start gap-2">
      <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-surface text-muted'}`}>
        {isActive ? text.active : text.inactive}
      </span>
      {isActive ? <button type="button" onClick={deactivate} disabled={pending}
        aria-label={`${text.deactivate}: ${title}`} aria-busy={pending}
        className="min-h-9 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition hover:border-gold/50 hover:text-gold disabled:cursor-wait disabled:opacity-50">
        {pending ? text.saving : text.deactivate}
      </button> : null}
      {error ? <span role="alert" className="max-w-48 text-xs text-red-500">{text.failed}</span> : null}
    </div>
  );
}
