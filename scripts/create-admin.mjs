#!/usr/bin/env node
/**
 * Create or reset an admin user. Run: npm run create-admin [email] [password]
 * Default: admin@example.com / admin123
 * If the user already exists, their password is updated (reset).
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing env. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  const email = (process.argv[2] || "admin@example.com").toLowerCase().trim();
  const password = process.argv[3] || "admin123";

  if (!email || !password) {
    console.error("Usage: npm run create-admin [email] [password]");
    process.exit(1);
  }

  const { data: adminRole, error: roleError } = await supabase
    .from("roles")
    .select("id")
    .eq("name", "Admin")
    .maybeSingle();

  if (roleError || !adminRole) {
    console.error("Roles table not seeded or Admin role missing. Run 002_users_roles.sql in Supabase SQL Editor.");
    process.exit(1);
  }

  const password_hash = await bcrypt.hash(password, 12);

  const { data: existing } = await supabase
    .from("users")
    .select("id, email")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    const { error: updateError } = await supabase
      .from("users")
      .update({ password_hash, is_active: true })
      .eq("id", existing.id);

    if (updateError) {
      console.error("Failed to update password:", updateError.message);
      process.exit(1);
    }
    console.log("Password updated for existing user:", existing.email);
  } else {
    const { data, error } = await supabase
      .from("users")
      .insert({
        email,
        password_hash,
        role_id: adminRole.id,
        name: "Admin",
        is_active: true,
      })
      .select("id, email")
      .single();

    if (error) {
      console.error("Error creating user:", error.message);
      process.exit(1);
    }
    console.log("Admin user created:", data.email);
  }

  console.log("");
  console.log("Login at /login using EMAIL and password (this app uses email, not username):");
  console.log("  Email:    " + email);
  console.log("  Password: (the one you passed)");
}

main();
