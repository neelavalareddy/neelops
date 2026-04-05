import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getRequestSessionUser } from "@/lib/auth/requestUser";
import { createSignedChallenge } from "@/lib/world/challenge";
import { TASK_FUNDING_REFERENCE_KIND } from "@/lib/world/constants";
import { getTreasuryAddress, toWorldWldBaseUnits } from "@/lib/world/payments";

export async function POST(request: Request) {
  try {
    const user = getRequestSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { funding_amount_wld } = await request.json() as {
      funding_amount_wld?: number;
    };

    const amount = Number(funding_amount_wld);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "funding_amount_wld must be positive." }, { status: 400 });
    }

    const reference = randomUUID();
    const challenge = createSignedChallenge(
      TASK_FUNDING_REFERENCE_KIND,
      `${user.id}:${amount.toFixed(4)}`,
      reference,
      1000 * 60 * 15
    );

    return NextResponse.json({
      reference,
      challenge,
      to: getTreasuryAddress(),
      token_amount: toWorldWldBaseUnits(amount).toString(),
    });
  } catch (error) {
    console.error("[task-funding init]", error);
    return NextResponse.json({ error: "Could not initialize funding." }, { status: 500 });
  }
}
