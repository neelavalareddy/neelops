import Link from "next/link";

export default function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b nav-bar">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="nav-logo-mark">
            <span className="font-display text-lg leading-none" style={{ color: "var(--signal)" }}>C</span>
          </div>
          <span className="font-display text-xl tracking-wider text-white">CLASSIFY</span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link href="/tasks" className="nav-link">Browse Tasks</Link>
          <Link href="/dashboard" className="nav-link">Dashboard</Link>
          <Link href="/post" className="c-btn-primary ml-3 py-2 text-xs">
            Post a Task
          </Link>
        </nav>
      </div>

      <style>{`
        .nav-bar {
          border-color: var(--border);
          background: rgba(5,5,7,0.88);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .nav-logo-mark {
          position: relative;
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 8px;
          background: var(--signal-dim);
          border: 1px solid var(--signal-border);
        }
        .nav-link {
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 0.875rem;
          color: var(--text-dim);
          transition: color 0.15s, background 0.15s;
        }
        .nav-link:hover {
          color: var(--text);
          background: rgba(255,255,255,0.05);
        }
      `}</style>
    </header>
  );
}
