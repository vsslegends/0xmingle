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

function buildConfig() {
  const projectId = getWalletConnectProjectId() || "dev-placeholder-project-id";
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
