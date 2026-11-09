import { maintenanceNotice } from '@/lib/admin-maintenance';

export default function UnderConstruction({locale}: {locale: 'de' | 'en'}) {
  const copy = maintenanceNotice(locale);
  return (
    <section role="status" aria-live="polite" className="mx-auto max-w-xl p-5 sm:p-8">
      <div className="rounded-2xl border border-gold/30 bg-surface p-6 shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">{copy.eyebrow}</p>
        <h1 className="mt-2 text-xl font-semibold text-foreground">{copy.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">{copy.body}</p>
      </div>
    </section>
  );
}
