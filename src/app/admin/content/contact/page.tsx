import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminDictionary } from '@/lib/admin-i18n-server';
import AdminShell from '../../../../components/admin/AdminShell';
import ContactContentForm from './ContactContentForm';

export const dynamic = 'force-dynamic';

export type ContactLocaleContent = {
  heroTitle: string;
  heroSubtitle: string;
  form: {
    title: string;
    namePlaceholder: string;
    emailPlaceholder: string;
    messagePlaceholder: string;
    submit: string;
  };
};

export type ContactContent = { de: ContactLocaleContent; en: ContactLocaleContent };

const defaultLocale = (): ContactLocaleContent => ({
  heroTitle: '',
  heroSubtitle: '',
  form: {
    title: '',
    namePlaceholder: '',
    emailPlaceholder: '',
    messagePlaceholder: '',
    submit: '',
  },
});

export default async function ContactContentPage() {
  const dict = await getAdminDictionary();
  const admin = createAdminClient();

  const { data } = await admin
    .from('store_settings')
    .select('value')
    .eq('key', 'content_contact')
    .single();

  const stored = (data?.value ?? {}) as Partial<ContactContent>;

  const initialContent: ContactContent = {
    de: { ...defaultLocale(), ...(stored.de ?? {}) },
    en: { ...defaultLocale(), ...(stored.en ?? {}) },
  };

  return (
    <AdminShell title={dict.sidebar.contentContact}>
      <ContactContentForm initialContent={initialContent} />
    </AdminShell>
  );
}
