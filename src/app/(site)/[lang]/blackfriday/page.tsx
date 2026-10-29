import { redirect } from "next/navigation";

import { requireLocale } from "@/lib/route-locale";

/**
 * Ad links are typed by hand, so `/blackfriday` has to land on the canonical
 * `/black-friday` page instead of a 404.
 */
export default async function BlackFridayAlias({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  redirect(`/${requireLocale(lang)}/black-friday`);
}
