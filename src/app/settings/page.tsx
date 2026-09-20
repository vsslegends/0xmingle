"use client";

import * as React from "react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import type { IdentityMode } from "@/lib/interests";

export default function SettingsPage() {
  const { profile, save, saving } = useProfile();
  const [privacy, setPrivacy] = React.useState<IdentityMode>("anonymous");
  React.useEffect(() => { if (profile) setPrivacy(profile.privacy); }, [profile]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <Card className="mt-4">
        <CardBody className="space-y-4 text-sm text-slate-300">
          <div>
            <p className="font-semibold text-white">Privacy mode</p>
            <p className="text-xs text-slate-500">Switch how strangers see you. Applies instantly to new matches.</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {(["anonymous", "wallet", "profile"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setPrivacy(m)}
                  aria-pressed={privacy === m}
                  className={`rounded-xl border p-3 text-left text-xs capitalize ${privacy === m ? "border-violet-400 bg-violet-500/10 text-white" : "border-white/10"}`}
                >
                  {m}
                </button>
              ))}
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="mt-3"
              disabled={saving || !profile}
              onClick={() => profile && void save({
                username: profile.username, avatar: profile.avatar, bio: profile.bio,
                interests: profile.interests, language: profile.language, region: profile.region,
                links: profile.links, privacy,
              })}
            >
              {saving ? "Saving…" : "Apply"}
            </Button>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked className="accent-violet-500" />
            Respect reduced-motion system setting (always on)
          </label>
        </CardBody>
      </Card>
    </div>
  );
}
