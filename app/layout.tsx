import type { Metadata } from "next";
import { JetBrains_Mono, Syne } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/app/providers";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "POLYINTEL | Live Polymarket Research",
  description:
    "Browse live Polymarket bets and open a dedicated research page for each market.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(jetbrainsMono.variable, syne.variable)}>
      <body className="min-h-screen bg-[#0a0a0f] font-mono text-[#c8c8d4] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
