import Link from "next/link";

/** 404 fallback. */
export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-xl font-bold">Page not found</h1>
      <p className="mt-2 text-sm text-slate-500">
        That stranger wandered off. Head back home to meet a new one.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
      >
        Go home
      </Link>
    </div>
  );
}
