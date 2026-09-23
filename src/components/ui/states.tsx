import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-xl bg-white/10", className)}
    />
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-slate-300" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-violet-400" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  hint,
  onRetry,
}: {
  title?: string;
  hint?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5" role="alert">
      <p className="font-medium text-red-200">{title}</p>
      {hint ? <p className="mt-1 text-sm text-slate-400">{hint}</p> : null}
      {onRetry ? (
        <button
          onClick={onRetry}
          className="mt-3 rounded-full border border-white/15 px-4 py-1.5 text-sm hover:bg-white/10"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
      <div aria-hidden className="signal-field pointer-events-none absolute inset-0 opacity-60" />
      <div aria-hidden className="relative mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/30 to-cyan-400/30 text-slate-300">
        <span className="absolute inset-0 rounded-full border border-dashed border-white/20 animate-spin-slower" />
        <span className="text-lg">✦</span>
      </div>
      <p className="relative font-medium text-white">{title}</p>
      {hint ? <p className="relative mt-1 text-sm text-slate-400">{hint}</p> : null}
    </div>
  );
}
