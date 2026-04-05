import { NextResponse } from "next/server";
import { signRequest } from "@worldcoin/idkit-core/signing";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { action } = (await request.json()) as { action?: string };
    const rpId = process.env.WLD_RP_ID?.trim();
    const signingKey = process.env.WLD_RP_SIGNING_KEY?.trim();
    const requestedAction = action?.trim() || process.env.NEXT_PUBLIC_WLD_ACTION?.trim();

    const missing: string[] = [];
    if (!rpId) missing.push("WLD_RP_ID");
    if (!signingKey) missing.push("WLD_RP_SIGNING_KEY");
    if (!requestedAction) missing.push("NEXT_PUBLIC_WLD_ACTION");

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `World ID RP context is not configured. Missing: ${missing.join(", ")}` },
        { status: 503 }
      );
    }

    const safeAction = requestedAction!;
    const safeSigningKey = signingKey!;
    let sig;
    try {
      sig = signRequest({
        action: safeAction,
        signingKeyHex: safeSigningKey,
      });
    } catch (error) {
      console.error("[worldid/rp-context signRequest]", error);
      return NextResponse.json(
        {
          error:
            "World ID request signing failed. Check that WLD_RP_SIGNING_KEY, WLD_RP_ID, and NEXT_PUBLIC_WLD_ACTION belong to the same World ID app and environment.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      rp_id: rpId,
      nonce: sig.nonce,
      created_at: sig.createdAt,
      expires_at: sig.expiresAt,
      signature: sig.sig,
    });
  } catch (error) {
    console.error("[worldid/rp-context]", error);
    return NextResponse.json(
      {
        error:
          "Could not create RP context. The World ID route failed before it could produce a signed request.",
      },
      { status: 500 }
    );
  }
}
