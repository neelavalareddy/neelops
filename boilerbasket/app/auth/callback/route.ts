import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Something went wrong — send back to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
