import { describe, expect, it } from "vitest";
import { brand } from "@/config/brand";
import { shortAddress, strangerLabel } from "@/lib/utils";
import { INTERESTS } from "@/lib/interests";

describe("brand", () => {
  it("has a swappable name", () => {
    expect(brand.name.length).toBeGreaterThan(0);
    expect(brand.tagline.length).toBeGreaterThan(0);
  });
  it("links first-time users to an official wallet download", () => {
    expect(brand.links.getWallet.startsWith("https://")).toBe(true);
    expect(brand.links.getWalletLabel.length).toBeGreaterThan(0);
  });
});

describe("utils", () => {
  it("shortens addresses", () => {
    expect(shortAddress("0xA42F0000000000000000000000000000000091D2")).toBe(
      "0xA42F…91D2",
    );
  });
  it("formats stranger labels", () => {
    expect(strangerLabel(48291)).toBe("Stranger #48291");
  });
});

describe("interests", () => {
  it("includes the required set", () => {
    for (const i of ["technology", "gaming", "crypto", "random"]) {
      expect(INTERESTS).toContain(i);
    }
  });
});
