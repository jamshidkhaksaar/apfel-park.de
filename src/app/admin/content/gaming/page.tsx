import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminDictionary } from '@/lib/admin-i18n-server';
import AdminShell from '../../../../components/admin/AdminShell';
import GamingContentForm from './GamingContentForm';

export const dynamic = 'force-dynamic';

export type GamingLocaleContent = {
  heroTitle: string;
  heroSubtitle: string;
  highlights: string[];
};

export type GamingContent = { de: GamingLocaleContent; en: GamingLocaleContent };

const defaultLocale = (): GamingLocaleContent => ({
  heroTitle: '',
  heroSubtitle: '',
  highlights: ['', '', ''],
});

export default async function GamingContentPage() {
  const dict = await getAdminDictionary();
  const admin = createAdminClient();

  const { data } = await admin
    .from('store_settings')
    .select('value')
    .eq('key', 'content_gaming')
    .single();

  const stored = (data?.value ?? {}) as Partial<GamingContent>;

  const initialContent: GamingContent = {
    de: { ...defaultLocale(), ...(stored.de ?? {}) },
    en: { ...defaultLocale(), ...(stored.en ?? {}) },
  };

  return (
    <AdminShell title={dict.sidebar.contentGaming}>
      <GamingContentForm initialContent={initialContent} />
    </AdminShell>
  );
}
