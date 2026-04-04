"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Supabase sends the session via URL hash — the client picks it up automatically
  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        // session is active — user can now update their password
      }
    });
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/dashboard"), 2000);
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="text-5xl">✓</div>
          <h2 className="font-display text-3xl text-white tracking-wide">PASSWORD UPDATED</h2>
          <p className="font-body text-gray-400 text-sm">Redirecting you to your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Link href="/">
            <span className="font-display text-4xl gold-text tracking-wider">BOILERBASKET</span>
          </Link>
          <p className="font-body text-gray-400 text-sm mt-2">Set a new password</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 font-body text-sm text-red-400">
                {error}
              </div>
            )}

            <div>
              <label className="font-body block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                New Password
              </label>
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="input-dark"
              />
            </div>

            <div>
              <label className="font-body block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="input-dark"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full font-body font-semibold bg-[#CFB991] text-black py-3.5 rounded-xl hover:bg-[#EBD99F] transition-colors disabled:opacity-50 text-sm"
            >
              {loading ? "Updating…" : "Update password →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
