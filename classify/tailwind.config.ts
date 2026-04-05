import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      colors: {
        ink: "#080912",
        surface: "#0E1123",
        amber: "#FFD60A",
        pass: "#00D98B",
        fail: "#FF4D6D",
      },
    },
  },
  plugins: [],
};

export default config;
