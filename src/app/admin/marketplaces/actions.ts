'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAdminServerClient } from '@/lib/admin-auth-server';
import { canManageOrders, isAdminUser } from '@/lib/admin-auth';
import { enqueueMarketplaceJob } from '@/lib/marketplaces';
import { validateMarketplaceProduct } from '@/lib/marketplaces';

const marketplace = (value: FormDataEntryValue | null) => value === 'amazon_de' || value === 'ebay_de' ? value : null;

export async function queueMarketplaceOperation(formData: FormData): Promise<void> {
  const client = await createAdminServerClient(); const { data: { user } } = await client.auth.getUser();
  const channel = marketplace(formData.get('marketplace')); const operation = String(formData.get('operation') ?? ''); const sku = String(formData.get('sku') ?? '').trim();
  if (!channel || !['publish', 'unpublish', 'update_price', 'reconcile'].includes(operation) || !canManageOrders(user)) redirect('/admin/marketplaces?error=auth');
  if (operation === 'publish') {
    if (!sku) redirect('/admin/marketplaces?error=sku');
    const { query } = await import('@/lib/db');
    const [compliance, products] = await Promise.all([
      query('SELECT id FROM marketplace_compliance_profiles WHERE verified_at IS NOT NULL ORDER BY verified_at DESC LIMIT 1'),
      query(`SELECT sku, title, description, price, condition, gtin, asin, ebay_epid, marketplace_category_mappings, manufacturer, eu_responsible_person, safety_warnings, safety_documents FROM products WHERE sku = $1 LIMIT 1`, [sku]),
    ]);
    const product = products.rows[0] as Record<string, unknown> | undefined;
    if (!compliance.rows[0] || !product) redirect('/admin/marketplaces?error=blocked');
    const validation = validateMarketplaceProduct(channel, {
      sku, title: String(product.title ?? ''), description: String(product.description ?? ''), price: Number(product.price), condition: String(product.condition ?? 'new'),
      gtin: product.gtin as string | null, asin: product.asin as string | null, ebayEpid: product.ebay_epid as string | null,
      categoryMappings: (product.marketplace_category_mappings as Record<string, unknown>) ?? {}, manufacturer: (product.manufacturer as Record<string, unknown>) ?? {}, euResponsiblePerson: (product.eu_responsible_person as Record<string, unknown>) ?? {}, safetyWarnings: (product.safety_warnings as string[]) ?? [], safetyDocuments: (product.safety_documents as string[]) ?? [],
    });
    if (!validation.valid) {
      await query(`INSERT INTO marketplace_listings (sku, marketplace, status, last_error) VALUES ($1, $2, 'blocked', $3) ON CONFLICT (sku, marketplace) DO UPDATE SET status = 'blocked', last_error = EXCLUDED.last_error, updated_at = now()`, [sku, channel, validation.errors.join(' ')]);
      redirect('/admin/marketplaces?error=blocked');
    }
    await query(`INSERT INTO marketplace_listings (sku, marketplace, status, price) VALUES ($1, $2, 'queued', $3) ON CONFLICT (sku, marketplace) DO UPDATE SET status = 'queued', price = EXCLUDED.price, last_error = null, updated_at = now()`, [sku, channel, product.price]);
  }
  await enqueueMarketplaceJob(channel, operation as 'publish' | 'unpublish' | 'update_price' | 'reconcile', sku || undefined, {});
  revalidatePath('/admin/marketplaces'); redirect('/admin/marketplaces?queued=1');
}

export async function verifyMarketplaceCompliance(formData: FormData): Promise<void> {
  const client = await createAdminServerClient(); const { data: { user } } = await client.auth.getUser();
  if (!isAdminUser(user)) redirect('/admin/marketplaces?error=admin');
  const { query } = await import('@/lib/db');
  await query(`INSERT INTO marketplace_compliance_profiles (verified_at, verified_by, evidence, notes) VALUES (now(), $1, $2, $3)`, [user?.email ?? 'admin', JSON.stringify({ lucid: Boolean(formData.get('lucid')), weee: Boolean(formData.get('weee')), batteries: Boolean(formData.get('batteries')), gpsr: Boolean(formData.get('gpsr')) }), String(formData.get('notes') ?? '').slice(0, 2000)]);
  revalidatePath('/admin/marketplaces'); redirect('/admin/marketplaces?verified=1');
}
