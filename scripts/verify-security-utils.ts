import {
  escapeHtml,
  isSecureSvg,
  validateImageFileExtension,
  isValidEmail,
  isValidInputLength,
  sanitizeInput
} from "../src/lib/security";

console.log("Running security verification...");

const testCases = [
  { input: '<script>', expected: '&lt;script&gt;' },
  { input: 'Hello "World"', expected: 'Hello &quot;World&quot;' },
  { input: "It's me", expected: "It&apos;s me" },
  { input: 'a & b', expected: 'a &amp; b' },
  { input: '<div>\n</div>', expected: '&lt;div&gt;\n&lt;/div&gt;' },
];

let failed = false;

console.log("Testing escapeHtml...");
testCases.forEach(({ input, expected }, index) => {
  const result = escapeHtml(input);
  if (result !== expected) {
    console.error(`❌ Test case ${index + 1} failed:`);
    console.error(`   Input:    ${input}`);
    console.error(`   Expected: ${expected}`);
    console.error(`   Actual:   ${result}`);
    failed = true;
  } else {
    console.log(`✅ Test case ${index + 1} passed`);
  }
});

console.log("\nTesting isSecureSvg...");
const svgCases = [
  { input: '<svg><script>alert(1)</script></svg>', secure: false },
  { input: '<svg><rect onclick="alert(1)" /></svg>', secure: false },
  { input: '<svg><foreignObject>test</foreignObject></svg>', secure: false },
  { input: '<svg><animate attributeName="x" to="100" /></svg>', secure: false },
  { input: '<svg><use href="external.svg#icon" /></svg>', secure: false },
  { input: '<svg width="100" height="100"><rect /></svg>', secure: true },
  // check javascript: in attribute
  { input: '<svg><a href="javascript:alert(1)">link</a></svg>', secure: false },
  // check entity-encoded javascript:
  { input: '<svg><a href="&#x6A;avascript:alert(1)">link</a></svg>', secure: false },
  // check entity-encoded script tag
  { input: '<svg><scr&#105;pt>alert(1)</scr&#105;pt></svg>', secure: false },
];

svgCases.forEach(({ input, secure }, index) => {
  const result = isSecureSvg(input);
  if (result !== secure) {
    console.error(`❌ SVG case ${index + 1} failed:`);
    console.error(`   Input:    ${input}`);
    console.error(`   Expected: ${secure}`);
    console.error(`   Actual:   ${result}`);
    failed = true;
  } else {
    console.log(`✅ SVG case ${index + 1} passed`);
  }
});

console.log("\nTesting isValidEmail...");
const emailCases = [
  { email: "test@example.com", expected: true },
  { email: "user.name+tag@example.co.uk", expected: true },
  { email: "plainaddress", expected: false },
  { email: "@missingusername.com", expected: false },
  { email: "username@.com", expected: false },
  { email: "username@com", expected: false }, // Needs at least one dot
  { email: "user@domain.c", expected: false }, // TLD too short (min 2)
  { email: "user@localhost", expected: false }, // No TLD/dot not allowed for public web
  { email: "".padEnd(255, "a") + "@example.com", expected: false }, // Too long
  { email: "test@example.com\n", expected: false }, // Newline not allowed
];

emailCases.forEach(({ email, expected }, index) => {
  const result = isValidEmail(email);
  if (result !== expected) {
    console.error(`❌ Email case ${index + 1} failed:`);
    console.error(`   Email:    ${email.length > 50 ? email.substring(0, 20) + "..." : email}`);
    console.error(`   Expected: ${expected}`);
    console.error(`   Actual:   ${result}`);
    failed = true;
  } else {
    console.log(`✅ Email case ${index + 1} passed`);
  }
});

console.log("\nTesting isValidInputLength...");
const lengthCases = [
  { input: "short", max: 10, expected: true },
  { input: "exactlength", max: 11, expected: true },
  { input: "too long string", max: 5, expected: false },
  { input: 12345, max: 10, expected: false }, // Not a string
  { input: null, max: 10, expected: false },
  { input: undefined, max: 10, expected: false },
];

lengthCases.forEach(({ input, max, expected }, index) => {
  const result = isValidInputLength(input, max);
  if (result !== expected) {
    console.error(`❌ Length case ${index + 1} failed:`);
    console.error(`   Input:    ${input}`);
    console.error(`   Max:      ${max}`);
    console.error(`   Expected: ${expected}`);
    console.error(`   Actual:   ${result}`);
    failed = true;
  } else {
    console.log(`✅ Length case ${index + 1} passed`);
  }
});

console.log("\nTesting sanitizeInput...");
const sanitizeCases = [
  { input: "  hello  ", expected: "hello" },
  { input: "hello\0world", expected: "helloworld" },
  { input: 123, expected: "" },
  { input: null, expected: "" },
  { input: "  \0  test  \0  ", expected: "test" },
];

sanitizeCases.forEach(({ input, expected }, index) => {
  const result = sanitizeInput(input);
  if (result !== expected) {
    console.error(`❌ Sanitize case ${index + 1} failed:`);
    console.error(`   Input:    ${input}`);
    console.error(`   Expected: '${expected}'`);
    console.error(`   Actual:   '${result}'`);
    failed = true;
  } else {
    console.log(`✅ Sanitize case ${index + 1} passed`);
  }
});

console.log("\nTesting validateImageFileExtension...");
const fileCases = [
  { name: "test.png", type: "image/png", expected: true },
  { name: "test.jpg", type: "image/jpeg", expected: true },
  { name: "test.jpeg", type: "image/jpeg", expected: true },
  { name: "test.webp", type: "image/webp", expected: true },
  { name: "test.svg", type: "image/svg+xml", expected: true },
  { name: "favicon.ico", type: "image/x-icon", expected: true },
  { name: "favicon.ico", type: "image/vnd.microsoft.icon", expected: true },
  { name: "favicon.ico", type: "application/octet-stream", expected: true },
  // Invalid cases
  { name: "malicious.html", type: "image/png", expected: false },
  { name: "malicious.exe", type: "image/jpeg", expected: false },
  { name: "test.png", type: "text/plain", expected: false },
  { name: "test.txt", type: "image/png", expected: false },
  { name: "test", type: "image/png", expected: false },
];

fileCases.forEach(({ name, type, expected }, index) => {
  // Mock File object since we only need name and type properties
  const file = { name, type } as unknown as File;
  const result = validateImageFileExtension(file);

  if (result !== expected) {
    console.error(`❌ File case ${index + 1} failed:`);
    console.error(`   Name:     ${name}`);
    console.error(`   Type:     ${type}`);
    console.error(`   Expected: ${expected}`);
    console.error(`   Actual:   ${result}`);
    failed = true;
  } else {
    console.log(`✅ File case ${index + 1} passed`);
  }
});

if (failed) {
  console.error("\nSome tests failed.");
  process.exit(1);
} else {
  console.log("\nAll tests passed successfully.");
}
