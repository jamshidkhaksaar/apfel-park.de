// Script to create admin user in Supabase
// Run with: npx tsx scripts/create-admin.ts

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing environment variables!");
  console.error("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "SET" : "MISSING");
  console.error("SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "SET" : "MISSING");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createAdminUser() {
  const email = "admin@apfel-park.de";
  const password = "ApfelPark2026!";

  console.log("Creating admin user...");
  console.log(`Email: ${email}`);

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    console.error("Error creating user:", error.message);
    process.exit(1);
  }

  console.log("Admin user created successfully!");
  console.log("User ID:", data.user.id);
  console.log("\n--- Login Credentials ---");
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
}

createAdminUser();
