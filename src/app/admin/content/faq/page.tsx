import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminDictionary } from '@/lib/admin-i18n-server';
import AdminShell from '../../../../components/admin/AdminShell';
import FaqContentForm from './FaqContentForm';

export const dynamic = 'force-dynamic';

export type FaqItem = { question: string; answer: string };

export type FaqLocaleContent = {
  heroTitle: string;
  heroSubtitle: string;
  items: FaqItem[];
};

export type FaqContent = { de: FaqLocaleContent; en: FaqLocaleContent };

const defaultLocale = (): FaqLocaleContent => ({
  heroTitle: '',
  heroSubtitle: '',
  items: [{ question: '', answer: '' }],
});

export default async function FaqContentPage() {
  const dict = await getAdminDictionary();
  const admin = createAdminClient();

  const { data } = await admin
    .from('store_settings')
    .select('value')
    .eq('key', 'content_faq')
    .single();

  const stored = (data?.value ?? {}) as Partial<FaqContent>;

  const initialContent: FaqContent = {
    de: { ...defaultLocale(), ...(stored.de ?? {}) },
    en: { ...defaultLocale(), ...(stored.en ?? {}) },
  };

  return (
    <AdminShell title={dict.sidebar.contentFaq}>
      <FaqContentForm initialContent={initialContent} />
    </AdminShell>
  );
}
