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

/** Keys collected since the last pause, with the field they were typed into. */
export type ScanBurst = { text: string; times: number[]; target: Element | null; snapshot: string | null };

export const emptyBurst = (): ScanBurst => ({ text: "", times: [], target: null, snapshot: null });

const isTextField = (element: Element | null): element is HTMLInputElement | HTMLTextAreaElement =>
  typeof HTMLInputElement !== "undefined" && (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement);

/** Adds a character key to the burst, or starts a new burst after a pause. */
export function trackScanKey(burst: ScanBurst, key: string, now: number): ScanBurst {
  const lastAt = burst.times[burst.times.length - 1];
  if (lastAt === undefined || now - lastAt > SCAN_MAX_GAP_MS) {
    const target = typeof document === "undefined" ? null : document.activeElement;
    return { text: key, times: [now], target, snapshot: isTextField(target) ? target.value : null };
  }
  return { ...burst, text: burst.text + key, times: [...burst.times, now] };
}

/** Puts a field's value back (React-controlled fields included) after a scan typed into it. */
export function restoreScannedField(burst: ScanBurst): void {
  const { target, snapshot } = burst;
  if (snapshot === null || !isTextField(target) || target.value === snapshot) return;
  const prototype = target instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, "value")?.set?.call(target, snapshot);
  target.dispatchEvent(new Event("input", { bubbles: true }));
}

/** A character key that may belong to a scan (not a shortcut). */
export const isScanCharacter = (event: KeyboardEvent): boolean =>
  event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
