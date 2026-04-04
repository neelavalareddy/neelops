import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Purdue brand colors
        gold: {
          DEFAULT: "#CFB991",
          dark: "#8E6F3E",
          light: "#EBD99F",
        },
        boiler: {
          black: "#1A1A1A",
          dark: "#2D2D2D",
        },
      },
    },
  },
  plugins: [],
};

export default config;
