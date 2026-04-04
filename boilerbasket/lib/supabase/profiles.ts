import type { User } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/server";

function normalizeFullName(user: User) {
  const metadataName =
    typeof user.user_metadata.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "";

  if (metadataName) {
    return metadataName;
  }

  const emailName = user.email?.split("@")[0]?.replace(/[._-]+/g, " ") ?? "";
  const fallbackName = emailName
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return fallbackName || "Boilermaker";
}

export async function ensureUserProfile(user: User) {
  if (!user.email) {
    return;
  }

  const supabase = createServiceClient();

  await supabase.from("users").upsert(
    {
      id: user.id,
      email: user.email,
      full_name: normalizeFullName(user),
    },
    { onConflict: "id" }
  );
}
