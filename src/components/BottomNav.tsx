"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Home, Shuffle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMatchmaking } from "@/hooks/useMatchmaking";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/chat", label: "Random", icon: Shuffle },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/profile", label: "Profile", icon: User },
];

/** Mobile bottom navigation. Desktop uses SiteHeader. */
export function BottomNav() {
  const path = usePathname();
  const { state } = useMatchmaking();
  const live = state.kind === "connected";
  return (
    <nav
      aria-label="Mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#090a12]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden"
    >
      <div className="grid grid-cols-4">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            aria-current={path === it.href ? "page" : undefined}
            className={cn(
              "relative flex flex-col items-center gap-1 py-2.5 text-[11px] text-slate-400",
              path === it.href && "text-white",
            )}
          >
            <span className="relative">
              <it.icon size={20} />
              {live && it.href === "/chat" ? (
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#090a12] bg-emerald-400" aria-label="Live chat" role="img" />
              ) : null}
            </span>
            {it.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
