const SENSITIVE_ANALYTICS_PARAMS = new Set([
  "order_id",
  "return_token",
  "token",
  "session_id",
  "payment_intent",
  "payment_intent_client_secret",
  "redirect_status",
  "provider",
  "payerid", "payer_id", "email", "phone", "name", "address", "imei", "serial", "eid", "code", "state",
]);

export const analyticsPagePath = (
  pathname: string,
  input: URLSearchParams | ReadonlyURLSearchParams,
): string => {
  const params = new URLSearchParams(input.toString());
  for (const key of [...params.keys()]) {
    if (SENSITIVE_ANALYTICS_PARAMS.has(key.toLowerCase()) || /token|secret|password|authorization|customer/i.test(key)) params.delete(key);
  }
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
};

type ReadonlyURLSearchParams = Pick<URLSearchParams, "toString">;

export const analyticsPageContext = (
  pathname: string,
  input: URLSearchParams | ReadonlyURLSearchParams,
  origin: string,
  referrer = '',
): Record<string, string> => {
  const pagePath = analyticsPagePath(pathname, input);
  let safeReferrer = '';
  try {
    const parsed = new URL(referrer);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') safeReferrer = parsed.origin + parsed.pathname;
  } catch { /* A missing referrer is normal for direct traffic. */ }
  return { page_path: pagePath, page_location: new URL(pagePath, origin).toString(), page_referrer: safeReferrer };
};
