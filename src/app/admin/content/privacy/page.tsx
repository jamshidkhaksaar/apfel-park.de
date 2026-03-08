import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminDictionary } from '@/lib/admin-i18n-server';
import AdminShell from '../../../../components/admin/AdminShell';
import PrivacyContentForm from './PrivacyContentForm';

export const dynamic = 'force-dynamic';

export type PrivacySection = { title: string; content: string };

export type PrivacyLocaleContent = {
  heroTitle: string;
  heroSubtitle: string;
  sections: PrivacySection[];
};

export type PrivacyContent = { de: PrivacyLocaleContent; en: PrivacyLocaleContent };

const defaultLocale = (): PrivacyLocaleContent => ({
  heroTitle: '',
  heroSubtitle: '',
  sections: [{ title: '', content: '' }],
});

export default async function PrivacyContentPage() {
  const dict = await getAdminDictionary();
  const admin = createAdminClient();

  const { data } = await admin
    .from('store_settings')
    .select('value')
    .eq('key', 'content_privacy')
    .single();

  const stored = (data?.value ?? {}) as Partial<PrivacyContent>;

  const initialContent: PrivacyContent = {
    de: { ...defaultLocale(), ...(stored.de ?? {}) },
    en: { ...defaultLocale(), ...(stored.en ?? {}) },
  };

  return (
    <AdminShell title={dict.sidebar.contentPrivacy}>
      <PrivacyContentForm initialContent={initialContent} />
    </AdminShell>
  );
}
