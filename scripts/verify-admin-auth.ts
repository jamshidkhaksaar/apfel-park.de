import { isAdminUser } from "@/lib/admin-auth";
import type { User } from "@supabase/supabase-js";

// Mock environment variables
const originalEnv = process.env;

function setup() {
  process.env = { ...originalEnv };
  delete process.env.ADMIN_EMAILS;
}

function teardown() {
  process.env = originalEnv;
}

function createMockUser(email: string, role?: string): User {
  return {
    id: "user-123",
    app_metadata: { role },
    user_metadata: {},
    aud: "authenticated",
    created_at: new Date().toISOString(),
    email,
    role: "authenticated",
  } as unknown as User;
}

function runTest() {
  setup();

  console.log("Running admin auth verification...");
  let allPassed = true;

  // Test 1: ADMIN_EMAILS unset (Secure Default)
  delete process.env.ADMIN_EMAILS;
  const user = createMockUser("user@example.com");
  const result1 = isAdminUser(user);
  console.log(`[Test 1] ADMIN_EMAILS unset. User 'user@example.com' is admin? ${result1}`);
  if (result1 === false) {
    console.log("✅ PASSED: Secure default (denied).");
  } else {
    console.error("❌ FAILED: Insecure default (allowed).");
    allPassed = false;
  }

  // Test 2: ADMIN_EMAILS set, matching email
  process.env.ADMIN_EMAILS = "admin@example.com,other@example.com";
  const adminUser = createMockUser("admin@example.com");
  const result2 = isAdminUser(adminUser);
  console.log(`[Test 2] ADMIN_EMAILS='${process.env.ADMIN_EMAILS}'. User 'admin@example.com' is admin? ${result2}`);
  if (result2 === true) {
     console.log("✅ PASSED: Correctly allowed admin email.");
  } else {
    console.error("❌ FAILED: Denied valid admin email.");
    allPassed = false;
  }

  // Test 3: ADMIN_EMAILS set, non-matching email
  const normalUser = createMockUser("hacker@evil.com");
  const result3 = isAdminUser(normalUser);
  console.log(`[Test 3] ADMIN_EMAILS='${process.env.ADMIN_EMAILS}'. User 'hacker@evil.com' is admin? ${result3}`);
  if (result3 === false) {
    console.log("✅ PASSED: Correctly denied non-admin email.");
  } else {
    console.error("❌ FAILED: Allowed non-admin email.");
    allPassed = false;
  }

  // Test 4: Explicit Admin Role (should always pass)
  delete process.env.ADMIN_EMAILS;
  const roleUser = createMockUser("role@example.com", "admin");
  const result4 = isAdminUser(roleUser);
  console.log(`[Test 4] ADMIN_EMAILS unset. User with role='admin' is admin? ${result4}`);
  if (result4 === true) {
      console.log("✅ PASSED: Correctly allowed admin role.");
  } else {
      console.error("❌ FAILED: Denied user with admin role.");
      allPassed = false;
  }

  teardown();

  if (allPassed) {
    console.log("\n🎉 All security checks passed!");
    process.exit(0);
  } else {
    console.error("\n💥 Some checks failed!");
    process.exit(1);
  }
}

runTest();
