"use client";

import Image from "next/image";
import { useState } from "react";

import { useReCaptcha } from "@/components/ReCaptcha";
import type { ProductRatingSummary, ProductReview } from "@/lib/product-reviews";

const Stars = ({ rating, className = "h-4 w-4" }: { rating: number; className?: string }) => (
  <span className="inline-flex items-center gap-0.5" aria-label={`${rating} / 5`}>
    {[1, 2, 3, 4, 5].map((step) => (
      <svg
        key={step}
        viewBox="0 0 24 24"
        className={`${className} ${step <= Math.round(rating) ? "text-gold" : "text-muted/30"}`}
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="m12 17.27 5.18 3.13-1.37-5.89 4.57-3.96-6.02-.51L12 4.5 9.64 10.04l-6.02.51 4.57 3.96-1.37 5.89L12 17.27Z" />
      </svg>
    ))}
  </span>
);

const formatDate = (locale: "de" | "en", value: string) =>
  new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", { dateStyle: "medium" }).format(new Date(value));

export function ProductRatingBadge({
  locale,
  summary,
}: {
  locale: "de" | "en";
  summary: ProductRatingSummary;
}) {
  return (
    <a href="#reviews" className="mt-3 inline-flex items-center gap-2 text-sm text-muted transition hover:text-gold">
      <Stars rating={summary.average} />
      <span className="font-semibold text-foreground">{summary.average.toFixed(1).replace(".", locale === "de" ? "," : ".")}</span>
      <span>
        ({summary.count} {locale === "de" ? (summary.count === 1 ? "Bewertung" : "Bewertungen") : summary.count === 1 ? "review" : "reviews"})
      </span>
    </a>
  );
}

