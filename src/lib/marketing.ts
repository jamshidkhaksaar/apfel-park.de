import { createHash, randomUUID } from "node:crypto";

import { createAdminDbClient } from "@/lib/admin-db";

type MarketingIntegrationsConfig = {
  metaPixelEnabled: boolean;
  metaPixelId: string;
  metaConversionsApiToken: string;
  metaConversionsTestEventCode: string;
  tiktokPixelEnabled: boolean;
  tiktokPixelId: string;
  tiktokEventsApiToken: string;
  tiktokTestEventCode: string;
  facebookPageId: string;
  facebookPageAccessToken: string;
  instagramBusinessAccountId: string;
  instagramAccessToken: string;
  autoPublishNewProducts: boolean;
  autoPublishDiscountProducts: boolean;
};

type MarketingRequestContext = {
  consentMode?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  url?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  externalId?: string | null;
};

type LeadPayload = {
  eventName: string;
  eventId?: string;
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  locale?: string | null;
  value?: number | null;
  currency?: string;
  formType: "contact" | "repair";
  deviceModel?: string | null;
};

type CatalogInteractionPayload = {
  eventName: "ViewContent" | "AddToCart";
  eventId?: string;
  productId: string;
  title: string;
  category: string;
  condition?: string;
  price?: number | null;
  currency?: string;
  locale?: string | null;
};

type ViewContentPayload = CatalogInteractionPayload & {
  eventName: "ViewContent";
};

type AddToCartPayload = CatalogInteractionPayload & {
  eventName: "AddToCart";
};

type PurchasePayload = {
  eventId?: string;
  orderId: string;
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  value: number;
  currency?: string;
  items: Array<{
    productId?: string;
    product_id?: string;
    title?: string;
    quantity?: number;
    unitAmount?: number;
    unit_amount?: number;
    category?: string;
  }>;
};

type ProductPromotionPayload = {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  slug: string;
  imageUrl?: string | null;
  price?: number | null;
  compareAtPrice?: number | null;
  locale?: "de" | "en";
};

export type EventSendResult = {
  success: boolean;
  target: "meta" | "tiktok";
  status?: number;
  error?: string;
};

export type SocialPublishResult = {
  success: boolean;
  target: "facebook" | "instagram";
  status?: number;
  postId?: string;
  error?: string;
};

const EXTERNAL_CONSENT = "external";
const META_API_VERSION = "v22.0";
const TIKTOK_EVENTS_API_URL = "https://business-api.tiktok.com/open_api/v1.3/event/track/";
const SOCIAL_PUBLISH_TIMEOUT_MS = 15000;

const parseGraphError = (responseText: string) => {
  if (!responseText) return "Meta returned an empty error response";

  try {
    const parsed = JSON.parse(responseText) as { error?: { message?: string; code?: number; error_subcode?: number } };
    if (parsed.error?.message) {
      const details = [
        parsed.error.code ? `code ${parsed.error.code}` : "",
        parsed.error.error_subcode ? `subcode ${parsed.error.error_subcode}` : "",
      ].filter(Boolean).join(", ");
      return details ? `${parsed.error.message} (${details})` : parsed.error.message;
    }
  } catch {
    // Fall through to the raw response slice.
  }

  return responseText.slice(0, 500);
};

const normalizeString = (value: string | null | undefined) => (value ?? "").trim();

const hashValue = (value: string | null | undefined) => {
  const normalized = normalizeString(value).toLowerCase();
  if (!normalized) return undefined;
  return createHash("sha256").update(normalized).digest("hex");
};

const hashPhone = (value: string | null | undefined) => {
  const normalized = normalizeString(value).replace(/\D/g, "");
  if (!normalized) return undefined;
  return createHash("sha256").update(normalized).digest("hex");
};

const splitName = (value: string | null | undefined) => {
  const normalized = normalizeString(value);
  if (!normalized) return { firstName: undefined, lastName: undefined };
  const parts = normalized.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: undefined, lastName: undefined };
  return {
    firstName: parts[0],
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : undefined,
  };
};

