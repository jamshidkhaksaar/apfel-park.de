"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type SettingsData = {
  general: {
    shopName: string;
    owner: string;
    address: string;
    email: string;
    phone: string;
  };
  hours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  maintenance: {
    enabled: boolean;
  };
  security: {
    cfSiteKey: string;
    cfSecretKey: string;
  };
  recaptcha: {
    enabled: boolean;
    siteKey: string;
    secretKey: string;
    minScore: number;
  };
};

export default function SettingsForm({ initialSettings }: { initialSettings: SettingsData }) {
  const router = useRouter();
  const [settings, setSettings] = useState<SettingsData>({
    ...initialSettings,
    security: initialSettings.security || { cfSiteKey: "", cfSecretKey: "" },
    recaptcha: initialSettings.recaptcha || { enabled: false, siteKey: "", secretKey: "", minScore: 0.5 }
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
    const supabase = createClient();

    try {
      // Update each section
      const updates = Object.keys(settings).map((key) => 
        supabase
          .from("store_settings")
          .upsert({ key, value: settings[key as keyof SettingsData], updated_at: new Date().toISOString() }, { onConflict: "key" })
      );

      await Promise.all(updates);
      
      setMessage({ type: "success", text: "Settings saved successfully!" });
      router.refresh();
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ type: "error", text: "Failed to save settings." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
      <div className="space-y-6">
        {/* General Information */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">General Information</h2>
          </div>
          <p className="mt-2 text-sm text-muted">
            Business details that appear on invoices and in the footer.
          </p>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted">Shop Name</label>
              <input
                type="text"
                value={settings.general.shopName}
                onChange={(e) => handleChange("general", "shopName", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted">Owner</label>
              <input
                type="text"
                value={settings.general.owner}
                onChange={(e) => handleChange("general", "owner", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted">Address</label>
              <input
                type="text"
                value={settings.general.address}
                onChange={(e) => handleChange("general", "address", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted">Email (Support)</label>
              <input
                type="email"
                value={settings.general.email}
                onChange={(e) => handleChange("general", "email", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted">Phone</label>
              <input
                type="text"
                value={settings.general.phone}
                onChange={(e) => handleChange("general", "phone", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition"
              />
            </div>
          </div>
        </div>

        {/* Save Button Area (Sticky on mobile, inline on desktop) */}
        <div className="sticky bottom-6 z-20 mt-6 flex items-center justify-between rounded-2xl border border-white/10 bg-surface/90 p-4 backdrop-blur-md shadow-2xl">
          <div className="text-sm">
             {message && (
                <span className={message.type === "success" ? "text-green-400" : "text-red-400"}>
                  {message.text}
                </span>
             )}
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            className="btn-primary flex items-center gap-2 px-6 py-2.5 disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"/>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            Save Changes
          </button>
        </div>
      </div>

      {/* Sidebar: Opening Hours */}
      <div className="space-y-6">
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground">Opening Hours</h2>
          <p className="mt-2 text-sm text-muted">
            Displayed in footer and contact page.
          </p>
          <div className="mt-6 space-y-3">
            {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
              <div key={day} className="grid grid-cols-[100px_1fr] items-center gap-2">
                <span className="text-sm text-muted capitalize">{day}</span>
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

        {/* Maintenance Mode */}
        <div className={`glass-panel rounded-2xl border p-6 transition-colors ${settings.maintenance.enabled ? "border-red-500/50 bg-red-950/10" : "border-yellow-500/20 bg-yellow-950/5"}`}>
          <h2 className={`text-lg font-semibold ${settings.maintenance.enabled ? "text-red-500" : "text-yellow-500"}`}>
            Maintenance Mode
          </h2>
          <p className={`mt-2 text-xs ${settings.maintenance.enabled ? "text-red-400" : "text-yellow-500/80"}`}>
            {settings.maintenance.enabled ? "Shop is currently offline." : "Blocks public access to shop. Admin area remains accessible."}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => handleChange("maintenance", "enabled", !settings.maintenance.enabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${settings.maintenance.enabled ? "bg-red-500 focus:ring-red-600" : "bg-stone-700 focus:ring-yellow-600"}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.maintenance.enabled ? "translate-x-5" : "translate-x-0"}`} />
            </button>
            <span className="text-sm font-medium text-muted">
              {settings.maintenance.enabled ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        {/* Security Settings (Cloudflare) */}
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground">Security (Cloudflare)</h2>
          <p className="mt-2 text-sm text-muted">
            Configure Turnstile Captcha to protect forms.
          </p>
          <div className="mt-4 space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted">Site Key</label>
              <input
                type="text"
                value={settings.security?.cfSiteKey || ""}
                onChange={(e) => handleChange("security", "cfSiteKey", e.target.value)}
                placeholder="0x4AAAA..."
                className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted">Secret Key</label>
              <input
                type="password"
                value={settings.security?.cfSecretKey || ""}
                onChange={(e) => handleChange("security", "cfSecretKey", e.target.value)}
                placeholder="0x4AAAA..."
                className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Google reCAPTCHA Settings */}
        <div className={`glass-panel rounded-2xl border p-6 transition-colors ${settings.recaptcha?.enabled ? "border-green-500/30 bg-green-950/10" : "border-white/10"}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Google reCAPTCHA v3</h2>
            <button
              onClick={() => handleChange("recaptcha", "enabled", !settings.recaptcha?.enabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${settings.recaptcha?.enabled ? "bg-green-500 focus:ring-green-600" : "bg-stone-700 focus:ring-stone-600"}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.recaptcha?.enabled ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>
          <p className="mt-2 text-sm text-muted">
            Protect contact and repair forms from spam and bots.
          </p>
          {!settings.recaptcha?.enabled && (
            <p className="mt-2 text-xs text-yellow-500/80">
              Currently disabled for development. Enable for production.
            </p>
          )}
          <div className="mt-4 space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted">Site Key</label>
              <input
                type="text"
                value={settings.recaptcha?.siteKey || ""}
                onChange={(e) => handleChange("recaptcha", "siteKey", e.target.value)}
                placeholder="6Le..."
                className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted">Secret Key</label>
              <input
                type="password"
                value={settings.recaptcha?.secretKey || ""}
                onChange={(e) => handleChange("recaptcha", "secretKey", e.target.value)}
                placeholder="6Le..."
                className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted">
                Min Score (0.0 - 1.0)
              </label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={settings.recaptcha?.minScore || 0.5}
                onChange={(e) => handleChange("recaptcha", "minScore", parseFloat(e.target.value) || 0.5)}
                className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-foreground focus:border-gold focus:outline-none"
              />
              <p className="text-xs text-muted/60">
                Lower = more lenient, Higher = stricter (0.5 recommended)
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-blue-950/20 border border-blue-500/20 p-3">
            <p className="text-xs text-blue-400">
              Get your keys from{" "}
              <a 
                href="https://www.google.com/recaptcha/admin" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-blue-300"
              >
                Google reCAPTCHA Admin Console
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
