"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifyBanner, setVerifyBanner] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Enforce @purdue.edu domain
    if (!email.toLowerCase().endsWith("@purdue.edu")) {
      setError("Only @purdue.edu email addresses are allowed.");
      return;
    }

    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
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

    // Insert public profile row
    if (data.user) {
      const { error: profileError } = await supabase.from("users").insert({
        id: data.user.id,
        email: data.user.email!,
        full_name: fullName,
      });

      if (profileError) {
        // Non-fatal for MVP — user row will be missing but auth works
        console.error("Profile insert failed:", profileError.message);
      }
    }

    setVerifyBanner(true);
    setLoading(false);
  }

  if (verifyBanner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-boiler-black px-4">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="text-5xl">📬</div>
          <h2 className="text-2xl font-bold text-white">Check your Purdue email</h2>
          <p className="text-gray-400 text-sm">
            We sent a verification link to <strong className="text-white">{email}</strong>.
            Click it to activate your BoilerBasket account.
          </p>
          <Link href="/login" className="text-[#CFB991] text-sm hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-boiler-black px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <Link href="/" className="text-3xl font-black text-white">
            Boiler<span className="text-[#CFB991]">Basket</span>
          </Link>
          <p className="mt-2 text-gray-400 text-sm">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-900/40 border border-red-500/30 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Boilermaker Pete"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#CFB991]"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Purdue Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@purdue.edu"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#CFB991]"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#CFB991]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#CFB991] text-black font-semibold py-3 hover:bg-[#EBD99F] transition-colors disabled:opacity-60"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="text-[#CFB991] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