const getIntegrations = async (): Promise<MarketingIntegrationsConfig> => {
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
      metaConversionsApiToken: typeof value?.metaConversionsApiToken === "string" ? value.metaConversionsApiToken : "",
      metaConversionsTestEventCode: typeof value?.metaConversionsTestEventCode === "string" ? value.metaConversionsTestEventCode : "",
      tiktokPixelEnabled: Boolean(value?.tiktokPixelEnabled),
      tiktokPixelId: typeof value?.tiktokPixelId === "string" ? value.tiktokPixelId : "",
      tiktokEventsApiToken: typeof value?.tiktokEventsApiToken === "string" ? value.tiktokEventsApiToken : "",
      tiktokTestEventCode: typeof value?.tiktokTestEventCode === "string" ? value.tiktokTestEventCode : "",
      facebookPageId: typeof value?.facebookPageId === "string" ? value.facebookPageId : "",
      facebookPageAccessToken: typeof value?.facebookPageAccessToken === "string" ? value.facebookPageAccessToken : "",
      instagramBusinessAccountId: typeof value?.instagramBusinessAccountId === "string" ? value.instagramBusinessAccountId : "",
      instagramAccessToken: typeof value?.instagramAccessToken === "string" ? value.instagramAccessToken : "",
      autoPublishNewProducts: Boolean(value?.autoPublishNewProducts),
      autoPublishDiscountProducts: Boolean(value?.autoPublishDiscountProducts),
    };
  } catch {
    return {
      metaPixelEnabled: false,
      metaPixelId: "",
      metaConversionsApiToken: "",
      metaConversionsTestEventCode: "",
      tiktokPixelEnabled: false,
      tiktokPixelId: "",
      tiktokEventsApiToken: "",
      tiktokTestEventCode: "",
      facebookPageId: "",
      facebookPageAccessToken: "",
      instagramBusinessAccountId: "",
      instagramAccessToken: "",
      autoPublishNewProducts: false,
      autoPublishDiscountProducts: false,
    };
  }
};

const canTrack = (context: MarketingRequestContext) => context.consentMode === EXTERNAL_CONSENT;

const buildMetaUserData = (
  context: MarketingRequestContext,
) => ({
  client_ip_address: context.ipAddress || undefined,
  client_user_agent: context.userAgent || undefined,
  fbp: context.fbp || undefined,
  fbc: context.fbc || undefined,
  external_id: hashValue(context.externalId),
});

const sendMetaLeadEvent = async (
  config: MarketingIntegrationsConfig,
  payload: LeadPayload,
  context: MarketingRequestContext,
): Promise<EventSendResult> => {
  if (!config.metaPixelEnabled || !config.metaPixelId || !config.metaConversionsApiToken) {
    return { success: false, target: "meta", error: "Meta Conversions API not configured" };
  }

  const { firstName, lastName } = splitName(payload.firstName || payload.lastName || null);
  const eventId = payload.eventId || randomUUID();
  const requestBody = {
    data: [
      {
        event_name: payload.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: "website",
        event_source_url: context.url || "https://apfel-park.de",
        user_data: {
          em: hashValue(payload.email),
          ph: hashPhone(payload.phone),
          fn: hashValue(firstName),
          ln: hashValue(lastName),
          client_ip_address: context.ipAddress || undefined,
          client_user_agent: context.userAgent || undefined,
        },
        custom_data: {
          currency: payload.currency || "EUR",
          value: payload.value ?? 0,
          form_type: payload.formType,
          device_model: payload.deviceModel || undefined,
          locale: payload.locale || undefined,
        },
      },
    ],
    test_event_code: config.metaConversionsTestEventCode || undefined,
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/${META_API_VERSION}/${config.metaPixelId}/events?access_token=${encodeURIComponent(config.metaConversionsApiToken)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(4000),
      },
    );

    if (!response.ok) {
      return {
        success: false,
        target: "meta",
        status: response.status,
        error: await response.text(),
      };
    }

    return { success: true, target: "meta", status: response.status };
  } catch (error) {
    return {
      success: false,
      target: "meta",
      error: error instanceof Error ? error.message : "Meta request failed",
    };
  }
};

