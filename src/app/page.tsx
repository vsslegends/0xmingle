import Link from "next/link";
import { ArrowRight, Fingerprint, Ghost, MessageCircle, Shield, Sparkles, Video, Wallet, Gift, Users, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Icon3D } from "@/components/ui/icon-3d";
import { Reveal } from "@/components/ui/reveal";
import { HeroCopy } from "@/components/landing/HeroCopy";
import { HeroVisual } from "@/components/landing/HeroVisual";
import { OrbitScene } from "@/components/landing/OrbitScene";
import { InterestMarquee } from "@/components/landing/InterestMarquee";
import { VortexBackdrop } from "@/components/landing/VortexBackdrop";

const steps = [
  { icon: Wallet, tone: "violet", t: "Connect", d: "Link your wallet. One signature proves it's yours — that's the whole login." },
  { icon: Sparkles, tone: "cyan", t: "Get matched", d: "Pick text, audio, or video. Add interests if you like. Meet in seconds." },
  { icon: MessageCircle, tone: "emerald", t: "Talk, then Next", d: "Chat freely. Tip if it was great. Press Next for someone new." },
] as const;

const modes = [
  { icon: Ghost, tone: "violet", t: "Anonymous mode", d: "Appear as “Stranger #48291”. Your address stays hidden from the other person." },
  { icon: Fingerprint, tone: "cyan", t: "Wallet mode", d: "Show a shortened address like 0xA42F…91D2. Optional username and avatar later." },
  { icon: Video, tone: "emerald", t: "Video + audio", d: "Peer-to-peer, low-latency media. Camera and mic are always in your control." },
] as const;

const web3perks = [
  { icon: Users, tone: "amber", t: "Communities", d: "Find your rooms — gated by wallet, token, or just vibes." },
  { icon: Gift, tone: "rose", t: "Tips", d: "Send ETH to great strangers. Platform fee routed on-chain." },
  { icon: Lock, tone: "cyan", t: "Private by default", d: "Conversations stay off-chain and ephemeral. Always." },
] as const;

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      {/* HERO — Vortex scene is the living ground; copy floats above. */}
      <section className="relative isolate grid items-center gap-10 px-2 py-14 sm:px-6 sm:py-20 lg:grid-cols-2">
        <VortexBackdrop />
        <HeroCopy />
        <HeroVisual />
      </section>

      {/* INTEREST TICKER */}
      <section className="pb-6" aria-label="Interests">
        <InterestMarquee />
      </section>

      {/* HOW IT WORKS */}
      <section className="py-10" aria-label="How it works">
        <Reveal>
          <h2 className="text-2xl font-bold sm:text-3xl">Meet someone <span className="text-gradient">random</span>.</h2>
        </Reveal>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.t} delay={i * 0.08}>
              <Card className="card-lift h-full">
                <CardBody>
                  <Icon3D icon={s.icon} tone={s.tone} />
                  <p className="mt-4 font-semibold">{s.t}</p>
                  <p className="mt-1 text-sm text-slate-400">{s.d}</p>
                </CardBody>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* MODES */}
      <section className="py-10" aria-label="Modes">
        <div className="grid gap-4 lg:grid-cols-3">
          {modes.map((m, i) => (
            <Reveal key={m.t} delay={i * 0.08}>
              <Card className="card-lift h-full">
                <CardBody>
                  <Icon3D icon={m.icon} tone={m.tone} />
                  <p className="mt-4 font-semibold">{m.t}</p>
                  <p className="mt-1 text-sm text-slate-400">{m.d}</p>
                </CardBody>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* SAFETY */}
      <section className="py-10" aria-label="Safety">
        <Reveal>
          <Card className="overflow-hidden">
            <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Icon3D icon={Shield} tone="emerald" size={24} className="shrink-0" />
              <div>
                <p className="font-semibold">Safety is built in, not bolted on.</p>
                <p className="mt-1 text-sm text-slate-400">
                  Report, block, and Next are one tap away. Abuse triggers automatic restrictions.
                  Must be 18+ — see <Link href="/safety" className="underline">Safety</Link>,{" "}
                  <Link href="/terms" className="underline">Terms</Link>, and{" "}
                  <Link href="/community-guidelines" className="underline">Guidelines</Link>.
                </p>
              </div>
            </CardBody>
          </Card>
        </Reveal>
      </section>

      {/* WEB3 QUIETLY */}
      <section className="grid items-center gap-10 py-10 pb-16" aria-label="Web3 features">
        <div>
          <Reveal>
            <h2 className="text-2xl font-bold sm:text-3xl">Connect beyond your <span className="text-gradient">social graph</span>.</h2>
            <p className="mt-2 max-w-xl text-slate-400">
              Meet someone you&apos;ve never met. Your wallet quietly unlocks identity,
              communities, creator rooms, and tips — only when you want them.
              Conversations themselves stay off-chain and private.
            </p>
          </Reveal>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {web3perks.map((w, i) => (
              <Reveal key={w.t} delay={i * 0.08}>
                <Card className="card-lift h-full">
                  <CardBody>
                    <Icon3D icon={w.icon} tone={w.tone} size={18} />
                    <p className="mt-3 text-sm font-semibold">{w.t}</p>
                    <p className="mt-1 text-sm text-slate-400">{w.d}</p>
                  </CardBody>
                </Card>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.1}>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/chat">
                <Button size="lg">
                  Find a stranger
                  <ArrowRight size={16} />
                </Button>
              </Link>
              <Link href="/explore">
                <Button size="lg" variant="secondary">Explore communities</Button>
              </Link>
            </div>
          </Reveal>
        </div>
        <Reveal className="mx-auto w-full max-w-md">
          <OrbitScene />
        </Reveal>
      </section>
    </div>
  );
}
