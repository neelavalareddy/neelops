import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const dm = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Classify — Agent testing & human feedback",
  description:
    "Companies list agents with objectives; testers chat under World ID. Classify evaluates messages for relevance, rules, and AI cheating — pay WLD when the gate passes. Plus classic rating tasks for feedback.",
};

const shell = {
  backgroundColor: "#050507",
  color: "#F0F2FF",
  minHeight: "100%",
} as const;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`min-h-full bg-[#050507] ${bebas.variable} ${dm.variable} ${mono.variable}`}
      style={shell}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-[#050507] text-[#F0F2FF] antialiased" style={shell}>
        {children}
      </body>
    </html>
  );
}
