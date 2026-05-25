"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { useAdmin } from "@/lib/admin-context";
import { saveHeroMedia, type HeroMediaFormState } from "./actions";

type MediaTab = "source" | "upload" | "playback";
const MAX_MOBILE_IMAGES = 8;

const tabClass = (active: boolean) =>
  `rounded-2xl border px-4 py-3 text-left transition ${
    active
      ? "border-gold/50 bg-gold/10 text-foreground shadow-lg shadow-gold/10"
      : "border-border/60 bg-surface/70 text-muted hover:border-gold/30 hover:text-foreground"
  }`;

export default function HeroMediaForm({ initialState }: { initialState: HeroMediaFormState }) {
  const router = useRouter();
  const { dict, lang } = useAdmin();
  const mediaDict = dict.mediaPage;
  const [activeTab, setActiveTab] = useState<MediaTab>("source");
  const [form, setForm] = useState<HeroMediaFormState>(initialState);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<null | "video" | "poster" | "mobile">(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const posterInputRef = useRef<HTMLInputElement | null>(null);
  const mobileInputRef = useRef<HTMLInputElement | null>(null);

  const previewVideo = form.sourceType !== "image" ? form.videoUrl : "";
  const previewPoster = form.posterUrl || form.fallbackImageUrl;
  const mobilePreviewImages = form.mobileImages.length > 0 ? form.mobileImages : [previewPoster];

  const updateField = <K extends keyof HeroMediaFormState>(key: K, value: HeroMediaFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleUpload = async (kind: "video" | "poster" | "mobile", file: File) => {
    setUploading(kind);
    setMessage(null);
    try {
      const body = new FormData();
      body.append("kind", kind);
      body.append("file", file);
      const response = await fetch("/api/admin/media/upload", {
        method: "POST",
        body,
        credentials: "include",
      });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        throw new Error(payload.error || mediaDict.messages.uploadFailed);
      }

      if (kind === "video") {
        setForm((prev) => ({
          ...prev,
          sourceType: "local",
          videoUrl: payload.url ?? "",
        }));
      } else if (kind === "poster") {
        setForm((prev) => ({
          ...prev,
          posterUrl: payload.url ?? "",
        }));
      } else {
        setForm((prev) => ({
          ...prev,
          mobileImages: [...prev.mobileImages, payload.url ?? ""].filter(Boolean).slice(0, MAX_MOBILE_IMAGES),
        }));
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : mediaDict.messages.uploadFailed,
      });
    } finally {
      setUploading(null);
    }
  };

  const handleMobileImagesUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    const remainingSlots = MAX_MOBILE_IMAGES - form.mobileImages.length;
    if (remainingSlots <= 0) {
      setMessage({
        type: "error",
        text: mediaDict.messages.uploadFailed + ` (${MAX_MOBILE_IMAGES} mobile images max)`,
      });
      return;
    }

    setUploading("mobile");
    setMessage(null);

    try {
      const selected = Array.from(files).slice(0, remainingSlots);
      const uploadedUrls: string[] = [];

      for (const file of selected) {
        const body = new FormData();
        body.append("kind", "mobile");
        body.append("file", file);
        const response = await fetch("/api/admin/media/upload", {
          method: "POST",
          body,
          credentials: "include",
        });
        const payload = (await response.json()) as { url?: string; error?: string };
        if (!response.ok || !payload.url) {
          throw new Error(payload.error || mediaDict.messages.uploadFailed);
        }
        uploadedUrls.push(payload.url);
      }

      setForm((prev) => ({
        ...prev,
        mobileImages: [...prev.mobileImages, ...uploadedUrls].slice(0, MAX_MOBILE_IMAGES),
      }));
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : mediaDict.messages.uploadFailed,
      });
    } finally {
      setUploading(null);
    }
  };

  const removeMobileImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      mobileImages: prev.mobileImages.filter((_, imageIndex) => imageIndex !== index),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    const result = await saveHeroMedia(form, lang);
    setMessage({
      type: result.success ? "success" : "error",
      text: result.message,
    });
    setSaving(false);
    if (result.success) {
      router.refresh();
    }
  };

  const recommendationPills = useMemo(
    () => [
      "Cloudflare Stream",
      "Short muted MP4/WebM",
      "Poster first paint",
      "Desktop video + mobile slider",
    ],
    [],
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[260px_1fr]">
      <aside className="glass-panel h-fit rounded-3xl p-4">
        <div className="rounded-2xl border border-gold/20 bg-gold/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
            {mediaDict.recommendationTitle}
          </p>
          <p className="mt-2 text-sm text-muted">{mediaDict.recommendationBody}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {recommendationPills.map((pill) => (
              <span
                key={pill}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-foreground/80"
              >
                {pill}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <button type="button" onClick={() => setActiveTab("source")} className={tabClass(activeTab === "source")}>
            <div className="text-sm font-semibold">{mediaDict.tabs.source}</div>
            <div className="mt-1 text-xs text-muted">{mediaDict.hints.external}</div>
          </button>
          <button type="button" onClick={() => setActiveTab("upload")} className={tabClass(activeTab === "upload")}>
            <div className="text-sm font-semibold">{mediaDict.tabs.upload}</div>
            <div className="mt-1 text-xs text-muted">{mediaDict.hints.video}</div>
          </button>
          <button type="button" onClick={() => setActiveTab("playback")} className={tabClass(activeTab === "playback")}>
            <div className="text-sm font-semibold">{mediaDict.tabs.playback}</div>
            <div className="mt-1 text-xs text-muted">{mediaDict.hints.playback}</div>
          </button>
        </div>
      </aside>

      <div className="space-y-6">
        <div className="glass-panel rounded-3xl p-6">
          <h2 className="text-2xl font-semibold text-foreground">{mediaDict.heading}</h2>
          <p className="mt-2 text-sm text-muted">{mediaDict.intro}</p>
        </div>

        {activeTab === "source" && (
          <div className="glass-panel rounded-3xl p-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/10 p-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{mediaDict.labels.enabled}</p>
                    <p className="mt-1 text-xs text-muted">{mediaDict.hints.playback}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateField("enabled", !form.enabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition ${
                      form.enabled ? "bg-green-500" : "bg-stone-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                        form.enabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted">
                    {mediaDict.labels.sourceType}
                  </label>
                  <div className="grid gap-3 md:grid-cols-3">
                    {[
                      { value: "image", label: mediaDict.labels.sourceImage },
                      { value: "local", label: mediaDict.labels.sourceLocal },
                      { value: "external", label: mediaDict.labels.sourceExternal },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateField("sourceType", option.value as HeroMediaFormState["sourceType"])}
                        className={`rounded-2xl border px-4 py-4 text-left transition ${
                          form.sourceType === option.value
                            ? "border-gold/50 bg-gold/10 text-foreground"
                            : "border-white/10 bg-black/10 text-muted hover:border-gold/25 hover:text-foreground"
                        }`}
                      >
                        <div className="text-sm font-semibold">{option.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted">
                    {mediaDict.labels.videoUrl}
                  </label>
                  <input
                    type="text"
                    value={form.videoUrl}
                    onChange={(e) => updateField("videoUrl", e.target.value)}
                    placeholder={form.sourceType === "external" ? "https://cdn.example.com/hero.mp4" : "/uploads/hero/hero-video.mp4"}
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-foreground focus:border-gold focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted">
                    {mediaDict.labels.posterUrl}
                  </label>
                  <input
                    type="text"
                    value={form.posterUrl}
                    onChange={(e) => updateField("posterUrl", e.target.value)}
                    placeholder="/uploads/hero/hero-poster.jpg"
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-foreground focus:border-gold focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted">
                    {mediaDict.labels.mobileImages ?? "Mobile slider images"}
                  </label>
                  <p className="text-xs text-muted">
                    {mediaDict.hints.mobileImages ?? "Upload up to 8 mobile-only hero images. Mobile visitors see an animated slider instead of the desktop video."}
                  </p>
                  <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-foreground/85">
                        {form.mobileImages.length} / {MAX_MOBILE_IMAGES}
                      </span>
                      <button
                        type="button"
                        onClick={() => mobileInputRef.current?.click()}
                        className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold transition hover:bg-gold/20 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={uploading === "mobile" || form.mobileImages.length >= MAX_MOBILE_IMAGES}
                      >
                        {uploading === "mobile"
                          ? mediaDict.labels.uploadingMobile ?? "Uploading..."
                          : mediaDict.labels.uploadMobileImages ?? "Upload mobile images"}
                      </button>
                    </div>
                    <input
                      ref={mobileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        void handleMobileImagesUpload(e.target.files);
                        e.currentTarget.value = "";
                      }}
                    />
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {form.mobileImages.map((imageUrl, index) => (
                        <div key={imageUrl} className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                          <div className="relative aspect-[9/16]">
                            <Image
                              src={imageUrl}
                              alt={`Mobile hero ${index + 1}`}
                              fill
                              sizes="(min-width: 640px) 50vw, 100vw"
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2 border-t border-white/10 px-3 py-2">
                            <span className="text-xs font-medium text-foreground/80">Slide {index + 1}</span>
                            <button
                              type="button"
                              onClick={() => removeMobileImage(index)}
                              className="rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-200 transition hover:bg-red-500/20"
                            >
                              {mediaDict.labels.removeMobileImage ?? "Remove"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted">
                    {mediaDict.labels.fallbackImageUrl}
                  </label>
                  <input
                    type="text"
                    value={form.fallbackImageUrl}
                    onChange={(e) => updateField("fallbackImageUrl", e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-foreground focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/15 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                  Preview
                </p>
                <div className="mt-4 aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-black">
                  <div className="grid h-full grid-cols-[1.2fr_0.8fr]">
                    <div className="relative border-r border-white/10">
                      {previewVideo && form.sourceType !== "image" ? (
                        <video
                          className="h-full w-full object-cover"
                          src={previewVideo}
                          poster={previewPoster}
                          muted
                          loop
                          playsInline
                          autoPlay
                        />
                      ) : (
                        <Image
                          src={previewPoster}
                          alt={form.title || "Hero preview"}
                          fill
                          sizes="60vw"
                          className="object-cover"
                          unoptimized
                        />
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 p-2">
                      {mobilePreviewImages.slice(0, 4).map((imageUrl, index) => (
                        <div key={`${imageUrl}-${index}`} className="relative overflow-hidden rounded-xl border border-white/10">
                          <Image
                            src={imageUrl}
                            alt={`Mobile preview ${index + 1}`}
                            fill
                            sizes="20vw"
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "upload" && (
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="glass-panel rounded-3xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{mediaDict.labels.uploadVideo}</h3>
                  <p className="mt-2 text-sm text-muted">{mediaDict.hints.video}</p>
                </div>
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-black transition hover:brightness-105"
                  disabled={uploading === "video"}
                >
                  {uploading === "video" ? "Uploading..." : mediaDict.labels.uploadVideo}
                </button>
              </div>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/webm"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleUpload("video", file);
                  e.currentTarget.value = "";
                }}
              />
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/15 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">{mediaDict.labels.currentVideo}</p>
                <p className="mt-2 break-all text-sm text-foreground/85">{form.videoUrl || "—"}</p>
              </div>
            </div>

            <div className="glass-panel rounded-3xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{mediaDict.labels.uploadPoster}</h3>
                  <p className="mt-2 text-sm text-muted">{mediaDict.hints.poster}</p>
                </div>
                <button
                  type="button"
                  onClick={() => posterInputRef.current?.click()}
                  className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold transition hover:bg-gold/20"
                  disabled={uploading === "poster"}
                >
                  {uploading === "poster" ? "Uploading..." : mediaDict.labels.uploadPoster}
                </button>
              </div>
              <input
                ref={posterInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleUpload("poster", file);
                  e.currentTarget.value = "";
                }}
              />
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/15 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">{mediaDict.labels.currentPoster}</p>
                <p className="mt-2 break-all text-sm text-foreground/85">{form.posterUrl || "—"}</p>
              </div>
            </div>

            <div className="glass-panel rounded-3xl p-6 xl:col-span-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {mediaDict.labels.mobileImages ?? "Mobile slider images"}
                  </h3>
                  <p className="mt-2 text-sm text-muted">
                    {mediaDict.hints.mobileImages ?? "Upload up to 8 images for the mobile hero slider. These will rotate with a smooth animation on smaller screens."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => mobileInputRef.current?.click()}
                  className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold transition hover:bg-gold/20 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={uploading === "mobile" || form.mobileImages.length >= MAX_MOBILE_IMAGES}
                >
                  {uploading === "mobile"
                    ? mediaDict.labels.uploadingMobile ?? "Uploading..."
                    : mediaDict.labels.uploadMobileImages ?? "Upload mobile images"}
                </button>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: MAX_MOBILE_IMAGES }).map((_, index) => {
                  const imageUrl = form.mobileImages[index];
                  return (
                    <div key={index} className="overflow-hidden rounded-2xl border border-white/10 bg-black/15">
                      <div className="relative aspect-[9/16]">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={`Mobile slide ${index + 1}`}
                            fill
                            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center px-4 text-center text-xs text-muted">
                            {mediaDict.labels.emptyMobileSlot ?? "Empty mobile slide slot"}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 border-t border-white/10 px-3 py-2">
                        <span className="text-xs font-medium text-foreground/80">Slide {index + 1}</span>
                        {imageUrl ? (
                          <button
                            type="button"
                            onClick={() => removeMobileImage(index)}
                            className="rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-200 transition hover:bg-red-500/20"
                          >
                            {mediaDict.labels.removeMobileImage ?? "Remove"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === "playback" && (
          <div className="glass-panel rounded-3xl p-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted">
                    {mediaDict.labels.title}
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-foreground focus:border-gold focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted">
                    {mediaDict.labels.subtitle}
                  </label>
                  <textarea
                    value={form.subtitle}
                    onChange={(e) => updateField("subtitle", e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-foreground focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-gold/20 bg-gold/5 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Playback strategy</p>
                <ul className="mt-4 space-y-3 text-sm text-muted">
                  <li>Poster image paints first so the hero remains fast.</li>
                  <li>Desktop visitors see the hero video, while mobile visitors see a smooth image slider.</li>
                  <li>Visitors with reduced-motion preference keep the static image.</li>
                  <li>Use short muted loops; this is a background accent, not a full promo video.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {message ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              message.type === "success"
                ? "border-green-500/30 bg-green-500/10 text-green-200"
                : "border-red-500/30 bg-red-500/10 text-red-200"
            }`}
          >
            {message.text}
          </div>
        ) : null}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="rounded-2xl bg-gold px-5 py-3 text-sm font-semibold text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? mediaDict.actions.saving : mediaDict.actions.save}
          </button>
        </div>
      </div>
    </div>
  );
}
