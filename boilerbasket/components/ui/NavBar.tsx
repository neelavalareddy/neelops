"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NavBar() {
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-boiler-black/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/dashboard" className="text-xl font-black text-white">
          Boiler<span className="text-[#CFB991]">Basket</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm font-medium text-gray-300">
          <Link href="/orders/new" className="hover:text-[#CFB991] transition-colors">
            + New Order
          </Link>
          <Link href="/dashboard" className="hover:text-[#CFB991] transition-colors">
            Dashboard
          </Link>
          {/* TODO: replace with actual user id from session */}
          <Link href="/profile/me" className="hover:text-[#CFB991] transition-colors">
            Profile
          </Link>
          <button
            onClick={signOut}
            className="rounded-lg border border-white/20 px-3 py-1.5 hover:bg-white/10 transition-colors"
          >
            Sign out
          </button>
        </nav>
      </div>
    </header>
  );
}
