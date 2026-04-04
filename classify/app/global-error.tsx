"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ background: "#050507", color: "#F0F2FF", minHeight: "100vh", margin: 0, fontFamily: "system-ui, sans-serif", padding: 24 }}>
        <h1 style={{ fontSize: 24, marginBottom: 12 }}>Classify — error</h1>
        <p style={{ opacity: 0.8, marginBottom: 20 }}>{error.message || "Root layout failed."}</p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            background: "#00FF87",
            color: "#050507",
            border: "none",
            padding: "10px 18px",
            borderRadius: 10,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
