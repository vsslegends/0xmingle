import { afterEach, describe, expect, it } from "vitest";
import { getAdminWallets, isAdminAddress } from "@/lib/admin";

const ADDR_A = "0x1111111111111111111111111111111111111111";
const ADDR_B = "0x2222222222222222222222222222222222222222";

describe("admin allowlist", () => {
  const prev = process.env.ADMIN_WALLETS;
  afterEach(() => {
    if (prev === undefined) delete process.env.ADMIN_WALLETS;
    else process.env.ADMIN_WALLETS = prev;
  });

  it("returns empty when unconfigured", () => {
    delete process.env.ADMIN_WALLETS;
    expect(getAdminWallets()).toEqual([]);
    expect(isAdminAddress(ADDR_A)).toBe(false);
  });

  it("parses comma-separated wallets case-insensitively", () => {
    process.env.ADMIN_WALLETS = ` ${ADDR_A.toUpperCase()} , ${ADDR_B} ,, not-an-address `;
    expect(getAdminWallets()).toEqual([ADDR_A.toLowerCase(), ADDR_B.toLowerCase()]);
    expect(isAdminAddress(ADDR_A)).toBe(true);
    expect(isAdminAddress(ADDR_A.toUpperCase())).toBe(true);
    expect(isAdminAddress("0x3333333333333333333333333333333333333333")).toBe(false);
  });

  it("rejects null/undefined/invalid input", () => {
    process.env.ADMIN_WALLETS = ADDR_A;
    expect(isAdminAddress(null)).toBe(false);
    expect(isAdminAddress(undefined)).toBe(false);
    expect(isAdminAddress("not-an-address")).toBe(false);
  });
});