export default function ProductReviews({
  locale,
  productId,
  reviews,
  summary,
  orderId,
  token,
}: {
  locale: "de" | "en";
  productId: string;
  reviews: ProductReview[];
  summary: ProductRatingSummary | null;
  /** Present when arriving from a post-purchase review invitation. */
  orderId?: string | null;
  token?: string | null;
}) {
  const invited = Boolean(orderId && token);
  const [open, setOpen] = useState(invited);
  const [rating, setRating] = useState(0);
  const [authorName, setAuthorName] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const { execute, ReCaptchaComponent, isLoading: recaptchaLoading } = useReCaptcha("product_review");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (rating < 1) {
      setError(locale === "de" ? "Bitte vergib eine Bewertung von 1 bis 5 Sternen." : "Please give a rating from 1 to 5 stars.");
      return;
    }
    setState("sending");
    setError("");
    const recaptchaToken = await execute();
    if (!recaptchaToken) { setState("idle"); setError(locale === "de" ? "Sicherheitsprüfung nicht verfügbar." : "Security check unavailable."); return; }
    const form=new FormData();Object.entries({productId,rating:String(rating),authorName,title,body,locale,orderId:orderId??"",token:token??"",recaptchaToken}).forEach(([key,value])=>form.set(key,value));files.forEach(file=>form.append("images",file));
    const response = await fetch("/api/reviews", { method: "POST", body: form });
    const data = (await response.json()) as { success: boolean; error?: string };
    if (!response.ok || !data.success) {
      setState("idle");
      setError(data.error || (locale === "de" ? "Bewertung konnte nicht gespeichert werden." : "The review could not be saved."));
      return;
    }
    setState("done");
  };

  return (
    <div id="reviews" className="rounded-2xl border border-border bg-store-card p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-foreground">
          {locale === "de" ? "Bewertungen" : "Reviews"}
        </h2>
        {summary ? (
          <div className="flex items-center gap-2 text-sm">
            <Stars rating={summary.average} className="h-5 w-5" />
            <span className="font-semibold text-foreground">{summary.average.toFixed(1)}</span>
            <span className="text-muted">
              {locale === "de" ? `aus ${summary.count} Bewertungen` : `from ${summary.count} reviews`}
            </span>
          </div>
        ) : null}
      </div>

      {reviews.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          {locale === "de"
            ? "Für dieses Produkt gibt es noch keine Bewertungen. Sei die erste Person, die eine schreibt."
            : "There are no reviews for this product yet. Be the first to write one."}
        </p>
      ) : (
        <ul className="mt-6 space-y-5">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-2xl border border-border/60 bg-surface/40 p-5">
              <div className="flex flex-wrap items-center gap-3">
                <Stars rating={review.rating} />
                <span className="text-sm font-semibold text-foreground">{review.authorName}</span>
                {review.verified ? (
                  <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">
                    {locale === "de" ? "Verifizierter Kauf" : "Verified purchase"}
                  </span>
                ) : null}
                <span className="text-xs text-muted">{formatDate(locale, review.createdAt)}</span>
              </div>
              {review.title ? <p className="mt-3 font-semibold text-foreground">{review.title}</p> : null}
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted">{review.body}</p>
              {review.mediaUrls.length ? (
                <div className="mt-4 flex gap-3 overflow-x-auto">
                  {review.mediaUrls.map((url, index) => {
                    const label = locale === "de"
                      ? `Kundenfoto ${index + 1} von ${review.authorName}`
                      : `Customer photo ${index + 1} by ${review.authorName}`;
                    return (
                      <a key={url} href={url} target="_blank" rel="noreferrer" aria-label={label} className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-border bg-white">
                        <Image src={url} alt={label} fill sizes="112px" className="object-cover" />
                      </a>
                    );
                  })}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {state === "done" ? (
        <p className="mt-6 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-5 text-sm text-foreground">
          {locale === "de"
            ? "Danke für deine Bewertung. Wir prüfen sie kurz und schalten sie dann frei."
            : "Thank you for your review. We check it briefly and then publish it."}
        </p>
      ) : open ? (
        <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border border-border/60 bg-surface/40 p-5">
          <ReCaptchaComponent />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              {locale === "de" ? "Deine Bewertung *" : "Your rating *"}
            </p>
            <div className="mt-2 flex gap-1" role="radiogroup" aria-label={locale === "de" ? "Bewertung in Sternen" : "Star rating"}>
              {[1, 2, 3, 4, 5].map((step) => (
                <button
                  key={step}
                  type="button"
                  role="radio"
                  aria-checked={rating === step}
                  aria-label={`${step} / 5`}
                  onClick={() => setRating(step)}
                  className="transition hover:scale-110"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className={`h-7 w-7 ${step <= rating ? "text-gold" : "text-muted/30"}`}
                    fill="currentColor"
                  >
                    <path d="m12 17.27 5.18 3.13-1.37-5.89 4.57-3.96-6.02-.51L12 4.5 9.64 10.04l-6.02.51 4.57 3.96-1.37 5.89L12 17.27Z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              {locale === "de" ? "Name *" : "Name *"}
            </span>
            <input
              required
              maxLength={80}
              value={authorName}
              onChange={(event) => setAuthorName(event.target.value)}
              className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              {locale === "de" ? "Überschrift" : "Headline"}
            </span>
            <input
              maxLength={120}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              {locale === "de" ? "Deine Erfahrung *" : "Your experience *"}
            </span>
            <textarea
              required
              rows={4}
              maxLength={2000}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground"
            />
          </label>
          {invited ? <label className="block space-y-2"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{locale==="de"?"Kundenfotos (optional, max. 3)":"Customer photos (optional, max 3)"}</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={event=>setFiles(Array.from(event.target.files??[]).slice(0,3))} className="w-full rounded-2xl border border-border/60 bg-surface/70 px-4 py-3 text-sm text-foreground"/><span className="text-xs text-muted">{files.length}/3</span></label> : null}
          {error ? <p className="text-sm text-red-text" role="alert">{error}</p> : null}
          <button type="submit" disabled={state === "sending" || recaptchaLoading} className="btn-primary justify-center disabled:opacity-50">
            {state === "sending"
              ? locale === "de" ? "Wird gesendet…" : "Sending…"
              : locale === "de" ? "Bewertung absenden" : "Submit review"}
          </button>
          <p className="text-xs text-muted">
            {locale === "de"
              ? "Bewertungen werden vor der Veröffentlichung geprüft. Dein Name erscheint öffentlich."
              : "Reviews are checked before publication. Your name is shown publicly."}
          </p>
        </form>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="btn-secondary mt-6 justify-center">
          {locale === "de" ? "Bewertung schreiben" : "Write a review"}
        </button>
      )}
    </div>
  );
}
