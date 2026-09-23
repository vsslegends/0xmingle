"use client";

import * as React from "react";
import { useDisconnect } from "wagmi";
import { LogOut, Ghost } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrustBadge } from "@/components/profile/TrustBadge";
import { useProfile } from "@/hooks/useProfile";
import { useSession } from "@/hooks/useSession";
import { INTERESTS, type IdentityMode } from "@/lib/interests";
import { shortAddress } from "@/lib/utils";

export default function ProfilePage() {
  const session = useSession();
  const { disconnectAsync } = useDisconnect();
  const [leaving, setLeaving] = React.useState(false);
  const { profile, loading, saving, save } = useProfile();
  const [form, setForm] = React.useState({
    username: "",
    avatar: "",
    bio: "",
    interests: [] as string[],
    language: "",
    region: "",
    privacy: "anonymous" as IdentityMode,
  });

  React.useEffect(() => {
    if (profile) {
      setForm({
        username: profile.username ?? "",
        avatar: profile.avatar ?? "",
        bio: profile.bio ?? "",
        interests: profile.interests ?? [],
        language: profile.language ?? "",
        region: profile.region ?? "",
        privacy: profile.privacy,
      });
    }
  }, [profile]);

  if (session.status !== "signed-in") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold">Profile</h1>
        <Card className="mt-4"><CardBody className="text-sm text-slate-400">Connect your wallet to create your persistent identity. Login is a signature — never a transaction.</CardBody></Card>
      </div>
    );
  }

  const toggleInterest = (tag: string) => {
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(tag) ? f.interests.filter((t) => t !== tag) : [...f.interests, tag].slice(0, 11),
    }));
  };

  const logout = async () => {
    setLeaving(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* cookie clear is best-effort; wallet disconnect still applies */
    }
    try {
      await disconnectAsync();
    } catch {
      /* already disconnected */
    } finally {
      session.refresh();
      setLeaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-4">
        <span className="relative shrink-0" aria-hidden>
          <span className="absolute -inset-1 rounded-2xl border border-dashed border-cyan-300/30 animate-spin-slower" />
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400 via-fuchsia-500 to-cyan-400 text-black shadow-xl shadow-violet-900/40">
            <span aria-hidden className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/30 to-transparent" />
            <Ghost size={26} strokeWidth={2.25} className="relative" />
          </span>
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold">
            {form.username ? <><span className="text-gradient">@{form.username}</span></> : shortAddress(session.address ?? "")}
          </h1>
          <p className="mt-0.5 font-mono2 text-xs text-slate-500">{shortAddress(session.address ?? "")} · {profile ? `${profile.conversations} conversations · ${profile.peopleMet} people met` : loading ? "Loading…" : "New here — say hi to a stranger."}</p>
        </div>
        <span className="ml-auto flex items-center gap-2">
          <TrustBadge tier="new" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void logout()}
            disabled={leaving}
            data-testid="disconnect-button"
            title="Sign out and disconnect your wallet"
          >
            <LogOut size={16} />
            {leaving ? "Leaving…" : "Disconnect"}
          </Button>
        </span>
      </div>

      <Card className="mt-4">
        <CardBody className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">Username
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="satoshi_fan" maxLength={20} />
            </label>
            <label className="text-sm">Avatar URL
              <Input value={form.avatar} onChange={(e) => setForm({ ...form, avatar: e.target.value })} placeholder="https://…" />
            </label>
          </div>
          <label className="block text-sm">Bio
            <Input value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Builder, gamer, night owl." maxLength={160} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">Language
              <Input value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} placeholder="English" maxLength={24} />
            </label>
            <label className="text-sm">Region (optional)
              <Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="Lisbon" maxLength={48} />
            </label>
          </div>
          <fieldset>
            <legend className="text-sm text-slate-300">Interests</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {INTERESTS.filter((t) => t !== "random").map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleInterest(tag)}
                  aria-pressed={form.interests.includes(tag)}
                  className={`rounded-full border px-3 py-1 text-xs ${form.interests.includes(tag) ? "border-violet-400 bg-violet-500/20 text-white" : "border-white/10 text-slate-400"}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-sm text-slate-300">Who sees your profile?</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {(["anonymous", "wallet", "profile"] as const).map((m) => (
                <label key={m} className={`cursor-pointer rounded-xl border p-3 text-xs ${form.privacy === m ? "border-violet-400 bg-violet-500/10" : "border-white/10"}`}>
                  <input type="radio" name="privacy" className="sr-only" checked={form.privacy === m} onChange={() => setForm({ ...form, privacy: m })} />
                  <span className="font-semibold capitalize">{m}</span>
                  <span className="mt-1 block text-slate-400">
                    {m === "anonymous" ? "Stranger #82931" : m === "wallet" ? "0xA72F…91C2" : "@username + bio"}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <Button
            disabled={saving}
            onClick={() => void save({
              username: form.username || null,
              avatar: form.avatar || null,
              bio: form.bio || null,
              interests: form.interests,
              language: form.language || null,
              region: form.region || null,
              links: [],
              privacy: form.privacy,
            })}
          >
            {saving ? "Saving…" : "Save profile"}
          </Button>
          <p className="text-xs text-slate-500">Strangers never see your transaction history or moderation data. Chat stays ephemeral.</p>
        </CardBody>
      </Card>
    </div>
  );
}
