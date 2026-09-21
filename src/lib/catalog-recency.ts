/** PostgreSQL may return Date objects; compare timestamps, not weekday strings. */
export const compareCatalogRecency = (left: unknown, right: unknown): number => {
  const timestamp = (value: unknown): number => {
    const parsed = value instanceof Date ? value.getTime() : typeof value === 'string' ? Date.parse(value) : NaN;
    return Number.isFinite(parsed) ? parsed : 0;
  };
  return timestamp(right) - timestamp(left);
};