const sendTikTokLeadEvent = async (
  config: MarketingIntegrationsConfig,
  payload: LeadPayload,
  context: MarketingRequestContext,
): Promise<EventSendResult> => {
  if (!config.tiktokPixelEnabled || !config.tiktokPixelId || !config.tiktokEventsApiToken) {
    return { success: false, target: "tiktok", error: "TikTok Events API not configured" };
  }

  const eventId = payload.eventId || randomUUID();
  const requestBody = {
    event_source: "web",
    event_source_id: config.tiktokPixelId,
    data: [
      {
        event: "SubmitForm",
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        page: {
          url: context.url || "https://apfel-park.de",
        },
        user: {
          email: hashValue(payload.email),
          phone_number: hashPhone(payload.phone),
          external_id: hashValue(payload.email || payload.phone || `${payload.formType}-${eventId}`),
          user_agent: context.userAgent || undefined,
          ip: context.ipAddress || undefined,
        },
        properties: {
          value: payload.value ?? 0,
          currency: payload.currency || "EUR",
          form_type: payload.formType,
          device_model: payload.deviceModel || undefined,
          locale: payload.locale || undefined,
        },
      },
    ],
    test_event_code: config.tiktokTestEventCode || undefined,
  };

  try {
    const response = await fetch(TIKTOK_EVENTS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Token": config.tiktokEventsApiToken,
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(4000),
    });

    if (!response.ok) {
      return {
        success: false,
        target: "tiktok",
        status: response.status,
        error: await response.text(),
      };
    }

    return { success: true, target: "tiktok", status: response.status };
  } catch (error) {
    return {
      success: false,
      target: "tiktok",
      error: error instanceof Error ? error.message : "TikTok request failed",
    };
  }
};

const logFailures = (results: EventSendResult[]) => {
  results.filter((result) => !result.success).forEach((result) => {
    console.warn(`[Marketing] ${result.target} event failed:`, result.error || `status ${result.status}`);
  });
};

export const sendLeadTrackingEvents = async (
  payload: LeadPayload,
  context: MarketingRequestContext,
) => {
  if (!canTrack(context)) return [];

  const config = await getIntegrations();
  const [metaResult, tikTokResult] = await Promise.all([
    sendMetaLeadEvent(config, payload, context),
    sendTikTokLeadEvent(config, payload, context),
  ]);

  logFailures([metaResult, tikTokResult]);
  return [metaResult, tikTokResult];
};

const sendMetaViewContentEvent = async (
  config: MarketingIntegrationsConfig,
  payload: CatalogInteractionPayload,
  context: MarketingRequestContext,
): Promise<EventSendResult> => {
  if (!config.metaPixelEnabled || !config.metaPixelId || !config.metaConversionsApiToken) {
    return { success: false, target: "meta", error: "Meta Conversions API not configured" };
  }

  const eventId = payload.eventId || randomUUID();
  const requestBody = {
    data: [
      {
        event_name: payload.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: "website",
        event_source_url: context.url || "https://apfel-park.de",
        user_data: buildMetaUserData(context),
        custom_data: {
          currency: payload.currency || "EUR",
          value: payload.price ?? 0,
          content_name: payload.title,
          content_category: payload.category,
          content_condition: payload.condition || "new",
          content_ids: [payload.productId],
          content_type: "product",
          locale: payload.locale || undefined,
        },
      },
    ],
    test_event_code: config.metaConversionsTestEventCode || undefined,
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/${META_API_VERSION}/${config.metaPixelId}/events?access_token=${encodeURIComponent(config.metaConversionsApiToken)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(4000),
      },
    );

    if (!response.ok) {
      return { success: false, target: "meta", status: response.status, error: await response.text() };
    }

    return { success: true, target: "meta", status: response.status };
  } catch (error) {
    return { success: false, target: "meta", error: error instanceof Error ? error.message : "Meta request failed" };
  }
};

