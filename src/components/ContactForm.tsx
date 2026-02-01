"use client";

import { useState, FormEvent, useId } from "react";
import { useReCaptcha } from "./ReCaptcha";

type ContactFormProps = {
  lang: string;
};

type FormData = {
  name: string;
  email: string;
  device: string;
  message: string;
};

type SubmitStatus = {
  type: "idle" | "loading" | "success" | "error";
  message?: string;
  errors?: Partial<Record<keyof FormData, string>>;
};

export default function ContactForm({ lang }: ContactFormProps) {
  const formId = useId();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    device: "",
    message: "",
  });
  const [status, setStatus] = useState<SubmitStatus>({ type: "idle" });
  const id = useId();
  
  const { token: recaptchaToken, ReCaptchaComponent } = useReCaptcha("contact_form");

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (status.errors?.[field]) {
      setStatus((prev) => ({
        ...prev,
        errors: { ...prev.errors, [field]: undefined },
      }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const errors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.name) {
      errors.name = lang === "de" ? "Name ist erforderlich" : "Name is required";
    }
    if (!formData.email) {
      errors.email = lang === "de" ? "E-Mail ist erforderlich" : "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = lang === "de" ? "Ungültige E-Mail-Adresse" : "Invalid email address";
    }
    if (!formData.message) {
      errors.message = lang === "de" ? "Nachricht ist erforderlich" : "Message is required";
    }

    if (Object.keys(errors).length > 0) {
      setStatus({
        type: "error",
        message: lang === "de" 
          ? "Bitte korrigiere die Fehler im Formular." 
          : "Please correct the errors in the form.",
        errors,
      });
      return;
    }

    setStatus({ type: "loading" });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          recaptchaToken,
          locale: lang,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setStatus({
          type: "success",
          message: result.message,
        });
        // Reset form
        setFormData({ name: "", email: "", device: "", message: "" });
      } else {
        setStatus({
          type: "error",
          message: result.error || (lang === "de" 
            ? "Nachricht konnte nicht gesendet werden." 
            : "Failed to send message."),
        });
      }
    } catch (error) {
      console.error("Contact form error:", error);
      setStatus({
        type: "error",
        message: lang === "de" 
          ? "Ein Fehler ist aufgetreten. Bitte versuche es später erneut." 
          : "An error occurred. Please try again later.",
      });
    }
  };

  const inputClassName = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-muted-strong focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/50 aria-[invalid=true]:border-red-500/50 aria-[invalid=true]:focus:ring-red-500/50";

  return (
    <form onSubmit={handleSubmit} className="tech-card space-y-5 rounded-3xl p-8">
      <h2 className="text-xl font-bold text-foreground">
        {lang === "de" ? "Nachricht senden" : "Send Message"}
      </h2>
      
      {/* Status Messages */}
      {status.type === "success" && (
        <div role="alert" className="rounded-xl bg-green-500/10 border border-green-500/30 p-4">
          <div className="flex items-center gap-2 text-green-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium">{status.message}</span>
          </div>
        </div>
      )}
      
      {status.type === "error" && !status.errors && (
        <div role="alert" className="rounded-xl bg-red-500/10 border border-red-500/30 p-4">
          <div className="flex items-center gap-2 text-red-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">{status.message}</span>
          </div>
        </div>
      )}

      {status.type === "error" && status.errors && (
        <div role="alert" className="rounded-xl bg-red-500/10 border border-red-500/30 p-4">
            <div className="flex items-center gap-2 text-red-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">{status.message}</span>
            </div>
        </div>
      )}
      
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`${id}-name`}
            className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted"
          >
            {lang === "de" ? "Name" : "Name"} *
          </label>
          <input
            id={`${id}-name`}
            type="text"
            autoComplete="name"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder={lang === "de" ? "Dein Name" : "Your name"}
            className={inputClassName}
            disabled={status.type === "loading"}
            required
            aria-invalid={!!status.errors?.name}
            aria-describedby={status.errors?.name ? `${id}-name-error` : undefined}
          />
          {status.errors?.name && (
            <p id={`${id}-name-error`} className="mt-1 text-xs text-red-400">
              {status.errors.name}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor={`${id}-email`}
            className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted"
          >
            {lang === "de" ? "E-Mail" : "Email"} *
          </label>
          <input
            id={`${id}-email`}
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="you@email.com"
            className={inputClassName}
            disabled={status.type === "loading"}
            required
            aria-invalid={!!status.errors?.email}
            aria-describedby={status.errors?.email ? `${id}-email-error` : undefined}
          />
          {status.errors?.email && (
            <p id={`${id}-email-error`} className="mt-1 text-xs text-red-400">
              {status.errors.email}
            </p>
          )}
        </div>
      </div>
      
      <div>
        <label
          htmlFor={`${id}-device`}
          className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted"
        >
          {lang === "de" ? "Gerät" : "Device"}
        </label>
        <input
          id={`${id}-device`}
          type="text"
          value={formData.device}
          onChange={(e) => handleChange("device", e.target.value)}
          placeholder={lang === "de" ? "z.B. iPhone 15 Pro" : "e.g. iPhone 15 Pro"}
          className={inputClassName}
          disabled={status.type === "loading"}
        />
      </div>
      
      <div>
        <label
          htmlFor={`${id}-message`}
          className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted"
        >
          {lang === "de" ? "Nachricht" : "Message"} *
        </label>
        <textarea
          id={`${id}-message`}
          rows={4}
          value={formData.message}
          onChange={(e) => handleChange("message", e.target.value)}
          placeholder={lang === "de" ? "Beschreibe dein Anliegen..." : "Describe your request..."}
          className={inputClassName}
          disabled={status.type === "loading"}
          required
          aria-invalid={!!status.errors?.message}
          aria-describedby={status.errors?.message ? `${id}-message-error` : undefined}
        />
        {status.errors?.message && (
          <p id={`${id}-message-error`} className="mt-1 text-xs text-red-400">
            {status.errors.message}
          </p>
        )}
      </div>
      
      {/* reCAPTCHA (invisible for v3) */}
      <ReCaptchaComponent />
      
      <button 
        type="submit" 
        className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={status.type === "loading"}
      >
        {status.type === "loading" ? (
          <>
            <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
            <span>{lang === "de" ? "Wird gesendet..." : "Sending..."}</span>
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <span>{lang === "de" ? "Nachricht senden" : "Send Message"}</span>
          </>
        )}
      </button>
      
      {/* Privacy notice for reCAPTCHA */}
      <p className="text-xs text-muted/60 text-center">
        {lang === "de" 
          ? "Diese Website ist durch reCAPTCHA geschützt. Es gelten die Google Datenschutzrichtlinien und Nutzungsbedingungen."
          : "This site is protected by reCAPTCHA. Google Privacy Policy and Terms of Service apply."}
      </p>
    </form>
  );
}
