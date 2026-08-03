/**
 * SQL identifier quoting.
 *
 * Extracted from db.ts so it can be unit-tested without importing that module,
 * which builds a pg.Pool from DATABASE_URL at import time.
 *
 * This is a security boundary, not a formatting helper: table names, column
 * names, ORDER BY columns and ON CONFLICT targets are interpolated straight
 * into SQL strings (values are parameterised, identifiers cannot be). Anything
 * that is not a plain identifier must throw rather than be escaped, because a
 * caller passing attacker-controlled text here would otherwise get injection.
 */
const VALID_IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

export const quoteIdentifier = (value: string): string => {
  if (!VALID_IDENTIFIER.test(value)) {
    throw new Error(`Invalid SQL identifier: ${value}`);
  }
  return `"${value}"`;
};

export const parseColumns = (columns: string): string => {
  if (columns.trim() === "*") return "*";
  return columns
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => quoteIdentifier(part))
    .join(", ");
};
