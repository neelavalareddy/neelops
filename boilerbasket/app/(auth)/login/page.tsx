"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [callbackError, setCallbackError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "auth_callback_failed") {
      setCallbackError(
        "That sign-in link expired or could not be verified. Please try again."
      );
    }

    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (mounted) {
        setCurrentUser(data.user ?? null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "Incorrect email or password."
          : error.message
      );
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center px-4">

      {/* Back to home */}
      <div className="absolute top-6 left-6">
        <Link href="/" className="font-body text-sm text-gray-500 hover:text-[#CFB991] transition-colors">
          ← Home
        </Link>
      </div>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/">
            <span className="font-display text-4xl gold-text tracking-wider">BOILERBASKET</span>
          </Link>
          <p className="font-body text-gray-400 text-sm mt-2">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {currentUser && (
              <div className="rounded-xl border border-[#CFB991]/20 bg-[#CFB991]/10 px-4 py-3 font-body text-sm text-[#F4E8C8]">
                You&apos;re already signed in as {currentUser.email}. You can keep using this page to switch accounts, or{" "}
                <Link href="/dashboard" className="font-semibold text-[#EBD99F] hover:text-white transition-colors">
                  go back to your dashboard
                </Link>
                .
              </div>
            )}

            {(error || callbackError) && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 font-body text-sm text-red-400">
                {error ?? callbackError}
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

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-body block text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="font-body text-xs text-[#CFB991]/70 hover:text-[#CFB991] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-dark"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full font-body font-semibold bg-[#CFB991] text-black py-3.5 rounded-xl hover:bg-[#EBD99F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-2"
            >
              {loading ? "Signing in…" : "Sign in →"}
            </button>
          </form>
        </div>

        <p className="font-body text-center text-sm text-gray-500 mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[#CFB991] hover:text-[#EBD99F] transition-colors font-medium">
            Sign up
          </Link>
        </p>
      </div>

      <div className="absolute bottom-6 font-body text-xs text-gray-700 text-center">
        Purdue students only · @purdue.edu required
      </div>
    </div>
  );
}
