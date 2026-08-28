"use client";

import { useState, useTransition } from "react";

import type { Locale } from "@/lib/i18n";
import {
  seoRouteDefinitions,
  type SeoChangeFrequency,
  type SeoPageSettings,
  type SeoRouteId,
  type SeoSettings,
} from "@/lib/seo-shared";

import { saveSeoSettings } from "./actions";

const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50";
const textareaCls =
  "min-h-[88px] w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50";
const labelCls = "mb-1 block text-xs font-medium text-muted";
const langButtonCls =
  "rounded-lg px-4 py-1.5 text-xs font-semibold uppercase transition";

const frequencyOptions: SeoChangeFrequency[] = [
  "daily",
  "weekly",
  "monthly",
  "yearly",
  "always",
  "hourly",
  "never",
];

type Props = {
  initialSettings: SeoSettings;
  adminLang: Locale;
};

const copy = {
  de: {
    title: "SEO Übersicht",
    subtitle:
      "Pflege Titel, Beschreibungen, Keywords, Indexierung und Search-Engine-Keys für Deutsch und Englisch an einer Stelle.",
    global: "Globale SEO Einstellungen",
    routeSettings: "Seiten & Sprachversionen",
    save: "SEO speichern",
    saving: "Speichern...",
    success: "SEO Einstellungen gespeichert.",
    error: "SEO Einstellungen konnten nicht gespeichert werden.",
    googleVerification: "Google Search Console Token",
    bingVerification: "Bing Webmaster Token",
    ogImage: "Standard Open Graph Bild",
    defaultKeywordsDe: "Standard Keywords Deutsch",
    defaultKeywordsEn: "Standard Keywords Englisch",
    enableSitemap: "Sitemap aktiv",
    enableRobots: "robots.txt aktiv",
    canonical: "Canonical Tags erzwingen",
    route: "Seite",
    publicUrl: "Öffentliche URL",
    index: "Indexieren",
    priority: "Priorität",
    changeFrequency: "Änderungshäufigkeit",
    deTab: "Deutsch",
    enTab: "Englisch",
    titleLabel: "Meta Titel",
    descriptionLabel: "Meta Beschreibung",
    keywordsLabel: "Keywords",
    sitemapLink: "Sitemap öffnen",
    robotsLink: "robots.txt öffnen",
  },
  en: {
    title: "SEO Overview",
    subtitle:
      "Manage titles, descriptions, keywords, indexing, and search-engine keys for German and English in one place.",
    global: "Global SEO Settings",
    routeSettings: "Pages & Language Versions",
    save: "Save SEO",
    saving: "Saving...",
    success: "SEO settings saved.",
    error: "Failed to save SEO settings.",
    googleVerification: "Google Search Console token",
    bingVerification: "Bing Webmaster token",
    ogImage: "Default Open Graph image",
    defaultKeywordsDe: "Default German keywords",
    defaultKeywordsEn: "Default English keywords",
    enableSitemap: "Enable sitemap",
    enableRobots: "Enable robots.txt",
    canonical: "Force canonical tags",
    route: "Page",
    publicUrl: "Public URL",
    index: "Index",
    priority: "Priority",
    changeFrequency: "Change frequency",
    deTab: "German",
    enTab: "English",
    titleLabel: "Meta title",
    descriptionLabel: "Meta description",
    keywordsLabel: "Keywords",
    sitemapLink: "Open sitemap",
    robotsLink: "Open robots.txt",
  },
} as const;

