import { Ghost, Sparkles, Wallet, Zap } from "lucide-react";

/**
 * CSS-3D "connection orbit" hero visual: a glowing core with two orbit
 * rings carrying wallet/stranger chips, plus floating message pills.
 * Pure CSS animation (global reduced-motion guard applies), zero assets.
 */
export function OrbitScene() {
  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-[440px] select-none"
      role="img"
      aria-label="Illustration of strangers connecting around 0xMingle"
    >
      {/* Ambient orbs */}
      <div aria-hidden className="absolute -left-8 top-8 h-40 w-40 rounded-full bg-violet-600/25 blur-3xl animate-drift" />
      <div aria-hidden className="absolute -right-6 bottom-10 h-44 w-44 rounded-full bg-cyan-500/20 blur-3xl animate-drift" style={{ animationDelay: "-8s" }} />

      {/* Faint conic halo behind everything */}
      <div
        aria-hidden
        className="absolute inset-4 rounded-full opacity-30 blur-2xl animate-spin-slower"
        style={{ background: "conic-gradient(from 0deg, #8b7cf6, transparent 30%, #22d3ee 50%, transparent 70%, #8b7cf6)" }}
      />

      {/* Outer orbit ring (static border) + rotating riders */}
      <div aria-hidden className="absolute inset-0 rounded-full border border-white/10" />
      <div aria-hidden className="absolute inset-0 orbit-44">
        <div className="absolute -top-4 left-1/2 -ml-14">
          <div className="orbit-back-44">
            <span className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/15 bg-[#141524]/90 px-3 py-1.5 text-xs text-slate-200 shadow-xl">
              <Wallet size={13} className="text-cyan-300" /> 0xA42F…91D2
            </span>
          </div>
        </div>
        <div className="absolute -bottom-4 left-1/2 -ml-10">
          <div className="orbit-back-44">
            <span className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/15 bg-[#141524]/90 px-3 py-1.5 text-xs text-slate-200 shadow-xl">
              <Sparkles size={13} className="text-amber-300" /> #travel
            </span>
          </div>
        </div>
      </div>

      {/* Inner orbit ring + riders */}
      <div aria-hidden className="absolute inset-14 rounded-full border border-dashed border-white/15" />
      <div aria-hidden className="absolute inset-14 orbit-28">
        <div className="absolute -top-3.5 left-1/2 -ml-12">
          <div className="orbit-back-28">
            <span className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-3 py-1.5 text-xs font-semibold text-black shadow-lg shadow-violet-900/40">
              <Ghost size={13} strokeWidth={2.5} /> Stranger #48291
            </span>
          </div>
        </div>
        <div className="absolute -bottom-3.5 left-1/2 -ml-9">
          <div className="orbit-back-28">
            <span className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-300/30 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-200 shadow-xl">
              <Zap size={13} /> +0.01 ETH tip
            </span>
          </div>
        </div>
      </div>

      {/* Core: layered glowing sphere */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div aria-hidden className="absolute -inset-8 rounded-full bg-violet-600/30 blur-2xl animate-glow-pulse" />
        <div aria-hidden className="absolute -inset-4 rounded-full border border-white/15" />
        <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 via-fuchsia-500 to-cyan-400 shadow-2xl shadow-violet-900/50">
          <span aria-hidden className="absolute inset-0 rounded-full bg-gradient-to-b from-white/35 via-transparent to-black/25" />
          <span aria-hidden className="absolute left-4 top-3 h-5 w-8 rounded-full bg-white/40 blur-[6px]" />
          <Ghost size={44} strokeWidth={2.25} className="relative text-black" />
        </div>
      </div>

      {/* Floating message pills */}
      <div aria-hidden className="absolute left-0 top-1/4 max-w-[150px] rounded-2xl rounded-tl-md border border-white/10 bg-white/10 px-3 py-2 text-xs text-slate-200 shadow-xl backdrop-blur-sm animate-float">
        hey — any hidden gems in Lisbon?
      </div>
      <div aria-hidden className="absolute bottom-1/4 right-0 max-w-[150px] rounded-2xl rounded-tr-md bg-gradient-to-r from-violet-500 to-cyan-400 px-3 py-2 text-xs font-medium text-black shadow-xl animate-float-slow" style={{ animationDelay: "-3.5s" }}>
        strangers &gt; algorithms ✦
      </div>
    </div>
  );
}
