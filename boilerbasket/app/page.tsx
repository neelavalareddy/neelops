import Link from "next/link";

/**
 * Marketing landing page.
 * TODO: flesh out with hero imagery, how-it-works section, testimonials.
 */
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-boiler-black px-6 text-white">
      <div className="max-w-xl text-center space-y-6">
        {/* Logo mark */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gold-dark flex items-center justify-center text-3xl font-black text-white select-none">
          BB
        </div>

        <h1 className="text-5xl font-black tracking-tight">
          Boiler<span className="text-[#CFB991]">Basket</span>
        </h1>

        <p className="text-lg text-gray-300">
          Skip the walk. Get your dining-hall meal delivered by a fellow Boilermaker.
          <br />
          <span className="text-[#CFB991] font-medium">Purdue students only.</span>
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/signup"
            className="rounded-xl bg-[#CFB991] text-black font-semibold px-6 py-3 hover:bg-[#EBD99F] transition-colors"
          >
            Sign up with @purdue.edu
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-white/20 px-6 py-3 font-semibold hover:bg-white/10 transition-colors"
          >
            Log in
          </Link>
        </div>

        <p className="text-xs text-gray-500 pt-4">
          By signing up you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </main>
  );
}
