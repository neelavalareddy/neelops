import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-boiler-black text-white px-4">
      <h1 className="text-6xl font-black text-[#CFB991]">404</h1>
      <p className="text-gray-400">This page doesn&apos;t exist (or you don&apos;t have access).</p>
      <Link
        href="/dashboard"
        className="rounded-xl border border-white/20 px-5 py-2.5 hover:bg-white/10 transition-colors font-medium"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
