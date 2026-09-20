import Link from "next/link";
import { brand } from "@/config/brand";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/5">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          <span className="font-semibold tracking-widest text-slate-200">{brand.name}</span>
          {" · "}
          {brand.footerNote}
        </p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Footer">
          <Link href="/safety" className="hover:text-white">Safety</Link>
          <Link href="/terms" className="hover:text-white">Terms</Link>
          <Link href="/privacy" className="hover:text-white">Privacy</Link>
          <Link href="/community-guidelines" className="hover:text-white">Guidelines</Link>
        </nav>
      </div>
    </footer>
  );
}
