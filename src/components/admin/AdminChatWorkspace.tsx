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
  const latestCustomerMessageIdRef = useRef<string | null>(null);

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

  const loadConversations = useCallback(async (silent = false) => {
    if (!silent) setLoadingThread(true);
    try {
      const response = await fetch("/api/admin/chat", { cache: "no-store" });
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
    } finally {
      if (!silent) setLoadingThread(false);
    }
  }, [conversations, selectedId]);

  const loadThread = useCallback(async (id: string, silent = false) => {
    if (!id) return;
    if (!silent) setLoadingThread(true);
    try {
      const response = await fetch(`/api/admin/chat?id=${encodeURIComponent(id)}`, { cache: "no-store" });
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
    } finally {
      if (!silent) setLoadingThread(false);
    }
  }, []);

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
    }, 5000);
    return () => window.clearInterval(interval);
  }, [selectedId, loadConversations, loadThread]);

  const handleReply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedId || !reply.trim()) return;
    setSending(true);
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
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (status: ChatStatus) => {
    if (!selectedId) return;
    const response = await fetch("/api/admin/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "status",
        conversationId: selectedId,
        status,
      }),
    });
    const payload = (await response.json()) as { conversation?: ChatConversation };
    if (payload.conversation) {
      setConversations((current) =>
        current.map((item) => (item.id === payload.conversation?.id ? payload.conversation : item)),
      );
    }
  };

  return (
    <div className="grid h-[calc(100vh-9rem)] gap-6 xl:grid-cols-[360px_1fr]">
      <section className="glass-panel flex min-h-0 flex-col rounded-3xl p-4">
        <div className="mb-4 px-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">{text.eyebrow}</p>
          <h2 className="mt-2 text-2xl font-bold text-foreground">{text.title}</h2>
          <p className="mt-2 text-sm text-muted">{text.intro}</p>
        </div>
        <div className="px-2">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={text.search}
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-foreground focus:border-gold focus:outline-none"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {(["all", "open", "waiting", "resolved"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                  filter === item ? "bg-gold text-black" : "bg-black/20 text-muted"
                }`}
              >
                {text.filters[item]}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-muted">{text.empty}</div>
          ) : (
            <div className="space-y-2">
              {filtered.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setSelectedId(conversation.id)}
                  className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                    selectedId === conversation.id
                      ? "border-gold/40 bg-gold/10"
                      : "border-white/10 bg-black/10 hover:border-gold/20"
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

      <section className="glass-panel flex min-h-0 flex-col rounded-3xl p-6">
        {!selectedConversation ? (
          <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-white/10 text-sm text-muted">
            {text.emptyDetail}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
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
                  className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground focus:border-gold focus:outline-none"
                >
                  <option value="open">{text.status.open}</option>
                  <option value="waiting">{text.status.waiting}</option>
                  <option value="resolved">{text.status.resolved}</option>
                </select>
              </div>
            </div>

            <div className="mt-5 flex-1 space-y-3 overflow-y-auto">
              {loadingThread && messages.length === 0 ? (
                <div className="text-sm text-muted">Loading…</div>
              ) : (
                messages.map((message) => {
                  const own = message.senderRole === "admin";
                  return (
                    <div key={message.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[78%] rounded-3xl px-4 py-3 ${
                          own ? "bg-gold text-black" : "border border-white/10 bg-white/5 text-foreground"
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
            </div>

            <form onSubmit={handleReply} className="mt-5 border-t border-white/10 pt-5">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                {text.reply}
              </label>
              <div className="flex gap-3">
                <textarea
                  rows={3}
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder={text.messagePlaceholder}
                  className="min-h-[88px] flex-1 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-foreground focus:border-gold focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={sending || !reply.trim()}
                  className="rounded-2xl bg-gold px-5 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-black transition hover:bg-gold-deep disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sending ? text.sending : text.send}
                </button>
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
