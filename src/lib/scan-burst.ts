/**
 * Telling a barcode scanner from a person typing. A USB scanner "types" the
 * whole code within a few milliseconds per key and ends with Enter; people
 * need around 100 ms or more per key. Shift and other non-character keys do
 * not count as keys here.
 */

/** A pause longer than this starts a new burst. */
export const SCAN_MAX_GAP_MS = 100;
/** Average time per key a scan stays under. */
export const SCAN_MAX_AVERAGE_GAP_MS = 40;
/** Shortest code treated as a scan. */
export const SCAN_MIN_LENGTH = 4;

/**
 * `times` are the keydown timestamps (ms) of the burst's character keys,
 * `enterAt` the Enter that ends it.
 */
export function looksLikeScan(times: readonly number[], enterAt: number): boolean {
  if (times.length < SCAN_MIN_LENGTH) return false;
  const last = times[times.length - 1];
  if (enterAt - last > SCAN_MAX_GAP_MS) return false;
  for (let index = 1; index < times.length; index += 1) {
    if (times[index] - times[index - 1] > SCAN_MAX_GAP_MS) return false;
  }
  return (last - times[0]) / (times.length - 1) <= SCAN_MAX_AVERAGE_GAP_MS;
}
