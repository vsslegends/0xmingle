"use client";

/** Root-level failsafe for errors outside route boundaries. */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <h1 className="text-xl font-bold">Something went wrong</h1>
          <p className="mt-2 text-sm text-slate-500">
            Reload to start fresh. Nothing you typed was stored.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
