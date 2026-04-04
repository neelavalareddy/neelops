"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#CFB991]/10 border border-[#CFB991]/20 flex items-center justify-center text-3xl">
            📬
          </div>
          <h2 className="font-display text-3xl text-white tracking-wide">CHECK YOUR EMAIL</h2>
          <p className="font-body text-gray-400 text-sm leading-relaxed">
            We sent a reset link to <span className="text-white font-medium">{email}</span>.
            Click it to set a new password.
          </p>
          <Link href="/login" className="font-body text-sm text-[#CFB991] hover:text-[#EBD99F] transition-colors">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center px-4">
      <div className="absolute top-6 left-6">
        <Link href="/login" className="font-body text-sm text-gray-500 hover:text-[#CFB991] transition-colors">
          ← Back to login
        </Link>
      </div>

      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Link href="/">
            <span className="font-display text-4xl gold-text tracking-wider">BOILERBASKET</span>
          </Link>
          <p className="font-body text-gray-400 text-sm mt-2">Reset your password</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <p className="font-body text-sm text-gray-400 mb-6 leading-relaxed">
            Enter your Purdue email and we&apos;ll send you a link to reset your password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 font-body text-sm text-red-400">
                {error}
              </div>
            )}

            <div>
              <label className="font-body block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                Purdue Email
              </label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@purdue.edu"
                className="input-dark"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full font-body font-semibold bg-[#CFB991] text-black py-3.5 rounded-xl hover:bg-[#EBD99F] transition-colors disabled:opacity-50 text-sm"
            >
              {loading ? "Sending…" : "Send reset link →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
