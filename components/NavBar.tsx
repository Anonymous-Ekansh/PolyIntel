"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Eye, Home, TerminalSquare, Zap, Brain } from "lucide-react";
import { useWatchlist } from "@/hooks/useWatchlist";
import { cn } from "@/lib/utils";

export default function NavBar() {
  const pathname = usePathname();
  const { count } = useWatchlist();

  const links = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/markets", label: "Markets", icon: BarChart3 },
    { href: "/analyze", label: "Analyze", icon: Brain },
    { href: "/intelligence", label: "Intel", icon: Zap },
    { href: "/watchlist", label: "Watchlist", icon: Eye, badge: count },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-[#1e1e3a] bg-[#0a0a0f]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1680px] items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex size-9 items-center justify-center rounded-xl border border-[#1e1e3a] bg-[#0d111c] shadow-[0_0_20px_rgba(0,255,136,0.12)] group-hover:shadow-[0_0_30px_rgba(0,255,136,0.2)] transition-shadow">
            <TerminalSquare className="size-5 text-[#00ff88]" />
          </div>
          <span className="font-heading text-lg uppercase tracking-[0.24em] text-white hidden sm:block">
            POLYINTEL
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative flex items-center gap-2 rounded-xl px-3 py-2 text-xs uppercase tracking-[0.18em] transition-all",
                  isActive
                    ? "bg-[#131b2b] text-[#00ff88] border border-[#00ff88]/20"
                    : "text-[#8b93a7] hover:bg-[#0f1421] hover:text-white border border-transparent"
                )}
              >
                <link.icon className="size-4" />
                <span className="hidden sm:block">{link.label}</span>
                {link.badge !== undefined && link.badge > 0 && (
                  <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[#00ff88] text-[10px] font-bold text-[#0a0a0f]">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
