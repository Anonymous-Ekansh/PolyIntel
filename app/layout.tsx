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
  title: "POLYINTEL | Polymarket Intelligence Dashboard",
  description:
    "Browser-only Polymarket intelligence terminal with EV scanning, live market mapping, matched news, whale flow, paper trading, and risk controls.",
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
