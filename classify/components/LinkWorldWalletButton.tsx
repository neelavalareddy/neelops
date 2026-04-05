"use client";

import { useState } from "react";
import { MiniKit } from "@worldcoin/minikit-js";
import { WORLD_WALLET_AUTH_STATEMENT } from "@/lib/world/constants";

type Props = {
  onLinked?: (walletAddress: string) => void;
};

export default function LinkWorldWalletButton({ onLinked }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);

    try {
      if (!MiniKit.isInstalled() || !MiniKit.isInWorldApp()) {
        throw new Error("Open Classify inside World App to link your wallet.");
      }

      const nonceRes = await fetch("/api/wallet-auth/nonce", { method: "POST" });
      const nonceJson = await nonceRes.json().catch(() => ({}));
      if (!nonceRes.ok) {
        throw new Error(typeof nonceJson?.error === "string" ? nonceJson.error : "Could not start wallet linking.");
      }

      const result = await MiniKit.walletAuth({
        nonce: nonceJson.nonce,
        requestId: nonceJson.requestId,
        statement: WORLD_WALLET_AUTH_STATEMENT,
        fallback: () => {
          throw new Error("Open Classify inside World App to link your wallet.");
        },
      });

      const completeRes = await fetch("/api/wallet-auth/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload: result.data,
          challenge: nonceJson.challenge,
          requestId: nonceJson.requestId,
          username: MiniKit.user?.username ?? null,
        }),
      });

      const completeJson = await completeRes.json().catch(() => ({}));
      if (!completeRes.ok || typeof completeJson?.wallet_address !== "string") {
        throw new Error(typeof completeJson?.error === "string" ? completeJson.error : "Could not link wallet.");
      }

      onLinked?.(completeJson.wallet_address);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not link wallet.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button type="button" onClick={handleClick} disabled={loading} className="c-btn-gold w-full justify-center py-3">
        {loading ? "Linking wallet…" : "Link World Wallet"}
      </button>
      {error ? (
        <p className="text-xs" style={{ color: "var(--red)" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
