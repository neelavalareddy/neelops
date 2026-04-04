"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-16"
      style={{ background: "#050507", color: "#F0F2FF" }}
    >
      <h1 className="font-display text-3xl tracking-wider text-white mb-3">SOMETHING BROKE</h1>
      <p className="text-sm text-center max-w-md mb-2" style={{ color: "rgba(240,242,255,0.65)" }}>
        {error.message || "An unexpected error occurred."}
      </p>
      {error.digest && (
        <p className="text-[10px] font-mono mb-6" style={{ color: "rgba(240,242,255,0.35)" }}>
          {error.digest}
        </p>
      )}
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-xl px-5 py-2.5 text-sm font-semibold"
          style={{ background: "#00FF87", color: "#050507" }}
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-xl border px-5 py-2.5 text-sm"
          style={{ borderColor: "rgba(255,255,255,0.15)", color: "#F0F2FF" }}
        >
          Home
        </Link>
      </div>
    </div>
  );
}
