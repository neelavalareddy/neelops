import { NextResponse } from "next/server";
import type { WalletAuthResult } from "@worldcoin/minikit-js/commands";
import { verifySiweMessage } from "@worldcoin/minikit-js/siwe";
import { getRequestSessionUser } from "@/lib/auth/requestUser";
import { linkWorldWallet } from "@/lib/auth/users";
import { parseSignedChallenge } from "@/lib/world/challenge";
import {
  WALLET_AUTH_REFERENCE_KIND,
  WORLD_WALLET_AUTH_STATEMENT,
} from "@/lib/world/constants";

export async function POST(request: Request) {
  try {
    const user = getRequestSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { payload, challenge, requestId, username } = await request.json() as {
      payload?: WalletAuthResult;
      challenge?: string;
      requestId?: string;
      username?: string | null;
    };

    if (!payload || !challenge || typeof requestId !== "string") {
      return NextResponse.json({ error: "Wallet auth payload is required." }, { status: 400 });
    }

    const parsed = parseSignedChallenge(challenge);
    if (!parsed || parsed.kind !== WALLET_AUTH_REFERENCE_KIND || parsed.sub !== user.id) {
      return NextResponse.json({ error: "Wallet auth challenge is invalid or expired." }, { status: 400 });
    }

    const verification = await verifySiweMessage(
      payload,
      parsed.nonce,
      WORLD_WALLET_AUTH_STATEMENT,
      requestId
    );

    if (!verification.isValid || !payload.address) {
      return NextResponse.json({ error: "Wallet signature verification failed." }, { status: 400 });
    }

    const appUser = await linkWorldWallet(
      user.id,
      payload.address,
      typeof username === "string" ? username : null
    );
    return NextResponse.json({
      username: appUser.username ?? null,
      wallet_address: appUser.wallet_address ?? null,
      wallet_connected_at: appUser.wallet_connected_at ?? null,
    });
  } catch (error) {
    console.error("[wallet-auth complete]", error);
    return NextResponse.json({ error: "Could not link wallet." }, { status: 500 });
  }
}
