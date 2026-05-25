"use client";

import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import type { AdminDictionary } from "@/lib/admin-i18n";

type MailboxRecord = {
  email: string;
  localPart: string;
  usedDisplay: string;
  quotaDisplay: string;
  usedBytes: number;
  quotaBytes: number | null;
  percentUsed: number | null;
  isSystem: boolean;
};

type Props = {
  locale: "de" | "en";
  mailPage: AdminDictionary["mailPage"];
  mailboxes: MailboxRecord[];
};

type ApiState = {
  mailboxes: MailboxRecord[];
  password?: string;
};

type WorkspaceTab = "mailboxes" | "create";

const inputClassName =
  "w-full rounded-xl border border-border/70 bg-background/70 px-3 py-2 text-sm text-foreground focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40";

const labelClassName = "text-xs font-semibold uppercase tracking-[0.2em] text-muted";

const progressTone = (mailbox: MailboxRecord): string => {
  if (mailbox.percentUsed === null) return "bg-sky-500/70";
  if (mailbox.percentUsed >= 90) return "bg-red-500";
  if (mailbox.percentUsed >= 70) return "bg-amber-500";
  return "bg-emerald-500";
};

const generatePassword = (): string => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
  return Array.from({ length: 18 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
};

export default function AdminMailWorkspace({ locale, mailPage, mailboxes: initialMailboxes }: Props) {
  const [mailboxes, setMailboxes] = useState(initialMailboxes);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(initialMailboxes[0]?.email ?? null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("mailboxes");

  const [createLocalPart, setCreateLocalPart] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createQuota, setCreateQuota] = useState("0");

  const [quotaDraft, setQuotaDraft] = useState(
    initialMailboxes[0]?.quotaBytes ? initialMailboxes[0].quotaDisplay.replace(" ", "") : "0",
  );
  const [resetPasswordDraft, setResetPasswordDraft] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSavingQuota, setIsSavingQuota] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeletingMailbox, setIsDeletingMailbox] = useState(false);

  const deferredSearch = useDeferredValue(search);

  const copy = useMemo(
    () =>
      locale === "de"
        ? {
            tabMailboxes: "Mailboxen",
            tabCreate: "Neue E-Mail",
            tabCreateDesc: "Neues Postfach mit Passwortgenerator anlegen.",
            listTitle: "Mailboxen",
            listSubtitle: "Wahle links eine Adresse aus und verwalte rechts Passwort und Speicherlimit.",
            passwordGenerator: "Passwortgenerator",
            generatePassword: "Passwort generieren",
            quickSummary: "Kurzstatus",
            usageLive: "Live vom Mailserver",
            selectedMailbox: "Ausgewahltes Postfach",
            quotaCard: "Speicherlimit",
            passwordCard: "Zugang",
            manualPasswordTitle: "Manuelles Passwort setzen",
            manualPasswordHint: "Trage ein neues Passwort ein oder generiere eines. Beim Speichern wird es sofort auf dem Mailserver gesetzt.",
            manualPasswordPlaceholder: "Neues Passwort eingeben",
            savePassword: "Passwort speichern",
            savingPassword: "Passwort wird gespeichert...",
            deleteCard: "Postfach löschen",
            deleteHint: "Diese Aktion entfernt die Mailbox vom Mailserver. Tippe die komplette E-Mail-Adresse zur Bestätigung ein.",
            deleteConfirmPlaceholder: "E-Mail-Adresse zur Bestätigung",
            deleteButton: "Postfach löschen",
            deletingButton: "Wird gelöscht...",
            deleteSuccess: "Postfach wurde gelöscht.",
            createHelper: "Neue Postfächer werden sofort auf dem Live-Mailserver angelegt.",
          }
        : {
            tabMailboxes: "Mailboxes",
            tabCreate: "New email",
            tabCreateDesc: "Create a new mailbox with a built-in password generator.",
            listTitle: "Mailboxes",
            listSubtitle: "Choose an address on the left and manage password and storage on the right.",
            passwordGenerator: "Password generator",
            generatePassword: "Generate password",
            quickSummary: "Quick summary",
            usageLive: "Live from mail server",
            selectedMailbox: "Selected mailbox",
            quotaCard: "Storage quota",
            passwordCard: "Access",
            manualPasswordTitle: "Set manual password",
            manualPasswordHint: "Enter a new password or generate one. Saving applies it immediately on the mail server.",
            manualPasswordPlaceholder: "Enter new password",
            savePassword: "Save password",
            savingPassword: "Saving password...",
            deleteCard: "Delete mailbox",
            deleteHint: "This removes the mailbox from the mail server. Type the full email address to confirm.",
            deleteConfirmPlaceholder: "Email address to confirm",
            deleteButton: "Delete mailbox",
            deletingButton: "Deleting...",
            deleteSuccess: "Mailbox deleted.",
            createHelper: "New mailboxes are created immediately on the live mail server.",
          },
    [locale],
  );

  const filteredMailboxes = useMemo(() => {
    const needle = deferredSearch.trim().toLowerCase();
    if (!needle) return mailboxes;
    return mailboxes.filter((mailbox) =>
      `${mailbox.email} ${mailbox.localPart}`.toLowerCase().includes(needle),
    );
  }, [deferredSearch, mailboxes]);

  const selectedMailbox =
    filteredMailboxes.find((mailbox) => mailbox.email === selectedEmail) ??
    mailboxes.find((mailbox) => mailbox.email === selectedEmail) ??
    filteredMailboxes[0] ??
    null;

  useEffect(() => {
    if (!selectedMailbox) return;
    setQuotaDraft(selectedMailbox.quotaBytes === null ? "0" : selectedMailbox.quotaDisplay.replace(" ", ""));
  }, [selectedMailbox]);

  const unlimitedCount = mailboxes.filter((mailbox) => mailbox.quotaBytes === null).length;

  const syncState = (state: ApiState, successMessage: string) => {
    startTransition(() => {
      setMailboxes(state.mailboxes);
      setSelectedEmail((current) =>
        state.mailboxes.some((mailbox) => mailbox.email === current)
          ? current
          : state.mailboxes[0]?.email ?? null,
      );
      if (state.password) {
        setGeneratedPassword(state.password);
      }
      setFlash({ type: "success", message: successMessage });
    });
  };

  const readError = async (response: Response): Promise<string> => {
    try {
      const payload = (await response.json()) as { error?: string };
      return payload.error || mailPage.errorGeneric;
    } catch {
      return mailPage.errorGeneric;
    }
  };

  const refreshMailboxes = async () => {
    const response = await fetch("/api/admin/mail", {
      method: "GET",
      credentials: "same-origin",
    });
    if (!response.ok) throw new Error(await readError(response));

    const payload = (await response.json()) as ApiState;
    startTransition(() => {
      setMailboxes(payload.mailboxes);
      setSelectedEmail((current) =>
        payload.mailboxes.some((mailbox) => mailbox.email === current)
          ? current
          : payload.mailboxes[0]?.email ?? null,
      );
    });
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsCreating(true);
    setFlash(null);
    setGeneratedPassword(null);

    try {
      const response = await fetch("/api/admin/mail", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          localPart: createLocalPart,
          password: createPassword,
          quota: createQuota,
        }),
      });

      if (!response.ok) throw new Error(await readError(response));

      const payload = (await response.json()) as ApiState;
      syncState(payload, mailPage.successCreate);
      setCreateLocalPart("");
      setCreatePassword("");
      setCreateQuota("0");
      setActiveTab("mailboxes");
    } catch (error) {
      setFlash({ type: "error", message: error instanceof Error ? error.message : mailPage.errorGeneric });
    } finally {
      setIsCreating(false);
    }
  };

  const handleQuotaSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedMailbox) return;
    setIsSavingQuota(true);
    setFlash(null);

    try {
      const response = await fetch("/api/admin/mail", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "quota",
          email: selectedMailbox.email,
          quota: quotaDraft,
        }),
      });

      if (!response.ok) throw new Error(await readError(response));

      const payload = (await response.json()) as ApiState;
      syncState(payload, mailPage.successQuota);
    } catch (error) {
      setFlash({ type: "error", message: error instanceof Error ? error.message : mailPage.errorGeneric });
    } finally {
      setIsSavingQuota(false);
    }
  };

  const handlePasswordReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedMailbox) return;
    setIsResettingPassword(true);
    setFlash(null);
    setGeneratedPassword(null);

    try {
      const response = await fetch("/api/admin/mail", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "password",
          email: selectedMailbox.email,
          password: resetPasswordDraft,
        }),
      });

      if (!response.ok) throw new Error(await readError(response));

      const payload = (await response.json()) as ApiState;
      syncState(payload, mailPage.successPassword);
      setResetPasswordDraft("");
    } catch (error) {
      setFlash({ type: "error", message: error instanceof Error ? error.message : mailPage.errorGeneric });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleDeleteMailbox = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedMailbox || selectedMailbox.isSystem || deleteConfirmation !== selectedMailbox.email) return;
    setIsDeletingMailbox(true);
    setFlash(null);
    setGeneratedPassword(null);

    try {
      const response = await fetch("/api/admin/mail", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          email: selectedMailbox.email,
        }),
      });

      if (!response.ok) throw new Error(await readError(response));

      const payload = (await response.json()) as ApiState;
      setDeleteConfirmation("");
      syncState(payload, copy.deleteSuccess);
    } catch (error) {
      setFlash({ type: "error", message: error instanceof Error ? error.message : mailPage.errorGeneric });
    } finally {
      setIsDeletingMailbox(false);
    }
  };

  return (
    <div className="space-y-6">
      {flash ? (
        <div
          className={`glass-panel rounded-2xl border p-4 text-sm ${
            flash.type === "success"
              ? "border-green-500/30 bg-green-500/10 text-green-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {flash.message}
        </div>
      ) : null}

      {generatedPassword ? (
        <div className="glass-panel rounded-2xl border border-gold/30 bg-gold/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">{mailPage.generatedPassword}</p>
          <p className="mt-2 break-all rounded-xl bg-background/70 px-3 py-3 font-mono text-sm text-foreground">
            {generatedPassword}
          </p>
          <p className="mt-2 text-xs text-muted">{mailPage.generatedPasswordHint}</p>
        </div>
      ) : null}

      <div className="glass-panel rounded-2xl p-4">
        <div className="flex flex-wrap gap-2">
          {([
            ["mailboxes", copy.tabMailboxes],
            ["create", copy.tabCreate],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveTab(value)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                activeTab === value
                  ? "border-gold/50 bg-gold/10 text-gold"
                  : "border-border/60 bg-background/40 text-muted hover:border-gold/30 hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "mailboxes" ? (
        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="glass-panel flex min-h-[72vh] flex-col rounded-2xl p-5 xl:sticky xl:top-8 xl:max-h-[calc(100vh-4rem)]">
            <div className="border-b border-border/50 pb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{mailPage.eyebrow}</p>
              <h2 className="mt-2 break-words text-2xl font-semibold leading-tight text-foreground">{copy.listTitle}</h2>
              <p className="mt-2 text-sm text-muted">{copy.listSubtitle}</p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                  <p className="break-words text-xs uppercase tracking-[0.2em] text-muted">{mailPage.statsTotal}</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{mailboxes.length}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                  <p className="break-words text-xs uppercase tracking-[0.2em] text-muted">{mailPage.statsUnlimited}</p>
                  <p className="mt-2 text-2xl font-bold text-gold">{unlimitedCount}</p>
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={mailPage.searchPlaceholder}
                  className={inputClassName}
                />
                <button
                  type="button"
                  onClick={() => void refreshMailboxes().catch((error) => setFlash({ type: "error", message: error.message }))}
                  className="rounded-xl border border-border/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground transition hover:border-gold/40 hover:text-gold"
                >
                  {mailPage.refresh}
                </button>
              </div>
            </div>

            <div className="mt-5 flex-1 space-y-2 overflow-y-auto pr-1">
              {filteredMailboxes.length > 0 ? (
                filteredMailboxes.map((mailbox) => {
                  const selected = mailbox.email === selectedMailbox?.email;
                  return (
                    <button
                      key={mailbox.email}
                      type="button"
                      onClick={() => {
                        setSelectedEmail(mailbox.email);
                        setQuotaDraft(mailbox.quotaBytes === null ? "0" : mailbox.quotaDisplay.replace(" ", ""));
                        setResetPasswordDraft("");
                        setDeleteConfirmation("");
                      }}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        selected
                          ? "border-gold/50 bg-gold/10 shadow-[0_0_0_1px_rgba(212,175,55,0.12)]"
                          : "border-border/60 bg-background/50 hover:border-gold/30 hover:bg-background/70"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{mailbox.email}</p>
                          <p className="mt-1 text-xs text-muted">
                            {mailPage.used}: {mailbox.usedDisplay}
                          </p>
                        </div>
                        {mailbox.isSystem ? (
                          <span className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
                            {mailPage.protectedLabel}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-muted">
                        <span>
                          {mailPage.assigned}: {mailbox.quotaDisplay}
                        </span>
                        <span>{mailbox.percentUsed === null ? mailPage.unlimited : `${mailbox.percentUsed}%`}</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-background/70">
                        <div
                          className={`h-full rounded-full ${progressTone(mailbox)}`}
                          style={{ width: `${mailbox.percentUsed ?? Math.min(100, Math.max(6, Math.round(mailbox.usedBytes / (1024 ** 2))))}%` }}
                        />
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-border/70 p-6 text-sm text-muted">{mailPage.empty}</div>
              )}
            </div>
          </aside>

          <section className="glass-panel rounded-2xl p-6">
            {selectedMailbox ? (
              <div className="space-y-6">
                <div className="border-b border-border/50 pb-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{copy.selectedMailbox}</p>
                  <h3 className="mt-2 break-words text-2xl font-semibold leading-tight text-foreground">{selectedMailbox.email}</h3>
                  <p className="mt-2 text-sm text-muted">{copy.usageLive}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
                    <p className={labelClassName}>{mailPage.used}</p>
                    <p className="mt-2 text-2xl font-bold text-foreground">{selectedMailbox.usedDisplay}</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
                    <p className={labelClassName}>{mailPage.assigned}</p>
                    <p className="mt-2 text-2xl font-bold text-foreground">{selectedMailbox.quotaDisplay}</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
                    <p className={labelClassName}>{mailPage.storageUsage}</p>
                    <p className="mt-2 text-2xl font-bold text-gold">
                      {selectedMailbox.percentUsed === null ? mailPage.unlimited : `${selectedMailbox.percentUsed}%`}
                    </p>
                  </div>
                </div>

                {selectedMailbox.isSystem ? (
                  <div className="rounded-2xl border border-gold/30 bg-gold/10 p-4 text-sm text-gold">
                    <p className="font-semibold">{mailPage.systemMailbox}</p>
                    <p className="mt-1 text-gold/80">{mailPage.systemHint}</p>
                  </div>
                ) : null}

                <form
                  onSubmit={handlePasswordReset}
                  className="rounded-2xl border border-gold/40 bg-gold/10 p-5 shadow-[0_18px_60px_rgba(212,175,55,0.10)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                        {copy.passwordCard}
                      </p>
                      <h4 className="mt-2 text-xl font-semibold text-foreground">{copy.manualPasswordTitle}</h4>
                      <p className="mt-1 max-w-2xl text-sm text-muted">{copy.manualPasswordHint}</p>
                    </div>
                    <span className="rounded-full border border-gold/30 bg-background/70 px-3 py-1 text-xs font-semibold text-gold">
                      {selectedMailbox.email}
                    </span>
                  </div>
                  <label className="mt-5 block">
                    <span className={labelClassName}>{mailPage.password}</span>
                    <input
                      type="password"
                      value={resetPasswordDraft}
                      onChange={(event) => setResetPasswordDraft(event.target.value)}
                      className={`${inputClassName} mt-2 bg-background`}
                      placeholder={copy.manualPasswordPlaceholder}
                      autoComplete="new-password"
                    />
                  </label>
                  {resetPasswordDraft ? (
                    <div className="mt-3 rounded-xl border border-gold/20 bg-background/80 px-3 py-2">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted">{mailPage.generatedPassword}</p>
                      <p className="mt-1 break-all font-mono text-sm text-foreground">{resetPasswordDraft}</p>
                    </div>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setResetPasswordDraft(generatePassword())}
                      className="rounded-xl border border-border/70 bg-background/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground transition hover:border-gold/40 hover:text-gold"
                    >
                      {copy.generatePassword}
                    </button>
                    <button
                      type="submit"
                      disabled={isResettingPassword || !resetPasswordDraft.trim()}
                      className="inline-flex min-w-40 items-center justify-center rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-black shadow-lg shadow-gold/15 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isResettingPassword ? copy.savingPassword : copy.savePassword}
                    </button>
                  </div>
                </form>

                <div className="grid gap-6 xl:grid-cols-2">
                  <form onSubmit={handleQuotaSave} className="rounded-2xl border border-border/60 bg-background/40 p-5">
                    <p className="text-sm font-semibold text-foreground">{copy.quotaCard}</p>
                    <p className="mt-1 text-sm text-muted">{mailPage.quotaHint}</p>
                    <label className="mt-4 block">
                      <span className={labelClassName}>{mailPage.quota}</span>
                      <input
                        type="text"
                        value={quotaDraft}
                        onChange={(event) => setQuotaDraft(event.target.value)}
                        className={`${inputClassName} mt-2`}
                        placeholder="2G"
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={isSavingQuota}
                      className="mt-4 inline-flex items-center justify-center rounded-xl border border-border/70 px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-gold/40 hover:text-gold disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isSavingQuota ? mailPage.savingQuota : mailPage.saveQuota}
                    </button>
                  </form>

                  <div className="rounded-2xl border border-border/60 bg-background/40 p-5">
                    <p className="text-sm font-semibold text-foreground">{copy.quickSummary}</p>
                    <p className="mt-1 text-sm text-muted">{copy.usageLive}</p>
                    <div className="mt-4 space-y-3 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted">{mailPage.used}</span>
                        <span className="font-semibold text-foreground">{selectedMailbox.usedDisplay}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted">{mailPage.assigned}</span>
                        <span className="font-semibold text-foreground">{selectedMailbox.quotaDisplay}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted">{mailPage.storageUsage}</span>
                        <span className="font-semibold text-gold">
                          {selectedMailbox.percentUsed === null ? mailPage.unlimited : `${selectedMailbox.percentUsed}%`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleDeleteMailbox} className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-red-200">{copy.deleteCard}</p>
                      <p className="mt-1 max-w-2xl text-sm text-red-100/80">{copy.deleteHint}</p>
                    </div>
                    {selectedMailbox.isSystem ? (
                      <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                        {mailPage.protectedLabel}
                      </span>
                    ) : null}
                  </div>
                  <label className="mt-4 block">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-red-100/80">
                      {selectedMailbox.email}
                    </span>
                    <input
                      type="text"
                      value={deleteConfirmation}
                      onChange={(event) => setDeleteConfirmation(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-red-300/30 bg-background/80 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-red-300/60 focus:outline-none focus:ring-1 focus:ring-red-300/40"
                      placeholder={copy.deleteConfirmPlaceholder}
                      disabled={selectedMailbox.isSystem || isDeletingMailbox}
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={selectedMailbox.isSystem || isDeletingMailbox || deleteConfirmation !== selectedMailbox.email}
                    className="mt-4 rounded-xl border border-red-300/40 bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isDeletingMailbox ? copy.deletingButton : copy.deleteButton}
                  </button>
                </form>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 p-8 text-sm text-muted">
                {mailPage.detailEmpty}
              </div>
            )}
          </section>
        </div>
      ) : (
        <section className="glass-panel rounded-2xl p-6">
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="border-b border-border/50 pb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{mailPage.eyebrow}</p>
              <h2 className="mt-2 text-2xl font-semibold text-foreground">{mailPage.createTitle}</h2>
              <p className="mt-2 text-sm text-muted">{copy.tabCreateDesc}</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <form onSubmit={handleCreate} className="rounded-2xl border border-border/60 bg-background/40 p-5">
                <div className="space-y-4">
                  <label className="block">
                    <span className={labelClassName}>{mailPage.localPart}</span>
                    <div className="mt-2 flex overflow-hidden rounded-xl border border-border/70 bg-background/70">
                      <input
                        value={createLocalPart}
                        onChange={(event) => setCreateLocalPart(event.target.value)}
                        className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-foreground focus:outline-none"
                        placeholder={locale === "de" ? "zum-beispiel service" : "for example service"}
                        required
                      />
                      <span className="border-l border-border/60 px-3 py-2 text-sm text-muted">{mailPage.domainSuffix}</span>
                    </div>
                  </label>

                  <label className="block">
                    <span className={labelClassName}>{mailPage.password}</span>
                    <input
                      type="password"
                      value={createPassword}
                      onChange={(event) => setCreatePassword(event.target.value)}
                      className={`${inputClassName} mt-2`}
                      placeholder={mailPage.passwordHint}
                      autoComplete="new-password"
                    />
                  </label>

                  <label className="block">
                    <span className={labelClassName}>{mailPage.quota}</span>
                    <input
                      type="text"
                      value={createQuota}
                      onChange={(event) => setCreateQuota(event.target.value)}
                      className={`${inputClassName} mt-2`}
                      placeholder="500M"
                    />
                    <p className="mt-1 text-xs text-muted">{mailPage.quotaHint}</p>
                  </label>

                  <button
                    type="submit"
                    disabled={isCreating}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isCreating ? mailPage.creating : mailPage.create}
                  </button>
                </div>
              </form>

              <div className="rounded-2xl border border-border/60 bg-background/40 p-5">
                <p className="text-sm font-semibold text-foreground">{copy.passwordGenerator}</p>
                <p className="mt-1 text-sm text-muted">{copy.createHelper}</p>

                <div className="mt-4 rounded-2xl border border-border/60 bg-background/70 p-4">
                  <p className="break-all font-mono text-sm text-foreground">
                    {createPassword || "••••••••••••••••••"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setCreatePassword(generatePassword())}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-border/70 px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-gold/40 hover:text-gold"
                >
                  {copy.generatePassword}
                </button>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted">{mailPage.statsTotal}</p>
                    <p className="mt-2 text-2xl font-bold text-foreground">{mailboxes.length}</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted">{mailPage.statsUnlimited}</p>
                    <p className="mt-2 text-2xl font-bold text-gold">{unlimitedCount}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
