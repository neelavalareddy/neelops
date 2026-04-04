import { NextResponse } from "next/server";
import type { ISuccessResult } from "@worldcoin/idkit";

export async function POST(request: Request) {
  try {
    const { proof, action, signal }: { proof: ISuccessResult; action: string; signal: string } =
      await request.json();

    const appId = process.env.NEXT_PUBLIC_WLD_APP_ID;
    if (!appId) {
      return NextResponse.json({ error: "World ID app not configured." }, { status: 500 });
    }

    const verifyRes = await fetch(
      `https://developer.worldcoin.org/api/v2/verify/${appId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nullifier_hash: proof.nullifier_hash,
          merkle_root: proof.merkle_root,
          proof: proof.proof,
          verification_level: proof.verification_level,
          action: action ?? process.env.NEXT_PUBLIC_WLD_ACTION,
          signal_hash: signal || "",
        }),
      }
    );

    if (!verifyRes.ok) {
      const err = await verifyRes.json().catch(() => ({}));
      const msg = err?.detail ?? err?.code ?? "World ID verification failed.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[verify]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
