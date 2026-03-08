import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminDictionary } from '@/lib/admin-i18n-server';
import AdminShell from '../../../../components/admin/AdminShell';
import AccessoriesContentForm from './AccessoriesContentForm';

export const dynamic = 'force-dynamic';

export type AccessoriesLocaleContent = {
  heroTitle: string;
  heroSubtitle: string;
  categories: string[];
};

export type AccessoriesContent = { de: AccessoriesLocaleContent; en: AccessoriesLocaleContent };

const defaultLocale = (): AccessoriesLocaleContent => ({
  heroTitle: '',
  heroSubtitle: '',
  categories: ['', '', '', ''],
});

export default async function AccessoriesContentPage() {
  const dict = await getAdminDictionary();
  const admin = createAdminClient();

  const { data } = await admin
    .from('store_settings')
    .select('value')
    .eq('key', 'content_accessories')
    .single();

  const stored = (data?.value ?? {}) as Partial<AccessoriesContent>;

  const initialContent: AccessoriesContent = {
    de: { ...defaultLocale(), ...(stored.de ?? {}) },
    en: { ...defaultLocale(), ...(stored.en ?? {}) },
  };

  return (
    <AdminShell title={dict.sidebar.contentAccessories}>
      <AccessoriesContentForm initialContent={initialContent} />
    </AdminShell>
  );
}
