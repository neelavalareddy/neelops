import { NextResponse } from "next/server";
import type { PayResult } from "@worldcoin/minikit-js/commands";
import { predictTaskQuality } from "@/lib/ai/anthropic";
import { getRequestSessionUser } from "@/lib/auth/requestUser";
import { parseSignedChallenge } from "@/lib/world/challenge";
import { TASK_FUNDING_REFERENCE_KIND } from "@/lib/world/constants";
import {
  verifyMiniKitPayment,
  getTreasuryAddress,
  toWorldWldBaseUnits,
  hasWorldPaymentRails,
  createSimulatedFundingVerification,
  createSimulatedPaymentReference,
} from "@/lib/world/payments";
import { createClient, createServiceClient, hasSupabaseEnv, hasSupabaseServiceEnv } from "@/lib/supabase/server";
import type { Task } from "@/types/database";

export async function GET() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false }) as { data: Task[] | null; error: unknown };

  if (error) return NextResponse.json({ error: "Failed to fetch tasks." }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  try {
    if (!hasSupabaseServiceEnv()) {
      return NextResponse.json({ error: "Supabase service role is not configured." }, { status: 503 });
    }

    const user = getRequestSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const {
      company_name,
      ai_output,
      criteria,
      bounty_wld,
      max_responses,
      funding_reference,
      funding_challenge,
      funding_payload,
    } = await request.json() as {
      company_name?: string;
      ai_output?: string;
      criteria?: string;
      bounty_wld?: number;
      max_responses?: number;
      funding_reference?: string;
      funding_challenge?: string;
      funding_payload?: PayResult;
    };

    if (!company_name?.trim() || !ai_output?.trim() || !criteria?.trim()) {
      return NextResponse.json({ error: "company_name, ai_output, and criteria are required." }, { status: 400 });
    }
    const bounty = Number(bounty_wld);
    if (!Number.isFinite(bounty) || bounty <= 0) {
      return NextResponse.json({ error: "bounty_wld must be a positive number." }, { status: 400 });
    }
    const maxResponses = Number(max_responses);
    if (!Number.isInteger(maxResponses) || maxResponses <= 0 || maxResponses > 500) {
      return NextResponse.json({ error: "max_responses must be a whole number between 1 and 500." }, { status: 400 });
    }
    const fundingAmount = Number((bounty * maxResponses).toFixed(4));
    const paymentsConfigured = hasWorldPaymentRails();
    const effectiveReference = funding_reference ?? crypto.randomUUID();
    let effectiveFundingPayload = funding_payload;

    if (paymentsConfigured) {
      if (!funding_reference || !funding_challenge || !funding_payload) {
        return NextResponse.json({ error: "A verified World payment is required before posting." }, { status: 400 });
      }

      const challenge = parseSignedChallenge(funding_challenge);
      if (
        !challenge ||
        challenge.kind !== TASK_FUNDING_REFERENCE_KIND ||
        challenge.sub !== `${user.id}:${fundingAmount.toFixed(4)}` ||
        challenge.nonce !== funding_reference
      ) {
        return NextResponse.json({ error: "Funding challenge is invalid or expired." }, { status: 400 });
      }
    } else {
      effectiveFundingPayload = createSimulatedPaymentReference(effectiveReference);
    }

    const verifiedFunding = paymentsConfigured
      ? await verifyMiniKitPayment(
          effectiveFundingPayload as PayResult,
          effectiveReference,
          getTreasuryAddress(),
          toWorldWldBaseUnits(fundingAmount)
        )
      : createSimulatedFundingVerification(effectiveReference);

    const supabase = createServiceClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("tasks")
      .insert({
        company_name: company_name.trim(),
        ai_output: ai_output.trim(),
        criteria: criteria.trim(),
        bounty_wld: bounty,
        max_responses: maxResponses,
        created_by_user_id: user.id,
        funded_pool_wld: fundingAmount,
        remaining_pool_wld: fundingAmount,
        funding_status: "funded",
        funding_reference: effectiveReference,
        funding_transaction_id: effectiveFundingPayload?.transactionId ?? null,
        funding_wallet_address: verifiedFunding.from,
        funded_at: new Date().toISOString(),
      })
      .select()
      .single() as { data: Task | null; error: unknown };

    if (error || !data) {
      return NextResponse.json({ error: "Failed to create task." }, { status: 500 });
    }

    let taskOut = data as Task;
    const prediction = await predictTaskQuality(data.ai_output, data.criteria);
    if (prediction) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: uErr } = await (supabase as any)
        .from("tasks")
        .update({
          predicted_score: prediction.score,
          prediction_rationale: prediction.rationale,
        })
        .eq("id", data.id);
      if (!uErr) {
        taskOut = {
          ...taskOut,
          predicted_score: prediction.score,
          prediction_rationale: prediction.rationale,
        };
      }
    }

    return NextResponse.json({ id: taskOut.id, task: taskOut });
  } catch (err) {
    console.error("[tasks POST]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
