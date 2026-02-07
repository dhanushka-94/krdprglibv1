#!/usr/bin/env node
/**
 * Seed sample users for each role. Run: npm run seed-users
 * Creates: Admin, Programme Manager, Viewer (one user each)
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

const SAMPLE_USERS = [
  { roleName: "Admin", email: "admin@example.com", password: "Admin123", name: "Admin User", company: "Krushi Radio", unit: "HQ" },
  { roleName: "Programme Manager", email: "manager@example.com", password: "Manager123", name: "Programme Manager", company: "Krushi Radio", unit: "Content" },
  { roleName: "Viewer", email: "viewer@example.com", password: "Viewer123", name: "Viewer User", company: "Krushi Radio", unit: "Listeners" },
];

async function main() {
  const { data: roles, error: rolesErr } = await supabase.from("roles").select("id, name");
  if (rolesErr || !roles?.length) {
    console.error("Roles table not seeded. Run 002_users_roles.sql first.");
    process.exit(1);
  }

  const adminPath = process.env.NEXT_PUBLIC_ADMIN_PATH ?? "k7x9p2";
  console.log("\n--- Sample users ---\n");

  for (const u of SAMPLE_USERS) {
    const role = roles.find((r) => r.name === u.roleName);
    if (!role) {
      console.warn(`Role "${u.roleName}" not found, skipping ${u.email}`);
      continue;
    }

    const password_hash = await bcrypt.hash(u.password, 12);
    const { error } = await supabase
      .from("users")
      .upsert(
        {
          email: u.email.toLowerCase(),
          password_hash,
          role_id: role.id,
          name: u.name,
          company: u.company ?? null,
          unit: u.unit ?? null,
          is_active: true,
        },
        { onConflict: "email" }
      );

    if (error) {
      console.error(`${u.email}: ${error.message}`);
      continue;
    }
    console.log(`${u.roleName}:`);
    console.log(`  Email:    ${u.email}`);
    console.log(`  Password: ${u.password}`);
    console.log("");
  }

  console.log(`Login at /${adminPath}/login\n`);
}

main();
