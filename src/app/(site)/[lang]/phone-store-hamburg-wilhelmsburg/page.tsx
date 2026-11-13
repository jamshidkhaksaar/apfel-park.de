// English slug for the Wilhelmsburg store landing page. The implementation is
// shared with /[lang]/handy-shop-hamburg-wilhelmsburg, which derives its
// canonical and hreflang from the locale, so this route only needs to exist.
// /de/phone-store-hamburg-wilhelmsburg is redirected to the German slug in
// next.config.ts, so no duplicate German URL is reachable.
//
// `dynamic` is declared here rather than re-exported: Next.js refuses to
// recognise a re-exported segment config, even though it accepts the page and
// metadata exports.
export { default, generateMetadata } from "../handy-shop-hamburg-wilhelmsburg/page";

export const dynamic = "force-dynamic";
