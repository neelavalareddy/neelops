import { NextResponse } from "next/server";
import type { ISuccessResult } from "@worldcoin/idkit";
import { verifyCloudProof } from "@worldcoin/idkit-core/backend";

export async function POST(request: Request) {
  try {
    const { proof, action, signal }: { proof: ISuccessResult; action?: string; signal?: string } =
      await request.json();

    const appId = process.env.NEXT_PUBLIC_WLD_APP_ID as `app_${string}` | undefined;
    const defaultAction = process.env.NEXT_PUBLIC_WLD_ACTION;

    if (!appId || !defaultAction) {
      return NextResponse.json({ error: "World ID app not configured." }, { status: 500 });
    }

    const result = await verifyCloudProof(
      proof,
      appId,
      typeof action === "string" && action.length > 0 ? action : defaultAction,
      typeof signal === "string" ? signal : undefined
    );

    if (!result.success) {
      const msg = result.detail ?? result.code ?? "World ID verification failed.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[verify]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
