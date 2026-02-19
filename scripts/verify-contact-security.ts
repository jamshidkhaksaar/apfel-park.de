import { escapeHtml } from "../src/lib/security";

// This regex is strict: only alphanumeric, dot, underscore, percent, plus, minus.
// It explicitly excludes '<' and '>' which are allowed in some RFCs but dangerous for HTML injection if unescaped.
const strictEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Allowed locales
const allowedLocales = ["de", "en"];

function testEmail(email: string) {
  const result = strictEmailRegex.test(email);
  console.log(`Email: '${email}' -> Valid: ${result}`);
  return result;
}

function testSanitize(input: string) {
  const sanitized = escapeHtml(input);
  console.log(`Input: '${input}' -> Sanitized: '${sanitized}'`);
  return sanitized;
}

function testLocale(locale: string) {
  const valid = allowedLocales.includes(locale);
  const final = valid ? locale : "en";
  console.log(`Locale: '${locale}' -> Final: '${final}'`);
  return final;
}

console.log("--- Email Validation Tests ---");

let failed = false;

// Valid emails
if (!testEmail("test@example.com")) { console.error("❌ Expected valid: test@example.com"); failed = true; }
if (!testEmail("user.name+tag@example.co.uk")) { console.error("❌ Expected valid: user.name+tag@example.co.uk"); failed = true; }

// Invalid emails
if (testEmail("<script>@example.com")) { console.error("❌ Expected invalid: <script>@example.com"); failed = true; }
if (testEmail("user@<script>example.com")) { console.error("❌ Expected invalid: user@<script>example.com"); failed = true; }
if (testEmail("user@example")) { console.error("❌ Expected invalid: user@example"); failed = true; }
if (testEmail("user space@example.com")) { console.error("❌ Expected invalid: user space@example.com"); failed = true; }

console.log("\n--- Sanitization Tests ---");

const s1 = testSanitize("<script>alert(1)</script>");
if (s1 !== "&lt;script&gt;alert(1)&lt;/script&gt;") { console.error(`❌ Expected escaped script, got: ${s1}`); failed = true; }

const s2 = testSanitize("<b>Bold</b>");
if (s2 !== "&lt;b&gt;Bold&lt;/b&gt;") { console.error(`❌ Expected escaped bold, got: ${s2}`); failed = true; }

console.log("\n--- Locale Validation Tests ---");

if (testLocale("de") !== "de") { console.error("❌ Expected 'de' -> 'de'"); failed = true; }
if (testLocale("en") !== "en") { console.error("❌ Expected 'en' -> 'en'"); failed = true; }
if (testLocale("fr") !== "en") { console.error("❌ Expected 'fr' -> 'en'"); failed = true; }
if (testLocale("<script>") !== "en") { console.error("❌ Expected '<script>' -> 'en'"); failed = true; }

if (failed) {
  console.error("\n❌ TESTS FAILED");
  process.exit(1);
} else {
  console.log("\n✅ ALL TESTS PASSED");
}
