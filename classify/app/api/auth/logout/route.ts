import { NextResponse } from "next/server";
import { getSessionCookieName } from "@/lib/auth/session";

export async function POST(request: Request) {
  const referer = request.headers.get("referer");
  const redirectUrl = referer && referer.startsWith("http")
    ? referer
    : process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set({
    name: getSessionCookieName(),
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
