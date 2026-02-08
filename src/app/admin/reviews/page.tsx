import { createClient } from "@/lib/supabase/server";
import { getAdminDictionary } from "@/lib/admin-i18n-server";
import AdminShell from "../../../components/admin/AdminShell";

export const dynamic = "force-dynamic";

type ReviewRow = {
  id: string;
  author_name: string;
  rating: number;
  content: string | null;
  source: string | null;
  is_published: boolean;
};

const formatSource = (source: string | null, dict: Awaited<ReturnType<typeof getAdminDictionary>>) => {
  const normalized = source?.toLowerCase().trim();
  if (!normalized) return dict.reviewsPage.sources.unknown;
  if (normalized === "google") return dict.reviewsPage.sources.google;
  if (normalized === "website") return dict.reviewsPage.sources.website;
  if (normalized === "trustpilot") return dict.reviewsPage.sources.trustpilot;
  if (normalized === "other") return dict.reviewsPage.sources.other;
  return normalized;
};

export default async function ReviewsPage() {
  const supabase = await createClient();
  const dict = await getAdminDictionary();
  const { data } = await supabase
    .from("reviews")
    .select("id,author_name,rating,content,source,is_published")
    .order("created_at", { ascending: false })
    .limit(100);

  const reviews = (data ?? []) as ReviewRow[];

  return (
    <AdminShell title={dict.reviewsPage.title}>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground">
            {dict.reviewsPage.addTitle}
          </h2>
          <form className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                {dict.reviewsPage.name}
              </label>
              <input
                type="text"
                placeholder={dict.reviewsPage.namePlaceholder}
                className="mt-2 w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                {dict.reviewsPage.stars}
              </label>
              <input
                type="number"
                min={1}
                max={5}
                defaultValue={5}
                className="mt-2 w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                {dict.reviewsPage.reviewText}
              </label>
              <textarea
                rows={4}
                placeholder={dict.reviewsPage.textPlaceholder}
                className="mt-2 w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground"
              />
            </div>
            <button
              type="button"
              className="w-full rounded-full bg-brand-gold px-6 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-black"
            >
              {dict.reviewsPage.save}
            </button>
          </form>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground">{dict.reviewsPage.activeTitle}</h2>
          <div className="mt-6 space-y-4">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review.id} className="rounded-xl border border-border/60 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <p className="font-semibold text-foreground">{review.author_name}</p>
                    <span className="text-brand-gold">{"★".repeat(review.rating)}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted">{review.content ?? "-"}</p>
                  <p className="mt-2 text-xs text-muted">
                    {dict.reviewsPage.sourceLabel}: {formatSource(review.source, dict)}
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    {review.is_published ? dict.reviewsPage.published : dict.reviewsPage.unpublished}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-border/60 p-6 text-sm text-muted">
                {dict.reviewsPage.empty}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
