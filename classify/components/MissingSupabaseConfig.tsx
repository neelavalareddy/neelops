/**
 * Shown when Supabase URL/key are missing so the server never throws a blank error page.
 * Inline styles so the message is readable even if CSS variables fail.
 */
export default function MissingSupabaseConfig() {
  return (
    <main
      className="mx-auto max-w-xl px-5 py-16"
      style={{ color: "#F0F2FF" }}
    >
      <h1 className="font-display text-2xl tracking-wider mb-3" style={{ color: "#fff" }}>
        SUPABASE NOT CONFIGURED
      </h1>
      <p className="text-sm leading-relaxed mb-4" style={{ color: "rgba(240,242,255,0.72)" }}>
        This page needs database access. Add these to <code style={{ color: "#00FF87" }}>.env.local</code> (see{" "}
        <code style={{ color: "#00FF87" }}>.env.example</code>), then restart the dev server:
      </p>
      <ul className="text-xs font-mono space-y-2 mb-6" style={{ color: "rgba(240,242,255,0.55)" }}>
        <li>NEXT_PUBLIC_SUPABASE_URL</li>
        <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
      </ul>
      <p className="text-xs" style={{ color: "rgba(240,242,255,0.45)" }}>
        API routes that write data also need <span className="font-mono">SUPABASE_SERVICE_ROLE_KEY</span>.
      </p>
    </main>
  );
}
