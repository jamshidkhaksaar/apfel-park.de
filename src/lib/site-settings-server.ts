import { createAdminDbClient } from "@/lib/admin-db";
import { defaultSocialLinks, siteInfo } from "@/lib/site";

const DEFAULT_TIKTOK_PIXEL_ID = "D8LV0ARC77UCVEHVMHGG";

export type MarketingIntegrations = {
  metaPixelEnabled: boolean;
  metaPixelId: string;
  tiktokPixelEnabled: boolean;
  tiktokPixelId: string;
  googleAnalyticsEnabled: boolean;
  googleAnalyticsId: string;
};

export type WhatsAppWidgetSettings = {
  widgetEnabled: boolean;
  number: string;
  defaultMessageDe: string;
  defaultMessageEn: string;
  cloudApiEnabled: boolean;
  phoneNumberId: string;
  businessAccountId: string;
};

export type HeroMediaSettings = {
  enabled: boolean;
  sourceType: "image" | "local" | "external";
  videoUrl: string;
  posterUrl: string;
  mobileImages: string[];
  fallbackImageUrl: string;
  title: string;
  subtitle: string;
};

export const getSiteSocialLinks = async () => {
  try {
    const admin = createAdminDbClient();
    const { data } = await admin
      .from("store_settings")
      .select("value")
      .eq("key", "site_social_links")
      .maybeSingle();

    const value = (data?.value as Record<string, string> | null) ?? null;

    return {
      ...defaultSocialLinks,
      ...(value ?? {}),
    };
  } catch {
    return defaultSocialLinks;
  }
};

export const getMarketingIntegrations = async (): Promise<MarketingIntegrations> => {
  try {
    const admin = createAdminDbClient();
    const { data } = await admin
      .from("store_settings")
      .select("value")
      .eq("key", "integrations")
      .maybeSingle();

    const value = (data?.value as Record<string, unknown> | null) ?? null;

    return {
      metaPixelEnabled: Boolean(value?.metaPixelEnabled),
      metaPixelId: typeof value?.metaPixelId === "string" ? value.metaPixelId : "",
      tiktokPixelEnabled: value?.tiktokPixelEnabled !== false,
      tiktokPixelId:
        typeof value?.tiktokPixelId === "string" && value.tiktokPixelId.trim()
          ? value.tiktokPixelId
          : DEFAULT_TIKTOK_PIXEL_ID,
      googleAnalyticsEnabled: Boolean(value?.googleAnalyticsEnabled),
      googleAnalyticsId: typeof value?.googleAnalyticsId === "string" ? value.googleAnalyticsId : "",
    };
  } catch {
    return {
      metaPixelEnabled: false,
      metaPixelId: "",
      tiktokPixelEnabled: true,
      tiktokPixelId: DEFAULT_TIKTOK_PIXEL_ID,
      googleAnalyticsEnabled: false,
      googleAnalyticsId: "",
    };
  }
};

export const getWhatsAppWidgetSettings = async (): Promise<WhatsAppWidgetSettings> => {
  try {
    const admin = createAdminDbClient();
    const { data } = await admin
      .from("store_settings")
      .select("value")
      .eq("key", "integrations")
      .maybeSingle();

    const value = (data?.value as Record<string, unknown> | null) ?? null;

    return {
      widgetEnabled: value?.whatsappWidgetEnabled !== false,
      number:
        typeof value?.whatsappNumber === "string" && value.whatsappNumber.trim()
          ? value.whatsappNumber
          : siteInfo.whatsapp,
      defaultMessageDe:
        typeof value?.whatsappDefaultMessageDe === "string" && value.whatsappDefaultMessageDe.trim()
          ? value.whatsappDefaultMessageDe
          : "Hallo! Ich habe eine Frage zu Ihren Services.",
      defaultMessageEn:
        typeof value?.whatsappDefaultMessageEn === "string" && value.whatsappDefaultMessageEn.trim()
          ? value.whatsappDefaultMessageEn
          : "Hello! I have a question about your services.",
      cloudApiEnabled: Boolean(value?.whatsappCloudApiEnabled),
      phoneNumberId: typeof value?.whatsappPhoneNumberId === "string" ? value.whatsappPhoneNumberId : "",
      businessAccountId:
        typeof value?.whatsappBusinessAccountId === "string" ? value.whatsappBusinessAccountId : "",
    };
  } catch {
    return {
      widgetEnabled: true,
      number: siteInfo.whatsapp,
      defaultMessageDe: "Hallo! Ich habe eine Frage zu Ihren Services.",
      defaultMessageEn: "Hello! I have a question about your services.",
      cloudApiEnabled: false,
      phoneNumberId: "",
      businessAccountId: "",
    };
  }
};

export const getHeroMediaSettings = async (): Promise<HeroMediaSettings> => {
  try {
    const admin = createAdminDbClient();
    const { data } = await admin
      .from("store_settings")
      .select("value")
      .eq("key", "hero_media")
      .maybeSingle();

    const value = (data?.value as Record<string, unknown> | null) ?? null;

    const sourceType =
      value?.sourceType === "local" || value?.sourceType === "external" || value?.sourceType === "image"
        ? value.sourceType
        : "image";

    return {
      enabled: Boolean(value?.enabled),
      sourceType,
      videoUrl: typeof value?.videoUrl === "string" ? value.videoUrl : "",
      posterUrl: typeof value?.posterUrl === "string" ? value.posterUrl : "",
      mobileImages: Array.isArray(value?.mobileImages)
        ? value.mobileImages.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, 8)
        : [],
      fallbackImageUrl:
        typeof value?.fallbackImageUrl === "string" && value.fallbackImageUrl.trim()
          ? value.fallbackImageUrl
          : "/images/shop2.jpg",
      title:
        typeof value?.title === "string" && value.title.trim()
          ? value.title
          : "Hero background video",
      subtitle:
        typeof value?.subtitle === "string" && value.subtitle.trim()
          ? value.subtitle
          : "Muted autoplay background optimized for desktop visitors.",
    };
  } catch {
    return {
      enabled: false,
      sourceType: "image",
      videoUrl: "",
      posterUrl: "",
      mobileImages: [],
      fallbackImageUrl: "/images/shop2.jpg",
      title: "Hero background video",
      subtitle: "Muted autoplay background optimized for desktop visitors.",
    };
  }
};
