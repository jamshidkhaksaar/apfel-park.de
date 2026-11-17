export type SettingsData = {
  /** Admin control for the seasonal campaign; `auto` follows env + calendar. */
  campaign: {
    mode: "auto" | "on" | "off";
    /**
     * Black Friday menus in the admin (deal column, editor box, Black Week
     * panel), independent of the shop theme so prices can be prepared while
     * the theme is still off. `auto`: teaser start until Cyber Monday.
     */
    adminTools?: "auto" | "on" | "off";
  };
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
    siteEnabled: boolean;
    storeEnabled: boolean;
  };
  recaptcha: {
    enabled: boolean;
    siteKey: string;
    secretKey: string;
    minScore: number;
  };
  integrations: {
    whatsappWidgetEnabled: boolean;
    whatsappNumber: string;
    whatsappDefaultMessageDe: string;
    whatsappDefaultMessageEn: string;
    whatsappCloudApiEnabled: boolean;
    whatsappPhoneNumberId: string;
    whatsappBusinessAccountId: string;
    whatsappAccessToken: string;
    whatsappWebhookVerifyToken: string;
    metaPixelEnabled: boolean;
    metaPixelId: string;
    metaConversionsApiToken: string;
    metaDatasetQualityApiToken: string;
    metaConversionsTestEventCode: string;
    tiktokPixelEnabled: boolean;
    tiktokPixelId: string;
    tiktokEventsApiToken: string;
    tiktokTestEventCode: string;
    googleAnalyticsEnabled: boolean;
    googleAnalyticsId: string;
    facebookPageId: string;
    facebookPageAccessToken: string;
    instagramBusinessAccountId: string;
    instagramAccessToken: string;
    tiktokShopEnabled: boolean;
    tiktokShopAppKey: string;
    tiktokShopAppSecret: string;
    tiktokShopWebhookSecret: string;
    autoPublishNewProducts: boolean;
    autoPublishDiscountProducts: boolean;
  };
};
