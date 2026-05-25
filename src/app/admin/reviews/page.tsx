import { createAdminServerClient } from "@/lib/admin-auth-server";
import { getAdminDictionary } from "@/lib/admin-i18n-server";
import { getHomeContent } from "@/lib/content";
import type { Locale } from "@/lib/i18n";

import AdminShell from "../../../components/admin/AdminShell";
import { addHomepageReview, deleteHomepageReview } from "./actions";

export const dynamic = "force-dynamic";

type ReviewRow = {
  id: string;
  author_name: string;
  rating: number;
  content: string | null;
  source: string | null;
  is_published: boolean;
};

type HomepageTestimonial = {
  name: string;
  badge: string;
  timeAgo: string;
  quote: string;
  rating: number;
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

const localeSections: Array<{ locale: Locale; labelKey: "localeDe" | "localeEn" }> = [
  { locale: "de", labelKey: "localeDe" },
  { locale: "en", labelKey: "localeEn" },
];

export default async function ReviewsPage() {
  const adminClient = await createAdminServerClient();
  const dict = await getAdminDictionary();
  const [germanHomeContent, englishHomeContent, { data }] = await Promise.all([
    getHomeContent("de"),
    getHomeContent("en"),
    adminClient
      .from("reviews")
      .select("id,author_name,rating,content,source,is_published")
      .order("created_at", { ascending: false })
      .limit(24),
  ]);

  const homepageReviewsByLocale: Record<Locale, readonly HomepageTestimonial[]> = {
    de: germanHomeContent.testimonials.items as readonly HomepageTestimonial[],
    en: englishHomeContent.testimonials.items as readonly HomepageTestimonial[],
  };

  const reviews = (data ?? []) as ReviewRow[];

  return (
    <AdminShell title={dict.reviewsPage.title}>
      <div className="space-y-6">
        <div className="glass-panel rounded-2xl p-6">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">
              {dict.reviewsPage.introTitle}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              {dict.reviewsPage.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              {dict.reviewsPage.introText}
            </p>
          </div>

          <div className="mt-5 rounded-xl border border-border/60 bg-black/20 p-4 text-sm text-muted">
            <p className="font-medium text-foreground">{dict.reviewsPage.helperTitle}</p>
            <p className="mt-1">{dict.reviewsPage.helperText}</p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          {localeSections.map(({ locale: reviewLocale, labelKey }) => {
            const homepageReviews = homepageReviewsByLocale[reviewLocale];

            return (
              <section key={reviewLocale} className="glass-panel rounded-2xl p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                      {dict.reviewsPage[labelKey]}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-foreground">
                      {dict.reviewsPage.homepageActiveTitle}
                    </h3>
                  </div>
                  <div className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted">
                    {homepageReviews.length}
                  </div>
                </div>

                <form action={addHomepageReview} className="mt-6 space-y-4 rounded-xl border border-border/60 bg-black/10 p-4">
                  <input type="hidden" name="locale" value={reviewLocale} />

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                        {dict.reviewsPage.name}
                      </span>
                      <input
                        name="name"
                        required
                        className="w-full rounded-xl border border-border/60 bg-surface/50 px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-gold/60"
                        placeholder={dict.reviewsPage.namePlaceholder}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                        {dict.reviewsPage.stars}
                      </span>
                      <select
                        name="rating"
                        defaultValue="5"
                        className="w-full rounded-xl border border-border/60 bg-surface/50 px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-gold/60"
                      >
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <option key={rating} value={rating}>
                            {rating} / 5
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                        {dict.reviewsPage.badge}
                      </span>
                      <input
                        name="badge"
                        className="w-full rounded-xl border border-border/60 bg-surface/50 px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-gold/60"
                        placeholder={dict.reviewsPage.badgePlaceholder}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                        {dict.reviewsPage.timeAgo}
                      </span>
                      <input
                        name="timeAgo"
                        className="w-full rounded-xl border border-border/60 bg-surface/50 px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-gold/60"
                        placeholder={dict.reviewsPage.timeAgoPlaceholder}
                      />
                    </label>
                  </div>

                  <label className="block space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                      {dict.reviewsPage.reviewText}
                    </span>
                    <textarea
                      name="quote"
                      required
                      rows={4}
                      className="w-full rounded-xl border border-border/60 bg-surface/50 px-3 py-3 text-sm text-foreground outline-none transition focus:border-gold/60"
                      placeholder={dict.reviewsPage.textPlaceholder}
                    />
                  </label>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="rounded-full bg-gold px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.25em] text-black transition hover:bg-gold-deep"
                    >
                      {dict.reviewsPage.save}
                    </button>
                  </div>
                </form>

                <div className="mt-5 space-y-3">
                  {homepageReviews.length > 0 ? (
                    homepageReviews.map((review, index) => (
                      <article key={`${reviewLocale}-${index}-${review.name}`} className="rounded-xl border border-border/60 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-foreground">{review.name}</p>
                              {review.badge ? (
                                <span className="rounded-full border border-border/60 px-2 py-0.5 text-[11px] text-muted">
                                  {review.badge}
                                </span>
                              ) : null}
                            </div>
                            {review.timeAgo ? (
                              <p className="mt-1 text-xs text-muted">{review.timeAgo}</p>
                            ) : null}
                          </div>

                          <div className="shrink-0 text-sm text-brand-gold">
                            {"★".repeat(review.rating)}
                          </div>
                        </div>

                        <p className="mt-3 text-sm leading-6 text-muted">{review.quote}</p>

                        <form action={deleteHomepageReview} className="mt-4 flex justify-end">
                          <input type="hidden" name="locale" value={reviewLocale} />
                          <input type="hidden" name="index" value={String(index)} />
                          <button
                            type="submit"
                            className="rounded-full border border-red-500/30 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-red-300 transition hover:bg-red-500/10"
                          >
                            {dict.reviewsPage.delete}
                          </button>
                        </form>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-xl border border-border/60 p-6 text-sm text-muted">
                      {dict.reviewsPage.empty}
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>

        <section className="glass-panel rounded-2xl p-6">
          <div className="max-w-3xl">
            <h3 className="text-lg font-semibold text-foreground">{dict.reviewsPage.databaseTitle}</h3>
            <p className="mt-2 text-sm text-muted">{dict.reviewsPage.databaseText}</p>
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-2">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <article key={review.id} className="rounded-xl border border-border/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{review.author_name}</p>
                      <p className="mt-1 text-xs text-muted">
                        {dict.reviewsPage.sourceLabel}: {formatSource(review.source, dict)}
                      </p>
                    </div>
                    <div className="shrink-0 text-sm text-brand-gold">{"★".repeat(review.rating)}</div>
                  </div>

                  <p className="mt-3 line-clamp-4 text-sm leading-6 text-muted">{review.content ?? "-"}</p>

                  <div className="mt-3 text-xs text-muted">
                    {review.is_published ? dict.reviewsPage.published : dict.reviewsPage.unpublished}
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-xl border border-border/60 p-6 text-sm text-muted">
                {dict.reviewsPage.empty}
              </div>
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
