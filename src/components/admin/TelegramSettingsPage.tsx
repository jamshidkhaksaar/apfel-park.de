import { notFound } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import TelegramBotSettings, {
  type TelegramSettingsData,
} from '@/components/admin/TelegramBotSettings';
import { getAdminLocale } from '@/lib/admin-i18n-server';
import { readSessionUser } from '@/lib/session';
import { isProductIntakeOwner } from '@/lib/product-intake/owner';
import { telegramProductsEnabled } from '@/lib/telegram-products/repository';
import { telegramText } from '@/lib/telegram-products/i18n';
import { aiCredentialStatus } from '@/lib/ai-provider-credentials';
import { query } from '@/lib/db';

export default async function TelegramSettingsPage({
  section,
}: {
  section: 'members' | 'providers';
}) {
  const [user, locale] = await Promise.all([
    readSessionUser(),
    getAdminLocale(),
  ]);
  if (!isProductIntakeOwner(user)) notFound();
  const t = telegramText[locale];
  if (!telegramProductsEnabled())
    return (
      <AdminShell title={t.title}>
        <p>{t.setup}</p>
      </AdminShell>
    );
  const [members, credentials] = await Promise.all([
    query(
      'SELECT id,telegram_id::text,display_name,locale,status,last_seen_at FROM telegram_product_members ORDER BY created_at DESC',
    ),
    aiCredentialStatus(),
  ]);
  const data = JSON.parse(
    JSON.stringify({
      members: members.rows,
      credentials,
      botUsername: process.env.TELEGRAM_PRODUCT_BOT_USERNAME ?? '',
    }),
  ) as TelegramSettingsData;
  return (
    <AdminShell title={section === 'members' ? t.title : t.providers}>
      <TelegramBotSettings
        locale={locale}
        section={section}
        initialData={data}
      />
    </AdminShell>
  );
}
