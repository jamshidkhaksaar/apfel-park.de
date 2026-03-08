import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminDictionary } from '@/lib/admin-i18n-server';
import AdminShell from '../../../../components/admin/AdminShell';
import TermsContentForm from './TermsContentForm';

export const dynamic = 'force-dynamic';

export type TermsSection = { title: string; content: string };

export type TermsLocaleContent = {
  heroTitle: string;
  heroSubtitle: string;
  sections: TermsSection[];
};

export type TermsContent = { de: TermsLocaleContent; en: TermsLocaleContent };

const defaultLocale = (): TermsLocaleContent => ({
  heroTitle: '',
  heroSubtitle: '',
  sections: [{ title: '', content: '' }],
});

export default async function TermsContentPage() {
  const dict = await getAdminDictionary();
  const admin = createAdminClient();

  const { data } = await admin
    .from('store_settings')
    .select('value')
    .eq('key', 'content_terms')
    .single();

  const stored = (data?.value ?? {}) as Partial<TermsContent>;

  const initialContent: TermsContent = {
    de: { ...defaultLocale(), ...(stored.de ?? {}) },
    en: { ...defaultLocale(), ...(stored.en ?? {}) },
  };

  return (
    <AdminShell title={dict.sidebar.contentTerms}>
      <TermsContentForm initialContent={initialContent} />
    </AdminShell>
  );
}
