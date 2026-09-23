import { INTERESTS } from "@/lib/interests";

/** Seamless interest ticker (list duplicated for the -50% loop). CSS-only. */
export function InterestMarquee() {
  const items = [...INTERESTS, ...INTERESTS];
  return (
    <div className="marquee-mask overflow-hidden" aria-label="Popular interests">
      <div className="flex w-max gap-2.5 animate-marquee hover:[animation-play-state:paused]">
        {items.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            aria-hidden={i >= INTERESTS.length}
            className="whitespace-nowrap rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-sm text-slate-300"
          >
            #{tag}
          </span>
        ))}
      </div>
    </div>
  );
}
