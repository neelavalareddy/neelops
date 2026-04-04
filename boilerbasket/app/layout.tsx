import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BoilerBasket — Campus Food Pickup",
  description:
    "Peer-to-peer dining pickup service for Purdue University students.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
