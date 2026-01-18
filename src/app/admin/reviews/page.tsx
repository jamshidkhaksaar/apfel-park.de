import AdminShell from "../../../components/admin/AdminShell";

const reviews = [
  {
    name: "Thomas W.",
    rating: 5,
    text: "Toller Kundenservice, super schnelle Lieferung und sehr gute Kommunikation.",
  },
  {
    name: "Alex N.",
    rating: 5,
    text: "Top Reparatur innerhalb einer Stunde – fairer Preis und freundliches Team.",
  },
];

export default function ReviewsPage() {
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
            {reviews.map((review) => (
              <div key={review.name} className="rounded-xl border border-border/60 p-4">
                <div className="flex items-center justify-between text-sm">
                  <p className="font-semibold text-foreground">{review.name}</p>
                  <span className="text-brand-gold">
                    {"★".repeat(review.rating)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted">{review.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
