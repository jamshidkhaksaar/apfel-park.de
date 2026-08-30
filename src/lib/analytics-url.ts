const SENSITIVE_ANALYTICS_PARAMS = new Set([
  "order_id",
  "return_token",
  "token",
  "session_id",
  "payment_intent",
  "payment_intent_client_secret",
  "redirect_status",
  "provider",
]);

export const analyticsPagePath = (
  pathname: string,
  input: URLSearchParams | ReadonlyURLSearchParams,
): string => {
  const params = new URLSearchParams(input.toString());
  for (const key of SENSITIVE_ANALYTICS_PARAMS) params.delete(key);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
};

type ReadonlyURLSearchParams = Pick<URLSearchParams, "toString">;
