export const metadata = { title: "Privacy — 0xMingle" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 text-slate-300 sm:px-6">
      <h1 className="text-3xl font-bold text-white">Privacy</h1>
      <div className="mt-4 space-y-3 text-sm leading-relaxed">
        <p>We store: your wallet address, session nonces, matchmaking state, blocks/reports, and aggregate reliability metrics.</p>
        <p>We do not permanently store chat messages, audio, or video. Temporary relay buffers auto-expire.</p>
        <p>Media is peer-to-peer via WebRTC; signaling passes through our servers only to establish the connection.</p>
        <p>We never ask for private keys or seed phrases. Anyone who does is scamming you.</p>
      </div>
    </div>
  );
}
