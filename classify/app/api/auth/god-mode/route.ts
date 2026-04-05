import { NextResponse } from "next/server";
import {
  createGodModeSessionToken,
  getSessionCookieName,
  getSessionMaxAgeSeconds,
} from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const { secret } = (await request.json()) as { secret?: string };
    const expected = process.env.GOD_MODE_SECRET?.trim();

    if (!expected) {
      return NextResponse.json({ error: "God mode is not configured." }, { status: 503 });
    }

    if (!secret?.trim() || secret.trim() !== expected) {
      return NextResponse.json({ error: "Invalid god mode secret." }, { status: 403 });
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: "god-mode",
        world_id_nullifier_hash: "god-mode",
        role: "admin",
      },
    });

    response.cookies.set({
      name: getSessionCookieName(),
      value: createGodModeSessionToken(),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: getSessionMaxAgeSeconds(),
    });

    return response;
  } catch (error) {
    console.error("[god-mode]", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
