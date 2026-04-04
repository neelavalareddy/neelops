import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "#0F0F13",
        card: "#16161D",
        border: "rgba(255,255,255,0.08)",
        accent: "#7C6FFF",
        "accent-dim": "#4A45B5",
        wld: "#F5C842",
        verified: "#22C55E",
      },
    },
  },
  plugins: [],
};

export default config;
