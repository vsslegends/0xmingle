export const metadata = { title: "Community Guidelines — 0xMingle" };

const rules = [
  "Be 18+.",
  "No sexual content with minors — zero tolerance, instant ban + report.",
  "No harassment, hate, threats, or doxxing.",
  "No spam, scams, phishing, or impersonation.",
  "No illegal content, full stop.",
  "Respect Next: if they leave, let them go.",
  "No bots or automation without permission.",
];

export default function GuidelinesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold">Community guidelines</h1>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-sm text-slate-300">
        {rules.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </div>
  );
}
