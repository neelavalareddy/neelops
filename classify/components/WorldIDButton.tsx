"use client";

import { useState } from "react";
import { IDKitWidget, VerificationLevel, type ISuccessResult } from "@worldcoin/idkit";

interface Props {
  taskId: string;
  onVerified: (nullifierHash: string) => void;
}

export default function WorldIDButton({ taskId, onVerified }: Props) {
  const [scanning, setScanning] = useState(false);

  async function handleVerify(proof: ISuccessResult) {
    setScanning(true);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proof,
          action: process.env.NEXT_PUBLIC_WLD_ACTION,
          signal: taskId,
        }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Verification failed." }));
        throw new Error(error ?? "Verification failed.");
      }
    } finally {
      setScanning(false);
    }
  }

  function onSuccess(result: ISuccessResult) {
    onVerified(result.nullifier_hash);
  }

  return (
    <IDKitWidget
      app_id={process.env.NEXT_PUBLIC_WLD_APP_ID as `app_${string}`}
      action={process.env.NEXT_PUBLIC_WLD_ACTION!}
      signal={taskId}
      verification_level={VerificationLevel.Device}
      handleVerify={handleVerify}
      onSuccess={onSuccess}
    >
      {({ open }: { open: () => void }) => (
        <button
          type="button"
          onClick={open}
          className="wid-btn"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {/* Iris animation */}
          <span className="wid-iris" aria-hidden>
            <span className="wid-ring wid-ring-1" />
            <span className="wid-ring wid-ring-2" />
            <span className="wid-ring wid-ring-3" />
            <span className="wid-core" />
          </span>

          <span className="flex flex-col items-start">
            <span className="text-sm font-semibold leading-tight" style={{ color: "var(--signal)" }}>
              {scanning ? "Scanning…" : "Verify with World ID"}
            </span>
            <span className="text-xs leading-tight" style={{ color: "var(--text-muted)" }}>
              Prove you&apos;re a unique human
            </span>
          </span>

          <style>{`
            .wid-btn {
              display: flex;
              width: 100%;
              align-items: center;
              gap: 14px;
              padding: 14px 18px;
              border-radius: 14px;
              background: var(--signal-dim);
              border: 1px solid var(--signal-border);
              cursor: pointer;
              transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
            }
            .wid-btn:hover {
              background: rgba(0, 255, 135, 0.1);
              border-color: rgba(0, 255, 135, 0.3);
              box-shadow: 0 0 24px rgba(0, 255, 135, 0.1);
            }
            .wid-iris {
              position: relative;
              flex-shrink: 0;
              width: 36px; height: 36px;
              display: flex; align-items: center; justify-content: center;
            }
            .wid-ring {
              position: absolute;
              border-radius: 50%;
              border: 1px solid var(--signal);
            }
            .wid-ring-1 { width: 100%; height: 100%; opacity: 0.15; animation: iris-spin 18s linear infinite; border-style: dashed; }
            .wid-ring-2 { width: 72%; height: 72%; opacity: 0.25; animation: iris-spin-rev 12s linear infinite; }
            .wid-ring-3 { width: 48%; height: 48%; opacity: 0.4; animation: iris-spin 8s linear infinite; border-style: dashed; }
            .wid-core {
              width: 10px; height: 10px;
              border-radius: 50%;
              background: var(--signal);
              box-shadow: 0 0 10px var(--signal), 0 0 24px rgba(0,255,135,0.5);
              animation: scan-pulse 2.5s ease-in-out infinite;
              z-index: 1;
            }
          `}</style>
        </button>
      )}
    </IDKitWidget>
  );
}
