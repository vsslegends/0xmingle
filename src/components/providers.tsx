"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { http } from "viem";
import { brand } from "@/config/brand";
import { getActiveChain, getWalletConnectProjectId } from "@/lib/chain";

const queryClient = new QueryClient();

/** True when a real Reown/WalletConnect project ID is configured. */
export function isWalletConnectConfigured(): boolean {
  return getWalletConnectProjectId().trim().length > 0;
}

function buildConfig() {
  // WalletConnect is unusable without a project ID from https://cloud.reown.com.
  // Never silently ship one: log loudly so a broken QR is diagnosable in seconds.
  const projectId = getWalletConnectProjectId().trim() || "dev-placeholder-project-id";
  if (!isWalletConnectConfigured()) {
    console.error(
      "[wallets] NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set — " +
        "WalletConnect QR/scan will fail. Get a free ID at https://cloud.reown.com " +
        "and set it in .env.local (and Vercel env vars). Injected wallets still work.",
    );
  }
  const active = getActiveChain();
  const chains = [active] as unknown as [typeof active, ...typeof active[]];
  return getDefaultConfig({
    appName: brand.name,
    projectId,
    chains,
    transports: { [active.id]: http() },
    ssr: true,
  });
}

const wagmiConfig = buildConfig();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider modalSize="compact">{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
