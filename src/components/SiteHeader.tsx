"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Ghost } from "lucide-react";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";
import { WalletButton } from "@/components/WalletButton";

const links = [
  { href: "/", label: "Home" },
  { href: "/chat", label: "Random" },
  { href: "/explore", label: "Explore" },
  { href: "/communities", label: "Communities" },
  { href: "/profile", label: "Profile" },
];

export function SiteHeader() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#090a12]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2" aria-label={`${brand.name} home`}>
          <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 text-black shadow-lg shadow-violet-900/40 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105">
            <span aria-hidden className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/30 to-transparent" />
            <Ghost size={18} strokeWidth={2.5} className="relative" />
          </span>
          <span className="text-[15px] font-bold tracking-[0.18em]">{brand.name}</span>
        </Link>
        <nav className="hidden items-center gap-1 sm:flex" aria-label="Primary">
          {links.map((l) => {
            const active = path === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative rounded-full px-4 py-2 text-sm transition-colors",
                  active ? "text-white" : "text-slate-300 hover:text-white",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full border border-white/10 bg-white/10"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative">{l.label}</span>
              </Link>
            );
          })}
        </nav>
        <WalletButton compact />
      </div>
    </header>
  );
}
