/**
 * Cookie-free spam protection for public enquiry forms.
 *
 * Google reCAPTCHA may only load after the visitor accepts external services.
 * Visitors who choose "Nur notwendige" still have to be able to send an
 * enquiry (contact, repair, device quote, trade-in, chat, withdrawal), so
 * without a reCAPTCHA token the form sends a guard proof instead:
 *
 *   guard.v1.<milliseconds the form was open>.<1 if the hidden trap field was filled, else 0>
 *
 * The server accepts it only for forms that opt in, only when the trap field
 * is empty and the form was open for a human amount of time, and only under a
 * stricter per-visitor send limit (see verifyReCaptcha). No cookies, no
 * third-party requests.
 */

export const GUARD_PREFIX = "guard.v1.";
/** Bots submit instantly; people need at least a few seconds to fill a form. */
export const GUARD_MIN_FILL_MS = 3000;
/** Hidden trap input. Unusual name so browser autofill leaves it alone. */
export const GUARD_FIELD_NAME = "ap_contact_fax_hint";

export const encodeGuardToken = (elapsedMs: number, trapFilled: boolean): string =>
  `${GUARD_PREFIX}${Math.max(0, Math.round(elapsedMs))}.${trapFilled ? 1 : 0}`;

export const isGuardToken = (token: unknown): token is string =>
  typeof token === "string" && token.startsWith(GUARD_PREFIX);

export type GuardCheck = { ok: true } | { ok: false; reason: "malformed" | "trap" | "too_fast" | "links" };

/** Counts web links; enquiries with many links are almost always spam. */
const linkCount = (text: string): number => (text.match(/https?:\/\/|www\./gi) ?? []).length;

export const checkGuardToken = (token: string, text = ""): GuardCheck => {
  const match = /^guard\.v1\.(\d{1,12})\.([01])$/.exec(token);
  if (!match) return { ok: false, reason: "malformed" };
  if (match[2] === "1") return { ok: false, reason: "trap" };
  if (Number(match[1]) < GUARD_MIN_FILL_MS) return { ok: false, reason: "too_fast" };
  if (linkCount(text) > 2) return { ok: false, reason: "links" };
  return { ok: true };
};
