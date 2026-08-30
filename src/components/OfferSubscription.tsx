"use client";

import { FormEvent, useState } from "react";

import { useReCaptcha } from "./ReCaptcha";

export default function OfferSubscription({ lang }: { lang: "de" | "en" }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const { execute, ReCaptchaComponent, isLoading: captchaLoading } = useReCaptcha("offer_subscribe");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState("sending");
    setMessage("");
    const recaptchaToken = await execute();
    try {
      const response = await fetch("/api/offer-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale: lang, recaptchaToken, website }),
      });
      const result = (await response.json()) as { success?: boolean; alreadySubscribed?: boolean; error?: string };
      if (!response.ok || !result.success) throw new Error(result.error ?? "subscribe_failed");
      setState("success");
      setMessage(
        result.alreadySubscribed
          ? (lang === "de" ? "Du bist bereits angemeldet." : "You are already subscribed.")
          : (lang === "de" ? "Bitte bestätige deine Anmeldung per E-Mail." : "Please confirm your subscription by email."),
      );
      setEmail("");
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error && error.message === "invalid_email"
          ? (lang === "de" ? "Bitte gib eine gültige E-Mail-Adresse ein." : "Please enter a valid email address.")
          : (lang === "de" ? "Die Anmeldung konnte nicht abgeschlossen werden." : "Subscription could not be completed."),
      );
    }
  };

  return (
    <section className="mx-auto mb-10 max-w-2xl rounded-3xl border border-gold/25 bg-surface-strong/30 p-6 text-center sm:p-8" aria-labelledby="offer-subscription-title">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
        {lang === "de" ? "Angebote & Neuigkeiten" : "Offers & news"}
      </p>
      <h2 id="offer-subscription-title" className="mt-2 text-2xl font-semibold text-foreground">
        {lang === "de" ? "Keine Angebote verpassen" : "Don’t miss our offers"}
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-muted">
        {lang === "de" ? "Melde dich freiwillig an und erhalte ausgewählte Angebote von Apfel Park." : "Opt in to receive selected offers from Apfel Park."}
      </p>
      <form onSubmit={submit} className="mx-auto mt-5 flex max-w-xl flex-col gap-3 sm:flex-row">
        <label htmlFor="offer-subscribe-email" className="sr-only">{lang === "de" ? "E-Mail-Adresse" : "Email address"}</label>
        <input id="offer-subscribe-email" type="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder={lang === "de" ? "Deine E-Mail-Adresse" : "Your email address"} className="min-w-0 flex-1 rounded-full border border-border/60 bg-background/60 px-5 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold" />
        <label htmlFor="offer-subscribe-website" className="sr-only">Website</label>
        <input id="offer-subscribe-website" tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} className="absolute -left-[9999px] h-px w-px opacity-0" aria-hidden="true" />
        <button type="submit" disabled={state === "sending" || captchaLoading} className="btn-primary justify-center whitespace-nowrap disabled:opacity-50">
          {state === "sending" ? (lang === "de" ? "Wird gesendet…" : "Submitting…") : (lang === "de" ? "Anmelden" : "Subscribe")}
        </button>
      </form>
      <p className="mt-3 text-xs text-muted">
        {lang === "de" ? "Double-Opt-in. Abmeldung jederzeit möglich. Spam-Schutz durch reCAPTCHA." : "Double opt-in. Unsubscribe anytime. Protected by reCAPTCHA."}
      </p>
      {message ? <p className={`mt-3 text-sm ${state === "error" ? "text-red-text" : "text-green-text"}`} role="status">{message}</p> : null}
      <ReCaptchaComponent />
    </section>
  );
}
