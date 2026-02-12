import { describe, it } from "node:test";
import assert from "node:assert";
import { isSafeRedirect } from "./security";

describe("isSafeRedirect", () => {
  it("should allow valid relative paths", () => {
    assert.strictEqual(isSafeRedirect("/admin"), true);
    assert.strictEqual(isSafeRedirect("/"), true);
    assert.strictEqual(isSafeRedirect("/products?sort=desc"), true);
    assert.strictEqual(isSafeRedirect("/foo/bar"), true);
  });

  it("should block absolute URLs", () => {
    assert.strictEqual(isSafeRedirect("https://example.com"), false);
    assert.strictEqual(isSafeRedirect("http://example.com"), false);
    assert.strictEqual(isSafeRedirect("ftp://example.com"), false);
  });

  it("should block protocol-relative URLs", () => {
    assert.strictEqual(isSafeRedirect("//example.com"), false);
    assert.strictEqual(isSafeRedirect("//evil.com/foo"), false);
  });

  it("should block URLs with backslashes", () => {
    assert.strictEqual(isSafeRedirect("\\example.com"), false);
    assert.strictEqual(isSafeRedirect("/\\example.com"), false);
    assert.strictEqual(isSafeRedirect("/foo\\bar"), false);
  });

  it("should block non-string or empty inputs", () => {
    assert.strictEqual(isSafeRedirect(""), false);
    assert.strictEqual(isSafeRedirect(null), false);
    assert.strictEqual(isSafeRedirect(undefined), false);
  });

  it("should block javascript: and data: URIs (implicitly)", () => {
    assert.strictEqual(isSafeRedirect("javascript:alert(1)"), false);
    assert.strictEqual(isSafeRedirect("data:text/html,alert(1)"), false);
  });
});
