#!/usr/bin/env node
/**
 * Creates test users in Supabase for local development.
 * Run AFTER the schema migration has been applied.
 *
 * Usage:  node scripts/create-users.mjs
 */

import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

// ── Parse .env.local ──────────────────────────────────────────────────────────
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()])
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ── Test accounts ─────────────────────────────────────────────────────────────
const TEST_USERS = [
  {
    email: "requester@purdue.edu",
    password: "Boiler1234!",
    full_name: "Alex Requester",
    purdue_id: "0012345",
  },
  {
    email: "picker@purdue.edu",
    password: "Boiler1234!",
    full_name: "Jordan Picker",
    purdue_id: "0054321",
  },
  {
    email: "both@purdue.edu",
    password: "Boiler1234!",
    full_name: "Sam Boilermaker",
    purdue_id: "0099999",
  },
];

// ── Create each user ──────────────────────────────────────────────────────────
for (const user of TEST_USERS) {
  process.stdout.write(`Creating ${user.email}… `);

  // 1. Create auth user (email pre-confirmed so no verification email needed)
  const { data, error: authError } = await supabase.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: { full_name: user.full_name },
  });

  if (authError) {
    if (authError.message.toLowerCase().includes("already")) {
      console.log("already exists, skipping.");
    } else {
      console.error(`AUTH ERROR: ${authError.message}`);
    }
    continue;
  }

  // 2. Insert public profile row
  const { error: profileError } = await supabase.from("users").upsert({
    id: data.user.id,
    email: user.email,
    full_name: user.full_name,
    purdue_id: user.purdue_id,
  });

  if (profileError) {
    console.error(`PROFILE ERROR: ${profileError.message}`);
  } else {
    console.log("✓");
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`
┌─────────────────────────────────────────────────────┐
│              Test Login Credentials                 │
├──────────────────────────────┬──────────────────────┤
│ Email                        │ Password             │
├──────────────────────────────┼──────────────────────┤
│ requester@purdue.edu         │ Boiler1234!          │
│ picker@purdue.edu            │ Boiler1234!          │
│ both@purdue.edu              │ Boiler1234!          │
└──────────────────────────────┴──────────────────────┘
`);
