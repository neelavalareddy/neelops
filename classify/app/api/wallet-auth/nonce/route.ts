import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getRequestSessionUser } from "@/lib/auth/requestUser";
import { createSignedChallenge } from "@/lib/world/challenge";
import { WALLET_AUTH_REFERENCE_KIND } from "@/lib/world/constants";

function createNonce(): string {
  return randomBytes(12).toString("hex");
}

export async function POST() {
  const user = getRequestSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const nonce = createNonce();
  const requestId = createNonce();
  const challenge = createSignedChallenge(WALLET_AUTH_REFERENCE_KIND, user.id, nonce, 1000 * 60 * 10);

  return NextResponse.json({ nonce, requestId, challenge });
}
