"use client";

import { useState, FormEvent } from "react";
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
};

export default function ContactForm({ lang }: ContactFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    device: "",
    message: "",
  });
  const [status, setStatus] = useState<SubmitStatus>({ type: "idle" });
  
  const { token: recaptchaToken, ReCaptchaComponent } = useReCaptcha("contact_form");

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.email || !formData.message) {
      setStatus({
        type: "error",
        message: lang === "de" 
          ? "Bitte fülle alle Pflichtfelder aus." 
          : "Please fill in all required fields.",
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

  const inputClassName = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-muted-strong focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/50";

  return (
    <form onSubmit={handleSubmit} className="tech-card space-y-5 rounded-3xl p-8">
      <h2 className="text-xl font-bold text-foreground">
        {lang === "de" ? "Nachricht senden" : "Send Message"}
      </h2>
      
      {/* Status Messages */}
      {status.type === "success" && (
        <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-4">
          <div className="flex items-center gap-2 text-green-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium">{status.message}</span>
          </div>
        </div>
      )}
      
      {status.type === "error" && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4">
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
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted">
            {lang === "de" ? "Name" : "Name"} *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder={lang === "de" ? "Dein Name" : "Your name"}
            className={inputClassName}
            disabled={status.type === "loading"}
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted">
            {lang === "de" ? "E-Mail" : "Email"} *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="you@email.com"
            className={inputClassName}
            disabled={status.type === "loading"}
            required
          />
        </div>
      </div>
      
      <div>
        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted">
          {lang === "de" ? "Gerät" : "Device"}
        </label>
        <input
          type="text"
          value={formData.device}
          onChange={(e) => handleChange("device", e.target.value)}
          placeholder={lang === "de" ? "z.B. iPhone 15 Pro" : "e.g. iPhone 15 Pro"}
          className={inputClassName}
          disabled={status.type === "loading"}
        />
      </div>
      
      <div>
        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted">
          {lang === "de" ? "Nachricht" : "Message"} *
        </label>
        <textarea
          rows={4}
          value={formData.message}
          onChange={(e) => handleChange("message", e.target.value)}
          placeholder={lang === "de" ? "Beschreibe dein Anliegen..." : "Describe your request..."}
          className={inputClassName}
          disabled={status.type === "loading"}
          required
        />
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
