import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminDictionary } from '@/lib/admin-i18n-server';
import AdminShell from '../../../../components/admin/AdminShell';
import RepairsContentForm from './RepairsContentForm';

export const dynamic = 'force-dynamic';

export type RepairsService = { title: string; description: string; price: string };

export type RepairsLocaleContent = {
  heroTitle: string;
  heroSubtitle: string;
  intro: string;
  services: RepairsService[];
  cta: { title: string; description: string };
};

export type RepairsContent = { de: RepairsLocaleContent; en: RepairsLocaleContent };

const defaultLocale = (): RepairsLocaleContent => ({
  heroTitle: '',
  heroSubtitle: '',
  intro: '',
  services: [{ title: '', description: '', price: '' }],
  cta: { title: '', description: '' },
});

export default async function RepairsContentPage() {
  const dict = await getAdminDictionary();
  const admin = createAdminClient();

  const { data } = await admin
    .from('store_settings')
    .select('value')
    .eq('key', 'content_repairs')
    .single();

  const stored = (data?.value ?? {}) as Partial<RepairsContent>;

  const initialContent: RepairsContent = {
    de: { ...defaultLocale(), ...(stored.de ?? {}) },
    en: { ...defaultLocale(), ...(stored.en ?? {}) },
  };

  return (
    <AdminShell title={dict.sidebar.contentRepairs}>
      <RepairsContentForm initialContent={initialContent} />
    </AdminShell>
  );
}
