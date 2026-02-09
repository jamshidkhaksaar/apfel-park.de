import { escapeHtml, isSecureSvg, validateFileExtension } from "../src/lib/security";

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

console.log("\nTesting validateFileExtension...");
const extensionCases = [
  { name: "image.png", type: "image/png", valid: true },
  { name: "image.PNG", type: "image/png", valid: true },
  { name: "image.jpg", type: "image/jpeg", valid: true },
  { name: "image.jpeg", type: "image/jpeg", valid: true },
  { name: "image.webp", type: "image/webp", valid: true },
  { name: "image.svg", type: "image/svg+xml", valid: true },
  { name: "favicon.ico", type: "image/x-icon", valid: true },

  // Mismatches
  { name: "image.png", type: "image/jpeg", valid: false },
  { name: "image.jpg", type: "image/png", valid: false },
  { name: "script.html", type: "image/png", valid: false },
  { name: "script.js", type: "image/png", valid: false },
  { name: "image.php", type: "image/jpeg", valid: false },

  // Unknown types
  { name: "file.xyz", type: "application/xyz", valid: false },
];

extensionCases.forEach(({ name, type, valid }, index) => {
  const result = validateFileExtension(name, type);
  if (result !== valid) {
    console.error(`❌ Extension case ${index + 1} failed:`);
    console.error(`   Name:   ${name}`);
    console.error(`   Type:   ${type}`);
    console.error(`   Expected: ${valid}`);
    console.error(`   Actual:   ${result}`);
    failed = true;
  } else {
    console.log(`✅ Extension case ${index + 1} passed`);
  }
});

if (failed) {
  console.error("\nSome tests failed.");
  process.exit(1);
} else {
  console.log("\nAll tests passed successfully.");
}
