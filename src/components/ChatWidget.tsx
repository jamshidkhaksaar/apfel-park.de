"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { useReCaptcha } from "@/components/ReCaptcha";
import { shouldHideChatWidget, shouldHideChatWidgetOnMobile } from "@/lib/chat-ui";

type ChatLocale = "de" | "en";
type ChatStatus = "open" | "waiting" | "resolved";
type ChatSenderRole = "customer" | "admin" | "system";

type ChatConversation = {
  id: string;
  status: ChatStatus;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  customerLocale: ChatLocale;
  lastMessageAt: string;
  customerUnreadCount: number;
  customerTyping: boolean;
  adminTyping: boolean;
};

type ChatMessage = {
  id: string;
  conversationId: string;
  createdAt: string;
  senderRole: ChatSenderRole;
  message: string;
};

type SessionResponse = {
  conversation: ChatConversation | null;
  messages: ChatMessage[];
};

type ChatWidgetProps = {
  lang: ChatLocale;
  whatsapp: {
    widgetEnabled: boolean;
    number: string;
    defaultMessageDe: string;
    defaultMessageEn: string;
  };
};

const STORAGE_KEY = "apfel-chat-token";

const copy = {
  de: {
    launcher: "Nachricht senden",
    contactUs: "Kontakt",
    contactSubtitle: "",
    chatOption: "Im Website-Chat schreiben",
    websiteLabel: "Website",
    back: "Zurück",
    whatsappOption: "Mit WhatsApp chatten",
    whatsappHint: "Schnell auf dem Handy oder in WhatsApp Web.",
    websiteHint: "Direkt hier auf der Website mit Verlauf.",
    title: "Apfel Park Chat",
    subtitle: "Schreibe direkt mit unserem Team.",
    closed: "Minimieren",
    intro: "Starte einen sicheren Chat mit unserem Support.",
    name: "Name",
    email: "E-Mail",
    phone: "Telefon",
    message: "Nachricht",
    start: "Chat starten",
    sending: "Wird gesendet...",
    send: "Senden",
    placeholder: "Wie können wir helfen?",
    waiting: "Antwort während der Öffnungszeiten.",
    resolved: "Diese Unterhaltung wurde als erledigt markiert. Du kannst trotzdem erneut schreiben.",
    recaptcha:
      "Dieser Chat ist durch reCAPTCHA geschützt. Es gelten die Google Datenschutzrichtlinien und Nutzungsbedingungen.",
    welcome: "Wir sind online und antworten so schnell wie möglich.",
    typing: "Apfel Park schreibt",
  },
  en: {
    launcher: "Message us",
    contactUs: "Contact",
    contactSubtitle: "",
    chatOption: "Use website chat",
    websiteLabel: "Website",
    back: "Back",
    whatsappOption: "Chat on WhatsApp",
    whatsappHint: "Fast on mobile or in WhatsApp Web.",
    websiteHint: "Stay here on the website with message history.",
    title: "Apfel Park Chat",
    subtitle: "Message our team directly.",
    closed: "Minimize",
    intro: "Start a secure chat with our support team.",
    name: "Name",
    email: "Email",
    phone: "Phone",
    message: "Message",
    start: "Start chat",
    sending: "Sending...",
    send: "Send",
    placeholder: "How can we help?",
    waiting: "Replies during opening hours.",
    resolved: "This conversation has been marked as resolved. You can still send a new message.",
    recaptcha:
      "This chat is protected by reCAPTCHA. Google Privacy Policy and Terms of Service apply.",
    welcome: "We are online and will reply as quickly as possible.",
    typing: "Apfel Park is typing",
  },
} as const;

const fieldErrorCopy = {
  de: {
    name: "Bitte gib deinen Namen ein.",
    email: "Bitte gib eine gültige E-Mail-Adresse ein.",
    message: "Bitte schreibe kurz, wie wir helfen können.",
  },
  en: {
    name: "Please enter your name.",
    email: "Please enter a valid email address.",
    message: "Please tell us briefly how we can help.",
  },
} as const;

