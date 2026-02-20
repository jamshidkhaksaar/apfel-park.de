import { validateContactForm, ContactFormInput } from "../src/lib/security";

console.log("🛡️ Running Contact Form Validation Verification...\n");

let passed = 0;
let failed = 0;

const assert = (description: string, result: boolean) => {
  if (result) {
    console.log(`✅ PASS: ${description}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${description}`);
    failed++;
  }
};

// Test Case 1: Valid Input
const validInput: ContactFormInput = {
  name: "John Doe",
  email: "john@example.com",
  device: "iPhone 13",
  message: "Hello, I need a repair.",
};
const result1 = validateContactForm(validInput);
assert("Valid input should pass", result1.isValid === true);

// Test Case 2: Missing Name
const missingName = { ...validInput, name: "" };
const result2 = validateContactForm(missingName);
assert("Missing name should fail", result2.isValid === false && result2.error === "Missing required fields");

// Test Case 3: Name Too Long
const longName = { ...validInput, name: "A".repeat(101) };
const result3 = validateContactForm(longName);
assert("Name > 100 chars should fail", result3.isValid === false && ((result3.error || "").includes("Name is too long")));

// Test Case 4: Email Too Long
const longEmail = { ...validInput, email: "a".repeat(245) + "@example.com" }; // 245 + 12 = 257 > 254 total
const result4 = validateContactForm(longEmail);
assert("Email > 254 chars should fail", result4.isValid === false && ((result4.error || "").includes("Email is too long")));

// Test Case 5: Device Too Long
const longDevice = { ...validInput, device: "A".repeat(101) };
const result5 = validateContactForm(longDevice);
assert("Device > 100 chars should fail", result5.isValid === false && ((result5.error || "").includes("Device name is too long")));

// Test Case 6: Message Too Long
const longMessage = { ...validInput, message: "A".repeat(5001) };
const result6 = validateContactForm(longMessage);
assert("Message > 5000 chars should fail", result6.isValid === false && ((result6.error || "").includes("Message is too long")));

// Test Case 7: Invalid Email Format
const invalidEmail = { ...validInput, email: "invalid-email" };
const result7 = validateContactForm(invalidEmail);
assert("Invalid email format should fail", result7.isValid === false && result7.error === "Invalid email format");

console.log(`\nResults: ${passed} passed, ${failed} failed.`);

if (failed > 0) {
  process.exit(1);
}
