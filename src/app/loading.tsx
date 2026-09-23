/** Route loading fallback (Suspense). */
export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6" aria-busy="true">
      <div className="h-7 w-40 animate-pulse rounded bg-slate-800" />
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="shimmer h-24 rounded-xl border border-white/5" />
        ))}
      </div>
    </div>
  );
}