const playTone = () => {
  try {
    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    const context = new AudioContextCtor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.22);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.24);
  } catch {
    // ignore audio failures
  }
};

export default function ChatWidget({ lang, whatsapp }: ChatWidgetProps) {
  const pathname = usePathname();
  const text = copy[lang];
  const [open, setOpen] = useState(false);
  const [panelEntered, setPanelEntered] = useState(false);
  const [mode, setMode] = useState<"chooser" | "local">("chooser");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Partial<Record<"customerName" | "customerEmail" | "message", string>>>({});
  const [token, setToken] = useState("");
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageDraft, setMessageDraft] = useState("");
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    message: "",
  });
  const lastAdminMessageIdRef = useRef<string | null>(null);
  const launcherRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const typingSentRef = useRef(false);

  const {
    token: recaptchaToken,
    error: recaptchaError,
    isLoading: recaptchaLoading,
    ReCaptchaComponent,
  } = useReCaptcha("chat_request");

  const hidden = shouldHideChatWidget(pathname);
  const hiddenOnMobile = shouldHideChatWidgetOnMobile(pathname);

  const normalizeNumber = (value: string) => value.replace(/[^\d]/g, "");
  const whatsappMessage = lang === "de" ? whatsapp.defaultMessageDe : whatsapp.defaultMessageEn;
  const whatsappUrl =
    whatsapp.widgetEnabled && whatsapp.number
      ? `https://wa.me/${normalizeNumber(whatsapp.number)}?text=${encodeURIComponent(whatsappMessage)}`
      : null;

  const syncSession = useCallback(async (nextToken = token, silent = false) => {
    if (!nextToken) return;
    if (!silent) setLoading(true);

    try {
      const response = await fetch(`/api/chat/session?token=${encodeURIComponent(nextToken)}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as SessionResponse;
      setConversation(payload.conversation);
      setMessages(payload.messages || []);

      const latestAdminMessage = [...(payload.messages || [])].reverse().find((item) => item.senderRole === "admin");
      if (latestAdminMessage && lastAdminMessageIdRef.current && latestAdminMessage.id !== lastAdminMessageIdRef.current) {
        playTone();
      }
      lastAdminMessageIdRef.current = latestAdminMessage?.id ?? lastAdminMessageIdRef.current;
    } catch (syncError) {
      console.error("[ChatWidget] Failed to sync:", syncError);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setToken(stored);
      }
    } catch {
      // ignore storage failures
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    void syncSession(token);
  }, [token, syncSession]);

  useEffect(() => {
    if (!open || !token) return;
    const interval = window.setInterval(() => {
      void syncSession(token, true);
    }, 2000);
    return () => window.clearInterval(interval);
  }, [open, token, syncSession]);

  const updateTyping = useCallback(async (isTyping: boolean) => {
    if (!token) return;
    try {
      await fetch("/api/chat/session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, isTyping }),
      });
    } catch {
      // Typing presence is best-effort and must never interrupt messaging.
    }
  }, [token]);

  const handleDraftChange = (value: string) => {
    setMessageDraft(value);
    if (!typingSentRef.current) {
      typingSentRef.current = true;
      void updateTyping(true);
    }
    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => {
      typingSentRef.current = false;
      void updateTyping(false);
    }, 2200);
  };

  useEffect(() => () => {
    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    if (typingSentRef.current) void updateTyping(false);
  }, [updateTyping]);

  useEffect(() => {
    if (open && token) {
      void fetch("/api/chat/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
    }
  }, [open, token, messages.length]);

  useEffect(() => {
    if (!open) {
      setPanelEntered(false);
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setPanelEntered(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      window.requestAnimationFrame(() => launcherRef.current?.focus());
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open || mode !== "local" || conversation) return;
    window.requestAnimationFrame(() => nameInputRef.current?.focus());
  }, [conversation, mode, open]);

  if (hidden) {
    return null;
  }

  const handleStartChat = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const nextErrors: Partial<Record<"customerName" | "customerEmail" | "message", string>> = {};
    const fieldText = fieldErrorCopy[lang];
    if (!form.customerName.trim()) nextErrors.customerName = fieldText.name;
    if (form.customerEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail.trim())) {
      nextErrors.customerEmail = fieldText.email;
    }
    if (!form.message.trim()) nextErrors.message = fieldText.message;
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setLoading(true);

    try {
      const response = await fetch("/api/chat/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          locale: lang,
          sourcePage: pathname,
          recaptchaToken,
        }),
      });

      const payload = (await response.json()) as SessionResponse & { success?: boolean; error?: string; token?: string };
      if (!response.ok || !payload.success || !payload.token) {
        setError(payload.error || "Chat unavailable");
        return;
      }

      setToken(payload.token);
      try {
        window.localStorage.setItem(STORAGE_KEY, payload.token);
      } catch {
        // ignore storage issues
      }
      setConversation(payload.conversation);
      setMessages(payload.messages || []);
      setForm({ customerName: "", customerEmail: "", customerPhone: "", message: "" });
      setFormErrors({});
      lastAdminMessageIdRef.current = null;
      setMode("local");
    } catch (submitError) {
      console.error("[ChatWidget] Start failed:", submitError);
      setError("Chat unavailable");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !messageDraft.trim()) return;

    setLoading(true);
    setError(null);
    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    typingSentRef.current = false;
    void updateTyping(false);

    try {
      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, message: messageDraft }),
      });
      const payload = (await response.json()) as SessionResponse & { success?: boolean; error?: string };
      if (!response.ok || !payload.success) {
        setError(payload.error || "Message failed");
        return;
      }

      setConversation(payload.conversation);
      setMessages(payload.messages || []);
      setMessageDraft("");
    } catch (submitError) {
      console.error("[ChatWidget] Message failed:", submitError);
      setError("Message failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      data-apfel-chat
      className={`fixed left-4 z-[130] md:left-6 ${hiddenOnMobile ? "hidden md:block" : ""}`}
      style={{ bottom: "calc(1rem + var(--apfel-cookie-banner-height, 0px))" }}
    >
      {open ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-labelledby="apfel-chat-title"
          tabIndex={-1}
          className={`max-h-[calc(100dvh-2rem-var(--apfel-cookie-banner-height,0px))] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-[24px] border border-white/10 bg-[#101010]/95 shadow-[0_20px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl transition-all duration-300 ease-out motion-reduce:transition-none md:w-[360px] ${
            panelEntered ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-95 opacity-0"
          }`}
        >
          <div className="flex items-start justify-between gap-4 border-b border-white/10 bg-gradient-to-r from-gold/90 via-amber/80 to-bronze/80 px-5 py-4 text-black">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em]">{conversation || mode === "local" ? text.launcher : text.contactUs}</p>
              <h3 id="apfel-chat-title" className="mt-1 text-lg font-semibold">{conversation || mode === "local" ? text.title : text.contactUs}</h3>
              {conversation ? <p className="mt-1 text-xs text-black/70">{text.waiting}</p> : null}
              {!conversation && mode === "local" ? <p className="mt-1 text-xs text-black/70">{text.subtitle}</p> : null}
              {!conversation && mode === "chooser" && text.contactSubtitle ? (
                <p className="mt-1 text-xs text-black/70">{text.contactSubtitle}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              {mode === "local" && !conversation ? (
                <button
                  type="button"
                  onClick={() => setMode("chooser")}
                  className="rounded-full border border-black/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-black/70"
                >
                  {text.back}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-black/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-black/70"
                aria-label={lang === "de" ? "Chat minimieren" : "Minimize chat"}
              >
                {text.closed}
              </button>
            </div>
          </div>

          {!conversation && mode === "chooser" ? (
            <div className="space-y-4 p-5 text-white">
              <button
                type="button"
                onClick={() => {
                  if (whatsappUrl) {
                    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
                  }
                }}
                disabled={!whatsappUrl}
                className="flex w-full items-center justify-between gap-4 rounded-3xl border border-green-500/30 bg-green-500/10 px-4 py-4 text-left transition hover:border-green-400 hover:bg-green-500/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-green-500 text-white shadow-lg">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
                    </svg>
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-white">{text.whatsappOption}</span>
                    <span className="mt-0.5 block text-xs text-white/65">{text.whatsappHint}</span>
                  </span>
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-green-300">WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setMode("local")}
                className="flex w-full items-center justify-between gap-4 rounded-3xl border border-gold/30 bg-white/5 px-4 py-4 text-left transition hover:border-gold hover:bg-white/8"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold text-black shadow-lg">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75h6.75m-6.75 3h4.5m7.125-1.125c0 4.142-3.693 7.5-8.25 7.5a8.841 8.841 0 01-3.348-.646L3.75 20.25l1.113-3.338A7.16 7.16 0 013.75 13.5C3.75 9.358 7.443 6 12 6s8.25 3.358 8.25 7.5z" />
                    </svg>
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-white">{text.chatOption}</span>
                    <span className="mt-0.5 block text-xs text-white/65">{text.websiteHint}</span>
                  </span>
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">{text.websiteLabel}</span>
              </button>
            </div>
          ) : !conversation ? (
            <form onSubmit={handleStartChat} noValidate className="space-y-4 p-5 text-white">
              <p className="text-sm text-white/70">{text.intro}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1.5 text-xs font-medium text-white/75">
                  <span>{text.name} <span className="text-gold">*</span></span>
                  <input
                    ref={nameInputRef}
                    type="text"
                    autoComplete="name"
                    value={form.customerName}
                    aria-invalid={Boolean(formErrors.customerName)}
                    aria-describedby={formErrors.customerName ? "chat-name-error" : undefined}
                    onChange={(event) => { setForm((current) => ({ ...current, customerName: event.target.value })); setFormErrors((current) => ({ ...current, customerName: undefined })); }}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-3 text-sm text-white focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                  />
                  {formErrors.customerName ? <span id="chat-name-error" className="block text-red-300">{formErrors.customerName}</span> : null}
                </label>
                <label className="space-y-1.5 text-xs font-medium text-white/75">
                  <span>{text.email} <span className="font-normal text-white/40">({lang === "de" ? "optional" : "optional"})</span></span>
                  <input
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={form.customerEmail}
                    aria-invalid={Boolean(formErrors.customerEmail)}
                    aria-describedby={formErrors.customerEmail ? "chat-email-error" : undefined}
                    onChange={(event) => { setForm((current) => ({ ...current, customerEmail: event.target.value })); setFormErrors((current) => ({ ...current, customerEmail: undefined })); }}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-3 text-sm text-white focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                  />
                  {formErrors.customerEmail ? <span id="chat-email-error" className="block text-red-300">{formErrors.customerEmail}</span> : null}
                </label>
              </div>
              <label className="space-y-1.5 text-xs font-medium text-white/75">
                <span>{text.phone} <span className="font-normal text-white/40">({lang === "de" ? "optional" : "optional"})</span></span>
                <input
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  value={form.customerPhone}
                  onChange={(event) => setForm((current) => ({ ...current, customerPhone: event.target.value }))}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-3 text-sm text-white focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </label>
              <label className="space-y-1.5 text-xs font-medium text-white/75">
                <span>{text.message} <span className="text-gold">*</span></span>
                <textarea
                  rows={4}
                  value={form.message}
                  aria-invalid={Boolean(formErrors.message)}
                  aria-describedby={formErrors.message ? "chat-message-error" : undefined}
                  onChange={(event) => { setForm((current) => ({ ...current, message: event.target.value })); setFormErrors((current) => ({ ...current, message: undefined })); }}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-3 text-sm text-white focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
                {formErrors.message ? <span id="chat-message-error" className="block text-red-300">{formErrors.message}</span> : null}
              </label>
              <div role="status" aria-live="polite" aria-atomic="true">
                {error ? <p className="text-xs text-red-300">{error}</p> : null}
                {recaptchaError ? <p className="text-xs text-red-300">{recaptchaError}</p> : null}
              </div>
              <p className="text-[11px] text-white/45">{text.recaptcha}</p>
              <ReCaptchaComponent />
              <button
                type="submit"
                disabled={loading || recaptchaLoading}
                className="w-full rounded-full bg-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.24em] text-black transition hover:bg-gold-deep disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? text.sending : text.start}
              </button>
            </form>
          ) : (
            <>
              <div className="max-h-[min(380px,50dvh)] space-y-3 overflow-y-auto p-5" aria-live="polite" aria-relevant="additions text">
                <p className="text-xs text-white/45">{text.welcome}</p>
                {conversation.status === "resolved" ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/70">
                    {text.resolved}
                  </div>
                ) : null}
                {messages.map((message) => {
                  const own = message.senderRole === "customer";
                  return (
                    <div key={message.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm ${
                          own
                            ? "bg-gold text-black"
                            : "border border-white/10 bg-white/5 text-white"
                        }`}
                      >
                        <p>{message.message}</p>
                        <p className={`mt-2 text-[10px] ${own ? "text-black/60" : "text-white/35"}`}>
                          {new Date(message.createdAt).toLocaleTimeString(lang === "de" ? "de-DE" : "en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {conversation.adminTyping ? (
                  <div className="flex justify-start" role="status" aria-live="polite">
                    <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-white">
                      <div className="flex items-center gap-2 text-xs text-white/60">
                        <span>{text.typing}</span>
                        <span className="flex gap-1" aria-hidden="true">
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold motion-reduce:animate-none [animation-delay:-0.3s]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold motion-reduce:animate-none [animation-delay:-0.15s]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold motion-reduce:animate-none" />
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <form onSubmit={handleSendMessage} className="border-t border-white/10 p-4">
                <div className="flex gap-3">
                  <textarea
                    rows={2}
                    value={messageDraft}
                    onChange={(event) => handleDraftChange(event.target.value)}
                    placeholder={text.placeholder}
                    className="min-h-[58px] flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-gold focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={loading || !messageDraft.trim()}
                    className="rounded-2xl bg-gold px-4 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-black transition hover:bg-gold-deep disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? text.sending : text.send}
                  </button>
                </div>
                {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
              </form>
            </>
          )}
        </div>
      ) : (
        <button
          ref={launcherRef}
          type="button"
          onClick={() => {
            setMode(conversation ? "local" : "chooser");
            setOpen(true);
          }}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={lang === "de" ? "Nachricht an Apfel Park senden" : "Message Apfel Park"}
          className="group relative flex items-center gap-2 rounded-full border border-gold/30 bg-[#101010]/95 px-2.5 py-2 text-white shadow-[0_12px_32px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-gold motion-reduce:transform-none motion-reduce:transition-none md:gap-2.5 md:px-3 md:py-2"
        >
          <span className="absolute inset-0 rounded-full bg-gold/10 opacity-60 blur-xl transition-opacity duration-300 group-hover:opacity-100" />
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gold text-black shadow-lg md:h-10 md:w-10">
            <svg className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75h6.75m-6.75 3h4.5m7.125-1.125c0 4.142-3.693 7.5-8.25 7.5a8.841 8.841 0 01-3.348-.646L3.75 20.25l1.113-3.338A7.16 7.16 0 013.75 13.5C3.75 9.358 7.443 6 12 6s8.25 3.358 8.25 7.5z" />
            </svg>
          </span>
          <span className="relative hidden text-left sm:block">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">{text.launcher}</span>
            <span className="mt-0.5 block text-xs text-white/75">
              {lang === "de" ? "Antwort während der Öffnungszeiten" : "Replies during opening hours"}
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
