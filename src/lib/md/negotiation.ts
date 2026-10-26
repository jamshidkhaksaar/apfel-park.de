import {
  AEO_SPEC_VERSION,
  detectAIBot,
  negotiateFormat,
  shouldServeMarkdown,
  toMarkdownPath,
} from '@dualmark/core';

/**
 * Content negotiation for the markdown twins, per the AEO Specification v1.0.
 *
 * The decision is delegated to @dualmark/core, the reference implementation,
 * because the spec's rules are subtler than "does the client mention markdown":
 * q-value ordering with ties going to HTML (§2.2, §2.4), wildcards that make a
 * request acceptable without naming a type, a `406` when nothing is acceptable
 * (§2.3, §4), and the bot-user-agent case that must still yield to an explicit
 * `Accept: text/html` (§5).
 */

export type RepresentationDecision =
  | {
      representation: 'markdown';
      /** `accept` when the Accept header asked for it, `bot` when a UA matched. */
      reason: 'accept' | 'bot';
      vary: string;
    }
  | { representation: 'html'; vary: string }
  | { representation: 'not-acceptable' };

export type RepresentationRequest = {
  accept: string | null;
  userAgent: string | null;
  /** False for paths with no markdown renderer: only HTML is on offer there. */
  hasTwin: boolean;
};

/**
 * §3 requires `Vary: Accept` on any response whose representation depends on
 * Accept; §5 adds `User-Agent` when a bot UA is what selected markdown, because
 * a shared cache that ignores it could hand markdown to a browser.
 */
export const VARY_ACCEPT = 'Accept';
export const VARY_ACCEPT_AND_USER_AGENT = 'Accept, User-Agent';

/** Somewhere for a shared cache to key the UA-negotiated markdown response. */
export const NO_SHARED_CACHE = 'private, no-store';

export const decideRepresentation = ({
  accept,
  userAgent,
  hasTwin,
}: RepresentationRequest): RepresentationDecision => {
  if (!hasTwin) return { representation: 'html', vary: VARY_ACCEPT };

  const header = accept ?? '';
  const isBot = detectAIBot(userAgent ?? '').isBot;

  if (shouldServeMarkdown(header, isBot)) {
    // The UA only decided this when Accept on its own would have kept HTML;
    // that is exactly the case §5 wants a shared cache told about.
    const viaBot = isBot && negotiateFormat(header) !== 'markdown';
    return {
      representation: 'markdown',
      reason: viaBot ? 'bot' : 'accept',
      vary: viaBot ? VARY_ACCEPT_AND_USER_AGENT : VARY_ACCEPT,
    };
  }

  // §2.3: no media range matches and no wildcard exists, so neither
  // representation is acceptable and §4 requires a 406 -- never a silent HTML
  // or markdown fallback.
  if (negotiateFormat(header) === null) return { representation: 'not-acceptable' };

  return { representation: 'html', vary: VARY_ACCEPT };
};

/** §6: `/de/about` -> `/de/about.md`, and the root page -> `/index.md`. */
export const markdownTwinPath = (htmlPath: string): string => toMarkdownPath(htmlPath);

/**
 * The 406 body the spec suggests: plain text, listing what is available. It is
 * deliberately not a markdown twin, because §4 forbids falling back to
 * `text/markdown` for a request that did not accept it.
 */
export const notAcceptableResponse = (): Response =>
  new Response('Not Acceptable\n\nSupported types: text/html, text/markdown\n', {
    status: 406,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      Vary: VARY_ACCEPT,
      'X-AEO-Version': AEO_SPEC_VERSION,
    },
  });

/**
 * Appends a token to a comma-separated header without duplicating it, which §3
 * calls out explicitly for `Vary` (token comparison is case-insensitive).
 */
export const appendHeaderToken = (headers: Headers, name: string, token: string): void => {
  const existing = headers.get(name);
  if (!existing) {
    headers.set(name, token);
    return;
  }

  const tokens = existing.split(',').map((value) => value.trim().toLowerCase());
  if (tokens.includes(token.trim().toLowerCase())) return;
  headers.set(name, `${existing}, ${token}`);
};

/** §6: the HTML response of a page with a twin advertises it via `Link`. */
export const markdownAlternateLink = (markdownUrl: string): string =>
  `<${markdownUrl}>; rel="alternate"; type="text/markdown"`;
