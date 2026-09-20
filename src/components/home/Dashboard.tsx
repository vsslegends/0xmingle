"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { useSession } from "@/hooks/useSession";
import { useProfile } from "@/hooks/useProfile";
import { shortAddress } from "@/lib/utils";

/**
 * Richer home after connect. FIND STRANGER stays the central CTA;
 * profile/community data loads progressively, never blocking chat.
 */
export function Dashboard() {
  const session = useSession();
  const { profile } = useProfile();
  if (session.status !== "signed-in") return null;
  const name = profile?.username ? `@${profile.username}` : shortAddress(session.address ?? "");

  return (
    <section aria-label="Your home" className="mt-2 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <p className="text-sm text-slate-400">Good to see you, <span className="text-white font-semibold">{name}</span></p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href="/chat"><Button>Find stranger <ArrowRight size={16} /></Button></Link>
        <Link href="/explore"><Button variant="secondary">Explore</Button></Link>
        <Link href="/communities"><Button variant="secondary">Communities</Button></Link>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Card><CardBody className="text-sm"><span className="text-xl font-bold">{profile?.conversations ?? 0}</span><span className="block text-slate-500">conversations</span></CardBody></Card>
        <Card><CardBody className="text-sm"><span className="text-xl font-bold">{profile?.peopleMet ?? 0}</span><span className="block text-slate-500">people met</span></CardBody></Card>
        <Card><CardBody className="text-sm"><span className="text-xl font-bold">{profile?.interests.length ?? 0}</span><span className="block text-slate-500">interests</span></CardBody></Card>
      </div>
    </section>
  );
}
