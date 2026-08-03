import { permanentRedirect } from "next/navigation";

export default function Home() {
  // 308, not 307. `redirect()` is a TEMPORARY redirect, which tells Google to
  // keep https://apfel-park.de/ in the index rather than consolidating signals
  // onto /de -- directly contradicting the canonical tag. Search Console showed
  // four homepage URLs indexed separately as a result, with the legacy
  // http://www variant outranking the canonical one.
  permanentRedirect("/de");
}
