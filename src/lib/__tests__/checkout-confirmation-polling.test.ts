import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startCheckoutConfirmationPolling } from '../checkout-confirmation-polling';

const orderId = '11111111-1111-4111-8111-111111111111';
const reply = (state: string, status = 200) => new Response(JSON.stringify({ success: true, state }), { status });
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('bounded checkout confirmation polling', () => {
  it('confirms a late webhook once, without initiating payment', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(reply('pending')).mockResolvedValueOnce(reply('paid'));
    const onResult = vi.fn();
    startCheckoutConfirmationPolling({ orderId, fetcher, onResult });
    await vi.advanceTimersByTimeAsync(0);
    expect(onResult).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(2_000);
    expect(onResult).toHaveBeenCalledExactlyOnceWith('paid');
    await vi.advanceTimersByTimeAsync(60_000);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher).toHaveBeenCalledWith('/api/checkout/status', expect.objectContaining({
      method: 'GET', credentials: 'same-origin', cache: 'no-store', headers: { 'X-Checkout-Order': orderId },
    }));
  });
  it.each(['failed', 'cancelled', 'refunded'])('stops at %s without a paid result', async state => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(reply(state));
    const onResult = vi.fn();
    startCheckoutConfirmationPolling({ orderId, fetcher, onResult });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(onResult).toHaveBeenCalledExactlyOnceWith(state);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it.each([401, 403, 404])('stops when the session becomes unavailable (%s)', async status => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(reply('paid', status));
    const onResult = vi.fn();
    startCheckoutConfirmationPolling({ orderId, fetcher, onResult });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(onResult).toHaveBeenCalledExactlyOnceWith('unavailable');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('retries transient service/network failures within the deadline', async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce(reply('pending', 503)).mockResolvedValue(reply('paid'));
    const onResult = vi.fn();
    startCheckoutConfirmationPolling({ orderId, fetcher, onResult });
    await vi.advanceTimersByTimeAsync(4_000);
    expect(onResult).toHaveBeenCalledExactlyOnceWith('paid');
  });
  it('does not trust an unsuccessful or malformed paid response', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response('{bad')).mockImplementation(async () => new Response(JSON.stringify({ success: false, state: 'paid' })));
    const onResult = vi.fn();
    startCheckoutConfirmationPolling({ orderId, fetcher, onResult });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(onResult).toHaveBeenCalledExactlyOnceWith('timeout');
    expect(fetcher.mock.calls.length).toBeLessThanOrEqual(30);
  });
  it('terminates even when a request never settles', async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(() => new Promise<Response>(() => undefined));
    const onResult = vi.fn();
    startCheckoutConfirmationPolling({ orderId, fetcher, onResult });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(onResult).toHaveBeenCalledExactlyOnceWith('timeout');
    expect(fetcher.mock.calls[0][1]?.signal?.aborted).toBe(true);
  });
  it('cleanup aborts and ignores a response delivered after unmount', async () => {
    let resolve!: (response: Response) => void;
    const fetcher = vi.fn<typeof fetch>().mockImplementation(() => new Promise<Response>(done => { resolve = done; }));
    const onResult = vi.fn();
    const stop = startCheckoutConfirmationPolling({ orderId, fetcher, onResult });
    stop();
    resolve(reply('paid'));
    await vi.advanceTimersByTimeAsync(60_000);
    expect(onResult).not.toHaveBeenCalled();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][1]?.signal?.aborted).toBe(true);
  });
});
