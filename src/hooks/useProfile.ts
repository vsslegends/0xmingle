"use client";

import * as React from "react";
import type { UserProfile, ProfileInput } from "@/lib/profiles";

export function useProfile() {
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/profile", { cache: "no-store" });
      if (r.status === 401) { setProfile(null); return; }
      if (!r.ok) throw new Error("Failed to load profile");
      const j = (await r.json()) as { profile: UserProfile | null };
      setProfile(j.profile);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void refresh(); }, [refresh]);

  const save = React.useCallback(async (input: ProfileInput) => {
    setSaving(true);
    setError(null);
    try {
      const r = await fetch("/api/profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!r.ok) throw new Error("Save failed");
      const j = (await r.json()) as { profile: UserProfile };
      setProfile(j.profile);
      return j.profile;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
      return null;
    } finally {
      setSaving(false);
    }
  }, []);

  return { profile, loading, saving, error, refresh, save };
}
