import Link from "next/link";

export default function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0A0A0F]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#7C6FFF] text-xs font-black text-white">
            C
          </span>
          <span className="font-bold text-white tracking-tight">Classify</span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link href="/tasks" className="rounded-lg px-3 py-1.5 text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
            Browse Tasks
          </Link>
          <Link href="/dashboard" className="rounded-lg px-3 py-1.5 text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
            Dashboard
          </Link>
          <Link href="/post" className="btn-primary ml-2 py-2 text-xs">
            Post a Task
          </Link>
        </nav>
      </div>
    </header>
  );
}
