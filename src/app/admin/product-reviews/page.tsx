import AdminShell from "@/components/admin/AdminShell";
import ProductReviewModeration, { type PendingReviewRow } from "@/components/admin/ProductReviewModeration";
import { getAdminLocale } from "@/lib/admin-i18n-server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ProductReviewsAdminPage() {
  const locale = await getAdminLocale();

  // Pending first: that is the queue an admin actually has to act on.
  const result = await query(`
    SELECT r.id, r.author_name, r.rating, r.title, r.body, r.verified, r.status, r.locale, r.created_at, r.media_urls,
           p.title AS product_title, p.slug AS product_slug
    FROM product_reviews r
    JOIN products p ON p.id = r.product_id
    ORDER BY (r.status = 'pending') DESC, r.created_at DESC
    LIMIT 200
  `);

  const reviews: PendingReviewRow[] = (result.rows as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    productTitle: String(row.product_title ?? ""),
    productSlug: String(row.product_slug ?? ""),
    authorName: String(row.author_name ?? ""),
    rating: Number(row.rating ?? 0),
    title: row.title ? String(row.title) : null,
    body: String(row.body ?? ""),
    verified: Boolean(row.verified),
    status: String(row.status ?? "pending"),
    locale: String(row.locale ?? "de"),
    createdAt: row.created_at ? String(row.created_at) : new Date().toISOString(),
    mediaUrls: Array.isArray(row.media_urls) ? row.media_urls.filter((value):value is string=>typeof value==="string") : [],
  }));

  const pendingCount = reviews.filter((review) => review.status === "pending").length;

  return (
    <AdminShell title={locale === "de" ? "Produktbewertungen" : "Product reviews"}>
      <div className="mx-auto w-full max-w-[1100px] space-y-5">
        <header>
          <p className="text-xs font-semibold tracking-[0.16em] text-muted">
            {locale === "de" ? "MODERATION" : "MODERATION"}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">
            {locale === "de" ? "Produktbewertungen" : "Product reviews"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {locale === "de"
              ? `${pendingCount} zur Prüfung · nur freigeschaltete Bewertungen erscheinen im Shop und in den Sternebewertungen bei Google.`
              : `${pendingCount} awaiting review · only approved reviews appear in the shop and in Google star ratings.`}
          </p>
        </header>
        <ProductReviewModeration locale={locale} reviews={reviews} />
      </div>
    </AdminShell>
  );
}
