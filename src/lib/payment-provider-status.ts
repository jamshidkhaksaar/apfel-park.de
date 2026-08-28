export type StripeConfiguration = {
  ready: boolean;
  webhookConfigured: boolean;
  publishableConfigured: boolean;
  checkoutMode: "hosted" | "embedded";
};

export const resolveStripeConfiguration = ({
  secret,
  webhook,
  publishable,
}: {
  secret?: string | null;
  webhook?: string | null;
  publishable?: string | null;
}): StripeConfiguration => {
  const secretConfigured = Boolean(secret?.trim());
  const webhookConfigured = Boolean(webhook?.trim());
  const publishableConfigured = Boolean(publishable?.trim());
  return {
    ready: secretConfigured && webhookConfigured,
    webhookConfigured,
    publishableConfigured,
    checkoutMode: publishableConfigured ? "embedded" : "hosted",
  };
};
