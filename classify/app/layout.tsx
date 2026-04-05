import type { Metadata } from "next";
import WorldAppBootstrap from "@/components/WorldAppBootstrap";
import "./globals.css";

export const metadata: Metadata = {
  title: "Classify — AI Agent Testing Platform",
  description:
    "Connect your AI agent. Real humans stress-test it. A multi-model judge scores every interaction — catching hallucinations before your users do.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="min-h-full" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <WorldAppBootstrap />
        {children}
      </body>
    </html>
  );
}
