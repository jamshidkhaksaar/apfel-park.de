export const toIsoTimestamp = (value: unknown): string | null => {
  const date = value instanceof Date
    ? value
    : typeof value === "string" || typeof value === "number"
      ? new Date(value)
      : null;

  return date && Number.isFinite(date.getTime()) ? date.toISOString() : null;
};
