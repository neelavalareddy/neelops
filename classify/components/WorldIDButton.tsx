"use client";

import { IDKitWidget, VerificationLevel, type ISuccessResult } from "@worldcoin/idkit";

interface Props {
  taskId: string;
  onVerified: (nullifierHash: string) => void;
}

export default function WorldIDButton({ taskId, onVerified }: Props) {
  async function handleVerify(proof: ISuccessResult) {
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
      {({ open }) => (
        <button
          type="button"
          onClick={open}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-[#22C55E]/20 bg-[#22C55E]/5 px-6 py-4 text-sm font-semibold text-[#22C55E] transition-all hover:bg-[#22C55E]/10 hover:border-[#22C55E]/40 active:scale-[0.98]"
        >
          <WorldIDIcon />
          Verify with World ID
        </button>
      )}
    </IDKitWidget>
  );
}

function WorldIDIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="46" stroke="#22C55E" strokeWidth="8" />
      <circle cx="50" cy="50" r="18" fill="#22C55E" />
      <circle cx="50" cy="50" r="30" stroke="#22C55E" strokeWidth="4" strokeDasharray="6 6" />
    </svg>
  );
}
