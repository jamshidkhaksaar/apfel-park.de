import Link from 'next/link';

import { getAdminDictionary } from '@/lib/admin-i18n-server';
import AdminShell from '../../../components/admin/AdminShell';

export const dynamic = 'force-dynamic';

const sections = [
  { key: 'about', labelKey: 'contentAbout', description: 'Hero, story, features, values, stats, CTA' },
  { key: 'faq', labelKey: 'contentFaq', description: 'Hero title, subtitle and FAQ items' },
  { key: 'repairs', labelKey: 'contentRepairs', description: 'Hero, intro, services and CTA' },
  { key: 'contact', labelKey: 'contentContact', description: 'Hero and contact form labels' },
  { key: 'privacy', labelKey: 'contentPrivacy', description: 'Hero and privacy policy sections' },
  { key: 'terms', labelKey: 'contentTerms', description: 'Hero and terms & conditions sections' },
] as const;

export default async function ContentPage() {
  const dict = await getAdminDictionary();

  return (
    <AdminShell title="Page Content">
      <div className="glass-panel rounded-2xl p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Content Management
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-foreground">
          Edit Page Content
        </h2>
        <p className="mt-2 text-sm text-muted">
          Select a page to edit its bilingual content. Changes are saved to the database and override the default translations.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <Link
              key={section.key}
              href={`/admin/content/${section.key}`}
              className="tech-card group flex flex-col gap-3 rounded-xl border border-white/10 p-5 transition hover:border-gold/40 hover:bg-gold/5"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground group-hover:text-gold transition">
                  {dict.sidebar[section.labelKey]}
                </span>
                <svg
                  className="h-4 w-4 text-muted group-hover:text-gold transition"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p className="text-xs text-muted">{section.description}</p>
              <span className="mt-auto inline-flex items-center gap-1 text-xs text-gold/70">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit DE / EN
              </span>
            </Link>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
