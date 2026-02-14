import { isSafeRedirect } from "../src/lib/security";

console.log("Running redirect security verification...");

const testCases = [
  { input: "/admin", safe: true },
  { input: "/dashboard", safe: true },
  { input: "/admin/products", safe: true },
  { input: "https://evil.com", safe: false },
  { input: "http://evil.com", safe: false },
  { input: "//evil.com", safe: false },
  { input: "/\\evil.com", safe: false }, // Backslash trick
  { input: "\\evil.com", safe: false },
  { input: "javascript:alert(1)", safe: false },
  { input: "  /admin", safe: false }, // Leading whitespace
  { input: "", safe: false },
  // @ts-ignore
  { input: null, safe: false },
  // @ts-ignore
  { input: undefined, safe: false },
];

let failed = false;

testCases.forEach(({ input, safe }, index) => {
  let result;
  try {
    result = isSafeRedirect(input);
  } catch (e) {
    console.error(`❌ Test case ${index + 1} threw error: ${e}`);
    failed = true;
    return;
  }

  if (result !== safe) {
    console.error(`❌ Test case ${index + 1} failed:`);
    console.error(`   Input:    ${input}`);
    console.error(`   Expected: ${safe}`);
    console.error(`   Actual:   ${result}`);
    failed = true;
  } else {
    console.log(`✅ Test case ${index + 1} passed: "${input}" -> ${result}`);
  }
});

if (failed) {
  console.error("\nSome tests failed.");
  process.exit(1);
} else {
  console.log("\nAll tests passed successfully.");
}
