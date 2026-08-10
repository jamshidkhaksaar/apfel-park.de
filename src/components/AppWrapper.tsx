"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import MarketingConsentScripts from "./MarketingConsentScripts";
import { siteInfo } from "@/lib/site";

const CookieBanner = dynamic(() => import("./CookieBanner"), { ssr: false });
const ChatWidget = dynamic(() => import("./ChatWidget"), { ssr: false });
const GoogleReviewsBadge = dynamic(() => import("./GoogleReviewsBadge"), { ssr: false });
const ProductPromoPopup = dynamic(() => import("./ProductPromoPopup"), { ssr: false });

type AppWrapperProps = {
  children: React.ReactNode;
  lang: "de" | "en";
  promo: {
    enabled: boolean;
    title: { de: string; en: string };
    description: { de: string; en: string };
    ctaLabel: { de: string; en: string };
    ctaHref: string;
  };
  discountedProducts: Array<{
    id: string;
    title: string;
    slug: string;
    price: number;
    compareAtPrice?: number;
  }>;
  marketing: {
    metaPixelEnabled: boolean;
    metaPixelId: string;
    tiktokPixelEnabled: boolean;
    tiktokPixelId: string;
    googleAnalyticsEnabled: boolean;
    googleAnalyticsId: string;
  };
  whatsapp: {
    widgetEnabled: boolean;
    number: string;
    defaultMessageDe: string;
    defaultMessageEn: string;
    cloudApiEnabled: boolean;
  };
};

export default function AppWrapper({ children, lang, promo, discountedProducts, marketing, whatsapp }: AppWrapperProps) {
  const pathname = usePathname();
  const effectiveLang = pathname?.startsWith("/en") ? "en" : pathname?.startsWith("/de") ? "de" : lang;

  useEffect(() => {
    try {
      const buildId = (window as { __NEXT_DATA__?: { buildId?: string } }).__NEXT_DATA__?.buildId;
      if (!buildId) return;

      const storageKey = "apfel-build-id";
      const stored = localStorage.getItem(storageKey);

      if (stored && stored !== buildId) {
        localStorage.setItem(storageKey, buildId);
        window.location.reload();
        return;
      }

      if (!stored) {
        localStorage.setItem(storageKey, buildId);
      }
    } catch {
      // localStorage not available
    }
  }, []);

  useEffect(() => {
    const reloadKey = "apfel-chunk-reload-once";

    const maybeRecoverFromChunkError = (message: string, source = "") => {
      const looksLikeChunkError =
        message.includes("ChunkLoadError") ||
        message.includes("/_next/static/chunks/") ||
        message.includes("Failed to fetch dynamically imported module") ||
        source.includes("/_next/static/chunks/");

      if (!looksLikeChunkError) return;

      try {
        if (sessionStorage.getItem(reloadKey) === "1") return;
        sessionStorage.setItem(reloadKey, "1");
      } catch {
        return;
      }

      window.location.reload();
    };

    const onWindowError = (event: ErrorEvent) => {
      const target = event.target as HTMLScriptElement | HTMLLinkElement | null;
      const source =
        (target instanceof HTMLScriptElement && target.src) ||
        (target instanceof HTMLLinkElement && target.href) ||
        event.filename ||
        "";

      maybeRecoverFromChunkError(event.message || "", source);
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason =
        typeof event.reason === "string"
          ? event.reason
          : event.reason instanceof Error
            ? event.reason.message
            : "";

      maybeRecoverFromChunkError(reason);
    };

    window.addEventListener("error", onWindowError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onWindowError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return (
    <>
      <div className="relative z-10">{children}</div>
      <MarketingConsentScripts {...marketing} />
      <ProductPromoPopup lang={effectiveLang} promo={promo} discountedProducts={discountedProducts} />
      <ChatWidget lang={effectiveLang} whatsapp={whatsapp} />
      {siteInfo.googleReviewsBadge ? (
        <GoogleReviewsBadge merchantId={siteInfo.googleMerchantId} locale={effectiveLang} />
      ) : null}
      <CookieBanner lang={effectiveLang} />
    </>
  );
}
