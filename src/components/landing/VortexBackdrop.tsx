"use client";

import * as React from "react";

/**
 * Living hero ground: the Vortex GPU scene (public/vortex.html) floating
 * behind the landing hero. Decorative, non-interactive, skipped entirely
 * under reduced motion (the static gradient underneath remains).
 */
export function VortexBackdrop() {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[28px] border border-white/10"
    >
      {!reduced ? (
        <iframe
          title=""
          tabIndex={-1}
          scrolling="no"
          src="/vortex.html"
          className="h-full w-full border-0 opacity-80"
          loading="eager"
        />
      ) : null}
      {/* Blend the plate into the page + keep copy legible. */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#090a12]/70 via-[#090a12]/10 to-[#090a12]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_40%,transparent_30%,rgb(9_10_18/0.7)_100%)]" />
    </div>
  );
}
