/**
 * Server-side admin allowlist. ADMIN_WALLETS is a comma-separated list of
 * EVM addresses, server-only (never NEXT_PUBLIC_). Empty = no admins.
 */
const ADDRESS_RE = /^0x[0-9a-f]{40}$/;

export function getAdminWallets(): string[] {
  const raw = process.env.ADMIN_WALLETS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => ADDRESS_RE.test(s));
}

export function isAdminAddress(address: string | null | undefined): boolean {
  if (!address) return false;
  const normalized = address.toLowerCase();
  if (!ADDRESS_RE.test(normalized)) return false;
  return getAdminWallets().includes(normalized);
}
