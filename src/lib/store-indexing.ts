type StoreSearchParams = Record<string, string | string[] | undefined>;

const firstValue = (value: string | string[] | undefined): string =>
  (Array.isArray(value) ? value[0] : value ?? "").trim();

export const resolveStoreIndexing = (query: StoreSearchParams): {
  page: number;
  noindex: boolean;
  canonicalQuery?: string;
} => {
  const pageRaw = firstValue(query.page);
  const pageValid = !pageRaw || (/^[1-9]\d*$/.test(pageRaw) && Number.isSafeInteger(Number(pageRaw)));
  const page = pageValid && pageRaw ? Number(pageRaw) : 1;
  const hasNonPaginationParameters = Object.entries(query).some(
    ([key, value]) => key !== "page" && Boolean(firstValue(value)),
  );
  const noindex = !pageValid || hasNonPaginationParameters;

  return {
    page,
    noindex,
    canonicalQuery: !noindex && page > 1 ? `page=${page}` : undefined,
  };
};
