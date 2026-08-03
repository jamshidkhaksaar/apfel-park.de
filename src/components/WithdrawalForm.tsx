"use client";

import { useState } from "react";

import { useReCaptcha } from "@/components/ReCaptcha";
import type { Locale } from "@/lib/i18n";

type Props = {
  lang: Locale;
};

type Stage = "form" | "confirm" | "done";

export default function WithdrawalForm({ lang }: Props) {
  const isGerman = lang === "de";
  const [stage, setStage] = useState<Stage>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [receivedDate, setReceivedDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmedAt, setConfirmedAt] = useState("");
  const { token: recaptchaToken, ReCaptchaComponent } = useReCaptcha("withdrawal_form");

  const inputClass =
    "w-full rounded-xl border border-border/60 bg-surface px-4 py-3 text-foreground placeholder:text-muted/50 focus:border-gold focus:outline-none";

  const goToConfirm = () => {
    setError("");
    if (!name.trim() || !email.trim() || !orderNumber.trim()) {
      setError(
        isGerman
          ? "Bitte Name, E-Mail und Bestellnummer angeben."
          : "Please provide your name, email, and order number.",
      );
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError(isGerman ? "Ungültige E-Mail-Adresse." : "Invalid email address.");
      return;
    }
    setStage("confirm");
  };

  const submitWithdrawal = async () => {
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/withdrawal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          orderNumber,
          receivedDate: receivedDate || undefined,
          reason: reason || undefined,
          recaptchaToken,
          locale: lang,
        }),
      });
      const result = (await response.json()) as { success: boolean; error?: string; confirmedAt?: string };
      if (!response.ok || !result.success) {
        setError(result.error || (isGerman ? "Widerruf konnte nicht übermittelt werden." : "Withdrawal could not be submitted."));
        setSubmitting(false);
        return;
      }
      setConfirmedAt(result.confirmedAt || new Date().toISOString());
      setStage("done");
    } catch {
      setError(isGerman ? "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut." : "An error occurred. Please try again.");
    }
    setSubmitting(false);
  };

  if (stage === "done") {
    const timestamp = new Date(confirmedAt).toLocaleString(isGerman ? "de-DE" : "en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    return (
      <div className="tech-card rounded-2xl p-8 text-center">
        <p className="text-2xl">✓</p>
        <h2 className="mt-3 text-xl font-semibold text-foreground">
          {isGerman ? "Widerruf eingegangen" : "Withdrawal received"}
        </h2>
        <p className="mt-3 text-sm text-muted">
          {isGerman
            ? `Ihr Widerruf ist am ${timestamp} bei uns eingegangen. Sie erhalten in Kürze eine Eingangsbestätigung per E-Mail an ${email}.`
            : `Your withdrawal was received on ${timestamp}. You will shortly receive a receipt confirmation by email at ${email}.`}
        </p>
        <p className="mt-3 text-sm text-muted">
          {isGerman
            ? "Bitte senden Sie die Ware innerhalb von 14 Tagen an: Apfel Park, Wilhelm-Strauß-Weg 2b, 21109 Hamburg."
            : "Please return the goods within 14 days to: Apfel Park, Wilhelm-Strauß-Weg 2b, 21109 Hamburg, Germany."}
        </p>
      </div>
    );
  }

  if (stage === "confirm") {
    return (
      <div className="tech-card rounded-2xl p-8">
        <h2 className="text-xl font-semibold text-foreground">
          {isGerman ? "Widerruf prüfen und bestätigen" : "Review and confirm withdrawal"}
        </h2>
        <dl className="mt-5 space-y-2 text-sm">
          <div className="flex justify-between gap-4"><dt className="text-muted">{isGerman ? "Name" : "Name"}</dt><dd className="text-foreground">{name}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted">{isGerman ? "E-Mail" : "Email"}</dt><dd className="text-foreground">{email}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted">{isGerman ? "Bestellnummer" : "Order number"}</dt><dd className="text-foreground">{orderNumber}</dd></div>
          {receivedDate ? <div className="flex justify-between gap-4"><dt className="text-muted">{isGerman ? "Erhalten am" : "Received on"}</dt><dd className="text-foreground">{receivedDate}</dd></div> : null}
          {reason ? <div className="flex justify-between gap-4"><dt className="text-muted">{isGerman ? "Grund (freiwillig)" : "Reason (optional)"}</dt><dd className="text-foreground">{reason}</dd></div> : null}
        </dl>
        <p className="mt-4 text-xs text-muted">
          {isGerman
            ? "Mit Klick auf „Widerruf bestätigen“ widerrufen Sie Ihren Kaufvertrag zu dieser Bestellung."
            : "By clicking “Confirm withdrawal” you withdraw from the purchase contract for this order."}
        </p>
        {error ? <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p> : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={submitWithdrawal} disabled={submitting} className="btn-primary disabled:cursor-not-allowed disabled:opacity-50">
            {submitting
              ? isGerman ? "Wird übermittelt ..." : "Submitting ..."
              : isGerman ? "Widerruf bestätigen" : "Confirm withdrawal"}
          </button>
          <button type="button" onClick={() => setStage("form")} disabled={submitting} className="btn-secondary">
            {isGerman ? "Zurück" : "Back"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="tech-card rounded-2xl p-8"
      onSubmit={(event) => {
        event.preventDefault();
        goToConfirm();
      }}
    >
      <h2 className="text-xl font-semibold text-foreground">
        {isGerman ? "Vertrag widerrufen" : "Withdraw from contract"}
      </h2>
      <p className="mt-2 text-sm text-muted">
        {isGerman
          ? "Hier können Sie Ihren Online-Kauf innerhalb von 14 Tagen nach Erhalt der Ware ohne Angabe von Gründen widerrufen."
          : "Here you can withdraw from your online purchase within 14 days of receiving the goods, without giving a reason."}
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-foreground">{isGerman ? "Name" : "Name"} *</span>
          <input required value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" className={`mt-2 ${inputClass}`} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-foreground">{isGerman ? "E-Mail" : "Email"} *</span>
          <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className={`mt-2 ${inputClass}`} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-foreground">{isGerman ? "Bestellnummer" : "Order number"} *</span>
          <input required value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} placeholder="A-123" className={`mt-2 ${inputClass}`} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-foreground">{isGerman ? "Ware erhalten am (optional)" : "Goods received on (optional)"}</span>
          <input type="date" value={receivedDate} onChange={(event) => setReceivedDate(event.target.value)} className={`mt-2 ${inputClass}`} />
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-foreground">{isGerman ? "Grund (freiwillig — keine Pflichtangabe)" : "Reason (voluntary — not required)"}</span>
          <textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} className={`mt-2 ${inputClass}`} />
        </label>
      </div>

      <ReCaptchaComponent />
      {error ? <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p> : null}

      <button type="submit" className="btn-primary mt-6">
        {isGerman ? "Weiter zur Bestätigung" : "Continue to confirmation"}
      </button>
      <p className="mt-3 text-xs text-muted">* {isGerman ? "Pflichtfeld" : "Required field"}</p>
    </form>
  );
}