const sendTikTokViewContentEvent = async (
  config: MarketingIntegrationsConfig,
  payload: CatalogInteractionPayload,
  context: MarketingRequestContext,
): Promise<EventSendResult> => {
  if (!config.tiktokPixelEnabled || !config.tiktokPixelId || !config.tiktokEventsApiToken) {
    return { success: false, target: "tiktok", error: "TikTok Events API not configured" };
  }

  const eventId = payload.eventId || randomUUID();
  const requestBody = {
    event_source: "web",
    event_source_id: config.tiktokPixelId,
    data: [
      {
        event: payload.eventName === "AddToCart" ? "AddToCart" : "ViewContent",
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        page: { url: context.url || "https://apfel-park.de" },
        user: {
          user_agent: context.userAgent || undefined,
          ip: context.ipAddress || undefined,
        },
        properties: {
          value: payload.price ?? 0,
          currency: payload.currency || "EUR",
          content_id: payload.productId,
          content_name: payload.title,
          content_category: payload.category,
          content_condition: payload.condition || "new",
          locale: payload.locale || undefined,
        },
      },
    ],
    test_event_code: config.tiktokTestEventCode || undefined,
  };

  try {
    const response = await fetch(TIKTOK_EVENTS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Token": config.tiktokEventsApiToken,
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(4000),
    });

    if (!response.ok) {
      return { success: false, target: "tiktok", status: response.status, error: await response.text() };
    }

    return { success: true, target: "tiktok", status: response.status };
  } catch (error) {
    return { success: false, target: "tiktok", error: error instanceof Error ? error.message : "TikTok request failed" };
  }
};

export const sendViewContentTrackingEvents = async (
  payload: ViewContentPayload,
  context: MarketingRequestContext,
) => {
  if (!canTrack(context)) return [];

  const config = await getIntegrations();
  const [metaResult, tikTokResult] = await Promise.all([
    sendMetaViewContentEvent(config, payload, context),
    sendTikTokViewContentEvent(config, payload, context),
  ]);

  logFailures([metaResult, tikTokResult]);
  return [metaResult, tikTokResult];
};

export const sendAddToCartTrackingEvents = async (
  payload: AddToCartPayload,
  context: MarketingRequestContext,
) => {
  if (!canTrack(context)) return [];

  const config = await getIntegrations();
  const [metaResult, tikTokResult] = await Promise.all([
    sendMetaViewContentEvent(config, payload, context),
    sendTikTokViewContentEvent(config, payload, context),
  ]);

  logFailures([metaResult, tikTokResult]);
  return [metaResult, tikTokResult];
};

const sendMetaPurchaseEvent = async (
  config: MarketingIntegrationsConfig,
  payload: PurchasePayload,
  context: MarketingRequestContext,
): Promise<EventSendResult> => {
  if (!config.metaPixelEnabled || !config.metaPixelId || !config.metaConversionsApiToken) {
    return { success: false, target: "meta", error: "Meta Conversions API not configured" };
  }

  const eventId = payload.eventId || `purchase-${payload.orderId}`;
  const requestBody = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: "website",
        event_source_url: context.url || "https://apfel-park.de/checkout/success",
        user_data: {
          ...buildMetaUserData({ ...context, externalId: context.externalId || payload.email || payload.phone || null }),
          em: hashValue(payload.email),
          ph: hashPhone(payload.phone),
          fn: hashValue(payload.firstName),
        },
        custom_data: {
          currency: payload.currency || "EUR",
          value: payload.value,
          order_id: payload.orderId,
          content_type: "product",
          content_ids: payload.items.map((item) => item.productId || item.product_id).filter(Boolean),
          contents: payload.items.map((item) => ({
            id: item.productId || item.product_id,
            quantity: item.quantity ?? 1,
            item_price: item.unitAmount ?? item.unit_amount ?? 0,
          })),
        },
      },
    ],
    test_event_code: config.metaConversionsTestEventCode || undefined,
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/${META_API_VERSION}/${config.metaPixelId}/events?access_token=${encodeURIComponent(config.metaConversionsApiToken)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(4000),
      },
    );

    if (!response.ok) {
      return { success: false, target: "meta", status: response.status, error: await response.text() };
    }

    return { success: true, target: "meta", status: response.status };
  } catch (error) {
    return { success: false, target: "meta", error: error instanceof Error ? error.message : "Meta request failed" };
  }
};

