import { createServiceClient } from "@/lib/supabase/server";
import type { SessionUser } from "@/lib/auth/session";
import type { AppUser } from "@/types/database";

type AppUserRow = SessionUser & {
  auth_method: "world_id";
  username?: string | null;
  wallet_address?: string | null;
  wallet_connected_at?: string | null;
  created_at: string;
  world_id_verified_at: string;
  last_sign_in_at: string;
};

export async function findOrCreateWorldIdUser(nullifierHash: string): Promise<SessionUser> {
  const supabase = createServiceClient();
  const trimmedHash = nullifierHash.trim();
  const now = new Date().toISOString();

  // Supabase's inferred insert type can lag behind hand-maintained Database types for new tables.
  const { data, error } = await (supabase as any)
    .from("app_users")
    .upsert(
      {
        world_id_nullifier_hash: trimmedHash,
        auth_method: "world_id",
        role: "worker",
        world_id_verified_at: now,
        last_sign_in_at: now,
      },
      {
        onConflict: "world_id_nullifier_hash",
      }
    )
    .select("id, world_id_nullifier_hash, role, auth_method, created_at, world_id_verified_at, last_sign_in_at")
    .single() as { data: AppUserRow | null; error: unknown };

  if (error || !data) {
    throw new Error("Could not create or load app user.");
  }

  return {
    id: data.id,
    world_id_nullifier_hash: data.world_id_nullifier_hash,
    role: data.role,
  };
}

export async function getAppUserById(userId: string): Promise<AppUser | null> {
  const supabase = createServiceClient();
  const { data } = await (supabase as any)
    .from("app_users")
    .select("*")
    .eq("id", userId)
    .single() as { data: AppUser | null };

  return data ?? null;
}

export async function linkWorldWallet(
  userId: string,
  walletAddress: string,
  username?: string | null
): Promise<AppUser> {
  const supabase = createServiceClient();
  const normalizedAddress = walletAddress.trim().toLowerCase();
  const now = new Date().toISOString();
  const normalizedUsername = username?.trim() || null;

  const { data, error } = await (supabase as any)
    .from("app_users")
    .update({
      wallet_address: normalizedAddress,
      wallet_connected_at: now,
      username: normalizedUsername,
    })
    .eq("id", userId)
    .select("*")
    .single() as { data: AppUser | null; error: unknown };

  if (error || !data) {
    throw new Error("Could not link wallet.");
  }

  return data;
}
