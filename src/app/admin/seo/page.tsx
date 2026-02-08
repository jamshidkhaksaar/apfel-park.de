"use client";

import AdminShell from "../../../components/admin/AdminShell";
import { useAdmin } from "@/lib/admin-context";

export default function SeoPage() {
  const { dict, lang } = useAdmin();

  const seoFields =
    lang === "en"
      ? [
          {
            label: "Default Title",
            placeholder: "Apfel Park | Smartphone & Repair Studio",
          },
          {
            label: "Meta Description",
            placeholder:
              "Smart Phone. Smart Service. Smart Price. Premium Smartphones, Accessories & Repairs in Hamburg.",
          },
          {
            label: "Focus Keywords",
            placeholder: "smartphone repair hamburg, phone accessories, ...",
          },
          {
            label: "Open Graph Image",
            placeholder: "https://.../og-image.jpg",
          },
        ]
      : [
          {
            label: "Standard Titel",
            placeholder: "Apfel Park | Smartphone & Repair Studio",
          },
          {
            label: "Meta Beschreibung",
            placeholder:
              "Smart Phone. Smart Service. Smart Price. Premium Smartphones, Accessories & Repairs in Hamburg.",
          },
          {
            label: "Fokus Keywords",
            placeholder: "smartphone reparatur hamburg, handy zubehoer, ...",
          },
          {
            label: "Open Graph Bild",
            placeholder: "https://.../og-image.jpg",
          },
        ];

  const verificationFields =
    lang === "en"
      ? [
          { label: "Google Search Console", placeholder: "Verification Token" },
          { label: "Bing Webmaster Tools", placeholder: "Verification Token" },
          { label: "Google Analytics ID", placeholder: "G-XXXXXXXXXX" },
        ]
      : [
          { label: "Google Search Console", placeholder: "Verifizierungs-Token" },
          { label: "Bing Webmaster Tools", placeholder: "Verifizierungs-Token" },
          { label: "Google Analytics ID", placeholder: "G-XXXXXXXXXX" },
        ];

  return (
    <AdminShell title={dict.seoPage.title}>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground">{dict.seoPage.baseTitle}</h2>
          <p className="mt-2 text-sm text-muted">{dict.seoPage.baseDesc}</p>
          <div className="mt-6 space-y-4">
            {seoFields.map((field) => (
              <div key={field.label}>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{field.label}</label>
                <input
                  type="text"
                  placeholder={field.placeholder}
                  className="mt-2 w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground"
                />
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {dict.seoPage.toggles.map((item) => (
              <label
                key={item}
                className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3 text-sm text-muted"
              >
                <span>{item}</span>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-foreground">{dict.seoPage.searchTitle}</h2>
            <p className="mt-2 text-sm text-muted">{dict.seoPage.searchDesc}</p>
            <div className="mt-6 space-y-4">
              {verificationFields.map((field) => (
                <div key={field.label}>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{field.label}</label>
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    className="mt-2 w-full rounded-xl border border-border/60 bg-black/30 px-4 py-3 text-sm text-foreground"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-foreground">{dict.seoPage.structuredTitle}</h2>
            <p className="mt-2 text-sm text-muted">{dict.seoPage.structuredDesc}</p>
            <div className="mt-6 space-y-3 text-sm text-muted">
              <div className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3">
                <span>{dict.seoPage.schemas.localBusiness}</span>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3">
                <span>{dict.seoPage.schemas.faq}</span>
                <input type="checkbox" className="h-4 w-4" />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3">
                <span>{dict.seoPage.schemas.product}</span>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
