/**
 * Layout for unauthenticated routes: /login, /signup.
 * Minimal wrapper — no NavBar, just the dark background.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-boiler-black">{children}</div>;
}
