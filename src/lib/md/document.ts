import { AEO_SPEC_VERSION } from '@dualmark/core';

import { absoluteUrl, approximateTokens, blocks, escapeMarkdown, heading, markdownLink } from './format';

/**
 * The markdown document envelope and its HTTP response.
 *
 * Every markdown response is noindex and points back at the HTML page as its
 * canonical, so exposing a second representation cannot create duplicate
 * content in search.
 */

export type MarkdownDoc = {
  title: string;
  summary?: string;
  /** Public HTML path this markdown mirrors; the canonical URL of the pair. */
  canonicalPath: string;
  lastUpdated?: string;
  body: string;
  related?: readonly { label: string; path: string }[];
};

const section = (title: string, body: string): string => blocks(heading(2, title), body);

export const renderMarkdownDocument = (doc: MarkdownDoc): string => {
  const header = blocks(
    heading(1, doc.title),
    doc.summary ? `> ${escapeMarkdown(doc.summary)}` : undefined,
    blocks(`Canonical: ${absoluteUrl(doc.canonicalPath)}`, doc.lastUpdated ? `Last updated: ${doc.lastUpdated}` : undefined),
  );

  const related = doc.related?.length
    ? section('Related', doc.related.map((item) => `- ${markdownLink(item.label, item.path)}`).join('\n'))
    : undefined;

  return `${blocks(header, doc.body, related)}\n`;
};

export type MarkdownResponseOptions = {
  canonicalPath: string;
  lastModified?: string;
  /** Long-lived for static copy, shorter for catalogue pages that move often. */
  cacheSeconds?: number;
  /**
   * Replaces the ordinary policy when the representation must not be stored by
   * a shared cache -- a twin that only the user-agent selected; see
   * `markdownCacheControl` in ./negotiation.
   */
  cacheControl?: string;
  status?: number;
};

export const markdownHeaders = ({
  canonicalPath,
  lastModified,
  cacheSeconds = 3600,
  cacheControl,
  status = 200,
}: MarkdownResponseOptions): Headers => {
  const headers = new Headers({
    'Content-Type': 'text/markdown; charset=utf-8',
    // The HTML page stays the indexed surface; this is an alternate rendering.
    'X-Robots-Tag': 'noindex, follow',
    // AEO Spec v1.0 §4: advertise the version this server implements, so a
    // conformance runner can tell a 1.0 twin from an unknown one.
    'X-AEO-Version': AEO_SPEC_VERSION,
    'Content-Location': absoluteUrl(canonicalPath),
    Link: `<${absoluteUrl(canonicalPath)}>; rel="canonical"`,
    Vary: 'Accept',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Accept',
  });

  if (status === 200) {
    headers.set(
      'Cache-Control',
      cacheControl ?? `public, s-maxage=${cacheSeconds}, stale-while-revalidate=86400`,
    );
  } else {
    headers.set('Cache-Control', 'no-store');
  }

  if (lastModified) {
    const parsed = new Date(lastModified);
    if (!Number.isNaN(parsed.getTime())) headers.set('Last-Modified', parsed.toUTCString());
  }

  return headers;
};

export const markdownResponse = (markdown: string, options: MarkdownResponseOptions): Response => {
  const headers = markdownHeaders(options);
  headers.set('X-Markdown-Tokens', String(approximateTokens(markdown)));
  return new Response(markdown, { status: options.status ?? 200, headers });
};

/** Never returns HTML: a missing twin is a markdown 404 with a readable reason. */
export const markdownNotFound = (pathname: string, reason: string): Response => {
  const markdown = `${blocks(
    heading(1, 'No markdown version'),
    `No markdown version exists for \`${pathname}\`. ${reason}`,
    markdownLink('HTML version', pathname),
  )}\n`;

  return markdownResponse(markdown, {
    canonicalPath: pathname,
    status: 404,
  });
};
