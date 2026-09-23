"use client";

import { useEffect } from "react";

/** Route-level error boundary: replaces the blank page on WS/API throws. */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Intentionally not logging chat state — error digest only.
    console.error("[app-error]", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-sm text-slate-500">
        Your conversation was not saved anywhere — reload to start fresh.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
      >
        Try again
      </button>
    </div>
  );
}
