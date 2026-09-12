'use client';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { phoneEditorText } from '@/lib/smartphone-editor/i18n';
import type { PhotoSlot } from '@/lib/smartphone-editor/model';

type Props = {
  locale: 'de' | 'en';
  slots: PhotoSlot[];
  coverId: string;
  onChange: (slots: PhotoSlot[], coverId: string) => void;
  onBusy?: (busy: boolean) => void;
  disabled?: boolean;
};
export default function PhonePhotoSlots({
  locale,
  slots,
  coverId,
  onChange,
  onBusy,
  disabled,
}: Props) {
  const t = phoneEditorText[locale];
  const [progress, setProgress] = useState<{
    id: string;
    value: number;
  } | null>(null);
  const [failure, setFailure] = useState<{ id: string; file: File } | null>(
    null,
  );
  const request = useRef<XMLHttpRequest | null>(null);
  useEffect(
    () => () => {
      request.current?.abort();
    },
    [],
  );
  const upload = (id: string, file: File) => {
    if (request.current) return;
    setFailure(null);
    setProgress({ id, value: 0 });
    onBusy?.(true);
    const xhr = new XMLHttpRequest();
    request.current = xhr;
    const done = () => {
      request.current = null;
      setProgress(null);
      onBusy?.(false);
    };
    xhr.open('POST', '/api/admin/products/upload');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable)
        setProgress({ id, value: Math.round((e.loaded / e.total) * 100) });
    };
    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText);
        if (
          xhr.status < 200 ||
          xhr.status >= 300 ||
          typeof body.url !== 'string'
        )
          throw new Error();
        onChange(
          slots.map((slot) =>
            slot.id === id ? { ...slot, url: body.url } : slot,
          ),
          coverId,
        );
      } catch {
        setFailure({ id, file });
      }
      done();
    };
    xhr.onerror = () => {
      setFailure({ id, file });
      done();
    };
    xhr.onabort = done;
    const data = new FormData();
    data.append('file', file);
    xhr.send(data);
  };
  const locked = disabled || Boolean(progress);
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {slots.map((slot, index) => (
        <div
          key={slot.id}
          className="rounded-2xl border border-border bg-surface p-3"
        >
          <p className="mb-2 font-semibold text-foreground">
            {t.photos[index]}
          </p>
          <div className="relative mb-3 aspect-square overflow-hidden rounded-xl bg-background">
            {slot.url ? (
              <Image
                src={slot.url}
                alt={t.photos[index]}
                fill
                unoptimized
                className="object-contain"
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-4xl text-muted">
                +
              </span>
            )}
          </div>
          <label className="block text-sm text-foreground">
            {t.replace}
            <input
              aria-label={`${t.photos[index]} — ${t.replace}`}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={locked}
              className="mt-2 block w-full text-xs"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) upload(slot.id, file);
                e.target.value = '';
              }}
            />
          </label>
          {progress?.id === slot.id ? (
            <progress
              aria-label={t.saving}
              className="mt-2 w-full"
              value={progress.value}
              max={100}
            />
          ) : null}
          {failure?.id === slot.id ? (
            <div role="alert" className="mt-2 text-sm text-foreground">
              <p>{t.uploadFailed}</p>
              <button
                type="button"
                disabled={locked}
                onClick={() => upload(slot.id, failure.file)}
                className="btn-secondary mt-2"
              >
                {t.retry}
              </button>
            </div>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              className="min-h-9 rounded-lg border border-border px-2 py-1 text-xs text-foreground disabled:opacity-40"
              disabled={locked || !slot.url}
              onClick={() => onChange(slots, slot.id)}
              aria-pressed={coverId === slot.id}
            >
              {coverId === slot.id ? t.cover : t.makeCover}
            </button>
            <button
              type="button"
              className="min-h-9 rounded-lg border border-border px-2 py-1 text-xs text-foreground disabled:opacity-40"
              disabled={locked || !slot.url}
              onClick={() =>
                onChange(
                  slots.map((p) => (p.id === slot.id ? { ...p, url: '' } : p)),
                  coverId,
                )
              }
            >
              {t.remove}
            </button>
            {[-1, 1].map((delta) => (
              <button
                key={delta}
                type="button"
                className="min-h-9 rounded-lg border border-border px-2 py-1 text-xs text-foreground disabled:opacity-40"
                aria-label={`${t.photos[index]} — ${delta < 0 ? t.left : t.right}`}
                disabled={
                  locked || index + delta < 0 || index + delta >= slots.length
                }
                onClick={() => {
                  const reordered = [...slots];
                  [reordered[index], reordered[index + delta]] = [
                    reordered[index + delta],
                    reordered[index],
                  ];
                  onChange(reordered, coverId);
                }}
              >
                {delta < 0 ? '←' : '→'}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
