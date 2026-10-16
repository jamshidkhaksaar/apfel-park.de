'use client';

import { useState } from 'react';
import { telegramText } from '@/lib/telegram-products/i18n';

export type TelegramSettingsData = {
  members: Array<{
    id: string;
    telegram_id: string;
    display_name: string;
    locale: string;
    status: 'pending' | 'active' | 'revoked';
    last_seen_at: string | null;
  }>;
  credentials: {
    slots: Array<{
      slot: 'primary' | 'backup';
      label: string;
      fingerprint: string;
      validated_at: string | null;
    }>;
    activeSlot: string;
    imageModel: string;
    encryptionConfigured: boolean;
    enabled: boolean;
  };
  botUsername: string;
};
export default function TelegramBotSettings({
  locale,
  initialData,
  section = 'members',
}: {
  locale: 'de' | 'en';
  initialData: TelegramSettingsData;
  section?: 'members' | 'providers';
}) {
  const t = telegramText[locale];
  const [data, setData] = useState(initialData),
    [password, setPassword] = useState(''),
    [label, setLabel] = useState(''),
    [key, setKey] = useState(''),
    [slot, setSlot] = useState<'primary' | 'backup'>('primary'),
    [model, setModel] = useState(initialData.credentials.imageModel),
    [invite, setInvite] = useState(''),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
  const run = async (payload: Record<string, unknown>) => {
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/telegram-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (result.token)
        setInvite(
          data.botUsername
            ? `https://t.me/${data.botUsername}?start=${result.token}`
            : result.token,
        );
      setKey('');
      setPassword('');
      setMessage(t.success);
      const refresh = await fetch('/api/admin/telegram-products', {
        cache: 'no-store',
      });
      if (refresh.ok) setData(await refresh.json());
    } catch (error) {
      const code = (error as Error).message;
      setMessage(t.errors[code as keyof typeof t.errors] ?? t.error);
    } finally {
      setBusy(false);
    }
  };
  const input =
    'w-full min-w-0 rounded-xl border border-border/60 bg-surface px-3 py-2.5 text-sm';
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {section === 'members' ? t.title : t.providers}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {section === 'members' ? t.intro : t.credentialsHint}
        </p>
      </div>
      <label className="block max-w-md space-y-2 text-sm">
        <span>{t.password}</span>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={input}
        />
      </label>
      {message ? (
        <p
          role="status"
          className="rounded-xl border border-gold/40 p-3 text-sm"
        >
          {message}
        </p>
      ) : null}
      {section === 'members' ? (
        <>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run({ action: 'invite', label });
            }}
            className="rounded-2xl border border-border p-5 space-y-3"
          >
            <label className="block text-sm">
              {t.label}
              <input
                value={label}
                maxLength={80}
                onChange={(e) => setLabel(e.target.value)}
                className={`${input} mt-2`}
              />
            </label>
            <p className="text-sm text-muted">{t.inviteHint}</p>
            <button
              disabled={busy || !password || !label.trim()}
              className="btn-primary"
            >
              {t.invite}
            </button>
            {invite ? (
              <p className="break-all rounded-xl bg-surface p-3 text-sm select-all">
                {invite}
              </p>
            ) : null}
          </form>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">{t.members}</h2>
            {!data.members.length ? (
              <p className="text-muted">{t.empty}</p>
            ) : (
              data.members.map((member) => (
                <article
                  key={member.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border p-4"
                >
                  <div className="min-w-0">
                    <p className="font-semibold break-words">
                      {member.display_name} · {t[member.status]}
                    </p>
                    <p className="text-xs text-muted break-all">
                      {t.id}: {member.telegram_id} ·{' '}
                      {member.locale.toUpperCase()}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {t.lastSeen}:{' '}
                      {member.last_seen_at
                        ? new Date(member.last_seen_at).toLocaleString(locale)
                        : '—'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {member.status !== 'active' ? (
                      <button
                        disabled={busy || !password}
                        className="btn-secondary"
                        onClick={() =>
                          void run({ action: 'approve', memberId: member.id })
                        }
                      >
                        {t.approve}
                      </button>
                    ) : null}
                    {member.status !== 'revoked' ? (
                      <button
                        disabled={busy || !password}
                        className="btn-secondary"
                        onClick={() =>
                          void run({ action: 'revoke', memberId: member.id })
                        }
                      >
                        {t.revoke}
                      </button>
                    ) : null}
                  </div>
                </article>
              ))
            )}
          </section>
        </>
      ) : (
        <>
          <p className="rounded-xl border border-border p-4 text-sm">
            {t.quota}
          </p>
          {!data.credentials.encryptionConfigured ? (
            <p role="alert" className="text-sm text-gold">
              {t.encryptionMissing}
            </p>
          ) : null}
          {!data.credentials.enabled ? (
            <p role="alert" className="text-sm text-gold">
              {t.disabled}
            </p>
          ) : null}
          <p className="text-sm">
            {t.activeKey}: <strong>{data.credentials.activeSlot}</strong>
          </p>
          <div className="space-y-3">
            {(['primary', 'backup'] as const).map((s) => {
              const saved = data.credentials.slots.find((c) => c.slot === s);
              return (
                <article
                  key={s}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
                >
                  <div>
                    <p className="font-semibold">
                      {t[s]} · {saved?.label ?? '—'}
                    </p>
                    <p className="text-xs text-muted">
                      {t.fingerprint}: {saved?.fingerprint ?? '—'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      disabled={
                        busy ||
                        !password ||
                        !saved ||
                        data.credentials.activeSlot === s ||
                        !data.credentials.enabled
                      }
                      className="btn-secondary"
                      onClick={() =>
                        void run({ action: 'activate_key', slot: s })
                      }
                    >
                      {t.activate}
                    </button>
                    <button
                      disabled={
                        busy ||
                        !password ||
                        !saved ||
                        data.credentials.activeSlot === s
                      }
                      className="btn-secondary"
                      onClick={() =>
                        void run({ action: 'remove_key', slot: s })
                      }
                    >
                      {t.remove}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
          <button
            className="btn-secondary"
            disabled={
              busy || !password || data.credentials.activeSlot === 'environment'
            }
            onClick={() =>
              void run({ action: 'activate_key', slot: 'environment' })
            }
          >
            {t.environment}
          </button>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run({ action: 'save_key', slot, key, label });
            }}
            className="rounded-2xl border border-border p-5 space-y-3"
          >
            <select
              aria-label={t.activeKey}
              value={slot}
              onChange={(e) => setSlot(e.target.value as 'primary' | 'backup')}
              className={input}
            >
              <option value="primary">{t.primary}</option>
              <option value="backup">{t.backup}</option>
            </select>
            <label className="block text-sm">
              {t.label}
              <input
                value={label}
                maxLength={80}
                onChange={(e) => setLabel(e.target.value)}
                className={`${input} mt-2`}
              />
            </label>
            <label className="block text-sm">
              {t.key}
              <input
                type="password"
                autoComplete="new-password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className={`${input} mt-2`}
              />
            </label>
            <button
              disabled={
                busy ||
                !password ||
                !key ||
                !data.credentials.encryptionConfigured
              }
              className="btn-primary"
            >
              {t.saveKey}
            </button>
          </form>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run({ action: 'image_model', model });
            }}
            className="space-y-3"
          >
            <label className="block text-sm">
              {t.imageModel}
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className={`${input} mt-2`}
              >
                {[
                  'gemini-nano-banana-2.1',
                  'gemini-3.1-flash-image',
                  'gemini-3-pro-image',
                ].map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </label>
            <button disabled={busy || !password} className="btn-secondary">
              {t.saveModel}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
