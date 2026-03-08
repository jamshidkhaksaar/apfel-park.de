import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminDictionary } from '@/lib/admin-i18n-server';
import AdminShell from '../../../../components/admin/AdminShell';
import HomeContentForm from './HomeContentForm';

export const dynamic = 'force-dynamic';

export type HomeLocaleContent = {
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
  };
  support: {
    title: string;
    subtitle: string;
    bullets: string[];
  };
  process: {
    title: string;
  };
  testimonials: {
    title: string;
    subtitle: string;
  };
};

export type HomeContent = { de: HomeLocaleContent; en: HomeLocaleContent };

const defaultLocale = (): HomeLocaleContent => ({
  hero: {
    eyebrow: '',
    title: '',
    subtitle: '',
    primaryCta: '',
    secondaryCta: '',
  },
  support: {
    title: '',
    subtitle: '',
    bullets: ['', '', '', ''],
  },
  process: {
    title: '',
  },
  testimonials: {
    title: '',
    subtitle: '',
  },
});

export default async function HomeContentPage() {
  const dict = await getAdminDictionary();
  const admin = createAdminClient();

  const { data } = await admin
    .from('store_settings')
    .select('value')
    .eq('key', 'content_home')
    .single();

  const stored = (data?.value ?? {}) as Partial<HomeContent>;

  const initialContent: HomeContent = {
    de: { ...defaultLocale(), ...(stored.de ?? {}) },
    en: { ...defaultLocale(), ...(stored.en ?? {}) },
  };

  return (
    <AdminShell title={dict.sidebar.contentHome}>
      <HomeContentForm initialContent={initialContent} />
    </AdminShell>
  );
}
