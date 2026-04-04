import { createClient } from "@/lib/supabase/server";
import { ensureUserProfile } from "@/lib/supabase/profiles";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Handles the email-confirmation redirect from Supabase.
 * Supabase appends ?code=... to this URL after the user clicks the email link.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (user) {
        await ensureUserProfile(user);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Something went wrong — send back to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
