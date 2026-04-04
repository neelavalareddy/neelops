import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "Bebas Neue", "cursive"],
        body: ["var(--font-body)", "DM Sans", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      colors: {
        signal: "#00FF87",
        gold: "#F0B429",
        bg: "#050507",
        surface: "#0B0C15",
        card: "#0F1019",
      },
      animation: {
        "iris-spin": "iris-spin 20s linear infinite",
        "scan-pulse": "scan-pulse 3s ease-in-out infinite",
        "ticker": "ticker 30s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
