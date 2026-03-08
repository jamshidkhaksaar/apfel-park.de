import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminDictionary } from '@/lib/admin-i18n-server';
import AdminShell from '../../../../components/admin/AdminShell';
import AboutContentForm from './AboutContentForm';

export const dynamic = 'force-dynamic';

export type AboutLocaleContent = {
  heroTitle: string;
  heroSubtitle: string;
  intro: string;
  story: { title: string; content: string };
  cta: { title: string; description: string };
  stats: Array<{ value: string; label: string }>;
  values: { title: string; items: string[] };
  features: Array<{ title: string; description: string; icon: string }>;
};

export type AboutContent = { de: AboutLocaleContent; en: AboutLocaleContent };

const defaultLocale = (): AboutLocaleContent => ({
  heroTitle: '',
  heroSubtitle: '',
  intro: '',
  story: { title: '', content: '' },
  cta: { title: '', description: '' },
  stats: [
    { value: '', label: '' },
    { value: '', label: '' },
    { value: '', label: '' },
    { value: '', label: '' },
  ],
  values: { title: '', items: ['', '', '', ''] },
  features: [
    { title: '', description: '', icon: '' },
    { title: '', description: '', icon: '' },
    { title: '', description: '', icon: '' },
    { title: '', description: '', icon: '' },
  ],
});

export default async function AboutContentPage() {
  const dict = await getAdminDictionary();
  const admin = createAdminClient();

  const { data } = await admin
    .from('store_settings')
    .select('value')
    .eq('key', 'content_about')
    .single();

  const stored = (data?.value ?? {}) as Partial<AboutContent>;

  const initialContent: AboutContent = {
    de: { ...defaultLocale(), ...(stored.de ?? {}) },
    en: { ...defaultLocale(), ...(stored.en ?? {}) },
  };

  return (
    <AdminShell title={dict.sidebar.contentAbout}>
      <AboutContentForm initialContent={initialContent} />
    </AdminShell>
  );
}
