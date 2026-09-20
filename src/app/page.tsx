import Link from "next/link";
import { ArrowRight, Fingerprint, Ghost, MessageCircle, Shield, Sparkles, Video, Wallet } from "lucide-react";
import { brand } from "@/config/brand";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WalletButton } from "@/components/WalletButton";
import { HeroVisual } from "@/components/landing/HeroVisual";

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      {/* HERO */}
      <section className="grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-2">
        <div>
          <Badge className="mb-5">Wallet-native · No followers needed</Badge>
          <h1 className="text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            {brand.tagline}
          </h1>
          <p className="mt-5 max-w-md text-lg text-slate-400">
            One wallet. One stranger. One conversation. Connect, get matched,
            and talk — text, audio, or video.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <WalletButton />
            <Link href="/chat">
              <Button variant="secondary" size="md">
                {brand.ctaSecondary}
                <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Basic chat is free. Connecting a wallet only verifies it&apos;s yours — no transaction, no jargon.
          </p>
        </div>
        <HeroVisual />
      </section>

      {/* HOW IT WORKS */}
      <section className="py-10" aria-label="How it works">
        <h2 className="text-2xl font-bold sm:text-3xl">Meet someone random.</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Wallet, t: "Connect", d: "Link your wallet. One signature proves it's yours — that's the whole login." },
            { icon: Sparkles, t: "Get matched", d: "Pick text, audio, or video. Add interests if you like. Meet in seconds." },
            { icon: MessageCircle, t: "Talk, then Next", d: "Chat freely. Tip if it was great. Press Next for someone new." },
          ].map((s) => (
            <Card key={s.t}>
              <CardBody>
                <s.icon size={20} className="text-cyan-300" />
                <p className="mt-3 font-semibold">{s.t}</p>
                <p className="mt-1 text-sm text-slate-400">{s.d}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* MODES */}
      <section className="py-10" aria-label="Modes">
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardBody>
              <Ghost size={20} className="text-violet-300" />
              <p className="mt-3 font-semibold">Anonymous mode</p>
              <p className="mt-1 text-sm text-slate-400">
                Appear as “Stranger #48291”. Your address stays hidden from the other person.
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Fingerprint size={20} className="text-violet-300" />
              <p className="mt-3 font-semibold">Wallet mode</p>
              <p className="mt-1 text-sm text-slate-400">
                Show a shortened address like 0xA42F…91D2. Optional username and avatar later.
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Video size={20} className="text-violet-300" />
              <p className="mt-3 font-semibold">Video + audio</p>
              <p className="mt-1 text-sm text-slate-400">
                Peer-to-peer, low-latency media. Camera and mic are always in your control.
              </p>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* SAFETY */}
      <section className="py-10" aria-label="Safety">
        <Card>
          <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Shield size={24} className="shrink-0 text-emerald-300" />
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
      </section>

      {/* WEB3 QUIETLY */}
      <section className="py-10 pb-16" aria-label="Web3 features">
        <h2 className="text-2xl font-bold sm:text-3xl">Ownership, quietly underneath.</h2>
        <p className="mt-2 max-w-xl text-slate-400">
          Your wallet unlocks reputation, tips, and gated rooms — only when you want them.
          Conversations themselves stay off-chain and private.
        </p>
        <div className="mt-6">
          <Link href="/chat">
            <Button size="lg">
              Find a stranger
              <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
