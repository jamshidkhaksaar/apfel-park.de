import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import AdminShell from '@/components/admin/AdminShell';
import { readSessionUser } from '@/lib/session';
import { isProductIntakeOwner } from '@/lib/product-intake/owner';
import { getAdminLocale } from '@/lib/admin-i18n-server';
import { withTransaction } from '@/lib/db';
import { readSession } from '@/lib/telegram-products/repository';
import { telegramText } from '@/lib/telegram-products/i18n';
import { entryPayload } from '@/lib/smartphone-editor/model';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [user, locale, { id }] = await Promise.all([
    readSessionUser(),
    getAdminLocale(),
    params,
  ]);
  if (!isProductIntakeOwner(user) || !/^[a-f0-9-]{36}$/i.test(id)) notFound();
  const row = await withTransaction((client) => readSession(client, id)).catch(
    () => null,
  );
  if (!row) notFound();
  const t = telegramText[locale];
  return (
    <AdminShell title={t.previewTitle}>
      <div className="mx-auto max-w-5xl space-y-6">
        <p className="rounded-xl border border-gold/40 p-4 text-sm">
          {t.unpublished} · #{row.draft_revision}
        </p>
        <Link
          className="btn-secondary"
          href={`/admin/products/phone?draft=${row.draft_id}`}
        >
          {t.review}
        </Link>
        {row.document.entries.map((entry) => {
          const product = entryPayload(row.document, entry);
          return (
            <article
              key={entry.id}
              className="grid gap-6 rounded-2xl border border-border p-5 md:grid-cols-2"
            >
              <div className="grid grid-cols-2 gap-3">
                {(product.images ?? []).map((url, i) => (
                  <Image
                    key={`${url}:${i}`}
                    unoptimized
                    src={url}
                    alt={product.title ?? ''}
                    width={480}
                    height={480}
                    className="w-full rounded-xl bg-white object-contain"
                  />
                ))}
              </div>
              <div>
                <h1 className="text-2xl font-semibold">{product.title}</h1>
                <p className="mt-3 text-xl text-gold">
                  {new Intl.NumberFormat(locale, {
                    style: 'currency',
                    currency: 'EUR',
                  }).format(entry.price)}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {t.stock}: {entry.stock} · {entry.color} · {entry.storage}
                </p>
                <p className="mt-5 whitespace-pre-line text-sm">
                  {product.description}
                </p>
                <p className="mt-3 text-sm">{product.conditionNote}</p>
                <dl className="mt-5 space-y-2 text-sm">
                  {product.specs?.map((spec, i) => (
                    <div
                      className="flex flex-wrap justify-between gap-2 border-b border-border pb-2"
                      key={i}
                    >
                      <dt className="text-muted">{spec.label}</dt>
                      <dd>{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </article>
          );
        })}
      </div>
    </AdminShell>
  );
}
