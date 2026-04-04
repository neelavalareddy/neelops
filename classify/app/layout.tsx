import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Classify — Verified Human Feedback",
  description:
    "A verified human feedback marketplace where companies post AI evaluation tasks and verified humans complete them for WLD compensation.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
