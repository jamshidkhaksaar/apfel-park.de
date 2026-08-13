export type AnalyticsItem = {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_variant?: string;
  price?: number;
  quantity?: number;
};

type AnalyticsPayload = Record<string, unknown>;

const compactItem = (item: AnalyticsItem): AnalyticsItem =>
  Object.fromEntries(
    Object.entries(item).filter(([, value]) => value !== undefined && value !== ""),
  ) as AnalyticsItem;

export const analyticsItem = (input: AnalyticsItem): AnalyticsItem => compactItem(input);

/**
 * GA4 ecommerce reports only read product data from `items`. Meta and TikTok
 * still receive the legacy content_* fields, so this helper adds GA4's shape
 * without removing anything those pixels already use.
 */
export const withGa4Items = (
  payload: AnalyticsPayload,
  items: AnalyticsItem[],
): AnalyticsPayload => ({
  ...payload,
  items: items.map(compactItem),
});

/**
 * gtag.js expects dataLayer entries to be Arguments objects. Pushing a normal
 * array looks similar in DevTools but is ignored by Google's command queue.
 */
export const pushGtagCommand = (
  dataLayer: unknown[],
  command: string,
  ...args: unknown[]
) => {
  const toArguments = function (this: unknown, ...values: unknown[]) {
    void values;
    // gtag.js explicitly requires an Arguments object, not a rest-parameter
    // array. Keeping this function non-arrow is intentional.
    // eslint-disable-next-line prefer-rest-params
    return arguments;
  };
  const commandArguments = toArguments(command, ...args);
  dataLayer.push(commandArguments);
};
