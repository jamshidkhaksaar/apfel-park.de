import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminDictionary } from '@/lib/admin-i18n-server';
import AdminShell from '../../../../components/admin/AdminShell';
import SmartphonesContentForm from './SmartphonesContentForm';

export const dynamic = 'force-dynamic';

export type SmartphonesLocaleContent = {
  heroTitle: string;
  heroSubtitle: string;
  highlights: string[];
};

export type SmartphonesContent = { de: SmartphonesLocaleContent; en: SmartphonesLocaleContent };

const defaultLocale = (): SmartphonesLocaleContent => ({
  heroTitle: '',
  heroSubtitle: '',
  highlights: ['', '', ''],
});

export default async function SmartphonesContentPage() {
  const dict = await getAdminDictionary();
  const admin = createAdminClient();

  const { data } = await admin
    .from('store_settings')
    .select('value')
    .eq('key', 'content_smartphones')
    .single();

  const stored = (data?.value ?? {}) as Partial<SmartphonesContent>;

  const initialContent: SmartphonesContent = {
    de: { ...defaultLocale(), ...(stored.de ?? {}) },
    en: { ...defaultLocale(), ...(stored.en ?? {}) },
  };

  return (
    <AdminShell title={dict.sidebar.contentSmartphones}>
      <SmartphonesContentForm initialContent={initialContent} />
    </AdminShell>
  );
}
