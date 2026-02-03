import { buildEmailContent } from "../src/lib/email";

console.log("🛡️  Verifying Email HTML Injection Fix...");

const maliciousData = {
  name: "<script>alert('xss')</script>",
  email: "hacker@example.com",
  device: "<img src=x onerror=alert(1)>",
  message: "Hello world\n<script>bad()</script>",
  locale: "en",
};

const { html } = buildEmailContent(maliciousData);

console.log("\nGenerated HTML:");
console.log(html);

// Checks
const errors: string[] = [];

if (html.includes("<script>")) {
  errors.push("❌ Failed: <script> tag found in HTML.");
}

if (html.includes("&lt;script&gt;")) {
  console.log("✅ Passed: <script> was properly escaped.");
} else {
  errors.push("❌ Failed: Escaped <script> tag not found.");
}

if (html.includes("<img src=x")) {
  errors.push("❌ Failed: <img src=x> found in HTML.");
}

if (html.includes("&lt;img src=x")) {
  console.log("✅ Passed: <img> tag was properly escaped.");
} else {
  errors.push("❌ Failed: Escaped <img> tag not found.");
}

// Check message formatting
const expectedMessage = "Hello world<br/>&lt;script&gt;bad()&lt;/script&gt;";
if (html.includes(expectedMessage)) {
   console.log("✅ Passed: Message content properly escaped and formatted.");
} else {
  errors.push("❌ Failed: Message content not correctly formatted/escaped.");
  console.log("Expected part of message:", expectedMessage);
}

if (errors.length > 0) {
  console.error("\nVerification Failed:");
  errors.forEach((e) => console.error(e));
  process.exit(1);
} else {
  console.log("\n✅ All security checks passed!");
}
