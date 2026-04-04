"use client";

import { useState } from "react";
import {
  IDKitWidget,
  VerificationLevel,
  type ISuccessResult,
  type IErrorState,
} from "@worldcoin/idkit";

interface Props {
  taskId: string;
  onVerified: (nullifierHash: string) => void;
}

export default function WorldIDButton({ taskId, onVerified }: Props) {
  const [scanning, setScanning] = useState(false);
  const [hostError, setHostError] = useState<string | null>(null);

  const appId = process.env.NEXT_PUBLIC_WLD_APP_ID as `app_${string}` | undefined;
  const action = process.env.NEXT_PUBLIC_WLD_ACTION;

  async function handleVerify(proof: ISuccessResult) {
    setScanning(true);
    setHostError(null);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proof,
          action,
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
    setHostError(null);
    onVerified(result.nullifier_hash);
  }

  function onError(state: IErrorState) {
    const msg = state.message ?? state.code ?? "Verification was not completed.";
    setHostError(msg);
  }

  if (!appId || !action) {
    return (
      <div className="wid-missing rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-left">
        <p className="text-xs font-semibold text-amber-200/90">World ID not configured</p>
        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          Set <span className="font-mono">NEXT_PUBLIC_WLD_APP_ID</span> and{" "}
          <span className="font-mono">NEXT_PUBLIC_WLD_ACTION</span> in <span className="font-mono">.env.local</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
    <IDKitWidget
      app_id={appId}
      action={action}
      signal={taskId}
      verification_level={VerificationLevel.Device}
      handleVerify={handleVerify}
      onSuccess={onSuccess}
      onError={onError}
    >
      {({ open }: { open: () => void }) => (
        <button
          type="button"
          onClick={() => {
            setHostError(null);
            open();
          }}
          disabled={scanning}
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
              {scanning ? "Verifying on server…" : "Verify with World ID"}
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
            .wid-btn:hover:not(:disabled) {
              background: rgba(0, 255, 135, 0.1);
              border-color: rgba(0, 255, 135, 0.3);
              box-shadow: 0 0 24px rgba(0, 255, 135, 0.1);
            }
            .wid-btn:disabled {
              opacity: 0.65;
              cursor: wait;
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
    {hostError && (
      <p className="text-xs" style={{ color: "var(--red)" }} role="alert">
        {hostError}
      </p>
    )}
    </div>
  );
}
