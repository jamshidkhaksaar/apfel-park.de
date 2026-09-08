export type ConfirmationResult = 'paid' | 'failed' | 'cancelled' | 'refunded' | 'unavailable' | 'timeout';

/** Bounded, read-only refresh; its cleanup aborts requests and suppresses callbacks. */
export const startCheckoutConfirmationPolling = ({
  orderId,
  onResult,
  fetcher = fetch,
}: {
  orderId: string;
  onResult: (result: ConfirmationResult) => void;
  fetcher?: typeof fetch;
}): (() => void) => {
  let stopped = false;
  let request: AbortController | undefined;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  let requestTimer: ReturnType<typeof setTimeout> | undefined;

  const stop = () => {
    stopped = true;
    clearTimeout(deadline);
    clearTimeout(retryTimer);
    clearTimeout(requestTimer);
    request?.abort();
  };
  const finish = (result: ConfirmationResult) => {
    if (stopped) return;
    stop();
    onResult(result);
  };
  const deadline = setTimeout(() => finish('timeout'), 60_000);

  const check = async () => {
    if (stopped) return;
    request = new AbortController();
    const currentRequest = request;
    requestTimer = setTimeout(() => currentRequest.abort(), 8_000);
    try {
      const response = await fetcher('/api/checkout/status', {
        method: 'GET', credentials: 'same-origin', cache: 'no-store',
        headers: { 'X-Checkout-Order': orderId }, signal: currentRequest.signal,
      });
      if (stopped) return;
      if ([401, 403, 404].includes(response.status)) {
        finish('unavailable');
        return;
      }
      if (response.ok) {
        const data = await response.json() as { success?: unknown; state?: unknown } | null;
        if (stopped) return;
        if (data?.success === true && (data.state === 'paid' || data.state === 'failed' || data.state === 'cancelled' || data.state === 'refunded')) {
          finish(data.state);
          return;
        }
      }
    } catch {
      // A transient network/JSON failure cannot alter payment state or fail checkout.
    } finally {
      clearTimeout(requestTimer);
    }
    if (!stopped) retryTimer = setTimeout(() => { void check(); }, 2_000);
  };
  void check();
  return stop;
};
