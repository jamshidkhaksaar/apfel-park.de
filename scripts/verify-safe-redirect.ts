
import { isSafeRedirect } from "../src/lib/security";

const testCases = [
  // Safe cases
  { url: "/admin", expected: true },
  { url: "/admin/dashboard", expected: true },
  { url: "/foo?bar=baz", expected: true },
  { url: "/", expected: true },

  // Unsafe cases
  { url: "https://evil.com", expected: false },
  { url: "http://evil.com", expected: false },
  { url: "//evil.com", expected: false },
  { url: "/\\evil.com", expected: false },
  { url: "javascript:alert(1)", expected: false },
  { url: "data:text/html,<script>alert(1)</script>", expected: false },
  { url: "  /admin", expected: false }, // Whitespace bypass attempt
  { url: "/admin  ", expected: false }, // Whitespace bypass attempt
  { url: "", expected: false },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { url: null as any, expected: false },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { url: undefined as any, expected: false },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { url: 123 as any, expected: false },
];

let passed = 0;
let failed = 0;

console.log("Running isSafeRedirect tests...\n");

for (const { url, expected } of testCases) {
  const result = isSafeRedirect(url);
  if (result === expected) {
    console.log(`✅ PASS: "${url}" -> ${result}`);
    passed++;
  } else {
    console.error(`❌ FAIL: "${url}" -> ${result} (expected ${expected})`);
    failed++;
  }
}

console.log(`\nTests completed. Passed: ${passed}, Failed: ${failed}`);

if (failed > 0) {
  process.exit(1);
}
