import { cookies } from "next/headers";
import { Card, CardBody } from "@/components/ui/card";
import { SESSION_COOKIE, readSessionToken } from "@/server/auth";
import { isAdminAddress } from "@/lib/admin";

export const metadata = { title: "Admin — 0xMingle" };

const sections = [
  "users", "reports", "bans", "rooms", "communities",
  "creators", "tips", "payments", "moderation", "health",
];

export default async function AdminPage() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = await readSessionToken(token);
  if (!session || !isAdminAddress(session.address)) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold">Admin</h1>
        <Card>
          <CardBody className="text-sm">
            <p className="font-semibold">Restricted</p>
            <p className="mt-1 text-slate-500">
              Connect an admin wallet and sign in to view this area.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold">Admin</h1>
      <p className="mt-1 text-sm text-slate-500">
        Guarded by ADMIN_WALLETS. Chat contents are never exposed here.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {sections.map((s) => (
          <Card key={s}>
            <CardBody className="text-sm">
              <p className="font-semibold capitalize">/admin/{s}</p>
              <p className="mt-1 text-slate-500">
                {s === "tips" || s === "payments"
                  ? "Payment events review (amounts, fee split, status)."
                  : s === "rooms" || s === "communities"
                    ? "Disable rooms, remove members, review gates."
                    : s === "health"
                      ? "Matchmaking latency, WS sessions, error rates."
                      : "Review queue, bans, and moderation events."}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
