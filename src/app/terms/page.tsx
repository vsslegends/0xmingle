export const metadata = { title: "Terms — STRANGER" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 text-slate-300 sm:px-6">
      <h1 className="text-3xl font-bold text-white">Terms</h1>
      <div className="mt-4 space-y-3 text-sm leading-relaxed">
        <p>18+ only. No harassment, sexual content involving minors (zero tolerance), hate, spam, scams, impersonation, or illegal activity.</p>
        <p>Wallet signatures verify identity only — they never authorize transactions unless a screen explicitly says so (tipping, paid rooms).</p>
        <p>Abuse leads to rate limits, temporary blocks, or permanent bans. Reports and moderation events are stored for safety.</p>
        <p>Full legal terms ship before production launch; this page is a plain-language preview.</p>
      </div>
    </div>
  );
}
