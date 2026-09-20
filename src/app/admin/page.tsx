import { Card, CardBody } from "@/components/ui/card";

export const metadata = { title: "Admin — STRANGER" };

const sections = [
  "users", "reports", "bans", "rooms", "communities",
  "creators", "tips", "payments", "moderation", "health",
];

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold">Admin</h1>
      <p className="mt-1 text-sm text-slate-500">
        Server-guarded by ADMIN_WALLETS. Chat contents are never exposed here.
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
