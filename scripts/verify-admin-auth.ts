
import { isAdminUser } from "../src/lib/admin-auth";
import assert from "assert";

// Mock User interface from Supabase
const mockUser = (email: string | undefined, role: string | undefined = undefined) => ({
  id: "test-user-id",
  aud: "authenticated",
  created_at: new Date().toISOString(),
  email: email,
  phone: "",
  app_metadata: { provider: "email", providers: ["email"], role: role },
  user_metadata: {},
  identities: [],
  role: "authenticated",
});

async function runTests() {
  console.log("🛡️ Running Admin Auth Security Tests...");

  // store original env
  const originalAdminEmails = process.env.ADMIN_EMAILS;

  try {
    // TEST 1: No ADMIN_EMAILS configured -> Should return FALSE (Secure Default)
    delete process.env.ADMIN_EMAILS;
    const user1 = mockUser("random@user.com");
    assert.strictEqual(isAdminUser(user1), false, "FAILED: Should deny access when ADMIN_EMAILS is missing");
    console.log("✅ Passed: Denies access by default when unconfigured");

    // TEST 2: ADMIN_EMAILS configured, user NOT in list -> Should return FALSE
    process.env.ADMIN_EMAILS = "admin@secure.com,boss@secure.com";
    const user2 = mockUser("hacker@evil.com");
    assert.strictEqual(isAdminUser(user2), false, "FAILED: Should deny access for unlisted user");
    console.log("✅ Passed: Denies access for unlisted user");

    // TEST 3: ADMIN_EMAILS configured, user IN list -> Should return TRUE
    process.env.ADMIN_EMAILS = "admin@secure.com,boss@secure.com";
    const user3 = mockUser("admin@secure.com");
    assert.strictEqual(isAdminUser(user3), true, "FAILED: Should allow access for listed admin");
    console.log("✅ Passed: Allows access for listed admin");

    // TEST 4: ADMIN_EMAILS configured, user IN list (case insensitive) -> Should return TRUE
    process.env.ADMIN_EMAILS = "admin@secure.com";
    const user4 = mockUser("ADMIN@SECURE.COM");
    assert.strictEqual(isAdminUser(user4), true, "FAILED: Should allow access for case-insensitive match");
    console.log("✅ Passed: Handles case-insensitivity correctly");

    // TEST 5: App Role 'admin' -> Should return TRUE (Supabase RBAC override)
    // This tests that we didn't break existing RBAC if used
    delete process.env.ADMIN_EMAILS;
    const user5 = mockUser("service@role.com", "admin");
    assert.strictEqual(isAdminUser(user5), true, "FAILED: Should allow access if app_metadata.role is 'admin'");
    console.log("✅ Passed: Respects app_metadata.role='admin'");

  } catch (error) {
    console.error("❌ Test Failed:", error);
    process.exit(1);
  } finally {
    // restore env
    if (originalAdminEmails) {
      process.env.ADMIN_EMAILS = originalAdminEmails;
    } else {
      delete process.env.ADMIN_EMAILS;
    }
  }
}

runTests();
