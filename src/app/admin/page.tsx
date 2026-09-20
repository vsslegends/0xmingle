import { Card, CardBody } from "@/components/ui/card";

export const metadata = { title: "Admin — STRANGER" };

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold">Admin</h1>
      <Card className="mt-4">
        <CardBody className="text-sm text-slate-300">
          <p>Internal dashboard (Users · Reports · Bans · Sessions · System) ships in Phase 8.</p>
          <p className="mt-1 text-slate-500">Routes are server-guarded by ADMIN_WALLETS. No public admin APIs.</p>
          <nav className="mt-3 flex flex-wrap gap-3 text-cyan-300">
            {["users", "reports", "bans", "sessions", "system"].map((s) => (
              <span key={s} className="rounded-full border border-white/10 px-3 py-1 text-xs">/admin/{s} — soon</span>
            ))}
          </nav>
        </CardBody>
      </Card>
    </div>
  );
}