const sendTikTokPurchaseEvent = async (
  config: MarketingIntegrationsConfig,
  payload: PurchasePayload,
  context: MarketingRequestContext,
): Promise<EventSendResult> => {
  if (!config.tiktokPixelEnabled || !config.tiktokPixelId || !config.tiktokEventsApiToken) {
    return { success: false, target: "tiktok", error: "TikTok Events API not configured" };
  }

  const eventId = payload.eventId || `purchase-${payload.orderId}`;
  const requestBody = {
    event_source: "web",
    event_source_id: config.tiktokPixelId,
    data: [
      {
        event: "CompletePayment",
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        page: { url: context.url || "https://apfel-park.de/checkout/success" },
        user: {
          email: hashValue(payload.email),
          phone_number: hashPhone(payload.phone),
          external_id: hashValue(payload.email || payload.phone || payload.orderId),
          user_agent: context.userAgent || undefined,
          ip: context.ipAddress || undefined,
        },
        properties: {
          value: payload.value,
          currency: payload.currency || "EUR",
          order_id: payload.orderId,
          contents: payload.items.map((item) => ({
            content_id: item.productId || item.product_id,
            content_name: item.title,
            content_category: item.category,
            quantity: item.quantity ?? 1,
            price: item.unitAmount ?? item.unit_amount ?? 0,
          })),
        },
      },
    ],
    test_event_code: config.tiktokTestEventCode || undefined,
  };

  try {
    const response = await fetch(TIKTOK_EVENTS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Token": config.tiktokEventsApiToken,
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(4000),
    });

    if (!response.ok) {
      return { success: false, target: "tiktok", status: response.status, error: await response.text() };
    }

    return { success: true, target: "tiktok", status: response.status };
  } catch (error) {
    return { success: false, target: "tiktok", error: error instanceof Error ? error.message : "TikTok request failed" };
  }
};

export const sendPurchaseTrackingEvents = async (
  payload: PurchasePayload,
  context: MarketingRequestContext,
) => {
  if (!canTrack(context)) return [];

  const config = await getIntegrations();
  const [metaResult, tikTokResult] = await Promise.all([
    sendMetaPurchaseEvent(config, payload, context),
    sendTikTokPurchaseEvent(config, payload, context),
  ]);

  logFailures([metaResult, tikTokResult]);
  return [metaResult, tikTokResult];
};

export const sendTrackingTestEvents = async () => {
  const config = await getIntegrations();
  const context: MarketingRequestContext = {
    consentMode: "external",
    url: "https://apfel-park.de/admin/settings",
    userAgent: "ApfelPark-Admin-Test",
  };
  const eventId = randomUUID();

  const [metaResult, tikTokResult] = await Promise.all([
    sendMetaLeadEvent(
      config,
      {
        eventName: "Lead",
        eventId,
        email: "test@apfel-park.de",
        firstName: "Apfel Park Test",
        locale: "de",
        formType: "contact",
      },
      context,
    ),
    sendTikTokLeadEvent(
      config,
      {
        eventName: "Lead",
        eventId,
        email: "test@apfel-park.de",
        firstName: "Apfel Park Test",
        locale: "de",
        formType: "contact",
      },
      context,
    ),
  ]);

  return [metaResult, tikTokResult];
};

const createPromotionText = (payload: ProductPromotionPayload) => {
  const locale = payload.locale === "en" ? "en" : "de";
  const price = typeof payload.price === "number" ? new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-US", {
    style: "currency",
    currency: "EUR",
  }).format(payload.price) : null;
  const compareAt = typeof payload.compareAtPrice === "number" ? new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-US", {
    style: "currency",
    currency: "EUR",
  }).format(payload.compareAtPrice) : null;

  if (locale === "de") {
    return [
      `Neu im Shop: ${payload.title}`,
      payload.subtitle || payload.description || "",
      price ? `Preis: ${price}` : "",
      compareAt && payload.compareAtPrice && payload.price && payload.compareAtPrice > payload.price ? `Statt ${compareAt}` : "",
      `Mehr erfahren: https://apfel-park.de/de/store/${payload.slug}`,
    ].filter(Boolean).join("\n");
  }

  return [
    `New in store: ${payload.title}`,
    payload.subtitle || payload.description || "",
    price ? `Price: ${price}` : "",
    compareAt && payload.compareAtPrice && payload.price && payload.compareAtPrice > payload.price ? `Previously ${compareAt}` : "",
    `Learn more: https://apfel-park.de/en/store/${payload.slug}`,
  ].filter(Boolean).join("\n");
};

