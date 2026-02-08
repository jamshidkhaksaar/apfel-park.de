import { createClient } from "@/lib/supabase/server";
import AdminShell from "../../../components/admin/AdminShell";

export const dynamic = "force-dynamic";

type ReviewRow = {
  id: string;
  author_name: string;
  rating: number;
  content: string | null;
  is_published: boolean;
};

export default async function ReviewsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("id,author_name,rating,content,is_published")
    .order("created_at", { ascending: false })
    .limit(100);

  const reviews = (data ?? []) as ReviewRow[];

  return (
    <AdminShell title="Google Reviews">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Neue Bewertung hinzufügen
          </h2>
          <form className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                Name
              </label>
              <input
                type="text"
                placeholder="Name des Kunden"
                className="mt-2 w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                Sterne
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
                Review Text
              </label>
              <textarea
                rows={4}
                placeholder="Bewertungstext einfügen"
                className="mt-2 w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground"
              />
            </div>
            <button
              type="button"
              className="w-full rounded-full bg-brand-gold px-6 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-black"
            >
              Speichern
            </button>
          </form>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground">Aktive Reviews</h2>
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
                    {review.is_published ? "Veroffentlicht" : "Nicht veroffentlicht"}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-border/60 p-6 text-sm text-muted">
                Noch keine Reviews vorhanden.
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
