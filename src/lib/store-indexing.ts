export type StoreSearchParams = Record<string, string | string[] | undefined>;

const nonEmptyValues = (value: string | string[] | undefined): string[] =>
  (Array.isArray(value) ? value : [value])
    .map((entry) => entry?.trim() ?? "")
    .filter(Boolean);

export type StoreIndexingPolicy = {
  page: number;
  noindex: boolean;
  canonicalQuery?: string;
};

export const resolveStoreIndexing = (query: StoreSearchParams): StoreIndexingPolicy => {
  const pageValues = nonEmptyValues(query.page);
  const pageRaw = pageValues[0] ?? "";
  const pageValid = pageValues.length <= 1
    && (!pageRaw || (/^[1-9]\d*$/.test(pageRaw) && Number.isSafeInteger(Number(pageRaw))));
  const page = pageValid && pageRaw ? Number(pageRaw) : 1;
  const hasNonPaginationParameters = Object.entries(query).some(
    ([key, value]) => key !== "page" && nonEmptyValues(value).length > 0,
  );
  const noindex = !pageValid || hasNonPaginationParameters;

  return {
    page,
    noindex,
    canonicalQuery: pageValid && page > 1 ? `page=${page}` : undefined,
  };
};

export const buildStoreCanonicalUrl = (
  baseUrl: string,
  indexing: StoreIndexingPolicy,
): string => indexing.canonicalQuery
  ? `${baseUrl}?${indexing.canonicalQuery}`
  : baseUrl;

/**
 * Compare the requested URL page with the unclamped catalog page count.
 * Catalog pagination deliberately clamps its rendered page, so routes must
 * use the original indexing page to distinguish an invalid URL from the last
 * valid page.
 */
export const isStorePaginationOutOfRange = (
  requestedPage: number,
  catalogPages: number,
): boolean => requestedPage > catalogPages;
