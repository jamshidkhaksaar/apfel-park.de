export type SettingsData = {
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
