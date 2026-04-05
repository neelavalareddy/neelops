import { createServiceClient } from "@/lib/supabase/server";
import type { SessionUser } from "@/lib/auth/session";

type AppUserRow = SessionUser & {
  auth_method: "world_id";
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
