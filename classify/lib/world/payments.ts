import { privateKeyToAccount } from "viem/accounts";
import {
  createPublicClient,
  createWalletClient,
  erc20Abi,
  formatUnits,
  http,
  parseUnits,
} from "viem";
import { worldchain } from "viem/chains";
import type { PayResult } from "@worldcoin/minikit-js/commands";

type VerifiedPayment = {
  reference: string;
  from: string | null;
  to: string | null;
  amountTokenBaseUnits: bigint | null;
  raw: unknown;
};

export function hasWorldPaymentRails(): boolean {
  return Boolean(
    process.env.DEV_PORTAL_API_KEY?.trim() &&
    process.env.WORLD_TREASURY_PRIVATE_KEY?.trim() &&
    process.env.WORLD_WLD_TOKEN_ADDRESS?.trim() &&
    process.env.NEXT_PUBLIC_WLD_APP_ID?.trim()
  );
}

function getDevPortalApiKey(): string {
  const apiKey = process.env.DEV_PORTAL_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("DEV_PORTAL_API_KEY is not configured.");
  }
  return apiKey;
}

function getAppId(): string {
  const appId = process.env.NEXT_PUBLIC_WLD_APP_ID?.trim();
  if (!appId) {
    throw new Error("NEXT_PUBLIC_WLD_APP_ID is not configured.");
  }
  return appId;
}

function getTreasuryPrivateKey(): `0x${string}` {
  const privateKey = process.env.WORLD_TREASURY_PRIVATE_KEY?.trim();
  if (!privateKey) {
    throw new Error("WORLD_TREASURY_PRIVATE_KEY is not configured.");
  }
  return privateKey as `0x${string}`;
}

function getWldTokenAddress(): `0x${string}` {
  const address = process.env.WORLD_WLD_TOKEN_ADDRESS?.trim();
  if (!address) {
    throw new Error("WORLD_WLD_TOKEN_ADDRESS is not configured.");
  }
  return address as `0x${string}`;
}

function getWorldChainTransport() {
  return http(process.env.WORLDCHAIN_RPC_URL?.trim() || worldchain.rpcUrls.default.http[0]);
}

function readTransactionShape(input: any) {
  const tx = input?.transaction ?? input?.result ?? input;
  return {
    reference:
      tx?.reference ??
      tx?.payment_reference ??
      tx?.payload?.reference ??
      null,
    from:
      tx?.from ??
      tx?.sender ??
      tx?.payload?.from ??
      null,
    to:
      tx?.to ??
      tx?.recipient ??
      tx?.receiver ??
      tx?.payload?.to ??
      null,
    amount:
      tx?.token_amount ??
      tx?.amount ??
      tx?.payload?.token_amount ??
      tx?.tokens?.[0]?.token_amount ??
      tx?.payload?.tokens?.[0]?.token_amount ??
      null,
  };
}

export function getTreasuryAddress(): `0x${string}` {
  return privateKeyToAccount(getTreasuryPrivateKey()).address;
}

export function toWorldWldBaseUnits(amountWld: number): bigint {
  return parseUnits(amountWld.toFixed(4), 18);
}

export function formatWorldWld(amountBaseUnits: bigint): string {
  return formatUnits(amountBaseUnits, 18);
}

export async function verifyMiniKitPayment(
  payload: PayResult,
  expectedReference: string,
  expectedTo: string,
  expectedAmountBaseUnits: bigint
): Promise<VerifiedPayment> {
  const response = await fetch(
    `https://developer.worldcoin.org/api/v2/minikit/transaction/${payload.transactionId}?app_id=${getAppId()}&type=payment`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getDevPortalApiKey()}`,
      },
      cache: "no-store",
    }
  );

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error("World payment verification failed.");
  }

  const tx = readTransactionShape(json);
  if (tx.reference !== expectedReference) {
    console.error("[verifyMiniKitPayment] reference mismatch", { expectedReference, json });
    throw new Error("World payment reference mismatch.");
  }

  if (typeof tx.to === "string" && tx.to.toLowerCase() !== expectedTo.toLowerCase()) {
    console.error("[verifyMiniKitPayment] receiver mismatch", { expectedTo, json });
    throw new Error("World payment recipient mismatch.");
  }

  let amountTokenBaseUnits: bigint | null = null;
  if (tx.amount != null) {
    try {
      amountTokenBaseUnits = BigInt(String(tx.amount));
    } catch {
      amountTokenBaseUnits = null;
    }
  }

  if (amountTokenBaseUnits != null && amountTokenBaseUnits < expectedAmountBaseUnits) {
    console.error("[verifyMiniKitPayment] amount too small", {
      expectedAmountBaseUnits: expectedAmountBaseUnits.toString(),
      actual: amountTokenBaseUnits.toString(),
      json,
    });
    throw new Error("World payment amount was lower than expected.");
  }

  return {
    reference: tx.reference,
    from: typeof tx.from === "string" ? tx.from.toLowerCase() : null,
    to: typeof tx.to === "string" ? tx.to.toLowerCase() : null,
    amountTokenBaseUnits,
    raw: json,
  };
}

export function createSimulatedFundingVerification(reference: string): VerifiedPayment {
  return {
    reference,
    from: "demo-funder",
    to: "demo-treasury",
    amountTokenBaseUnits: null,
    raw: { simulated: true, reference },
  };
}

export function createSimulatedPaymentReference(reference: string): PayResult {
  return {
    transactionId: `sim_funding_${reference.replace(/-/g, "")}`,
    reference,
    from: "demo-funder",
    chain: "worldchain" as PayResult["chain"],
    timestamp: new Date().toISOString(),
  };
}

export function createSimulatedPayoutHash(responseId: string): `0x${string}` {
  const base = Buffer.from(`classify:${responseId}`).toString("hex").slice(0, 64).padEnd(64, "0");
  return `0x${base}` as `0x${string}`;
}

export async function sendWldPayout(to: string, amountWld: number): Promise<`0x${string}`> {
  const account = privateKeyToAccount(getTreasuryPrivateKey());
  const publicClient = createPublicClient({
    chain: worldchain,
    transport: getWorldChainTransport(),
  });
  const walletClient = createWalletClient({
    account,
    chain: worldchain,
    transport: getWorldChainTransport(),
  });

  const txHash = await walletClient.writeContract({
    address: getWldTokenAddress(),
    abi: erc20Abi,
    functionName: "transfer",
    args: [to as `0x${string}`, toWorldWldBaseUnits(amountWld)],
  });

  await publicClient.waitForTransactionReceipt({ hash: txHash });
  return txHash;
}