const publishFacebookPost = async (
  config: MarketingIntegrationsConfig,
  message: string,
  link: string,
): Promise<SocialPublishResult> => {
  if (!config.facebookPageId || !config.facebookPageAccessToken) {
    return { success: false, target: "facebook", error: "Facebook publishing not configured" };
  }

  try {
    const response = await fetch(`https://graph.facebook.com/${META_API_VERSION}/${config.facebookPageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        message,
        link,
        access_token: config.facebookPageAccessToken,
      }),
      signal: AbortSignal.timeout(SOCIAL_PUBLISH_TIMEOUT_MS),
    });

    const responseText = await response.text();
    if (!response.ok) {
      return { success: false, target: "facebook", status: response.status, error: parseGraphError(responseText) };
    }

    const published = responseText ? JSON.parse(responseText) as { id?: string } : {};
    return { success: true, target: "facebook", status: response.status, postId: published.id };
  } catch (error) {
    console.warn("[Marketing] Facebook publish failed:", error);
    return {
      success: false,
      target: "facebook",
      error: error instanceof Error ? error.message : "Facebook publish failed",
    };
  }
};

const publishInstagramPost = async (
  config: MarketingIntegrationsConfig,
  caption: string,
  imageUrl?: string | null,
): Promise<SocialPublishResult> => {
  if (!config.instagramBusinessAccountId || !config.instagramAccessToken) {
    return { success: false, target: "instagram", error: "Instagram publishing not configured" };
  }
  if (!imageUrl) {
    return { success: false, target: "instagram", error: "Instagram publishing requires a product image" };
  }

  const publicImageUrl = imageUrl.startsWith("http")
    ? imageUrl
    : `https://apfel-park.de/api/public/social-image?src=${encodeURIComponent(imageUrl)}`;

  try {
    const createRes = await fetch(`https://graph.facebook.com/${META_API_VERSION}/${config.instagramBusinessAccountId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        image_url: publicImageUrl,
        caption,
        access_token: config.instagramAccessToken,
      }),
      signal: AbortSignal.timeout(SOCIAL_PUBLISH_TIMEOUT_MS),
    });

    const createText = await createRes.text();
    if (!createRes.ok) {
      return { success: false, target: "instagram", status: createRes.status, error: parseGraphError(createText) };
    }

    const creation = createText ? JSON.parse(createText) as { id?: string } : {};
    if (!creation.id) {
      return { success: false, target: "instagram", status: createRes.status, error: "Instagram did not return a creation ID" };
    }

    const publishRes = await fetch(`https://graph.facebook.com/${META_API_VERSION}/${config.instagramBusinessAccountId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        creation_id: creation.id,
        access_token: config.instagramAccessToken,
      }),
      signal: AbortSignal.timeout(SOCIAL_PUBLISH_TIMEOUT_MS),
    });

    const publishText = await publishRes.text();
    if (!publishRes.ok) {
      return { success: false, target: "instagram", status: publishRes.status, error: parseGraphError(publishText) };
    }

    const published = publishText ? JSON.parse(publishText) as { id?: string } : {};
    return { success: true, target: "instagram", status: publishRes.status, postId: published.id };
  } catch (error) {
    console.warn("[Marketing] Instagram publish failed:", error);
    return {
      success: false,
      target: "instagram",
      error: error instanceof Error ? error.message : "Instagram publish failed",
    };
  }
};

export const autoPublishProductPromotion = async (
  payload: ProductPromotionPayload,
  mode: "new" | "discount",
): Promise<SocialPublishResult[]> => {
  const config = await getIntegrations();
  if (mode === "new" && !config.autoPublishNewProducts) return [];
  if (mode === "discount" && !config.autoPublishDiscountProducts) return [];

  const locale = payload.locale === "en" ? "en" : "de";
  const link = `https://apfel-park.de/${locale}/store/${payload.slug}`;
  const text = createPromotionText(payload);

  const results = await Promise.all([
    publishFacebookPost(config, text, link),
    publishInstagramPost(config, text, payload.imageUrl || null),
  ]);

  results.forEach((result) => {
    if (result.success) {
      console.info(`[Marketing] ${result.target} published`, result.postId ? { postId: result.postId } : {});
      return;
    }

    console.warn(`[Marketing] ${result.target} publish failed:`, result.error || `status ${result.status}`);
  });

  return results;
};
