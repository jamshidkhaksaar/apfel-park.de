'use client';

import { appliedResearchTextFields, normalizeAiTextFields } from '@/lib/product-ai-fields';
import { photoMembershipChanged } from '@/lib/product-photo-confirmation';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ProductPayload } from '@/lib/product-write-payload';
import {
  channels,
  newPhoneEntry,
  entryImages,
  entryReadiness,
  entryProblems,
  copyNewPhonePhotos,
  type PhoneDraft,
  type PhoneDocument,
  type PhoneEntry,
} from '@/lib/smartphone-editor/model';
import {
  phoneEditorText,
  translatePhoneChannelMessage,
  phoneErrorText,
} from '@/lib/smartphone-editor/i18n';
import PhonePhotoSlots from './PhonePhotoSlots';
import AiFillButton from './AiFillButton';

const inputClass =
  'mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-foreground';
function Field({
  label,
  value,
  onChange,
  type = 'text',
  id,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  id?: string;
}) {
  return (
    <label className="block text-sm text-foreground" htmlFor={id}>
      {label}
      <input
        id={id}
        className={inputClass}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        step={type === 'number' ? 'any' : undefined}
      />
    </label>
  );
}
const call = async (url: string, method = 'GET', body?: unknown) => {
  const response = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json();
  if (!response.ok)
    throw Object.assign(new Error(result.error ?? 'save_failed'), {
      status: response.status,
    });
  return result;
};
export default function SmartphoneWizard({
  locale,
  productId,
  researchEnabled = false,
}: {
  researchEnabled?: boolean;
  locale: 'de' | 'en';
  productId?: string;
}) {
  const t = phoneEditorText[locale];
  const [draft, setDraft] = useState<PhoneDraft | null>(null);
  const [document, setDocument] = useState<PhoneDocument | null>(null);
  const [drafts, setDrafts] = useState<{ id: string; title: string }[]>([]);
  const [status, setStatus] = useState('saved');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [models, setModels] = useState<
    { id: string; brand: string; model: string; title: string }[]
  >([]);
  const sharedEdit = document?.pendingShared;
  const [copyFrom, setCopyFrom] = useState<Record<string, string>>({});
  const current = useRef<PhoneDocument | null>(null);
  const saved = useRef('');
  const revision = useRef(0);
  const draftId = useRef('');
  const saving = useRef<Promise<void> | null>(null);
  const publishRetry = useRef<{
    requestId: string;
    revision: number;
    entryIds: string[];
  } | null>(null);
  const load = useCallback((next: PhoneDraft) => {
    revision.current = next.revision;
    draftId.current = next.id;
    current.current = next.document;
    saved.current = JSON.stringify(next.document);
    setDraft(next);
    setDocument(next.document);
    setStatus('saved');
    setError('');
    window.history.replaceState(
      null,
      '',
      `/admin/products/phone?draft=${next.id}`,
    );
  }, []);
  useEffect(() => {
    let active = true;
    const id = new URLSearchParams(window.location.search).get('draft');
    (id
      ? call(`/api/admin/smartphone-drafts/${id}`)
      : call(`/api/admin/smartphone-drafts${productId ? `?productId=${encodeURIComponent(productId)}` : ''}`)
    )
      .then((result) => {
        if (!active) return;
        if (id) load(result);
        else setDrafts(result.drafts);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setInitializing(false);
      });
    return () => {
      active = false;
    };
  }, [load, productId]);
  const flush = useCallback(async () => {
    if (saving.current) await saving.current;
    if (
      !current.current ||
      !draftId.current ||
      JSON.stringify(current.current) === saved.current
    )
      return;
    const snapshot = current.current;
    setStatus('saving');
    const task = (async () => {
      try {
        const result = await call(
          `/api/admin/smartphone-drafts/${draftId.current}`,
          'PATCH',
          { revision: revision.current, document: snapshot },
        );
        revision.current = result.revision;
        saved.current = JSON.stringify(snapshot);
        setDraft(result);
        setStatus(
          JSON.stringify(current.current) === saved.current
            ? 'saved'
            : 'saving',
        );
      } catch (e) {
        setStatus('save_failed');
        setError((e as Error).message);
        throw e;
      }
    })();
    saving.current = task;
    try {
      await task;
    } finally {
      saving.current = null;
    }
  }, []);
  useEffect(() => {
    if (
      !document ||
      JSON.stringify(document) === saved.current ||
      error === 'conflict'
    )
      return;
    const timer = setTimeout(() => {
      void flush().catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
  }, [document, error, flush]);
  useEffect(() => {
    const listener = (event: BeforeUnloadEvent) => {
      if (uploading || JSON.stringify(current.current) !== saved.current) {
        event.preventDefault();
      }
    };
    window.addEventListener('beforeunload', listener);
    return () => window.removeEventListener('beforeunload', listener);
  }, [uploading]);
  useEffect(() => {
    if (!search.trim()) {
      setModels([]);
      return;
    }
    let active = true;
    const timer = setTimeout(() => {
      call(`/api/admin/smartphone-drafts?search=${encodeURIComponent(search)}`)
        .then((result) => {
          if (active) setModels(result.models);
        })
        .catch(() => {});
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search]);
  useEffect(() => {
    if (
      !draft?.results.some((result) =>
        Object.values(result.channels).includes('pending'),
      )
    )
      return;
    const timer = setInterval(() => {
      void call(`/api/admin/smartphone-drafts/${draft.id}`)
        .then((result) => {
          if (result.revision === revision.current)
            setDraft((previous) =>
              previous ? { ...previous, results: result.results } : previous,
            );
        })
        .catch(() => {});
    }, 15000);
    return () => clearInterval(timer);
  }, [draft?.id, draft?.results]);
  const change = (fn: (previous: PhoneDocument) => PhoneDocument) => {
    if (!current.current || publishRetry.current) return;
    const next = fn(current.current);
    current.current = next;
    setDocument(next);
    setStatus('saving');
  };
  const updateEntry = (id: string, patch: Partial<PhoneEntry>) =>
    change((doc) => {
      const target = doc.entries.find((e) => e.id === id)!;
      const sharedCondition = [
        'condition',
        'conditionNote',
        'batteryHealth',
        'hasRealProductPhotos',
        'defects',
        'accessories',
      ].some((k) => k in patch);
      return {
        ...doc,
        entries: doc.entries.map((e) =>
          e.id === id ||
          (sharedCondition &&
            target.variantIndex !== undefined &&
            e.sourceProductId === target.sourceProductId)
            ? { ...e, ...patch }
            : e,
        ),
      };
    });
  const go = (step: number, entryId?: string, field?: string) => {
    change((d) => ({ ...d, step }));
    if (entryId)
      setTimeout(() => {
        const el =
          window.document.getElementById(`${entryId}-${field}`) ??
          window.document.getElementById(field ?? '') ??
          window.document.getElementById(entryId);
        el?.scrollIntoView({ block: 'center' });
        el?.focus();
      }, 50);
  };
  const start = async (step?: number) => {
    setBusy(true);
    try {
      const next = await call('/api/admin/smartphone-drafts', 'POST', { productId });
      load(next);
      if (step !== undefined) {
        const document = { ...next.document, step };
        current.current = document;
        setDocument(document);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const publish = async () => {
    if (!selected.length) {
      setError('noSelection');
      return;
    }
    setBusy(true);
    setError('');
    try {
      if (!publishRetry.current) {
        await flush();
        if (JSON.stringify(current.current) !== saved.current) await flush();
      }
      const request = publishRetry.current ?? {
        requestId: crypto.randomUUID(),
        revision: revision.current,
        entryIds: selected,
      };
      publishRetry.current = request;
      const next = await call(
        `/api/admin/smartphone-drafts/${draftId.current}/publish`,
        'POST',
        request,
      );
      publishRetry.current = null;
      load(next);
    } catch (e) {
      if (
        (e as { status?: number }).status &&
        (e as { status: number }).status < 500
      )
        publishRetry.current = null;
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const errorText = (key: string) =>
    t[key as keyof typeof t] ?? phoneErrorText(key, locale);
  if (!draft || !document)
    return (
      <div className="space-y-5">
        <h2 className="text-2xl font-semibold">{t.title}</h2>
        {error ? <p role="alert">{String(errorText(error))}</p> : null}
        <button
          className="btn-primary"
          disabled={busy || initializing}
          onClick={() => void start(productId ? 1 : undefined)}
        >
          {productId ? (locale === 'de' ? 'Varianten bearbeiten' : 'Edit versions') : t.newDraft}
        </button>
        {productId ? <div className="flex flex-wrap gap-3">
          <button className="btn-secondary" disabled={busy || initializing} onClick={() => void start(3)}>{locale === 'de' ? 'Variantenfotos bearbeiten' : 'Edit variant photos'}</button>
          <button className="btn-secondary" disabled={busy || initializing} onClick={() => void start(2)}>{t.priceShortcut}</button>
          <p className="w-full text-sm text-muted">{locale === 'de' ? 'Die vorhandenen Varianten werden als Entwurf geladen. Das veröffentlichte Produkt ändert sich erst nach der Prüfung und Veröffentlichung.' : 'Existing versions open as a draft. The live product changes only after review and publication.'}</p>
        </div> : null}
        <h3>{t.resume}</h3>
        {drafts.length ? (
          drafts.map((item) => (
            <button
              key={item.id}
              className="block text-gold"
              onClick={() => {
                void call(`/api/admin/smartphone-drafts/${item.id}`)
                  .then(load)
                  .catch((e) => setError(e.message));
              }}
            >
              {item.title || item.id}
            </button>
          ))
        ) : (
          <p className="text-muted">{t.empty}</p>
        )}
      </div>
    );
  const entryLabel = (e: PhoneEntry) =>
    `${t[e.condition]} · ${e.color || '—'} · ${e.storage || '—'} · #${e.sku.slice(-8)}`;
  const shared = sharedEdit ?? document.shared;
  const setShared = (patch: ProductPayload) =>
    change((d) => ({ ...d, pendingShared: { ...shared, ...patch } }));
  const editDetails = (e: PhoneEntry, patch: ProductPayload) =>
    updateEntry(e.id, { details: { ...e.details, ...patch } });
  const heading = (e: PhoneEntry) => (
    <h3 className="mb-4 break-words text-lg font-semibold text-foreground">
      {entryLabel(e)}
    </h3>
  );
  const card = (e: PhoneEntry, children: React.ReactNode) => (
    <section
      id={e.id}
      key={e.id}
      tabIndex={-1}
      className="rounded-2xl border border-border bg-surface p-4 sm:p-6"
    >
      {heading(e)}
      {children}
    </section>
  );
  return (
    <div className="mx-auto max-w-[1500px] space-y-5 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-foreground">
          {document.shared.title || t.title}
        </h2>
        <span role="status" className="text-sm text-muted">
          {String(errorText(status))}
        </span>
        <button
          className="btn-secondary"
          disabled={busy || uploading}
          onClick={() => go(2)}
        >
          {t.priceShortcut}
        </button>
      </div>
      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-border p-4 text-foreground"
        >
          <p>{String(errorText(error))}</p>
          <button
            className="btn-secondary mt-2"
            onClick={() => {
              if (error === 'conflict')
                void call(`/api/admin/smartphone-drafts/${draft.id}`).then(
                  load,
                );
              else {
                setError('');
                void flush().catch(() => {});
              }
            }}
          >
            {error === 'conflict' ? t.refresh : t.save_failed}
          </button>
        </div>
      ) : null}
      <nav
        aria-label={t.title}
        className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7"
      >
        {t.steps.map((label, index) => (
          <button
            type="button"
            key={label}
            aria-current={document.step === index ? 'step' : undefined}
            className={`rounded-xl border p-3 text-left text-sm ${document.step === index ? 'border-gold bg-gold/10 text-foreground' : 'border-border text-muted'}`}
            disabled={busy || uploading}
            onClick={() => go(index)}
          >
            <span className="mr-2 font-semibold">{index + 1}</span>
            {label}
          </button>
        ))}
      </nav>
      {document.entries.some(
        (e) =>
          e.sourceProductId &&
          document.entries.filter(
            (other) => other.sourceProductId === e.sourceProductId,
          ).length > 1,
      ) ? (
        <p className="rounded-xl bg-surface p-3 text-sm text-muted">
          {t.legacy}
        </p>
      ) : null}
      <fieldset
        disabled={busy || error === 'conflict'}
        className="min-w-0 space-y-5"
      >
        {document.step === 0 ? (
          <section className="space-y-4 rounded-2xl border border-border p-5">
            <Field label={t.search} value={search} onChange={setSearch} />
            {researchEnabled ? (
              <AiFillButton locale={locale} query={search}
                condition={document.entries.every(entry => entry.condition === document.entries[0]?.condition) ? document.entries[0]?.condition : undefined}
                onError={setError}
                onResult={(result) => {
                    change((d) => ({
                      ...d,
                      pendingShared: {
                        ...d.shared,
                        title: result.title ?? d.shared.title,
                        brand: result.brand ?? d.shared.brand,
                        model: result.model ?? d.shared.model,
                        description: result.description ?? d.shared.description,
                        aiGeneratedFields: appliedResearchTextFields(d.shared.aiGeneratedFields, result),
                        specs: result.specs ?? d.shared.specs,
                        manufacturer: result.manufacturer ?? d.shared.manufacturer,
                        euResponsiblePerson: result.euResponsiblePerson ?? d.shared.euResponsiblePerson,
                        safetyWarnings: result.safetyWarnings ?? d.shared.safetyWarnings,
                        eprelId: result.eprelId ?? d.shared.eprelId,
                        energyLabel: result.energyLabel ?? d.shared.energyLabel,
                        featureBullets: result.features ?? d.shared.featureBullets,
                        batteryDetails: result.batteryDetails ?? d.shared.batteryDetails,
                      },
                    }));
                }}/>
            ) : null}
            {models.map((m) => (
              <button
                className="btn-secondary mr-2"
                key={m.id}
                onClick={() => {
                  void call(`/api/admin/smartphone-drafts?template=${m.id}`)
                    .then((result) =>
                      change((d) => ({ ...d, pendingShared: result.shared })),
                    )
                    .catch((e) => setError(e.message));
                }}
              >
                {m.brand} {m.model} · {t.reuse}
              </button>
            ))}
            <div className="grid gap-4 sm:grid-cols-3">
              {(['brand', 'model', 'title'] as const).map((key) => (
                <Field
                  key={key}
                  id={key}
                  label={key === 'title' ? t.name : t[key]}
                  value={shared[key] ?? ''}
                  onChange={(value) => setShared({ [key]: value })}
                />
              ))}
            </div>
          </section>
        ) : null}
        {document.step === 1 ? (
          <>
            <div className="space-y-4">
              {document.entries.map((e) =>
                card(
                  e,
                  <>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <label className="text-sm">
                        {t.condition}
                        <select
                          className={inputClass}
                          value={e.condition}
                          onChange={(event) =>
                            updateEntry(e.id, {
                              condition: event.target
                                .value as PhoneEntry['condition'],
                              ...(!e.sourceProductId ? { stock: 1 } : {}),
                              hasRealProductPhotos: false,
                            })
                          }
                        >
                          {(['new', 'open_box', 'used'] as const).map((c) => (
                            <option key={c} value={c}>
                              {t[c]}
                            </option>
                          ))}
                        </select>
                      </label>
                      <Field
                        id={`${e.id}-color`}
                        label={t.color}
                        value={e.color}
                        onChange={(value) =>
                          updateEntry(e.id, { color: value })
                        }
                      />
                      <Field
                        label={t.storage}
                        value={e.storage}
                        onChange={(value) =>
                          updateEntry(e.id, { storage: value })
                        }
                      />
                    </div>
                    <div className="mt-4 flex gap-3">
                      <button
                        className="btn-secondary"
                        onClick={() =>
                          change((d) => ({
                            ...d,
                            entries: [...d.entries, newPhoneEntry(e)],
                          }))
                        }
                      >
                        {t.add}
                      </button>
                      {!e.sourceProductId && document.entries.length > 1 ? (
                        <button
                          className="btn-secondary"
                          onClick={() =>
                            change((d) => ({
                              ...d,
                              entries: d.entries.filter(
                                (item) => item.id !== e.id,
                              ),
                            }))
                          }
                        >
                          {t.remove}
                        </button>
                      ) : null}
                    </div>
                  </>,
                ),
              )}
            </div>
          </>
        ) : null}
        {document.step === 2
          ? document.entries.map((e) =>
              card(
                e,
                <>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {(['price', 'stock', 'sku'] as const).map((key) => (
                      <Field
                        id={`${e.id}-${key}`}
                        key={key}
                        label={t[key]}
                        value={e[key]}
                        type={key === 'sku' ? 'text' : 'number'}
                        onChange={(value) =>
                          updateEntry(e.id, {
                            [key]: key === 'sku' ? value : Number(value),
                          })
                        }
                      />
                    ))}
                  </div>
                  {e.condition !== 'new' ? (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <Field
                        label={t.batteryHealth}
                        type="number"
                        value={e.batteryHealth ?? ''}
                        onChange={(value) =>
                          updateEntry(e.id, {
                            batteryHealth: value ? Number(value) : null,
                          })
                        }
                      />
                      {(
                        ['conditionNote', 'defects', 'accessories'] as const
                      ).map((key) => (
                        <Field
                          id={`${e.id}-${key}`}
                          key={key}
                          label={t[key]}
                          value={e[key]}
                          onChange={(value) =>
                            updateEntry(e.id, { [key]: value })
                          }
                        />
                      ))}
                      <label className="flex gap-3 text-sm">
                        <input
                          type="checkbox"
                          checked={e.hasRealProductPhotos}
                          onChange={(event) =>
                            updateEntry(e.id, {
                              hasRealProductPhotos: event.target.checked,
                            })
                          }
                        />
                        {t.hasRealProductPhotos}
                      </label>
                    </div>
                  ) : null}
                </>,
              ),
            )
          : null}
        {document.step === 3
          ? document.entries.map((e) =>
              card(
                e,
                <>
                  <PhonePhotoSlots
                    locale={locale}
                    slots={e.photos}
                    coverId={e.coverId}
                    disabled={uploading}
                    onBusy={setUploading}
                    onChange={(photos, coverId) => {
                      if (e.condition !== 'new' && photoMembershipChanged(e.photos.map(photo => photo.url), photos.map(photo => photo.url))) {
                        // Confirmation is shared by sibling variants, but their
                        // photos are not: keep these two updates separate.
                        updateEntry(e.id, { hasRealProductPhotos: false });
                      }
                      updateEntry(e.id, { photos, coverId });
                    }}
                  />
                  {e.condition !== 'new' ? (
                    <label className="mt-4 flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={e.hasRealProductPhotos}
                        disabled={uploading}
                        onChange={(event) => updateEntry(e.id, { hasRealProductPhotos: event.target.checked })}
                      />
                      {t.hasRealProductPhotos}
                    </label>
                  ) : null}
                  {e.condition === 'new' ? (
                    <div className="mt-4 space-y-3">
                      <label className="text-sm">
                        {t.source}
                        <select
                          className={inputClass}
                          disabled={uploading}
                          value={copyFrom[e.id] ?? ''}
                          onChange={(event) =>
                            setCopyFrom({
                              ...copyFrom,
                              [e.id]: event.target.value,
                            })
                          }
                        >
                          <option value="">{t.choose}</option>
                          {document.entries
                            .filter(
                              (other) =>
                                other.id !== e.id &&
                                other.condition === 'new' &&
                                other.color.trim().toLowerCase() ===
                                  e.color.trim().toLowerCase() &&
                                entryImages(other).length === 4,
                            )
                            .map((other) => (
                              <option key={other.id} value={other.id}>
                                {entryLabel(other)}
                              </option>
                            ))}
                        </select>
                      </label>
                      <button
                        className="btn-secondary"
                        disabled={uploading || !copyFrom[e.id]}
                        onClick={() => {
                          const from = document.entries.find(
                            (other) => other.id === copyFrom[e.id],
                          );
                          if (from)
                            updateEntry(e.id, copyNewPhonePhotos(from, e));
                        }}
                      >
                        {t.approveCopy}
                      </button>
                    </div>
                  ) : null}
                </>,
              ),
            )
          : null}
        {document.step === 4 ? (
          <section className="space-y-5 rounded-2xl border border-border p-5">
            <label className="block text-sm">
              {t.description}
              <textarea
                id="description"
                rows={6}
                className={inputClass}
                value={shared.description ?? ''}
                onChange={(e) => setShared({ description: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              {t.specs}
              <textarea
                rows={5}
                className={inputClass}
                value={
                  document.pendingSpecsText ??
                  (shared.specs ?? [])
                    .map((s) => `${s.label}: ${s.value}`)
                    .join('\n')
                }
                onChange={(e) => {
                  const text = e.target.value;
                  change((d) => ({
                    ...d,
                    pendingSpecsText: text,
                    pendingShared: {
                      ...shared,
                      specs: text.split('\n').map((line) => {
                        const [label, ...rest] = line.split(':');
                        return { label, value: rest.join(':').trim() };
                      }),
                    },
                  }));
                }}
              />
            </label>
            {(['manufacturer', 'euResponsiblePerson'] as const).map((party) => (
              <div key={party}>
                <h3 className="font-semibold">{t[party]}</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {(['name', 'address', 'email'] as const).map((key) => (
                    <Field
                      key={key}
                      label={key === 'name' ? 'Name' : t[key]}
                      value={shared[party]?.[key] ?? ''}
                      onChange={(value) =>
                        setShared({
                          [party]: { ...shared[party], [key]: value },
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
            <label className="block text-sm">
              {t.safetyWarnings}
              <textarea
                className={inputClass}
                value={(shared.safetyWarnings ?? []).join('\n')}
                onChange={(e) =>
                  setShared({ safetyWarnings: e.target.value.split('\n') })
                }
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  'countryOfOrigin',
                  'packageWeightKg',
                  'packageLengthCm',
                  'packageWidthCm',
                  'packageHeightCm',
                ] as const
              ).map((key) => (
                <Field
                  key={key}
                  label={t[key]}
                  value={shared[key] ?? ''}
                  type={key === 'countryOfOrigin' ? 'text' : 'number'}
                  onChange={(value) =>
                    setShared({
                      [key]:
                        key === 'countryOfOrigin'
                          ? value.toUpperCase()
                          : value
                            ? Number(value)
                            : null,
                    })
                  }
                />
              ))}
            </div>
          </section>
        ) : null}
        {sharedEdit ? (
          <div className="rounded-xl border border-gold p-4 text-sm">
            <p>{t.shared}</p>
            <details className="my-3" open>
              <summary>{t.review}</summary>
              <dl className="mt-3 space-y-3">
                {Object.entries(sharedEdit)
                  .filter(
                    ([key, value]) =>
                      key !== 'aiGeneratedFields' &&
                      JSON.stringify(value) !==
                      JSON.stringify(
                        (document.shared as Record<string, unknown>)[key],
                      ),
                  )
                  .map(([key, value]) => (
                    <div key={key}>
                      <dt className="font-semibold">
                        {String(t[key as keyof typeof t] ?? key)}
                      </dt>
                      <dd className="whitespace-pre-wrap break-words">
                        {typeof value === 'string'
                          ? value
                          : Array.isArray(value)
                            ? value
                                .map((v) =>
                                  typeof v === 'string'
                                    ? v
                                    : typeof v === 'object' && v
                                      ? Object.values(v).join(': ')
                                      : String(v),
                                )
                                .join('\n')
                            : value && typeof value === 'object'
                              ? Object.values(value).join('\n')
                              : String(value ?? '')}
                      </dd>
                    </div>
                  ))}
              </dl>
            </details>
            <ul className="my-3 list-inside list-disc">
              {document.entries.map((e) => (
                <li key={e.id}>{entryLabel(e)}</li>
              ))}
            </ul>
            <button
              className="btn-primary"
              onClick={() => {
                change((d) => ({
                  ...d,
                  shared: { ...d.shared, ...sharedEdit },
                  entries: d.entries.map((e) => ({
                    ...e,
                    details: {
                      ...e.details,
                      ...Object.fromEntries(
                        Object.entries(sharedEdit ?? {}).filter(
                          ([key, value]) =>
                            JSON.stringify(value) !==
                            JSON.stringify(
                              (d.shared as Record<string, unknown>)[key],
                            ),
                        ),
                      ),
                      aiGeneratedFields: appliedResearchTextFields(e.details.aiGeneratedFields, Object.fromEntries(
                        Object.entries(sharedEdit).filter(([key, value]) =>
                          normalizeAiTextFields(sharedEdit.aiGeneratedFields).includes(key as 'title' | 'description')
                          && JSON.stringify(value) !== JSON.stringify((d.shared as Record<string, unknown>)[key]),
                        ),
                      )),
                    },
                  })),
                  pendingShared: undefined,
                  pendingSpecsText: undefined,
                }));
              }}
            >
              {t.apply}
            </button>
          </div>
        ) : null}
        {document.step === 5 ? (
          <>
            <div className="rounded-xl border border-border p-4 text-sm">
              {(['manufacturer', 'euResponsiblePerson'] as const)
                .filter(
                  (key) =>
                    !document.shared[key]?.name ||
                    !document.shared[key]?.address ||
                    !document.shared[key]?.email,
                )
                .map((key) => (
                  <button
                    key={key}
                    className="block text-gold"
                    onClick={() => go(4)}
                  >
                    {t[key]} · {t.ebay}, {t.amazon} · {document.entries.length}{' '}
                    {locale === 'de' ? 'Einträge' : 'entries'}
                  </button>
                ))}
            </div>
            <Link href="/admin/marketplaces" className="text-gold">
              {t.connections}
            </Link>
            {document.entries.map((e) =>
              card(
                e,
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {(['mpn', 'gtin', 'asin', 'ebayEpid'] as const).map(
                      (key) => (
                        <Field
                          key={key}
                          label={t[key]}
                          value={e.details[key] ?? ''}
                          onChange={(value) => editDetails(e, { [key]: value })}
                        />
                      ),
                    )}
                    <label>
                      {t.identifierStatus}
                      <select
                        className={inputClass}
                        value={e.details.identifierStatus ?? 'unknown'}
                        onChange={(event) =>
                          editDetails(e, {
                            identifierStatus: event.target.value as
                              'unknown' | 'assigned' | 'not_applicable',
                          })
                        }
                      >
                        {(
                          ['unknown', 'assigned', 'not_applicable'] as const
                        ).map((v) => (
                          <option key={v} value={v}>
                            {t[v]}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="mt-5 space-y-3">
                    {channels.map((channel) => {
                      const ready = entryReadiness(document, e)[channel];
                      return (
                        <details
                          key={channel}
                          className="rounded-xl border border-border p-3"
                        >
                          <summary className="cursor-pointer text-sm font-semibold">
                            {t[channel]} ·{' '}
                            {ready.ready ? t.complete : t.incomplete}
                          </summary>
                          <label className="my-3 flex gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={e.channels.includes(channel)}
                              onChange={(event) =>
                                updateEntry(e.id, {
                                  channels: event.target.checked
                                    ? [...e.channels, channel]
                                    : e.channels.filter((c) => c !== channel),
                                })
                              }
                            />
                            {t[channel]}
                          </label>
                          {channel === 'ebay' ? (
                            <>
                              <Field
                                label={t.categoryId}
                                value={
                                  e.details.marketplaceCategoryMappings?.ebay_de
                                    ?.categoryId ?? ''
                                }
                                onChange={(value) =>
                                  editDetails(e, {
                                    marketplaceCategoryMappings: {
                                      ...e.details.marketplaceCategoryMappings,
                                      ebay_de: {
                                        ...e.details.marketplaceCategoryMappings
                                          ?.ebay_de,
                                        categoryId: value,
                                        requiredAspects: [],
                                      },
                                    },
                                  })
                                }
                              />
                              <button
                                className="btn-secondary mt-3"
                                disabled={
                                  !e.details.marketplaceCategoryMappings
                                    ?.ebay_de?.categoryId
                                }
                                onClick={async () => {
                                  try {
                                    const result = await call(
                                      `/api/admin/marketplaces/ebay/taxonomy?categoryId=${encodeURIComponent(e.details.marketplaceCategoryMappings?.ebay_de?.categoryId ?? '')}`,
                                    );
                                    editDetails(e, {
                                      marketplaceCategoryMappings: {
                                        ...e.details
                                          .marketplaceCategoryMappings,
                                        ebay_de: {
                                          ...e.details
                                            .marketplaceCategoryMappings
                                            ?.ebay_de,
                                          requiredAspects: (
                                            result.aspects ?? []
                                          )
                                            .filter(
                                              (a: { required: boolean }) =>
                                                a.required,
                                            )
                                            .map(
                                              (a: { name: string }) => a.name,
                                            ),
                                        },
                                      },
                                    });
                                  } catch (error) {
                                    setError((error as Error).message);
                                  }
                                }}
                              >
                                {locale === 'de'
                                  ? 'Erforderliche Merkmale laden'
                                  : 'Load required aspects'}
                              </button>
                              {(
                                e.details.marketplaceCategoryMappings?.ebay_de
                                  ?.requiredAspects ?? []
                              ).map((aspect) => (
                                <Field
                                  key={aspect}
                                  label={aspect}
                                  value={(
                                    e.details.marketplaceAttributes?.ebay_de?.[
                                      aspect
                                    ] ?? []
                                  ).join(', ')}
                                  onChange={(value) =>
                                    editDetails(e, {
                                      marketplaceAttributes: {
                                        ...e.details.marketplaceAttributes,
                                        ebay_de: {
                                          ...e.details.marketplaceAttributes
                                            ?.ebay_de,
                                          [aspect]: value
                                            .split(',')
                                            .map((v) => v.trim())
                                            .filter(Boolean),
                                        },
                                      },
                                    })
                                  }
                                />
                              ))}
                            </>
                          ) : null}
                          {channel === 'amazon' ? (
                            <>
                              <Field
                                label={t.productType}
                                value={
                                  e.details.marketplaceCategoryMappings
                                    ?.amazon_de?.productType ?? ''
                                }
                                onChange={(value) =>
                                  editDetails(e, {
                                    marketplaceCategoryMappings: {
                                      ...e.details.marketplaceCategoryMappings,
                                      amazon_de: { productType: value },
                                    },
                                  })
                                }
                              />
                              {(
                                [
                                  'amazonRenewedApproved',
                                  'amazonGtinExemption',
                                ] as const
                              ).map((key) => (
                                <label
                                  className="mt-3 flex gap-2 text-sm"
                                  key={key}
                                >
                                  <input
                                    type="checkbox"
                                    checked={Boolean(e.details[key])}
                                    onChange={(event) =>
                                      editDetails(e, {
                                        [key]: event.target.checked,
                                      })
                                    }
                                  />
                                  {t[key]}
                                </label>
                              ))}
                              <label className="mt-3 flex gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={Boolean(
                                    e.details.batteryDetails?.included,
                                  )}
                                  onChange={(event) =>
                                    editDetails(e, {
                                      batteryDetails: {
                                        ...e.details.batteryDetails,
                                        included: event.target.checked,
                                      },
                                    })
                                  }
                                />
                                {t.included}
                              </label>
                              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                {(
                                  [
                                    'cellComposition',
                                    'count',
                                    'wattHours',
                                    'unNumber',
                                  ] as const
                                ).map((key) => (
                                  <Field
                                    key={key}
                                    label={t[key]}
                                    type={
                                      key === 'count' || key === 'wattHours'
                                        ? 'number'
                                        : 'text'
                                    }
                                    value={
                                      e.details.batteryDetails?.[key] ?? ''
                                    }
                                    onChange={(value) =>
                                      editDetails(e, {
                                        batteryDetails: {
                                          ...e.details.batteryDetails,
                                          [key]:
                                            key === 'count' ||
                                            key === 'wattHours'
                                              ? Number(value)
                                              : value,
                                        },
                                      })
                                    }
                                  />
                                ))}
                              </div>
                            </>
                          ) : null}
                          <ul className="mt-3 list-inside list-disc text-sm text-muted">
                            {ready.errors
                              .filter(
                                (message) =>
                                  !message.includes('GPSR manufacturer') &&
                                  !message.includes('EU responsible person'),
                              )
                              .map((message) => (
                                <li key={message}>
                                  {translatePhoneChannelMessage(
                                    message,
                                    locale,
                                  )}
                                </li>
                              ))}
                          </ul>
                        </details>
                      );
                    })}
                  </div>
                </>,
              ),
            )}
          </>
        ) : null}
        {document.step === 6 ? (
          <>
            <h3 className="font-semibold">{t.tasks}</h3>
            <div className="space-y-2">
              {document.entries.flatMap((e) =>
                entryProblems(document, e, locale)
                  .filter(
                    (p) =>
                      e === document.entries[0] || ![0, 4].includes(p.step),
                  )
                  .map((p) => (
                    <button
                      className="block text-left text-sm text-gold"
                      key={`${e.id}-${p.field}`}
                      onClick={() => go(p.step, e.id, p.field)}
                    >
                      {[0, 4].includes(p.step)
                        ? document.shared.model
                        : entryLabel(e)}
                      : {p.message}
                    </button>
                  )),
              )}
            </div>
            {document.entries.map((e) =>
              card(
                e,
                <div className="flex flex-wrap items-center gap-5">
                  {entryImages(e)[0] ? (
                    <Image
                      src={entryImages(e)[0]}
                      alt={entryLabel(e)}
                      width={80}
                      height={100}
                      unoptimized
                      className="h-24 w-20 object-contain"
                    />
                  ) : null}
                  <div className="flex-1 text-sm">
                    <p>
                      {e.price.toLocaleString(
                        locale === 'de' ? 'de-DE' : 'en-GB',
                        { style: 'currency', currency: 'EUR' },
                      )}{' '}
                      · {t.stock}: {e.stock} · {entryImages(e).length}/4{' '}
                      {t.photoCount}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3">
                      {channels.map((c) => (
                        <button
                          type="button"
                          className="text-left underline decoration-border underline-offset-4"
                          onClick={() => go(5, e.id)}
                          key={c}
                        >
                          {t[c]}:{' '}
                          {
                            t[
                              draft.results.find((r) => r.entryId === e.id)
                                ?.channels[c] ??
                                (entryReadiness(document, e)[c].ready
                                  ? 'complete'
                                  : 'incomplete')
                            ]
                          }
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="flex gap-2 text-sm">
                    <input
                      type="checkbox"
                      disabled={entryProblems(document, e, locale).length > 0}
                      checked={selected.includes(e.id)}
                      onChange={(event) =>
                        setSelected(
                          event.target.checked
                            ? [...selected, e.id]
                            : selected.filter((id) => id !== e.id),
                        )
                      }
                    />
                    {t.select}
                  </label>
                </div>,
              ),
            )}
            <button
              className="btn-primary"
              disabled={
                busy || uploading || Boolean(sharedEdit) || error === 'conflict'
              }
              onClick={publish}
            >
              {t.publish}
            </button>
          </>
        ) : null}
      </fieldset>
      <footer className="sticky bottom-3 z-10 flex items-center justify-between gap-4 rounded-2xl border border-border bg-background p-4 shadow-xl">
        <button
          className="btn-secondary"
          disabled={document.step === 0 || busy || uploading}
          onClick={() => go(document.step - 1)}
        >
          {t.back}
        </button>
        <span className="text-sm text-muted">{document.step + 1} / 7</span>
        <button
          className="btn-primary disabled:opacity-40"
          disabled={
            document.step === 6 || busy || uploading || Boolean(sharedEdit)
          }
          onClick={() => go(document.step + 1)}
        >
          {t.next}
        </button>
      </footer>
    </div>
  );
}
