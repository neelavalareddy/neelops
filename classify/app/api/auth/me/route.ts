import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionCookieName, parseSessionToken } from "@/lib/auth/session";

export async function GET() {
  const user = parseSessionToken(cookies().get(getSessionCookieName())?.value);
  return NextResponse.json({ user });
}
