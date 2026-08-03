import { describe, expect, it } from "vitest";

import { parseColumns, quoteIdentifier } from "@/lib/sql-identifier";

describe("quoteIdentifier", () => {
  it("quotes plain identifiers", () => {
    expect(quoteIdentifier("products")).toBe('"products"');
    expect(quoteIdentifier("created_at")).toBe('"created_at"');
    expect(quoteIdentifier("_private")).toBe('"_private"');
    expect(quoteIdentifier("col123")).toBe('"col123"');
  });

  // Identifiers cannot be parameterised, so they are interpolated directly
  // into SQL. Anything non-identifier MUST throw rather than be escaped.
  it.each([
    ['users"; DROP TABLE users; --', "classic injection"],
    ["users; DELETE FROM orders", "statement separator"],
    ["1=1 OR TRUE", "boolean payload"],
    ["col name", "whitespace"],
    ["col-name", "hyphen"],
    ["táble", "non-ascii"],
    ["9lives", "leading digit"],
    ["", "empty"],
    ["*", "wildcard"],
    ["public.products", "qualified name"],
    ['"quoted"', "pre-quoted"],
    ["col\n; DROP", "newline"],
  ])("throws on %o (%s)", (value) => {
    expect(() => quoteIdentifier(value)).toThrow(/Invalid SQL identifier/);
  });

  it("never emits an unescaped double quote", () => {
    // If a payload ever slipped through, the closing quote is what breaks out.
    for (const v of ['a"b', 'a""b', '"']) expect(() => quoteIdentifier(v)).toThrow();
  });
});

describe("parseColumns", () => {
  it("passes * through", () => {
    expect(parseColumns("*")).toBe("*");
    expect(parseColumns("  *  ")).toBe("*");
  });

  it("quotes and joins column lists, tolerating whitespace and empties", () => {
    expect(parseColumns("id, name")).toBe('"id", "name"');
    expect(parseColumns(" id ,  name ,")).toBe('"id", "name"');
  });

  it("rejects a list containing an injection payload", () => {
    expect(() => parseColumns('id, name"; DROP TABLE users; --')).toThrow(/Invalid SQL identifier/);
    expect(() => parseColumns("id, (SELECT password FROM users)")).toThrow(/Invalid SQL identifier/);
  });

  it("does not treat a wildcard inside a list as select-all", () => {
    expect(() => parseColumns("id, *")).toThrow(/Invalid SQL identifier/);
  });
});
