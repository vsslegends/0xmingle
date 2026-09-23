import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "violet" | "cyan" | "emerald" | "amber" | "rose";

const tones: Record<Tone, { tile: string; glow: string }> = {
  violet: {
    tile: "from-violet-400 via-violet-500 to-purple-800",
    glow: "shadow-violet-500/40",
  },
  cyan: {
    tile: "from-cyan-300 via-cyan-400 to-blue-700",
    glow: "shadow-cyan-500/40",
  },
  emerald: {
    tile: "from-emerald-300 via-emerald-400 to-teal-700",
    glow: "shadow-emerald-500/40",
  },
  amber: {
    tile: "from-amber-300 via-amber-400 to-orange-700",
    glow: "shadow-amber-500/40",
  },
  rose: {
    tile: "from-rose-400 via-rose-500 to-pink-800",
    glow: "shadow-rose-500/40",
  },
};

/**
 * Glossy 3D-style icon tile: gradient body + top highlight + soft colored
 * shadow reads as depth without any image assets. Pure CSS, no motion.
 */
export function Icon3D({
  icon: Icon,
  tone = "violet",
  size = 20,
  className,
  tileClassName,
}: {
  icon: LucideIcon;
  tone?: Tone;
  size?: number;
  className?: string;
  tileClassName?: string;
}) {
  const t = tones[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-2xl bg-gradient-to-br text-black shadow-lg transition-transform duration-300",
        t.tile,
        t.glow,
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex items-center justify-center rounded-2xl bg-gradient-to-b from-white/30 to-transparent p-2",
          tileClassName,
        )}
      >
        <Icon size={size} strokeWidth={2.5} />
      </span>
    </span>
  );
}
