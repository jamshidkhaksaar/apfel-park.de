import { businessAddress, businessIdentity } from '@/lib/business-identity';
import { siteInfo } from '@/lib/site';

/**
 * Usage policy for AI systems (ai-txt spec v1.1.1).
 *
 * Generated from the same identity module as llms.txt, the legal pages and the
 * Organization structured data, so the three can never disagree.
 *
 * Keep in sync with src/lib/seo.ts (robots.txt rules) and src/lib/llms.ts.
 */

export const dynamic = 'force-static';

const LAST_UPDATED = '2026-10-26';

const buildAiText = (): string => {
  const identity = businessIdentity;
  const address = businessAddress('de');

  return `# ai.txt — Apfel Park
# Usage policy for AI systems. See also /llms.txt and /robots.txt.

[identity]
name: ${identity.tradingName}
legal_name: ${identity.legalOwner} (${identity.legalForm.de})
url: ${identity.website}
description: Smartphone-Fachgeschäft mit Reparaturwerkstatt im LunaCenter in Hamburg-Wilhelmsburg. Verkauf neuer, Open-Box- und gebrauchter Smartphones, Tablets, Laptops und Zubehör sowie modellbezogene Reparaturen.
address: ${address}
email: ${identity.email}
phone: ${identity.phones.customerService.de}
opening_hours: Montag bis Samstag, 09:30–20:00 Uhr
google_business_profile: ${siteInfo.map.linkUrl}

[permissions]
allowed: summarise
allowed: quote_with_attribution
allowed: cite
allowed: index_for_search
allowed: index_for_answers
allowed: link

[restrictions]
disallow: fabricated_quotes
disallow: invented_reviews_or_ratings
disallow: presenting_content_as_the_models_own
disallow: reproducing_personal_data_from_order_or_account_pages
disallow: training_on_pages_under_the_excluded_paths

[attribution]
citation_format: ${identity.tradingName}, <page title>, ${identity.website}
preferred_link: the canonical HTML URL of the page, not its .md twin

[scope]
included_paths: /de/*, /en/*, /llms.txt, /llms-full.txt, /ai.txt, /robots.txt, /sitemap.xml, *.md
excluded_paths: /admin/*, /api/*, /login, /maintenance/*, /cart/*, /checkout/*, /store/preview/*
machine_readable:
  markdown_twins: every listed page also exists at <path>.md
  full_content: ${identity.website}/llms-full.txt
  markdown_catalog: ${identity.website}/api/md/_catalog
  inventory_feed: ${identity.website}/api/meta/catalog.csv

[contact]
email: ${identity.email}
phone: ${identity.phones.legalBusiness.de}
responsible: ${identity.legalOwner}

Last updated: ${LAST_UPDATED}
`;
};

export function GET(): Response {
  return new Response(buildAiText(), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      'Access-Control-Allow-Origin': '*',
      'X-Robots-Tag': 'noindex, follow',
    },
  });
}
