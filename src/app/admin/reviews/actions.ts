"use server";

import { revalidatePath } from "next/cache";

import { isAdminUser } from "@/lib/admin-auth";
import { createAdminDbClient } from "@/lib/admin-db";
import { createAdminServerClient } from "@/lib/admin-auth-server";
import { getHomeContent } from "@/lib/content";
import { type Locale } from "@/lib/i18n";
import { sanitizeInput } from "@/lib/security";

type HomepageTestimonial = {
  name: string;
  badge: string;
  timeAgo: string;
  quote: string;
  rating: number;
};

type ContentHomeValue = Partial<Record<Locale, Record<string, unknown>>>;

const HOME_CONTENT_KEY = "content_home";

const isLocale = (value: string): value is Locale => value === "de" || value === "en";

async function requireAdminUser() {
  const adminClient = await createAdminServerClient();
  const {
    data: { user },
    error: authError,
  } = await adminClient.auth.getUser();

  if (authError || !isAdminUser(user)) {
    throw new Error("Unauthorized");
  }
}

async function getRawContentHomeValue(): Promise<ContentHomeValue> {
  const adminDb = createAdminDbClient();
  const { data } = await adminDb
    .from("store_settings")
    .select("value")
    .eq("key", HOME_CONTENT_KEY)
    .maybeSingle();

  return (data?.value as ContentHomeValue | null) ?? {};
}

function buildLocaleOverride(
  existingLocaleValue: Record<string, unknown> | undefined,
  items: HomepageTestimonial[],
) {
  const existingTestimonials =
    typeof existingLocaleValue?.testimonials === "object" &&
    existingLocaleValue.testimonials !== null &&
    !Array.isArray(existingLocaleValue.testimonials)
      ? (existingLocaleValue.testimonials as Record<string, unknown>)
      : {};

  return {
    ...(existingLocaleValue ?? {}),
    testimonials: {
      ...existingTestimonials,
      items,
    },
  };
}

async function saveHomepageTestimonials(
  locale: Locale,
  items: HomepageTestimonial[],
) {
  const adminDb = createAdminDbClient();
  const existingValue = await getRawContentHomeValue();
  const nextValue: ContentHomeValue = {
    ...existingValue,
    [locale]: buildLocaleOverride(existingValue[locale], items),
  };

  const { error } = await adminDb.from("store_settings").upsert(
    {
      key: HOME_CONTENT_KEY,
      value: nextValue,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) {
    throw new Error(error.message || "Failed to save reviews");
  }

  revalidatePath("/admin/reviews");
  revalidatePath("/");
  revalidatePath("/de");
  revalidatePath("/en");
}

export async function addHomepageReview(formData: FormData) {
  await requireAdminUser();

  const localeValue = String(formData.get("locale") ?? "");
  if (!isLocale(localeValue)) {
    throw new Error("Invalid locale");
  }

  const rating = Number(formData.get("rating") ?? 5);
  const testimonial: HomepageTestimonial = {
    name: sanitizeInput(String(formData.get("name") ?? "")).trim(),
    badge: sanitizeInput(String(formData.get("badge") ?? "")).trim(),
    timeAgo: sanitizeInput(String(formData.get("timeAgo") ?? "")).trim(),
    quote: sanitizeInput(String(formData.get("quote") ?? "")).trim(),
    rating: Number.isFinite(rating) ? Math.min(5, Math.max(1, Math.round(rating))) : 5,
  };

  if (!testimonial.name || !testimonial.quote) {
    throw new Error("Missing required review fields");
  }

  const currentHomeContent = await getHomeContent(localeValue);
  const currentItems = [...(currentHomeContent.testimonials.items as readonly HomepageTestimonial[])];
  currentItems.unshift(testimonial);

  await saveHomepageTestimonials(localeValue, currentItems);
}

export async function deleteHomepageReview(formData: FormData) {
  await requireAdminUser();

  const localeValue = String(formData.get("locale") ?? "");
  const index = Number(formData.get("index") ?? -1);

  if (!isLocale(localeValue) || !Number.isInteger(index) || index < 0) {
    throw new Error("Invalid review selection");
  }

  const currentHomeContent = await getHomeContent(localeValue);
  const currentItems = [...(currentHomeContent.testimonials.items as readonly HomepageTestimonial[])];

  if (index >= currentItems.length) {
    throw new Error("Review not found");
  }

  currentItems.splice(index, 1);
  await saveHomepageTestimonials(localeValue, currentItems);
}
