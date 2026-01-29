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
