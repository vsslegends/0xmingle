"use client";

import * as React from "react";
import { useAccount } from "wagmi";

export type SessionState =
  | { status: "loading" }
  | { status: "signed-out"; address: null }
  | { status: "signed-in"; address: string };

export function useSession(): SessionState & { refresh: () => void } {
  const { address: wallet } = useAccount();
  const [serverAddress, setServerAddress] = React.useState<string | null | undefined>(undefined);

  const refresh = React.useCallback(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => r.json() as Promise<{ authenticated: boolean; address?: string }>)
      .then((j) => setServerAddress(j.authenticated && j.address ? j.address : null))
      .catch(() => setServerAddress(null));
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh, wallet]);

  if (serverAddress === undefined) return { status: "loading", refresh };
  if (serverAddress) return { status: "signed-in", address: serverAddress, refresh };
  return { status: "signed-out", address: null, refresh };
}
