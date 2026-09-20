"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ghost } from "lucide-react";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";
import { WalletButton } from "@/components/WalletButton";

const links = [
  { href: "/chat", label: "Chat" },
  { href: "/safety", label: "Safety" },
  { href: "/profile", label: "Profile" },
];

export function SiteHeader() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#090a12]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2" aria-label={`${brand.name} home`}>
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 text-black">
            <Ghost size={18} strokeWidth={2.5} />
          </span>
          <span className="text-[15px] font-bold tracking-[0.18em]">{brand.name}</span>
        </Link>
        <nav className="hidden items-center gap-1 sm:flex" aria-label="Primary">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white",
                path === l.href && "bg-white/10 text-white",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <WalletButton compact />
      </div>
    </header>
  );
}
