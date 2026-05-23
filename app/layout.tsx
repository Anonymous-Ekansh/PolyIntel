import type { Metadata } from "next";
import { JetBrains_Mono, Syne } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/app/providers";
import NavBar from "@/components/NavBar";

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
  title: "POLYINTEL | Live Polymarket Intelligence",
  description:
    "Real-time Polymarket analytics dashboard with smart bet advisor, market scanning, and news integration. 100% free, no paid APIs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(jetbrainsMono.variable, syne.variable)}>
      <body className="min-h-screen bg-[#0a0a0f] font-mono text-[#c8c8d4] antialiased">
        <Providers>
          <NavBar />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
