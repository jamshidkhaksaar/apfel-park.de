"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export type PendingReviewRow = {
  id: string;
  productTitle: string;
  productSlug: string;
  authorName: string;
  rating: number;
  title: string | null;
  body: string;
  verified: boolean;
  status: string;
  locale: string;
  createdAt: string;
  mediaUrls: string[];
};

export default function ProductReviewModeration({
  locale,
  reviews,
}: {
  locale: "de" | "en";
  reviews: PendingReviewRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const moderate = (id: string, status: "approved" | "rejected" | "pending") => {
    setBusyId(id);
    setError("");
    void (async () => {
      const response = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = (await response.json()) as { success: boolean; error?: string };
      setBusyId(null);
      if (!response.ok || !data.success) {
        setError(data.error || (locale === "de" ? "Aktualisierung fehlgeschlagen." : "Update failed."));
        return;
      }
      startTransition(() => router.refresh());
    })();
  };

  if (reviews.length === 0) {
    return (
      <p className="rounded-2xl border border-border/60 bg-surface/40 p-6 text-sm text-muted">
        {locale === "de" ? "Keine Bewertungen vorhanden." : "No reviews yet."}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-red-400" role="alert">{error}</p> : null}
      {reviews.map((review) => (
        <div key={review.id} className="rounded-2xl border border-border/60 bg-surface/40 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-gold">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
            <span className="text-sm font-semibold text-foreground">{review.authorName}</span>
            {review.verified ? (
              <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">
                {locale === "de" ? "Verifizierter Kauf" : "Verified purchase"}
              </span>
            ) : null}
            <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${
              review.status === "approved" ? "bg-emerald-500/10 text-emerald-500"
                : review.status === "rejected" ? "bg-red-500/10 text-red-400"
                : "bg-amber-500/10 text-amber-500"
            }`}>
              {review.status}
            </span>
            <span className="text-xs text-muted">
              {new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(review.createdAt))}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted">
            <a href={`/${locale}/store/${review.productSlug}`} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-gold">
              {review.productTitle}
            </a>
          </p>
          {review.title ? <p className="mt-3 font-semibold text-foreground">{review.title}</p> : null}
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted">{review.body}</p>
          {review.mediaUrls.length ? <div className="mt-4 flex gap-3 overflow-x-auto">{review.mediaUrls.map(value=>{const url=value.startsWith("/uploads/reviews/")?value:`/api/admin/reviews/assets/${encodeURIComponent(value)}`;return <a key={value} href={url} target="_blank" rel="noreferrer" className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-border bg-white"><Image src={url} alt="" fill sizes="112px" className="object-cover" unoptimized /></a>})}</div> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {review.status !== "approved" ? (
              <button
                type="button"
                disabled={busyId === review.id || pending}
                onClick={() => moderate(review.id, "approved")}
                className="rounded-xl bg-emerald-500/90 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
              >
                {locale === "de" ? "Freischalten" : "Approve"}
              </button>
            ) : null}
            {review.status !== "rejected" ? (
              <button
                type="button"
                disabled={busyId === review.id || pending}
                onClick={() => moderate(review.id, "rejected")}
                className="rounded-xl border border-border/60 px-4 py-2 text-sm text-foreground disabled:opacity-50"
              >
                {locale === "de" ? "Ablehnen" : "Reject"}
              </button>
            ) : null}
            {review.status !== "pending" ? (
              <button
                type="button"
                disabled={busyId === review.id || pending}
                onClick={() => moderate(review.id, "pending")}
                className="rounded-xl border border-border/60 px-4 py-2 text-sm text-muted disabled:opacity-50"
              >
                {locale === "de" ? "Zurück in Prüfung" : "Back to pending"}
              </button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
