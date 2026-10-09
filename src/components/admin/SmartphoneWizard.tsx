'use client';

import { markAdminListsChanged } from '@/lib/admin-list-navigation';
import { appliedResearchTextFields, normalizeAiTextFields } from '@/lib/product-ai-fields';
import { applyEditorResearch } from '@/lib/smartphone-editor/research';
import { changeEntryColor, setEntryPhotos, sharesColorPhotos } from '@/lib/smartphone-editor/photos';
import type { ExperienceCandidate } from '@/lib/admin-product-types';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ProductPayload } from '@/lib/product-write-payload';
import {
  channels,
  newPhoneEntry,
  isResearchPlaceholder,
  newBatteryHealthOffer,
  entryImages,
  entryReadiness,
  entryProblems,
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
import VersionOfferFields from './VersionOfferFields';
import ProductInformationFields from './ProductInformationFields';
import EditorExperienceFields from './EditorExperienceFields';
import EditorChannelFields from './EditorChannelFields';
import OfferPresetManager from './OfferPresetManager';
import { defaultOfferPresets, packageItemIcon, type OfferPresets } from '@/lib/product-offer-options';
import { localizedText } from '@/lib/product-experience';
import { offerEditorText, catalogToolsText } from '@/lib/i18n';
import { formatBatteryHealth } from '@/lib/product-offer-options';
import ConfirmDeletionDialog from './ConfirmDeletionDialog';
import ProductDeleteButton from './ProductDeleteButton';

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
  const router = useRouter();
  const t = phoneEditorText[locale];
  const cleanup = catalogToolsText[locale];
  const [manualVersion, setManualVersion] = useState(false);
  const [draftSelection, setDraftSelection] = useState<string[]>([]);
  const [draftDeletion, setDraftDeletion] = useState<Array<{id: string; revision: number}> | null>(null);
  const deletionDialog = draftDeletion ? <ConfirmDeletionDialog locale={locale} title={`${cleanup.deleteDrafts} (${draftDeletion.length})`} description={cleanup.draftDeleteHint} onClose={() => setDraftDeletion(null)} onConfirm={() => confirmDraftDeletion()}/> : null;
  const [presets, setPresets] = useState<OfferPresets>(defaultOfferPresets);
  const reloadPresets = async () => { const result = await call('/api/admin/products/offer-presets'); setPresets(result.presets); };
  useEffect(() => {
    let active = true;
    void call('/api/admin/products/offer-presets').then(result => { if (active) setPresets(result.presets); }).catch(() => {});
    return () => { active = false; };
  }, []);
  const [draft, setDraft] = useState<PhoneDraft | null>(null);
  const [document, setDocument] = useState<PhoneDocument | null>(null);
  const [drafts, setDrafts] = useState<{ id: string; title: string; revision: number }[]>([]);
  const [status, setStatus] = useState('saved');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [photoConfirmation, setPhotoConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [models, setModels] = useState<
    { id: string; brand: string; model: string; title: string }[]
  >([]);
  const sharedEdit = document?.pendingShared;
  const [experienceEntryId, setExperienceEntryId] = useState('');
  const [candidates, setCandidates] = useState<ExperienceCandidate[]>([]);
  useEffect(() => {
    if (!draft?.id) return;
    let active = true;
    void call('/api/admin/smartphone-drafts?candidates=1').then(result => { if (active) setCandidates(result.products); }).catch(() => {});
    return () => { active = false; };
  }, [draft?.id]);
  const [copyFrom, setCopyFrom] = useState<Record<string, string>>({});
  const current = useRef<PhoneDocument | null>(null);
  const saved = useRef('');
  const revision = useRef(0);
  const draftId = useRef('');
  const saving = useRef<Promise<void> | null>(null);
  const deleting = useRef(false);
  const publishRetry = useRef<{
    requestId: string;
    revision: number;
    entryIds: string[];
    confirmedSharedPhotos?: boolean;
  } | null>(null);
  const load = useCallback((next: PhoneDraft) => {
    setManualVersion(false); setDraftSelection([]);
    revision.current = next.revision;
    draftId.current = next.id;
    current.current = next.document;
    saved.current = JSON.stringify(next.document);
    setDraft(next);
    setDocument(next.document);
    setStatus('saved');
    setError('');
    const navigation = new URLSearchParams({ draft: next.id });
    const returnTo = new URLSearchParams(window.location.search).get("returnTo");
    if (returnTo) navigation.set("returnTo", returnTo);
    window.history.replaceState(
      null,
      '',
      `/admin/products/phone?${navigation}`,
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
    if (deleting.current) return;
    if (saving.current) await saving.current;
    if (deleting.current) return;
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
        setError('');
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
      const chargers = patch.experience?.packageContents.filter(item => packageItemIcon(item) === 'charger');
      if (chargers?.length && !Object.prototype.hasOwnProperty.call(patch.details ?? {}, 'chargerIncluded')) patch = { ...patch, details: { ...target.details, ...patch.details, chargerIncluded: chargers.some(item => item.included) } };
      if (patch.condition && (!target.conditionNote.trim() || target.conditionNotePresetId)) {
        const condition = patch.condition;
        const preset = presets.conditionNotes.find(item => item.id === presets.defaults[condition]);
        if (preset) patch = { ...patch, conditionNote: localizedText(preset.text, locale), conditionNotePresetId: preset.id };
      }
      if ('conditionNote' in patch && !('conditionNotePresetId' in patch)) patch = { ...patch, conditionNotePresetId: undefined };
      const sharedCondition = [
        'condition',
        'conditionNote',
        'batteryHealth',
        'batteryHealthMax',
        'hasRealProductPhotos',
        'defects',
        'accessories',
        'experience',
      ].some((k) => k in patch);
      const productSettings = Object.fromEntries(Object.entries(patch.details ?? {}).filter(([key]) => ['isActive', 'isHomepageFeatured'].includes(key)));
      return {
        ...doc,
        entries: doc.entries.map((e) =>
          e.id === id
            ? { ...e, ...patch }
            :
          (sharedCondition &&
            target.variantIndex !== undefined &&
            e.sourceProductId === target.sourceProductId)
            ? { ...e, ...patch, details: { ...e.details, ...Object.fromEntries(Object.entries(patch.details ?? {}).filter(([key]) => key === 'chargerIncluded')) } }
            : target.sourceProductId && e.sourceProductId === target.sourceProductId && Object.keys(productSettings).length
              ? { ...e, details: { ...e.details, ...productSettings } } : e,
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
        confirmedSharedPhotos: photoConfirmation === JSON.stringify({ document: current.current, selected }),
      };
      publishRetry.current = request;
      const next = await call(
        `/api/admin/smartphone-drafts/${draftId.current}/publish`,
        'POST',
        request,
      );
      publishRetry.current = null;
      load(next);
      markAdminListsChanged();
      setNotice('publishDone');
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
  const confirmDraftDeletion = async () => {
    if (!draftDeletion || deleting.current) return;
    deleting.current = true; setBusy(true);
    try {
      if (saving.current) await saving.current;
      const targets = draftDeletion.map(item => item.id === draftId.current ? { ...item, revision: revision.current } : item);
      const response = await fetch('/api/admin/smartphone-drafts/bulk-delete', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ confirmation: 'DELETE', drafts: targets })});
      const value = await response.json(); if (!response.ok) throw new Error(cleanup[value.error as keyof typeof cleanup] ?? cleanup.failed);
      if (targets.some(item => item.id === draftId.current)) {
        current.current = null; draftId.current = ''; revision.current = 0; saved.current = 'null'; publishRetry.current = null; setDraft(null); setDocument(null); setSelected([]); setPhotoConfirmation(''); setStatus('saved');
        const navigation = new URL(window.location.href); navigation.searchParams.delete('draft'); if (productId) navigation.searchParams.set('product',productId); window.history.replaceState(null,'',navigation.pathname+navigation.search);
        const next = await call(`/api/admin/smartphone-drafts${productId ? `?productId=${encodeURIComponent(productId)}` : ''}`); setDrafts(next.drafts);
      } else { const next = await call(`/api/admin/smartphone-drafts${productId ? `?productId=${encodeURIComponent(productId)}` : ''}`); setDrafts(next.drafts); }
      setDraftSelection([]); setDraftDeletion(null); setNotice('draftDeleted'); markAdminListsChanged();
    } finally { deleting.current = false; setBusy(false); }
  };
  const removePublishedVersion = async (entryId: string, fingerprint: string) => {
    await flush();
    deleting.current = true;
    setBusy(true);
    try {
      const result = await call(`/api/admin/smartphone-drafts/${draftId.current}/remove-product`, 'POST', {
        revision: revision.current, entryId, fingerprint, confirmation: 'DELETE',
      });
      load(result);
      setSelected(ids => ids.filter(id => result.document.entries.some((entry: PhoneEntry) => entry.id === id)));
      setNotice(cleanup.versionRemoved);
      markAdminListsChanged();
    } catch (reason) {
      const code = (reason as Error).message;
      setError(code);
      throw new Error(cleanup[code as keyof typeof cleanup] ?? t[code as keyof typeof t] ?? cleanup.failed);
    } finally {
      deleting.current = false;
      setBusy(false);
    }
  };
  const removeDraft = (id: string, expectedRevision: number) => {
    if (busy || deleting.current) return;
    setDraftDeletion([{ id, revision: expectedRevision }]);
  };
  if (!draft || !document)
    return (
      <div className="space-y-5">
        {deletionDialog}
        <h2 className="text-2xl font-semibold">{t.title}</h2>
        {error ? <p role="alert">{String(errorText(error))}</p> : null}
        {notice === 'draftDeleted' ? <p role="status">{t.draftDeleted}</p> : null}
        <button
          className="btn-primary"
          disabled={busy || initializing}
          onClick={() => void start(productId ? 1 : undefined)}
        >
          {productId ? (locale === 'de' ? 'Varianten bearbeiten' : 'Edit versions') : t.newDraft}
        </button>
        {productId ? <div className="flex flex-wrap gap-3">
          <button className="btn-secondary" disabled={busy || initializing} onClick={() => void start(3)}>{locale === 'de' ? 'Variantenfotos bearbeiten' : 'Edit variant photos'}</button>
          <button className="btn-secondary" disabled={busy || initializing} onClick={() => void start(1)}>{t.priceShortcut}</button>
          <p className="w-full text-sm text-muted">{locale === 'de' ? 'Die vorhandenen Varianten werden als Entwurf geladen. Das veröffentlichte Produkt ändert sich erst nach der Prüfung und Veröffentlichung.' : 'Existing versions open as a draft. The live product changes only after review and publication.'}</p>
        </div> : null}
        <h3>{t.resume}</h3>
        {productId ? <ProductDeleteButton id={productId} title={t.title} locale={locale} onDeleted={() => router.push('/admin/products')}/> : null}
        {drafts.length ? <div className="flex flex-wrap items-center gap-3"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draftSelection.length === drafts.length} onChange={event => setDraftSelection(event.target.checked ? drafts.map(item => item.id) : [])}/>{cleanup.selectAllDrafts}</label><button type="button" className="btn-secondary" disabled={!draftSelection.length || busy} onClick={() => setDraftDeletion(drafts.filter(item => draftSelection.includes(item.id)).map(({id,revision}) => ({id,revision})))}>{cleanup.deleteDrafts} ({draftSelection.length})</button></div> : null}
        {drafts.length ? (
          drafts.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3">
            <input type="checkbox" aria-label={`${cleanup.selectDraft}: ${item.title || item.id}`} checked={draftSelection.includes(item.id)} onChange={event => setDraftSelection(ids => event.target.checked ? [...ids,item.id] : ids.filter(id => id !== item.id))}/>
            <button
              className="block text-gold"
              disabled={busy || initializing}
              onClick={() => {
                void call(`/api/admin/smartphone-drafts/${item.id}`)
                  .then(load)
                  .catch((e) => setError(e.message));
              }}
            >
              {item.title || item.id}
            </button>
            <button type="button" className="rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-400 disabled:opacity-50" disabled={busy || initializing} onClick={() => void removeDraft(item.id, item.revision)}>
              {t.deleteDraft}
            </button>
            </div>
          ))
        ) : (
          <p className="text-muted">{t.empty}</p>
        )}
      </div>
    );
  const entryLabel = (e: PhoneEntry) =>
    `${t[e.condition]} · ${e.color || '—'} · ${e.storage || '—'}${e.condition === 'used' && e.batteryHealth != null ? ` · ${formatBatteryHealth(e.batteryHealth, e.batteryHealthMax != null ? {min:e.batteryHealth,max:e.batteryHealthMax} : undefined)}` : ''} · #${e.sku.slice(-8)}`;
  const versionEntries = document.variantSuggestions?.length && !manualVersion ? document.entries.filter(entry => !isResearchPlaceholder(entry, {...document.shared,...document.pendingShared})) : document.entries;
  const shared = sharedEdit ?? document.shared;
  const readyIds = document.entries.filter(e => entryProblems(document, e, locale).length === 0 && e.channels.length > 0).map(e => e.id);
  const totalUnits = versionEntries.reduce((total, e) => total + (Number.isInteger(e.stock) && e.stock >= 0 ? e.stock : 0), 0);
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
      {deletionDialog}
      <style>{`@keyframes phone-notice-in{from{transform:translateX(110%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
      {!error && notice ? <div role="status" className="fixed right-4 top-20 z-[100] w-[calc(100%-2rem)] max-w-sm rounded-xl border border-gold bg-background p-4 shadow-xl motion-safe:animate-[phone-notice-in_200ms_ease-out]">
        <p>{String(errorText(notice))}</p>
        <button type="button" className="btn-secondary mt-2" onClick={() => setNotice('')}>{t.dismissNotice}</button>
      </div> : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-foreground">
          {document.shared.title || t.title}
        </h2>
        <span role="status" className="text-sm text-muted">
          {String(errorText(status))}
        </span>
        <p className="text-sm font-semibold" aria-live="polite">
          {t.totalStock}: {totalUnits} {t.units} · {versionEntries.length} {t.variants}
        </p>
        <button
          className="btn-secondary"
          disabled={busy || uploading}
          onClick={() => go(1)}
        >
          {t.priceShortcut}
        </button>
        <button type="button" className="rounded-xl border border-red-500/30 px-3 py-2 text-sm text-red-400 disabled:opacity-50" disabled={busy || uploading} onClick={() => void removeDraft(draft.id, draft.revision)}>
          {t.deleteDraft}
        </button>
        {productId ? <ProductDeleteButton id={productId} title={document.shared.title || t.title} locale={locale} onDeleted={() => router.push('/admin/products')}/> : null}
      </div>
      {error ? (
        <div
          role="alert"
          className="fixed right-4 top-20 z-[100] max-h-[75vh] w-[calc(100%-2rem)] max-w-sm overflow-y-auto rounded-xl border border-gold bg-background p-4 text-foreground shadow-xl motion-safe:animate-[phone-notice-in_200ms_ease-out]"
        >
          <p>{String(errorText(error))}</p>
          <button type="button" className="btn-secondary mt-2 mr-2" onClick={() => setError('')}>{t.dismissNotice}</button>
          {error === 'shared_photos_confirmation_required' ? <button type="button" className="btn-secondary mt-2" onClick={() => { setError(''); go(6); }}>{t.reviewPhotos}</button> :
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
          </button>}
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
              <AiFillButton locale={locale} query={search || [shared.brand, shared.model, shared.title].filter(Boolean).join(' ')}
                color={document.entries.every(entry => entry.color === document.entries[0]?.color) ? document.entries[0]?.color : undefined}
                eprelId={shared.eprelId}
                condition={document.entries.every(entry => entry.condition === document.entries[0]?.condition) ? document.entries[0]?.condition : undefined}
                onError={setError}
                onResult={(result) => {
                    change(d => applyEditorResearch(d, result));
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
            <label className="block text-sm">{locale === 'de' ? 'Kategorie' : 'Category'}<select className={inputClass} value={shared.category ?? 'smartphones'} onChange={event => setShared({ category: event.target.value })}>
              {['smartphones', 'tablets', 'laptops', 'consoles', 'accessories', 'parts'].map(category => <option key={category} value={category}>{{ smartphones: 'Smartphones', tablets: 'Tablets', laptops: 'Laptops', consoles: locale === 'de' ? 'Konsolen' : 'Consoles', accessories: locale === 'de' ? 'Zubehör' : 'Accessories', parts: locale === 'de' ? 'Ersatzteile' : 'Spare parts' }[category]}</option>)}
            </select></label>
            <div className="grid gap-4 sm:grid-cols-3">
              {(['brand', 'model', 'title', 'subtitle'] as const).map((key) => (
                <Field
                  key={key}
                  id={key}
                  label={key === 'title' ? t.name : key === 'subtitle' ? (locale === 'de' ? 'Untertitel' : 'Subtitle') : t[key]}
                  value={shared[key] ?? ''}
                  onChange={(value) => setShared({ [key]: value })}
                />
              ))}
            </div>
          </section>
        ) : null}
        {document.step === 1 ? (
          <>
            <OfferPresetManager key={`${presets.revision}-${presets.conditionNotes.length}-${presets.gifts.length}`} locale={locale} value={presets} onReload={reloadPresets} onSave={async value => { const result = await call('/api/admin/products/offer-presets', 'PATCH', value); setPresets(result.presets); setNotice(offerEditorText[locale].saved); }}/>
            {document.variantSuggestions?.length ? <section className="rounded-xl border border-border p-4 space-y-3"><h3 className="font-semibold">{locale === 'de' ? 'Versionen aus der KI-Recherche' : 'Versions suggested by AI research'}</h3><p className="text-sm text-muted">{locale === 'de' ? 'Version auswählen und tatsächlichen Bestand, Preis und Zustand eintragen.' : 'Choose a version and enter its actual quantity, price and condition.'}</p><div className="flex flex-wrap gap-2">{document.variantSuggestions.map((suggestion, index) => <button key={index} type="button" className="btn-secondary" disabled={document.entries.length >= 100 && !document.entries.some(entry => isResearchPlaceholder(entry, {...document.shared,...document.pendingShared}))} onClick={() => change(d => {
              const donor = d.entries.find(entry => entry.condition === 'new' && entry.color.trim().toLowerCase() === suggestion.color.trim().toLowerCase());
              if (d.entries.some(item => item.condition === 'new' && item.color === suggestion.color && item.storage === suggestion.storage)) return d;
              const empty = d.entries.find(entry => isResearchPlaceholder(entry, {...d.shared,...d.pendingShared}));
              if (!empty && d.entries.length >= 100) return d;
              const entry = empty ? { ...empty, ...suggestion, stock: 0 } : { ...newPhoneEntry(donor ?? d.entries[0]), ...suggestion, stock: 0, price: 0 };
              return { ...d, entries: empty ? d.entries.map(item => item.id === empty.id ? entry : item) : [...d.entries, entry] };
            })}>{suggestion.color} · {suggestion.storage}</button>)}</div></section> : null}
            {document.variantSuggestions?.length ? <div className="flex flex-wrap items-center gap-3"><button type="button" className="btn-secondary" disabled={document.entries.length >= 100} onClick={() => { setManualVersion(true); if (!document.entries.some(entry => isResearchPlaceholder(entry, {...document.shared,...document.pendingShared}))) change(d => ({...d,entries:[...d.entries,newPhoneEntry()]})); }}>{cleanup.manualVersion}</button>{!versionEntries.length ? <p className="text-sm text-muted">{cleanup.chooseResearch}</p> : null}</div> : null}
            <div className="space-y-4">
              {versionEntries.map((e) =>
                card(
                  e,
                  <>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <label className="text-sm">
                        {t.condition}
                        <select
                          aria-label={t.condition}
                          className={inputClass}
                          value={e.condition}
                          onChange={(event) =>
                            updateEntry(e.id, {
                              condition: event.target
                                .value as PhoneEntry['condition'],
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
                          change(doc => changeEntryColor(doc, e.id, value))
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
                    <label className="mt-3 flex gap-2 text-sm"><input type="checkbox" checked={Boolean(e.individualPhotos)} onChange={event => updateEntry(e.id, { individualPhotos: event.target.checked })} />{locale === 'de' ? 'Eigene Fotos für diese Version verwenden' : 'Use separate photos for this version'}</label>
                    <VersionOfferFields locale={locale} entry={e} presets={presets} chargerIncluded={Object.prototype.hasOwnProperty.call(e.details, 'chargerIncluded') ? e.details.chargerIncluded : shared.chargerIncluded} onChange={patch => updateEntry(e.id, patch)} />
                    <div className="mt-4 flex flex-wrap gap-3">
                      {e.condition === 'used' ? <button type="button" className="btn-secondary" disabled={document.entries.length >= 100} onClick={() => change(d => ({ ...d, entries: [...d.entries, newBatteryHealthOffer(e)] }))}>{cleanup.batteryTier}</button> : null}
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
                      {e.sourceProductId && document.entries.filter(item => item.sourceProductId === e.sourceProductId).length === 1 ? <ProductDeleteButton id={e.sourceProductId} title={`${shared.title || t.title} · ${entryLabel(e)}`} locale={locale} previewUrl={`/api/admin/smartphone-drafts/${draft.id}/remove-product?entryId=${encodeURIComponent(e.id)}`} onConfirmDeletion={preview => removePublishedVersion(e.id, preview.fingerprint)}/> : null}
                      {!e.sourceProductId && (document.entries.length > 1 || document.variantSuggestions?.length) ? (
                        <button
                          className="btn-secondary"
                          onClick={() =>
                            change((d) => ({
                              ...d,
                              entries: d.entries.length === 1 ? [newPhoneEntry()] : d.entries.filter(
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
        {document.step === 2 ? <section className="space-y-4">
          <label className="block text-sm">{locale === 'de' ? 'Version für Produktdarstellung' : 'Version for product presentation'}<select className={inputClass} value={document.entries.some(e => e.id === experienceEntryId) ? experienceEntryId : document.entries[0].id} onChange={event => setExperienceEntryId(event.target.value)}>
            {document.entries.map(e => <option key={e.id} value={e.id}>{entryLabel(e)}</option>)}
          </select></label>
          {(() => { const e = document.entries.find(entry => entry.id === experienceEntryId) ?? document.entries[0]; return <EditorExperienceFields key={e.id} locale={locale} value={e.experience} family={document.family} candidates={candidates} onChange={experience => updateEntry(e.id, { experience })} onFamilyChange={family => change(d => ({ ...d, family }))} />; })()}
        </section> : null}
        {document.step === 3 && document.researchGallery?.length ? <div className="rounded-xl border border-border p-4 text-sm">{locale === 'de' ? 'Freigegebene Bilder aus der Recherche: Galerie prüfen und für die passende neue Version übernehmen.' : 'Licensed research images: review the gallery and apply it to the matching new version.'}</div> : null}
        {document.step === 3
          ? document.entries.filter((e, index, entries) => !sharesColorPhotos(e) || !entries.slice(0, index).some(other => sharesColorPhotos(other) && other.color.trim().toLowerCase() === e.color.trim().toLowerCase())).map((e) =>
              card(
                e,
                <>
                  <p className="mb-3 text-sm text-muted">{sharesColorPhotos(e) ? (locale === 'de' ? `Eine Galerie für alle neuen Versionen in ${e.color || 'dieser Farbe'}. Speicher und Preis bleiben getrennt.` : `One gallery for all new versions in ${e.color || 'this color'}. Storage and prices remain separate.`) : (locale === 'de' ? 'Individuelle Produktfotos' : 'Individual product photos')}</p>
                  <PhonePhotoSlots
                    locale={locale}
                    slots={e.photos}
                    coverId={e.coverId}
                    disabled={uploading}
                    onBusy={setUploading}
                    onChange={(photos, coverId) => {
                      change(d => setEntryPhotos(d, e.id, photos, coverId));
                    }}
                  />
                  {e.condition === 'new' && document.researchGallery?.length ? <button type="button" className="btn-secondary mt-3" onClick={() => { const photos = [...new Set([...entryImages(e), ...document.researchGallery ?? []])].map(url => ({ id: crypto.randomUUID(), url })); change(d => setEntryPhotos(d, e.id, photos, photos[0].id)); }}>{locale === 'de' ? 'Passende Recherchebilder übernehmen' : 'Apply matching research images'}</button> : null}
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
                  <label className="mt-3 flex gap-2 text-sm"><input type="checkbox" checked={Boolean(e.individualPhotos)} onChange={event => updateEntry(e.id, { individualPhotos: event.target.checked })} />{locale === 'de' ? 'Eigene Fotos für diese Version verwenden' : 'Use separate photos for this version'}</label>
                  {(
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
                                entryImages(other).length > 0,
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
                            { const photos = entryImages(from).map(url => ({ id: crypto.randomUUID(), url })); change(d => setEntryPhotos(d, e.id, photos, photos[0].id)); }
                        }}
                      >
                        {t.approveCopy}
                      </button>
                    </div>
                  )}
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
            <ProductInformationFields locale={locale} value={shared} onChange={setShared} />
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
                  <div className="grid gap-4 sm:grid-cols-2 mb-4">
                    {(['mpn', 'gtin'] as const).map(key => <Field key={key} label={t[key]} value={e.details[key] ?? ''} onChange={value => editDetails(e, { [key]: value })} />)}
                  </div>
                  <EditorChannelFields locale={locale} value={{ ...document.shared, ...e.details, condition: e.condition }} onChange={patch => editDetails(e, patch)} />
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
            <label className="flex items-start gap-3 rounded-xl border border-border p-4 text-sm">
              <input type="checkbox" className="mt-1" checked={photoConfirmation === JSON.stringify({document,selected})}
                onChange={event => { publishRetry.current = null; setPhotoConfirmation(event.target.checked ? JSON.stringify({document,selected}) : ''); }}/>
              {t.confirmSharedPhotos}
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className="btn-secondary" disabled={!readyIds.length}
                onClick={() => setSelected(readyIds)}>{t.selectAllReady}</button>
              <button type="button" className="btn-secondary" disabled={!selected.length}
                onClick={() => setSelected([])}>{t.clearSelection}</button>
              <span className="text-sm" aria-live="polite">{selected.filter(id => readyIds.includes(id)).length} / {document.entries.length} {t.selectedEntries}</span>
            </div>
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
                      · {t.stock}: {e.stock} · {entryImages(e).length}{' '}
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
                  {e.condition !== 'new' ? (
                    <label id={`${e.id}-hasRealProductPhotos`} tabIndex={-1}
                      className={`flex w-full items-start gap-3 rounded-xl border p-4 text-sm ${e.hasRealProductPhotos ? 'border-border' : 'border-gold bg-gold/5'}`}>
                      <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-gold"
                        checked={e.hasRealProductPhotos} disabled={uploading || entryImages(e).length === 0}
                        onChange={event => updateEntry(e.id, { hasRealProductPhotos: event.target.checked })} />
                      {t.hasRealProductPhotos}
                    </label>
                  ) : null}
                  <div className="flex w-full flex-wrap gap-4 text-sm">
                    <label className="flex gap-2"><input type="checkbox" checked={e.details.isActive ?? e.channels.includes('store')} onChange={event => editDetails(e, { isActive: event.target.checked })} />{locale === 'de' ? 'Im Shop aktiv' : 'Active in store'}</label>
                    <label className="flex gap-2"><input type="checkbox" checked={Boolean(e.details.isHomepageFeatured)} onChange={event => editDetails(e, { isHomepageFeatured: event.target.checked })} />{locale === 'de' ? 'Auf der Startseite hervorheben' : 'Feature on homepage'}</label>
                  </div>
                  <label className="flex gap-2 text-sm">
                    <input
                      type="checkbox"
                      disabled={!readyIds.includes(e.id)}
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
                  {entryProblems(document, e, locale).map(problem => (
                    <button type="button" key={problem.field} className="w-full text-left text-sm text-gold underline"
                      onClick={() => go(problem.step, e.id, problem.field)}>{problem.message}</button>
                  ))}
                </div>,
              ),
            )}
            <button
              className="btn-primary"
              disabled={
                busy || uploading || Boolean(sharedEdit) || error === 'conflict' || !selected.some(id => readyIds.includes(id))
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
