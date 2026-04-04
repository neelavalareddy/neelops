"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifyBanner, setVerifyBanner] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.toLowerCase().endsWith("@purdue.edu")) {
      setError("Only @purdue.edu email addresses are allowed.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { full_name: fullName },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setVerifyBanner(true);
    setLoading(false);
  }

  if (verifyBanner) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#CFB991]/10 border border-[#CFB991]/20 flex items-center justify-center text-3xl">
            📬
          </div>
          <h2 className="font-display text-3xl text-white tracking-wide">CHECK YOUR EMAIL</h2>
          <p className="font-body text-gray-400 text-sm leading-relaxed">
            We sent a verification link to{" "}
            <span className="text-white font-medium">{email}</span>.
            <br />
            Click it to activate your BoilerBasket account.
          </p>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="font-body text-xs text-gray-500">
              Didn&apos;t receive it? Check your spam folder or{" "}
              <button
                onClick={() => setVerifyBanner(false)}
                className="text-[#CFB991] hover:underline"
              >
                try again
              </button>
              .
            </p>
          </div>
          <Link href="/login" className="font-body text-sm text-gray-500 hover:text-[#CFB991] transition-colors">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center px-4 py-12">
      <div className="absolute top-6 left-6">
        <Link href="/" className="font-body text-sm text-gray-500 hover:text-[#CFB991] transition-colors">
          ← Home
        </Link>
      </div>

      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Link href="/">
            <span className="font-display text-4xl gold-text tracking-wider">BOILERBASKET</span>
          </Link>
          <p className="font-body text-gray-400 text-sm mt-2">Create your account</p>
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
                Full Name
              </label>
              <input
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Boilermaker Pete"
                className="input-dark"
              />
            </div>

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
              {email && !email.toLowerCase().endsWith("@purdue.edu") && (
                <p className="font-body text-xs text-red-400 mt-1.5">Must be a @purdue.edu address</p>
              )}
            </div>

            <div>
              <label className="font-body block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                Password
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
              {confirm && password !== confirm && (
                <p className="font-body text-xs text-red-400 mt-1.5">Passwords don&apos;t match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full font-body font-semibold bg-[#CFB991] text-black py-3.5 rounded-xl hover:bg-[#EBD99F] transition-colors disabled:opacity-50 text-sm mt-2"
            >
              {loading ? "Creating account…" : "Create account →"}
            </button>
          </form>
        </div>

        <p className="font-body text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-[#CFB991] hover:text-[#EBD99F] transition-colors font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
