"use client";

import { useEffect, useState } from "react";
import LinkWorldWalletButton from "@/components/LinkWorldWalletButton";

type Viewer = {
  wallet_address?: string | null;
  wallet_connected_at?: string | null;
};

export default function WorldWalletPanel() {
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const json = await res.json().catch(() => ({}));
        if (!active) return;
        setViewer(json?.user ?? null);
      } catch {
        if (active) setViewer(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const walletAddress = viewer?.wallet_address?.trim() || null;

  return (
    <section
      style={{
        background: "linear-gradient(180deg, rgba(97,245,163,0.08), rgba(97,245,163,0.03))",
        border: "1px solid var(--signal-border)",
        borderRadius: 20,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--signal)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        World Wallet
      </div>
      <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>
        Link your World wallet so task payouts can be routed to you when live payment rails are enabled.
      </div>

      {loading ? (
        <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-3)" }}>Checking wallet status…</div>
      ) : walletAddress ? (
        <div
          style={{
            borderRadius: 14,
            border: "1px solid var(--signal-border)",
            background: "rgba(97,245,163,0.08)",
            padding: "12px 14px",
          }}
        >
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
            Connected
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--signal)" }}>
            {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
          </div>
        </div>
      ) : (
        <LinkWorldWalletButton
          onLinked={(nextWallet) => {
            setViewer((current) => ({
              ...(current ?? {}),
              wallet_address: nextWallet,
              wallet_connected_at: new Date().toISOString(),
            }));
          }}
        />
      )}
    </section>
  );
}
