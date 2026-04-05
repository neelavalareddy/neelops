import type { IDKitResult } from "@worldcoin/idkit";

export function getWorldIdEnvironment(appId: string | undefined): "production" | "staging" {
  return appId?.startsWith("app_staging_") ? "staging" : "production";
}

export function extractWorldIdNullifier(result: IDKitResult): string | null {
  if (!Array.isArray(result.responses) || result.responses.length === 0) {
    return null;
  }

  const first = result.responses[0] as { nullifier?: string } | undefined;
  return typeof first?.nullifier === "string" && first.nullifier.length > 0
    ? first.nullifier
    : null;
}
