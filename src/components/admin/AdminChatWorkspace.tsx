"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

type ChatLocale = "de" | "en";
type ChatStatus = "open" | "waiting" | "resolved";
type ChatSenderRole = "customer" | "admin" | "system";

type ChatConversation = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: ChatStatus;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  customerLocale: ChatLocale;
  sourcePage: string | null;
  lastMessagePreview: string | null;
  lastMessageAt: string;
  adminUnreadCount: number;
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

type Props = {
  locale: ChatLocale;
  initialConversations: ChatConversation[];
};

const copy = {
  de: {
    eyebrow: "Kundenchat",
    title: "Live-Unterhaltungen",
    intro: "Öffne Gespräche, beantworte Fragen und halte Kunden direkt im Browser auf dem Laufenden.",
    search: "Nach Name, E-Mail oder Nachricht suchen",
    empty: "Noch keine Konversationen.",
    emptyDetail: "Wähle links eine Unterhaltung aus.",
    filters: {
      all: "Alle",
      open: "Offen",
      waiting: "Wartet",
      resolved: "Erledigt",
    },
    status: {
      open: "Offen",
      waiting: "Wartet",
      resolved: "Erledigt",
    },
    reply: "Antwort",
    send: "Antwort senden",
    sending: "Sende...",
    source: "Quelle",
    created: "Gestartet",
    locale: "Sprache",
    customer: "Kunde",
    email: "E-Mail",
    phone: "Telefon",
    messagePlaceholder: "Antworte professionell und klar...",
    typing: "Kunde schreibt",
    queue: "Unterhaltungen",
    unread: "ungelesen",
    error: "Chat-Daten konnten nicht aktualisiert werden.",
    shortcut: "Strg + Enter zum Senden",
  },
  en: {
    eyebrow: "Customer chat",
    title: "Live conversations",
    intro: "Open conversations, answer questions, and keep customers updated directly in the browser.",
    search: "Search by name, email, or message",
    empty: "No conversations yet.",
    emptyDetail: "Select a conversation from the left.",
    filters: {
      all: "All",
      open: "Open",
      waiting: "Waiting",
      resolved: "Resolved",
    },
    status: {
      open: "Open",
      waiting: "Waiting",
      resolved: "Resolved",
    },
    reply: "Reply",
    send: "Send reply",
    sending: "Sending...",
    source: "Source",
    created: "Started",
    locale: "Language",
    customer: "Customer",
    email: "Email",
    phone: "Phone",
    messagePlaceholder: "Reply clearly and professionally...",
    typing: "Customer is typing",
    queue: "Conversations",
    unread: "unread",
    error: "Chat data could not be refreshed.",
    shortcut: "Ctrl + Enter to send",
  },
} as const;

const playTone = () => {
  try {
    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    const context = new AudioContextCtor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 740;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.07, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.3);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.32);
  } catch {
    // ignore audio failures
  }
};

