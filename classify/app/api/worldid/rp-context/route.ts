import { NextResponse } from "next/server";
import { signRequest } from "@worldcoin/idkit/signing";

export async function POST(request: Request) {
  try {
    const { action } = (await request.json()) as { action?: string };
    const rpId = process.env.WLD_RP_ID?.trim();
    const signingKey = process.env.WLD_RP_SIGNING_KEY?.trim();
    const requestedAction = action?.trim() || process.env.NEXT_PUBLIC_WLD_ACTION?.trim();

    if (!rpId || !signingKey || !requestedAction) {
      return NextResponse.json({ error: "World ID RP context is not configured." }, { status: 503 });
    }

    const sig = signRequest(requestedAction, signingKey);

    return NextResponse.json({
      rp_id: rpId,
      nonce: sig.nonce,
      created_at: sig.createdAt,
      expires_at: sig.expiresAt,
      signature: sig.sig,
    });
  } catch (error) {
    console.error("[worldid/rp-context]", error);
    return NextResponse.json({ error: "Could not create RP context." }, { status: 500 });
  }
}
