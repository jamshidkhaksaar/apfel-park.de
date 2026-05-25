"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useAdmin } from "@/lib/admin-context";
import { saveSettings } from "./actions";
import { type SettingsData } from "./types";

type SettingsTab = "general" | "operations" | "whatsapp" | "integrations";
type SecretStatus = {
  facebookPageAccessToken: boolean;
  instagramAccessToken: boolean;
};

const tabButtonClass = (active: boolean) =>
  `rounded-2xl border px-4 py-3 text-left transition ${
    active
      ? "border-gold/50 bg-gold/10 text-foreground shadow-lg shadow-gold/10"
      : "border-border/60 bg-surface/70 text-muted hover:border-gold/30 hover:text-foreground"
  }`;

const statusPillClass = (active: boolean) =>
  `rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
    active
      ? "border-green-500/30 bg-green-950/20 text-green-300"
      : "border-white/10 bg-white/[0.03] text-muted"
  }`;

export default function SettingsForm({
  initialSettings,
  secretStatus = { facebookPageAccessToken: false, instagramAccessToken: false },
}: {
  initialSettings: SettingsData;
  secretStatus?: SecretStatus;
}) {
  const router = useRouter();
  const { dict, lang } = useAdmin();
  const [settings, setSettings] = useState<SettingsData>({
    ...initialSettings,
    recaptcha: initialSettings.recaptcha || { enabled: false, siteKey: "", secretKey: "", minScore: 0.5 },
  });
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const facebookPublishingReady = Boolean(
    settings.integrations.facebookPageId &&
      (settings.integrations.facebookPageAccessToken || secretStatus.facebookPageAccessToken),
  );
  const instagramPublishingReady = Boolean(
    settings.integrations.instagramBusinessAccountId &&
      (settings.integrations.instagramAccessToken || secretStatus.instagramAccessToken),
  );
  const publishingReady = facebookPublishingReady || instagramPublishingReady;
  const autoPublishEnabled = settings.integrations.autoPublishNewProducts || settings.integrations.autoPublishDiscountProducts;

  const handleChange = (section: keyof SettingsData, field: string, value: string | boolean | number) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const result = await saveSettings(settings, lang);
      setMessage({
        type: result.success ? "success" : "error",
        text: result.message,
      });
      if (result.success) {
        router.refresh();
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ type: "error", text: dict.settingsForm.saveFailed });
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestEvents = async () => {
    setTesting(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/marketing/test", { method: "POST" });
      const payload = (await response.json()) as { success?: boolean; results?: Array<{ success: boolean; target: string; error?: string }> };
      if (!response.ok || !payload.success) {
        setMessage({ type: "error", text: dict.settingsForm.testFailed });
        return;
      }

      const failed = payload.results?.filter((item) => !item.success) ?? [];
      if (failed.length > 0) {
        setMessage({
          type: "error",
          text: `${dict.settingsForm.testPartial}: ${failed.map((item) => `${item.target}${item.error ? ` (${item.error})` : ""}`).join(", ")}`,
        });
        return;
      }

      setMessage({ type: "success", text: dict.settingsForm.testSuccess });
    } catch (error) {
      console.error("Error sending test events:", error);
      setMessage({ type: "error", text: dict.settingsForm.testFailed });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[240px_1fr]">
      <aside className="glass-panel h-fit rounded-3xl p-4">
        <div className="space-y-2">
          <button type="button" onClick={() => setActiveTab("general")} className={tabButtonClass(activeTab === "general")}>
            <div className="text-sm font-semibold">{dict.settingsForm.tabs.general}</div>
            <div className="mt-1 text-xs text-muted">{dict.settingsForm.tabs.generalDesc}</div>
          </button>
          <button type="button" onClick={() => setActiveTab("operations")} className={tabButtonClass(activeTab === "operations")}>
            <div className="text-sm font-semibold">{dict.settingsForm.tabs.operations}</div>
            <div className="mt-1 text-xs text-muted">{dict.settingsForm.tabs.operationsDesc}</div>
          </button>
          <button type="button" onClick={() => setActiveTab("whatsapp")} className={tabButtonClass(activeTab === "whatsapp")}>
            <div className="text-sm font-semibold">{dict.settingsForm.tabs.whatsapp}</div>
            <div className="mt-1 text-xs text-muted">{dict.settingsForm.tabs.whatsappDesc}</div>
          </button>
          <button type="button" onClick={() => setActiveTab("integrations")} className={tabButtonClass(activeTab === "integrations")}>
            <div className="text-sm font-semibold">{dict.settingsForm.tabs.integrations}</div>
            <div className="mt-1 text-xs text-muted">{dict.settingsForm.tabs.integrationsDesc}</div>
          </button>
        </div>
      </aside>

      <div className="space-y-6">
        {activeTab === "general" && (
          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <div className="glass-panel rounded-3xl p-6">
              <h2 className="text-lg font-semibold text-foreground">{dict.settingsForm.generalTitle}</h2>
              <p className="mt-2 text-sm text-muted">{dict.settingsForm.generalDesc}</p>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted">{dict.settingsForm.labels.shopName}</label>
                  <input
                    type="text"
                    value={settings.general.shopName}
                    onChange={(e) => handleChange("general", "shopName", e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted">{dict.settingsForm.labels.owner}</label>
                  <input
                    type="text"
                    value={settings.general.owner}
                    onChange={(e) => handleChange("general", "owner", e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted">{dict.settingsForm.labels.address}</label>
                  <input
                    type="text"
                    value={settings.general.address}
                    onChange={(e) => handleChange("general", "address", e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted">{dict.settingsForm.labels.email}</label>
                  <input
                    type="email"
                    value={settings.general.email}
                    onChange={(e) => handleChange("general", "email", e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted">{dict.settingsForm.labels.phone}</label>
                  <input
                    type="text"
                    value={settings.general.phone}
                    onChange={(e) => handleChange("general", "phone", e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition"
                  />
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-3xl p-6">
              <h2 className="text-lg font-semibold text-foreground">{dict.settingsForm.openingHoursTitle}</h2>
              <p className="mt-2 text-sm text-muted">{dict.settingsForm.openingHoursDesc}</p>
              <div className="mt-6 space-y-3">
                {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
                  <div key={day} className="grid grid-cols-[100px_1fr] items-center gap-2">
                    <span className="text-sm text-muted capitalize">{dict.settingsForm.days[day as keyof typeof dict.settingsForm.days]}</span>
                    <input
                      type="text"
                      value={settings.hours[day as keyof typeof settings.hours]}
                      onChange={(e) => handleChange("hours", day, e.target.value)}
                      className={`rounded-lg border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-foreground text-center focus:border-gold focus:outline-none transition ${day === "sunday" ? "text-red-400" : ""}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "operations" && (
          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <div className={`glass-panel rounded-3xl border p-6 transition-colors ${settings.maintenance.siteEnabled || settings.maintenance.storeEnabled ? "border-red-500/50 bg-red-950/10" : "border-yellow-500/20 bg-yellow-950/5"}`}>
              <h2 className={`text-lg font-semibold ${settings.maintenance.siteEnabled || settings.maintenance.storeEnabled ? "text-red-500" : "text-yellow-500"}`}>
                {dict.settingsForm.maintenanceTitle}
              </h2>
              <p className={`mt-2 text-xs ${settings.maintenance.siteEnabled || settings.maintenance.storeEnabled ? "text-red-400" : "text-yellow-500/80"}`}>
                {settings.maintenance.siteEnabled
                  ? dict.settingsForm.maintenanceSiteOn
                  : settings.maintenance.storeEnabled
                    ? dict.settingsForm.maintenanceStoreOn
                    : dict.settingsForm.maintenanceOff}
              </p>
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{dict.settingsForm.maintenanceSiteTitle}</p>
                    <p className="mt-1 text-xs text-muted">{dict.settingsForm.maintenanceSiteDesc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleChange("maintenance", "siteEnabled", !settings.maintenance.siteEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition ${settings.maintenance.siteEnabled ? "bg-red-500" : "bg-stone-700"}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${settings.maintenance.siteEnabled ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{dict.settingsForm.maintenanceStoreTitle}</p>
                    <p className="mt-1 text-xs text-muted">{dict.settingsForm.maintenanceStoreDesc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleChange("maintenance", "storeEnabled", !settings.maintenance.storeEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition ${settings.maintenance.storeEnabled ? "bg-red-500" : "bg-stone-700"}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${settings.maintenance.storeEnabled ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
              </div>
            </div>

            <div className={`glass-panel rounded-3xl border p-6 transition-colors ${settings.recaptcha?.enabled ? "border-green-500/30 bg-green-950/10" : "border-white/10"}`}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">{dict.settingsForm.recaptchaTitle}</h2>
                <button
                  type="button"
                  onClick={() => handleChange("recaptcha", "enabled", !settings.recaptcha?.enabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition ${settings.recaptcha?.enabled ? "bg-green-500" : "bg-stone-700"}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${settings.recaptcha?.enabled ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
              <p className="mt-2 text-sm text-muted">{dict.settingsForm.recaptchaDesc}</p>
              <div className="mt-4 space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted">{dict.settingsForm.siteKey}</label>
                  <input
                    type="text"
                    value={settings.recaptcha?.siteKey || ""}
                    onChange={(e) => handleChange("recaptcha", "siteKey", e.target.value)}
                    placeholder="6Le..."
                    className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted">{dict.settingsForm.secretKey}</label>
                  <input
                    type="password"
                    value={settings.recaptcha?.secretKey || ""}
                    onChange={(e) => handleChange("recaptcha", "secretKey", e.target.value)}
                    placeholder="6Le..."
                    className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none"
                  />
                  <p className="text-xs text-muted/60">{dict.settingsForm.leaveSecretBlank}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted">{dict.settingsForm.minScore}</label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.recaptcha?.minScore ?? 0.5}
                    onChange={(e) => {
                      const nextValue = Number.parseFloat(e.target.value);
                      handleChange("recaptcha", "minScore", Number.isNaN(nextValue) ? 0.5 : nextValue);
                    }}
                    className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none"
                  />
                  <p className="text-xs text-muted/60">{dict.settingsForm.minScoreHint}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "whatsapp" && (
          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <div className="glass-panel rounded-3xl p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">{dict.settingsForm.whatsappTitle}</h2>
                <button
                  type="button"
                  onClick={() => handleChange("integrations", "whatsappWidgetEnabled", !settings.integrations.whatsappWidgetEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition ${settings.integrations.whatsappWidgetEnabled ? "bg-green-500" : "bg-stone-700"}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${settings.integrations.whatsappWidgetEnabled ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
              <p className="mt-2 text-sm text-muted">{dict.settingsForm.whatsappDesc}</p>
              <div className="mt-4 rounded-2xl border border-gold/20 bg-gold/5 p-4 text-sm text-muted">
                {dict.settingsForm.whatsappNotice}
              </div>
              <div className="mt-5 space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted">{dict.settingsForm.whatsappNumber}</label>
                  <input type="text" value={settings.integrations.whatsappNumber} onChange={(e) => handleChange("integrations", "whatsappNumber", e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted">{dict.settingsForm.whatsappDefaultMessageDe}</label>
                  <textarea value={settings.integrations.whatsappDefaultMessageDe} onChange={(e) => handleChange("integrations", "whatsappDefaultMessageDe", e.target.value)} rows={3} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted">{dict.settingsForm.whatsappDefaultMessageEn}</label>
                  <textarea value={settings.integrations.whatsappDefaultMessageEn} onChange={(e) => handleChange("integrations", "whatsappDefaultMessageEn", e.target.value)} rows={3} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none" />
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-3xl p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">{dict.settingsForm.whatsappCloudTitle}</h3>
                <button
                  type="button"
                  onClick={() => handleChange("integrations", "whatsappCloudApiEnabled", !settings.integrations.whatsappCloudApiEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition ${settings.integrations.whatsappCloudApiEnabled ? "bg-green-500" : "bg-stone-700"}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${settings.integrations.whatsappCloudApiEnabled ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
              <p className="mt-2 text-sm text-muted">{dict.settingsForm.whatsappCloudDesc}</p>
              <div className="mt-5 space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted">{dict.settingsForm.whatsappPhoneNumberId}</label>
                  <input type="text" value={settings.integrations.whatsappPhoneNumberId} onChange={(e) => handleChange("integrations", "whatsappPhoneNumberId", e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted">{dict.settingsForm.whatsappBusinessAccountId}</label>
                  <input type="text" value={settings.integrations.whatsappBusinessAccountId} onChange={(e) => handleChange("integrations", "whatsappBusinessAccountId", e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted">{dict.settingsForm.whatsappAccessToken}</label>
                  <input type="password" value={settings.integrations.whatsappAccessToken} onChange={(e) => handleChange("integrations", "whatsappAccessToken", e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none" />
                  <p className="text-xs text-muted/60">{dict.settingsForm.leaveSecretBlank}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted">{dict.settingsForm.whatsappWebhookVerifyToken}</label>
                  <input type="password" value={settings.integrations.whatsappWebhookVerifyToken} onChange={(e) => handleChange("integrations", "whatsappWebhookVerifyToken", e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none" />
                  <p className="text-xs text-muted/60">{dict.settingsForm.leaveSecretBlank}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "integrations" && (
          <div className="space-y-6">
            <div className="glass-panel rounded-3xl p-6">
              <h2 className="text-lg font-semibold text-foreground">{dict.settingsForm.integrationsTitle}</h2>
              <p className="mt-2 text-sm text-muted">{dict.settingsForm.integrationsDesc}</p>
              <div className="mt-4 rounded-2xl border border-gold/20 bg-gold/5 p-4 text-sm text-muted">
                {dict.settingsForm.integrationsNotice}
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSendTestEvents}
                  disabled={testing}
                  className="rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold transition hover:border-gold/50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {testing ? dict.settingsForm.testing : dict.settingsForm.sendTestEvents}
                </button>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="glass-panel rounded-3xl p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">{dict.settingsForm.metaTitle}</h3>
                  <button
                    type="button"
                    onClick={() => handleChange("integrations", "metaPixelEnabled", !settings.integrations.metaPixelEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition ${settings.integrations.metaPixelEnabled ? "bg-green-500" : "bg-stone-700"}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${settings.integrations.metaPixelEnabled ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
                <p className="mt-2 text-sm text-muted">{dict.settingsForm.metaDesc}</p>
                <div className="mt-5 space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted">{dict.settingsForm.metaPixelId}</label>
                    <input type="text" value={settings.integrations.metaPixelId} onChange={(e) => handleChange("integrations", "metaPixelId", e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted">{dict.settingsForm.metaConversionsToken}</label>
                    <input type="password" value={settings.integrations.metaConversionsApiToken} onChange={(e) => handleChange("integrations", "metaConversionsApiToken", e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none" />
                    <p className="text-xs text-muted/60">{dict.settingsForm.leaveSecretBlank}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted">{dict.settingsForm.metaTestEventCode}</label>
                    <input type="text" value={settings.integrations.metaConversionsTestEventCode} onChange={(e) => handleChange("integrations", "metaConversionsTestEventCode", e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none" />
                  </div>
                </div>
              </div>

              <div className="glass-panel rounded-3xl p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">{dict.settingsForm.tiktokTitle}</h3>
                  <button
                    type="button"
                    onClick={() => handleChange("integrations", "tiktokPixelEnabled", !settings.integrations.tiktokPixelEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition ${settings.integrations.tiktokPixelEnabled ? "bg-green-500" : "bg-stone-700"}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${settings.integrations.tiktokPixelEnabled ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
                <p className="mt-2 text-sm text-muted">{dict.settingsForm.tiktokDesc}</p>
                <div className="mt-5 space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted">{dict.settingsForm.tiktokPixelId}</label>
                    <input type="text" value={settings.integrations.tiktokPixelId} onChange={(e) => handleChange("integrations", "tiktokPixelId", e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted">{dict.settingsForm.tiktokEventsToken}</label>
                    <input type="password" value={settings.integrations.tiktokEventsApiToken} onChange={(e) => handleChange("integrations", "tiktokEventsApiToken", e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none" />
                    <p className="text-xs text-muted/60">{dict.settingsForm.leaveSecretBlank}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted">{dict.settingsForm.tiktokTestEventCode}</label>
                    <input type="text" value={settings.integrations.tiktokTestEventCode} onChange={(e) => handleChange("integrations", "tiktokTestEventCode", e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Google Analytics 4 */}
            <div className="glass-panel rounded-3xl p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">{dict.settingsForm.googleAnalyticsTitle}</h3>
                <button
                  type="button"
                  onClick={() => handleChange("integrations", "googleAnalyticsEnabled", !settings.integrations.googleAnalyticsEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition ${settings.integrations.googleAnalyticsEnabled ? "bg-green-500" : "bg-stone-700"}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${settings.integrations.googleAnalyticsEnabled ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
              <p className="mt-2 text-sm text-muted">{dict.settingsForm.googleAnalyticsDesc}</p>
              <div className="mt-5 space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted">{dict.settingsForm.googleAnalyticsId}</label>
                <input
                  type="text"
                  value={settings.integrations.googleAnalyticsId}
                  onChange={(e) => handleChange("integrations", "googleAnalyticsId", e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none"
                  placeholder="G-XXXXXXXXXX"
                />
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="glass-panel rounded-3xl p-6">
                <h3 className="text-lg font-semibold text-foreground">{dict.settingsForm.socialPublishingTitle}</h3>
                <p className="mt-2 text-sm text-muted">{dict.settingsForm.socialPublishingDesc}</p>
                <div className="mt-5 space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted">{dict.settingsForm.facebookPageId}</label>
                    <input type="text" value={settings.integrations.facebookPageId} onChange={(e) => handleChange("integrations", "facebookPageId", e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted">{dict.settingsForm.facebookPageToken}</label>
                    <input type="password" value={settings.integrations.facebookPageAccessToken} onChange={(e) => handleChange("integrations", "facebookPageAccessToken", e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none" />
                    <p className="text-xs text-muted/60">{dict.settingsForm.leaveSecretBlank}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted">{dict.settingsForm.instagramBusinessId}</label>
                    <input type="text" value={settings.integrations.instagramBusinessAccountId} onChange={(e) => handleChange("integrations", "instagramBusinessAccountId", e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted">{dict.settingsForm.instagramAccessToken}</label>
                    <input type="password" value={settings.integrations.instagramAccessToken} onChange={(e) => handleChange("integrations", "instagramAccessToken", e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none" />
                    <p className="text-xs text-muted/60">{dict.settingsForm.leaveSecretBlank}</p>
                  </div>
                </div>
              </div>

              <div className="glass-panel rounded-3xl p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">{dict.settingsForm.tiktokShopTitle}</h3>
                  <button
                    type="button"
                    onClick={() => handleChange("integrations", "tiktokShopEnabled", !settings.integrations.tiktokShopEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition ${settings.integrations.tiktokShopEnabled ? "bg-green-500" : "bg-stone-700"}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${settings.integrations.tiktokShopEnabled ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
                <p className="mt-2 text-sm text-muted">{dict.settingsForm.tiktokShopDesc}</p>
                <div className="mt-5 space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted">{dict.settingsForm.tiktokShopAppKey}</label>
                    <input type="text" value={settings.integrations.tiktokShopAppKey} onChange={(e) => handleChange("integrations", "tiktokShopAppKey", e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted">{dict.settingsForm.tiktokShopAppSecret}</label>
                    <input type="password" value={settings.integrations.tiktokShopAppSecret} onChange={(e) => handleChange("integrations", "tiktokShopAppSecret", e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none" />
                    <p className="text-xs text-muted/60">{dict.settingsForm.leaveSecretBlank}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted">{dict.settingsForm.tiktokShopWebhookSecret}</label>
                    <input type="password" value={settings.integrations.tiktokShopWebhookSecret} onChange={(e) => handleChange("integrations", "tiktokShopWebhookSecret", e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none" />
                    <p className="text-xs text-muted/60">{dict.settingsForm.leaveSecretBlank}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-3xl p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{dict.settingsForm.automationTitle}</h3>
                  <p className="mt-2 text-sm text-muted">{dict.settingsForm.automationDesc}</p>
                </div>
                <span className={statusPillClass(autoPublishEnabled)}>
                  {autoPublishEnabled ? dict.settingsForm.automationActive : dict.settingsForm.automationInactive}
                </span>
              </div>

              <div className="mt-5 grid gap-3 lg:grid-cols-3">
                <div className={`rounded-2xl border px-4 py-3 ${facebookPublishingReady ? "border-green-500/30 bg-green-950/10" : "border-amber-500/30 bg-amber-950/10"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{dict.settingsForm.facebookChannel}</span>
                    <span className={statusPillClass(facebookPublishingReady)}>
                      {facebookPublishingReady ? dict.settingsForm.configured : dict.settingsForm.missing}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted">{dict.settingsForm.facebookChannelDesc}</p>
                </div>
                <div className={`rounded-2xl border px-4 py-3 ${instagramPublishingReady ? "border-green-500/30 bg-green-950/10" : "border-amber-500/30 bg-amber-950/10"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{dict.settingsForm.instagramChannel}</span>
                    <span className={statusPillClass(instagramPublishingReady)}>
                      {instagramPublishingReady ? dict.settingsForm.configured : dict.settingsForm.missing}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted">{dict.settingsForm.instagramChannelDesc}</p>
                </div>
                <div className={`rounded-2xl border px-4 py-3 ${publishingReady ? "border-gold/25 bg-gold/5" : "border-red-500/30 bg-red-950/10"}`}>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{dict.settingsForm.publishTrigger}</div>
                  <p className="mt-2 text-xs text-muted">
                    {publishingReady ? dict.settingsForm.publishTriggerDesc : dict.settingsForm.publishNeedsConfig}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleChange("integrations", "autoPublishNewProducts", !settings.integrations.autoPublishNewProducts)}
                  className={`rounded-2xl border px-4 py-4 text-left transition hover:border-gold/35 ${settings.integrations.autoPublishNewProducts ? "border-green-500/40 bg-green-950/10" : "border-border/60 bg-surface/70"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm font-semibold text-foreground">{dict.settingsForm.autoPublishNewProducts}</div>
                    <span className={statusPillClass(settings.integrations.autoPublishNewProducts)}>
                      {settings.integrations.autoPublishNewProducts ? dict.settingsForm.enabled : dict.settingsForm.disabled}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted">{dict.settingsForm.autoPublishNewProductsDesc}</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleChange("integrations", "autoPublishDiscountProducts", !settings.integrations.autoPublishDiscountProducts)}
                  className={`rounded-2xl border px-4 py-4 text-left transition hover:border-gold/35 ${settings.integrations.autoPublishDiscountProducts ? "border-green-500/40 bg-green-950/10" : "border-border/60 bg-surface/70"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm font-semibold text-foreground">{dict.settingsForm.autoPublishDiscountProducts}</div>
                    <span className={statusPillClass(settings.integrations.autoPublishDiscountProducts)}>
                      {settings.integrations.autoPublishDiscountProducts ? dict.settingsForm.enabled : dict.settingsForm.disabled}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted">{dict.settingsForm.autoPublishDiscountProductsDesc}</div>
                </button>
              </div>
              <p className="mt-4 text-xs text-muted/70">{dict.settingsForm.automationFootnote}</p>
            </div>
          </div>
        )}

        <div className="sticky bottom-6 z-20 flex items-center justify-between rounded-2xl border border-white/10 bg-surface/90 p-4 backdrop-blur-md shadow-2xl">
          <div className="text-sm">
            {message && <span className={message.type === "success" ? "text-green-400" : "text-red-400"}>{message.text}</span>}
          </div>
          <button onClick={handleSave} disabled={loading} className="btn-primary flex items-center gap-2 px-6 py-2.5 disabled:opacity-50">
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {dict.settingsForm.saveChanges}
          </button>
        </div>
      </div>
    </div>
  );
}