export default function AdminChatWorkspace({ locale, initialConversations }: Props) {
  const text = copy[locale];
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedId, setSelectedId] = useState(initialConversations[0]?.id ?? "");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | ChatStatus>("all");
  const [reply, setReply] = useState("");
  const [error, setError] = useState<string | null>(null);
  const latestCustomerMessageIdRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const replyFormRef = useRef<HTMLFormElement | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const typingSentRef = useRef(false);

  const selectedConversation = conversations.find((item) => item.id === selectedId) ?? null;

  const filtered = useMemo(() => {
    return conversations.filter((conversation) => {
      if (filter !== "all" && conversation.status !== filter) return false;
      const haystack = [
        conversation.customerName,
        conversation.customerEmail ?? "",
        conversation.customerPhone ?? "",
        conversation.lastMessagePreview ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(search.toLowerCase());
    });
  }, [conversations, filter, search]);

  const counts = useMemo(() => ({
    all: conversations.length,
    open: conversations.filter((item) => item.status === "open").length,
    waiting: conversations.filter((item) => item.status === "waiting").length,
    resolved: conversations.filter((item) => item.status === "resolved").length,
    unread: conversations.reduce((sum, item) => sum + item.adminUnreadCount, 0),
  }), [conversations]);

  const loadConversations = useCallback(async (silent = false) => {
    if (!silent) setLoadingThread(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/chat", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load conversations");
      const payload = (await response.json()) as { conversations?: ChatConversation[] };
      if (Array.isArray(payload.conversations)) {
        const currentLatest = payload.conversations
          .slice()
          .sort((a, b) => (a.lastMessageAt < b.lastMessageAt ? 1 : -1))[0];

        if (
          currentLatest &&
          currentLatest.adminUnreadCount > 0 &&
          conversations.length > 0 &&
          payload.conversations[0]?.lastMessageAt !== conversations[0]?.lastMessageAt
        ) {
          playTone();
        }

        setConversations(payload.conversations);
        if (!selectedId && payload.conversations[0]?.id) {
          setSelectedId(payload.conversations[0].id);
        }
      }
    } catch {
      setError(text.error);
    } finally {
      if (!silent) setLoadingThread(false);
    }
  }, [conversations, selectedId, text.error]);

  const loadThread = useCallback(async (id: string, silent = false) => {
    if (!id) return;
    if (!silent) setLoadingThread(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/chat?id=${encodeURIComponent(id)}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load thread");
      const payload = (await response.json()) as { conversation?: ChatConversation; messages?: ChatMessage[] };
      if (payload.conversation) {
        setConversations((current) =>
          current.map((item) => (item.id === payload.conversation?.id ? payload.conversation : item)),
        );
      }
      if (Array.isArray(payload.messages)) {
        const latestCustomerMessage = [...payload.messages].reverse().find((item) => item.senderRole === "customer");
        if (latestCustomerMessage && latestCustomerMessage.id !== latestCustomerMessageIdRef.current && silent) {
          playTone();
        }
        latestCustomerMessageIdRef.current = latestCustomerMessage?.id ?? latestCustomerMessageIdRef.current;
        setMessages(payload.messages);
      }
    } catch {
      setError(text.error);
    } finally {
      if (!silent) setLoadingThread(false);
    }
  }, [text.error]);

  useEffect(() => {
    if (selectedId) {
      void loadThread(selectedId);
    }
  }, [selectedId, loadThread]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadConversations(true);
      if (selectedId) {
        void loadThread(selectedId, true);
      }
    }, 2000);
    return () => window.clearInterval(interval);
  }, [selectedId, loadConversations, loadThread]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, selectedConversation?.customerTyping]);

  const updateAdminTyping = useCallback(async (isTyping: boolean) => {
    if (!selectedId) return;
    try {
      await fetch("/api/admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "typing", conversationId: selectedId, isTyping }),
      });
    } catch {
      // Presence is best-effort and should never block a reply.
    }
  }, [selectedId]);

  const handleReplyChange = (value: string) => {
    setReply(value);
    if (!typingSentRef.current) {
      typingSentRef.current = true;
      void updateAdminTyping(true);
    }
    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => {
      typingSentRef.current = false;
      void updateAdminTyping(false);
    }, 2200);
  };

  useEffect(() => () => {
    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    if (typingSentRef.current) void updateAdminTyping(false);
  }, [updateAdminTyping]);

  const handleReply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedId || !reply.trim()) return;
    setSending(true);
    setError(null);
    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    typingSentRef.current = false;
    void updateAdminTyping(false);
    try {
      const response = await fetch("/api/admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reply",
          conversationId: selectedId,
          message: reply,
        }),
      });
      if (!response.ok) throw new Error("Reply failed");
      const payload = (await response.json()) as { conversation?: ChatConversation; messages?: ChatMessage[] };
      if (payload.conversation) {
        setConversations((current) =>
          current.map((item) => (item.id === payload.conversation?.id ? payload.conversation : item)),
        );
      }
      if (Array.isArray(payload.messages)) {
        setMessages(payload.messages);
      }
      setReply("");
      void loadConversations(true);
    } catch {
      setError(text.error);
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (status: ChatStatus) => {
    if (!selectedId) return;
    setError(null);
    const response = await fetch("/api/admin/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "status",
        conversationId: selectedId,
        status,
      }),
    });
    if (!response.ok) {
      setError(text.error);
      return;
    }
    const payload = (await response.json()) as { conversation?: ChatConversation };
    if (payload.conversation) {
      setConversations((current) =>
        current.map((item) => (item.id === payload.conversation?.id ? payload.conversation : item)),
      );
    }
  };

  return (
    <div className="grid gap-5 xl:h-[calc(100dvh-9rem)] xl:grid-cols-[340px_minmax(0,1fr)]">
      <section className="glass-panel flex min-h-[34rem] flex-col rounded-2xl p-4 xl:min-h-0">
        <div className="mb-4 px-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">{text.eyebrow}</p>
          <h2 className="mt-2 text-2xl font-bold text-foreground">{text.title}</h2>
          <p className="mt-2 text-sm text-muted">{text.intro}</p>
          <div className="mt-4 flex items-center gap-3 text-xs text-muted">
            <span><strong className="text-foreground">{counts.all}</strong> {text.queue.toLowerCase()}</span>
            <span aria-hidden="true">•</span>
            <span><strong className="text-gold">{counts.unread}</strong> {text.unread}</span>
          </div>
        </div>
        <div className="px-2">
          <label htmlFor="admin-chat-search" className="sr-only">{text.search}</label>
          <input
            id="admin-chat-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={text.search}
            className="w-full rounded-xl border border-border bg-black/20 px-4 py-3 text-sm text-foreground focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {(["all", "open", "waiting", "resolved"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                aria-pressed={filter === item}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  filter === item ? "bg-gold text-black" : "bg-black/20 text-muted"
                }`}
              >
                {text.filters[item]} <span className="ml-1 opacity-60">{counts[item]}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted">{text.empty}</div>
          ) : (
            <div className="space-y-2">
              {filtered.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setSelectedId(conversation.id)}
                  aria-pressed={selectedId === conversation.id}
                  className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                    selectedId === conversation.id
                      ? "border-gold/40 bg-gold/10"
                      : "border-border bg-black/10 hover:border-gold/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{conversation.customerName}</p>
                      <p className="mt-1 text-xs text-muted">{conversation.customerEmail}</p>
                    </div>
                    {conversation.adminUnreadCount > 0 ? (
                      <span className="rounded-full bg-gold px-2 py-1 text-[10px] font-bold text-black">
                        {conversation.adminUnreadCount}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-muted">{conversation.lastMessagePreview || "..."}</p>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-muted/70">
                    <span>{text.status[conversation.status]}</span>
                    <span>
                      {new Date(conversation.lastMessageAt).toLocaleString(locale === "de" ? "de-DE" : "en-US", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="glass-panel flex min-h-[42rem] flex-col rounded-2xl p-4 sm:p-6 xl:min-h-0">
        {!selectedConversation ? (
          <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-border text-sm text-muted">
            {text.emptyDetail}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted">{text.customer}</p>
                <h3 className="mt-2 text-2xl font-bold text-foreground">{selectedConversation.customerName}</h3>
                <div className="mt-3 grid gap-2 text-sm text-muted md:grid-cols-2">
                  <p><span className="text-foreground">{text.email}:</span> {selectedConversation.customerEmail || "—"}</p>
                  <p><span className="text-foreground">{text.phone}:</span> {selectedConversation.customerPhone || "—"}</p>
                  <p><span className="text-foreground">{text.locale}:</span> {selectedConversation.customerLocale.toUpperCase()}</p>
                  <p><span className="text-foreground">{text.source}:</span> {selectedConversation.sourcePage || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={selectedConversation.status}
                  onChange={(event) => void handleStatusChange(event.target.value as ChatStatus)}
                  className="rounded-full border border-border bg-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground focus:border-gold focus:outline-none"
                >
                  <option value="open">{text.status.open}</option>
                  <option value="waiting">{text.status.waiting}</option>
                  <option value="resolved">{text.status.resolved}</option>
                </select>
              </div>
            </div>

            <div className="mt-5 flex-1 space-y-3 overflow-y-auto pr-1" role="log" aria-live="polite" aria-relevant="additions text">
              {loadingThread && messages.length === 0 ? (
                <div className="text-sm text-muted">Loading…</div>
              ) : (
                messages.map((message) => {
                  const own = message.senderRole === "admin";
                  return (
                    <div key={message.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[78%] rounded-3xl px-4 py-3 ${
                          own ? "bg-gold text-black" : "border border-border bg-surface-strong text-foreground"
                        }`}
                      >
                        <p className="whitespace-pre-wrap text-sm">{message.message}</p>
                        <p className={`mt-2 text-[10px] ${own ? "text-black/60" : "text-muted/60"}`}>
                          {new Date(message.createdAt).toLocaleString(locale === "de" ? "de-DE" : "en-US", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              {selectedConversation.customerTyping ? (
                <div className="flex justify-start" role="status">
                  <div className="rounded-2xl border border-gold/20 bg-gold/5 px-4 py-3">
                    <div className="flex items-center gap-2 text-xs text-muted">
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
              <div ref={messagesEndRef} />
            </div>

            <form ref={replyFormRef} onSubmit={handleReply} className="mt-5 border-t border-border bg-surface/40 pt-4">
              <label htmlFor="admin-chat-reply" className="mb-2 block text-sm font-semibold text-foreground">
                {text.reply}
              </label>
              <div className="flex gap-3">
                <textarea
                  id="admin-chat-reply"
                  rows={3}
                  value={reply}
                  onChange={(event) => handleReplyChange(event.target.value)}
                  onKeyDown={(event) => {
                    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
                      event.preventDefault();
                      replyFormRef.current?.requestSubmit();
                    }
                  }}
                  placeholder={text.messagePlaceholder}
                  className="min-h-[88px] flex-1 rounded-2xl border border-border bg-black/20 px-4 py-3 text-sm text-foreground focus:border-gold focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={sending || !reply.trim()}
                  className="rounded-2xl bg-gold px-5 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-black transition hover:bg-gold-deep disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sending ? text.sending : text.send}
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted">
                <span>{text.shortcut}</span>
                <span>{reply.length}/2000</span>
              </div>
              {error ? <p className="mt-2 text-sm text-red-400" role="alert">{error}</p> : null}
            </form>
          </>
        )}
      </section>
    </div>
  );
}
