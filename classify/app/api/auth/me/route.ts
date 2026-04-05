import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionCookieName, parseSessionToken } from "@/lib/auth/session";
import { getAppUserById } from "@/lib/auth/users";
import { hasWorldPaymentRails } from "@/lib/world/payments";

export async function GET() {
  const user = parseSessionToken(cookies().get(getSessionCookieName())?.value);
  if (!user) {
    return NextResponse.json({ user: null });
  }

  const appUser = user.id === "god-mode" ? null : await getAppUserById(user.id);
  return NextResponse.json({
    user: {
      ...user,
      username: appUser?.username ?? null,
      wallet_address: appUser?.wallet_address ?? null,
      wallet_connected_at: appUser?.wallet_connected_at ?? null,
    },
    world_payments_configured: hasWorldPaymentRails(),
  });
}
