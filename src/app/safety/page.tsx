import { Card, CardBody } from "@/components/ui/card";

export const metadata = { title: "Safety — STRANGER" };

const items = [
  ["Report in one tap", "Harassment, sexual content, hate, spam, scams, impersonation, illegal content. The other person never learns who reported."],
  ["Block sticks", "Blocked wallets never match you again. Reports feed automatic restrictions for repeat abuse."],
  ["You control media", "Camera and mic start off until you enable them. Denying permissions still leaves text chat fully working."],
  ["18+ only", "This is an adult social product. Under-18 use is prohibited and blocked where detected."],
  ["What we collect", "Wallet address (as identity), matchmaking state, moderation events, and aggregated reliability metrics. Never your private keys. Never permanent chat logs."],
];

export default function SafetyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold">Safety</h1>
      <p className="mt-2 text-slate-400">
        Random chat is fun because it&apos;s unpredictable — not because it&apos;s unsafe.
        This platform is not completely anonymous and not completely risk-free. Here&apos;s what we do about it.
      </p>
      <div className="mt-6 grid gap-4">
        {items.map(([t, d]) => (
          <Card key={t}>
            <CardBody>
              <p className="font-semibold">{t}</p>
              <p className="mt-1 text-sm text-slate-400">{d}</p>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
