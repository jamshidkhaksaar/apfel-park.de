"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { useReCaptcha } from "@/components/ReCaptcha";

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
    launcher: "Live-Chat",
    contactUs: "Kontakt",
    contactSubtitle: "",
    chatOption: "Im Website-Chat schreiben",
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
    waiting: "Unser Team antwortet in Kürze.",
    resolved: "Diese Unterhaltung wurde als erledigt markiert. Du kannst trotzdem erneut schreiben.",
    recaptcha:
      "Dieser Chat ist durch reCAPTCHA geschützt. Es gelten die Google Datenschutzrichtlinien und Nutzungsbedingungen.",
    welcome: "Wir sind online und antworten so schnell wie möglich.",
  },
  en: {
    launcher: "Live chat",
    contactUs: "Contact",
    contactSubtitle: "",
    chatOption: "Use website chat",
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
    waiting: "Our team will reply shortly.",
    resolved: "This conversation has been marked as resolved. You can still send a new message.",
    recaptcha:
      "This chat is protected by reCAPTCHA. Google Privacy Policy and Terms of Service apply.",
    welcome: "We are online and will reply as quickly as possible.",
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

  const {
    token: recaptchaToken,
    error: recaptchaError,
    isLoading: recaptchaLoading,
    ReCaptchaComponent,
  } = useReCaptcha("chat_request");

  const hidden =
    pathname === "/login" ||
    pathname?.startsWith("/admin") ||
    pathname === "/maintenance";

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
    }, 5000);
    return () => window.clearInterval(interval);
  }, [open, token, syncSession]);

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

  if (hidden) {
    return null;
  }

  const handleStartChat = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
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
      className="fixed left-4 z-[130] md:left-6"
      style={{ bottom: `calc(1rem + var(--apfel-cookie-banner-height, 0px) + ${whatsapp.widgetEnabled ? "4.75rem" : "0px"})` }}
    >
      {open ? (
        <div
          className={`w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-[28px] border border-white/10 bg-[#101010]/95 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-300 ease-out md:w-[360px] ${
            panelEntered ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-95 opacity-0"
          }`}
        >
          <div className="flex items-start justify-between gap-4 border-b border-white/10 bg-gradient-to-r from-gold/90 via-amber/80 to-bronze/80 px-5 py-4 text-black">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em]">{conversation || mode === "local" ? text.launcher : text.contactUs}</p>
              <h3 className="mt-1 text-lg font-semibold">{conversation || mode === "local" ? text.title : text.contactUs}</h3>
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
                  Back
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-black/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-black/70"
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
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Live</span>
              </button>
            </div>
          ) : !conversation ? (
            <form onSubmit={handleStartChat} className="space-y-4 p-5 text-white">
              <p className="text-sm text-white/70">{text.intro}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  value={form.customerName}
                  onChange={(event) => setForm((current) => ({ ...current, customerName: event.target.value }))}
                  placeholder={text.name}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-gold focus:outline-none"
                />
                <input
                  type="email"
                  value={form.customerEmail}
                  onChange={(event) => setForm((current) => ({ ...current, customerEmail: event.target.value }))}
                  placeholder={text.email}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-gold focus:outline-none"
                />
              </div>
              <input
                type="text"
                value={form.customerPhone}
                onChange={(event) => setForm((current) => ({ ...current, customerPhone: event.target.value }))}
                placeholder={text.phone}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-gold focus:outline-none"
              />
              <textarea
                rows={4}
                value={form.message}
                onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                placeholder={text.placeholder}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-gold focus:outline-none"
              />
              {error ? <p className="text-xs text-red-300">{error}</p> : null}
              {recaptchaError ? <p className="text-xs text-red-300">{recaptchaError}</p> : null}
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
              <div className="max-h-[380px] space-y-3 overflow-y-auto p-5">
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
              </div>

              <form onSubmit={handleSendMessage} className="border-t border-white/10 p-4">
                <div className="flex gap-3">
                  <textarea
                    rows={2}
                    value={messageDraft}
                    onChange={(event) => setMessageDraft(event.target.value)}
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
          type="button"
          onClick={() => {
            setMode(conversation ? "local" : "chooser");
            setOpen(true);
          }}
          className="group relative flex items-center gap-2 rounded-full border border-gold/30 bg-[#101010]/95 px-3 py-2 text-white shadow-[0_14px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-gold hover:shadow-[0_18px_50px_rgba(212,158,66,0.18)] md:gap-3 md:px-4 md:py-2.5"
        >
          <span className="absolute inset-0 rounded-full bg-gold/10 opacity-60 blur-xl transition-opacity duration-300 group-hover:opacity-100" />
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full border border-[#101010] bg-emerald-400" />
          </span>
          <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gold text-black shadow-lg md:h-11 md:w-11">
            <svg className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75h6.75m-6.75 3h4.5m7.125-1.125c0 4.142-3.693 7.5-8.25 7.5a8.841 8.841 0 01-3.348-.646L3.75 20.25l1.113-3.338A7.16 7.16 0 013.75 13.5C3.75 9.358 7.443 6 12 6s8.25 3.358 8.25 7.5z" />
            </svg>
          </span>
          <span className="relative hidden text-left sm:block">
            <span className="block text-[11px] font-bold uppercase tracking-[0.24em] text-gold">{text.launcher}</span>
            <span className="mt-0.5 block text-xs text-white/75">
              {lang === "de" ? "Jetzt live erreichbar" : "Live and ready to help"}
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
