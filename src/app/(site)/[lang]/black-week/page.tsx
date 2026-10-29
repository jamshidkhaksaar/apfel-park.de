import { redirect } from "next/navigation";

import { requireLocale } from "@/lib/route-locale";

/**
 * The campaign is branded "Black Week" but the landing page keeps the
 * `/black-friday` URL for search and existing ad links. This alias catches
 * hand-typed or printed `/black-week` links.
 */
export default async function BlackWeekAlias({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  redirect(`/${requireLocale(lang)}/black-friday`);
}
