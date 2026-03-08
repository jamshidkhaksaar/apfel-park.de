import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminDictionary } from '@/lib/admin-i18n-server';
import AdminShell from '../../../../components/admin/AdminShell';
import LaptopsContentForm from './LaptopsContentForm';

export const dynamic = 'force-dynamic';

export type LaptopsLocaleContent = {
  heroTitle: string;
  heroSubtitle: string;
  sections: {
    new: { title: string; subtitle: string };
    refurbished: { title: string; subtitle: string };
  };
  highlights: string[];
  brands: string[];
};

export type LaptopsContent = { de: LaptopsLocaleContent; en: LaptopsLocaleContent };

const defaultLocale = (): LaptopsLocaleContent => ({
  heroTitle: '',
  heroSubtitle: '',
  sections: {
    new: { title: '', subtitle: '' },
    refurbished: { title: '', subtitle: '' },
  },
  highlights: ['', '', '', ''],
  brands: ['', '', '', '', '', ''],
});

export default async function LaptopsContentPage() {
  const dict = await getAdminDictionary();
  const admin = createAdminClient();

  const { data } = await admin
    .from('store_settings')
    .select('value')
    .eq('key', 'content_laptops')
    .single();

  const stored = (data?.value ?? {}) as Partial<LaptopsContent>;

  const initialContent: LaptopsContent = {
    de: { ...defaultLocale(), ...(stored.de ?? {}) },
    en: { ...defaultLocale(), ...(stored.en ?? {}) },
  };

  return (
    <AdminShell title={dict.sidebar.contentLaptops}>
      <LaptopsContentForm initialContent={initialContent} />
    </AdminShell>
  );
}
