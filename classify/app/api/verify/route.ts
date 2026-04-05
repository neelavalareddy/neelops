import { NextResponse } from "next/server";
import type { IDKitResult } from "@worldcoin/idkit";
import { createSessionToken, getSessionCookieName, getSessionMaxAgeSeconds } from "@/lib/auth/session";
import { findOrCreateWorldIdUser } from "@/lib/auth/users";
import { hasSupabaseServiceEnv } from "@/lib/supabase/server";
import { extractWorldIdNullifier } from "@/lib/worldid";

export async function POST(request: Request) {
  try {
    const { idkitResponse }: { idkitResponse: IDKitResult } =
      await request.json();

    const rpId = process.env.WLD_RP_ID?.trim();

    if (!rpId) {
      return NextResponse.json({ error: "World ID RP ID is not configured." }, { status: 500 });
    }
    if (!hasSupabaseServiceEnv()) {
      return NextResponse.json({ error: "Supabase service role is not configured." }, { status: 503 });
    }

    const verifyResponse = await fetch(`https://developer.worldcoin.org/api/v4/verify/${rpId}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "classify-worldid/1.0",
      },
      body: JSON.stringify(idkitResponse),
    });

    const verifyPayload = (await verifyResponse.json().catch(() => null)) as
      | {
          success?: boolean;
          detail?: string;
          code?: string;
          message?: string;
          nullifier?: string;
        }
      | null;

    if (!verifyResponse.ok || !verifyPayload?.success) {
      const msg =
        verifyPayload?.detail ??
        verifyPayload?.message ??
        verifyPayload?.code ??
        "World ID verification failed.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const nullifierHash =
      verifyPayload.nullifier ||
      extractWorldIdNullifier(idkitResponse);

    if (!nullifierHash) {
      return NextResponse.json({ error: "World ID verification returned no nullifier." }, { status: 400 });
    }

    const user = await findOrCreateWorldIdUser(nullifierHash);
    const response = NextResponse.json({ success: true, user });
    response.cookies.set({
      name: getSessionCookieName(),
      value: createSessionToken(user),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: getSessionMaxAgeSeconds(),
    });

    return response;
  } catch (err) {
    console.error("[verify]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
