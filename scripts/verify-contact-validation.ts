
import { isValidEmail } from "../src/lib/security";
import { locales, type Locale } from "../src/lib/i18n";

console.log("🔍 Verifying contact form validation logic...");

// 1. Test Email Validation
function testEmail() {
  const valid = ["test@example.com", "user.name@domain.co.uk", "a@b.co"];
  const invalid = ["plainaddress", "@missingusername.com", "username@.com", "username@domain", "user@domain.", ""];

  // Test max length
  const longEmail = "a".repeat(64) + "@" + "b".repeat(190) + ".com"; // > 254
  if (longEmail.length > 254) invalid.push(longEmail);

  let errors = 0;
  for (const email of valid) {
    if (!isValidEmail(email)) {
      console.error(`❌ FAILED: Valid email marked invalid: ${email}`);
      errors++;
    }
  }
  for (const email of invalid) {
    if (isValidEmail(email)) {
      console.error(`❌ FAILED: Invalid email marked valid: ${email}`);
      errors++;
    }
  }
  if (errors === 0) console.log("✅ Email validation tests passed");
  else {
    console.error(`❌ ${errors} email tests failed`);
    process.exit(1);
  }
}

// 2. Test Locale Validation logic
function testLocales() {
  const validLocales = ["de", "en"];
  const invalidLocales = ["fr", "es", ""];

  let errors = 0;

  for (const loc of validLocales) {
    if (!locales.includes(loc as Locale)) {
      console.error(`❌ FAILED: Valid locale marked invalid: ${loc}`);
      errors++;
    }
  }

  for (const loc of invalidLocales) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (locales.includes(loc as any)) {
      console.error(`❌ FAILED: Invalid locale marked valid: ${loc}`);
      errors++;
    }
  }

  if (errors === 0) console.log("✅ Locale validation tests passed");
  else {
    process.exit(1);
  }
}

testEmail();
testLocales();