export default function SeoAdminForm({ initialSettings, adminLang }: Props) {
  const [settings, setSettings] = useState(initialSettings);
  const [activeLocale, setActiveLocale] = useState<Locale>("de");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const t = copy[adminLang];

  const updateGlobal = <K extends keyof SeoSettings["global"]>(
    key: K,
    value: SeoSettings["global"][K],
  ) => {
    setSettings((prev) => ({
      ...prev,
      global: { ...prev.global, [key]: value },
    }));
  };

  const updateRoute = (
    routeId: SeoRouteId,
    updater: (route: SeoPageSettings) => SeoPageSettings,
  ) => {
    setSettings((prev) => ({
      ...prev,
      pages: {
        ...prev.pages,
        [routeId]: updater(prev.pages[routeId]),
      },
    }));
  };

  const handleSave = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await saveSeoSettings(settings);
      setMessage({
        type: result.success ? "success" : "error",
        text: result.success ? t.success : result.message || t.error,
      });
    });
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-foreground">{t.title}</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">{t.subtitle}</p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-gold/20 px-4 py-2 text-gold transition hover:border-gold/40 hover:bg-gold/10"
          >
            {t.sitemapLink}
          </a>
          <a
            href="/robots.txt"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-gold/20 px-4 py-2 text-gold transition hover:border-gold/40 hover:bg-gold/10"
          >
            {t.robotsLink}
          </a>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-foreground">{t.global}</h3>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div>
            <label className={labelCls}>{t.googleVerification}</label>
            <input
              className={inputCls}
              value={settings.global.googleVerification}
              onChange={(event) => updateGlobal("googleVerification", event.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>{t.bingVerification}</label>
            <input
              className={inputCls}
              value={settings.global.bingVerification}
              onChange={(event) => updateGlobal("bingVerification", event.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>{t.ogImage}</label>
            <input
              className={inputCls}
              value={settings.global.defaultOgImage}
              onChange={(event) => updateGlobal("defaultOgImage", event.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm text-muted">
              <span>{t.enableSitemap}</span>
              <input
                type="checkbox"
                checked={settings.global.enableSitemap}
                onChange={(event) => updateGlobal("enableSitemap", event.target.checked)}
              />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm text-muted">
              <span>{t.enableRobots}</span>
              <input
                type="checkbox"
                checked={settings.global.enableRobots}
                onChange={(event) => updateGlobal("enableRobots", event.target.checked)}
              />
            </label>
          </div>
          <div>
            <label className={labelCls}>{t.defaultKeywordsDe}</label>
            <textarea
              className={textareaCls}
              value={settings.global.defaultKeywords.de}
              onChange={(event) =>
                updateGlobal("defaultKeywords", {
                  ...settings.global.defaultKeywords,
                  de: event.target.value,
                })
              }
            />
          </div>
          <div>
            <label className={labelCls}>{t.defaultKeywordsEn}</label>
            <textarea
              className={textareaCls}
              value={settings.global.defaultKeywords.en}
              onChange={(event) =>
                updateGlobal("defaultKeywords", {
                  ...settings.global.defaultKeywords,
                  en: event.target.value,
                })
              }
            />
          </div>
        </div>
        <label className="mt-4 flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm text-muted">
          <span>{t.canonical}</span>
          <input
            type="checkbox"
            checked={settings.global.forceCanonical}
            onChange={(event) => updateGlobal("forceCanonical", event.target.checked)}
          />
        </label>
      </div>

      <div className="flex gap-2">
        {(["de", "en"] as Locale[]).map((locale) => (
          <button
            key={locale}
            type="button"
            onClick={() => setActiveLocale(locale)}
            className={`${langButtonCls} ${
              activeLocale === locale ? "bg-gold/20 text-gold" : "text-muted hover:text-foreground"
            }`}
          >
            {locale === "de" ? t.deTab : t.enTab}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {seoRouteDefinitions.map((route) => {
          const routeSettings = settings.pages[route.id];
          const localeFields = routeSettings.locales[activeLocale];
          const localizedUrl = `https://apfel-park.de/${activeLocale}${route.path}`;

          return (
            <div key={route.id} className="tech-card rounded-2xl p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-lg font-semibold text-foreground">{route.labels[adminLang]}</p>
                  <p className="mt-1 text-sm text-muted">
                    {t.publicUrl}: <span className="text-foreground">{localizedUrl}</span>
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="flex items-center justify-between gap-4 rounded-xl border border-border px-4 py-3 text-sm text-muted">
                    <span>{t.index}</span>
                    <input
                      type="checkbox"
                      checked={routeSettings.index}
                      onChange={(event) =>
                        updateRoute(route.id, (current) => ({
                          ...current,
                          index: event.target.checked,
                        }))
                      }
                    />
                  </label>
                  <label className="rounded-xl border border-border px-4 py-3 text-sm text-muted">
                    <span className="mb-2 block">{t.priority}</span>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      className={inputCls}
                      value={routeSettings.priority}
                      onChange={(event) =>
                        updateRoute(route.id, (current) => ({
                          ...current,
                          priority: Number(event.target.value) || 0,
                        }))
                      }
                    />
                  </label>
                  <label className="rounded-xl border border-border px-4 py-3 text-sm text-muted">
                    <span className="mb-2 block">{t.changeFrequency}</span>
                    <select
                      className={inputCls}
                      value={routeSettings.changeFrequency}
                      onChange={(event) =>
                        updateRoute(route.id, (current) => ({
                          ...current,
                          changeFrequency: event.target.value as SeoChangeFrequency,
                        }))
                      }
                    >
                      {frequencyOptions.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                <div>
                  <label className={labelCls}>{t.titleLabel}</label>
                  <input
                    className={inputCls}
                    value={localeFields.title}
                    onChange={(event) =>
                      updateRoute(route.id, (current) => ({
                        ...current,
                        locales: {
                          ...current.locales,
                          [activeLocale]: {
                            ...current.locales[activeLocale],
                            title: event.target.value,
                          },
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>{t.descriptionLabel}</label>
                  <textarea
                    className={textareaCls}
                    value={localeFields.description}
                    onChange={(event) =>
                      updateRoute(route.id, (current) => ({
                        ...current,
                        locales: {
                          ...current.locales,
                          [activeLocale]: {
                            ...current.locales[activeLocale],
                            description: event.target.value,
                          },
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>{t.keywordsLabel}</label>
                  <textarea
                    className={textareaCls}
                    value={localeFields.keywords}
                    onChange={(event) =>
                      updateRoute(route.id, (current) => ({
                        ...current,
                        locales: {
                          ...current.locales,
                          [activeLocale]: {
                            ...current.locales[activeLocale],
                            keywords: event.target.value,
                          },
                        },
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-6 z-20 flex items-center justify-between rounded-2xl border border-border bg-surface/90 p-4 shadow-2xl backdrop-blur-md">
        <div className="text-sm">
          {message && (
            <span className={message.type === "success" ? "text-green-400" : "text-red-400"}>
              {message.text}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="btn-primary flex items-center gap-2 px-6 py-2.5 disabled:opacity-50"
        >
          {isPending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-white" />
          ) : null}
          {isPending ? t.saving : t.save}
        </button>
      </div>
    </div>
  );
}
