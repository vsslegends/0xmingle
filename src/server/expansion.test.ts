import { describe, expect, it } from "vitest";
import { scoreReputation } from "@/server/reputation/scorer";
import { quoteTip } from "@/server/economy/fees";
import { profileInputSchema, publicView } from "@/lib/profiles";
import { checkAccess } from "@/server/communities/catalog";

describe("reputation", () => {
  it("rewards age + sessions, penalizes reports", () => {
    const good = scoreReputation({ accountAgeDays: 60, conversations: 50, reportsAgainst: 0, blocksAgainst: 0, spamFlags: 0, botProbability: 0 });
    const bad = scoreReputation({ accountAgeDays: 1, conversations: 0, reportsAgainst: 3, blocksAgainst: 5, spamFlags: 2, botProbability: 0.8 });
    expect(good.score).toBeGreaterThan(bad.score);
    expect(good.tier).toBe("established");
    expect(bad.tier).toBe("new");
  });
});

describe("fees", () => {
  it("splits recipient + platform fee authoritatively", () => {
    const q = quoteTip(10_000n);
    expect(q.amountWei).toBe(q.recipientWei + q.feeWei);
    expect(q.feeBps).toBeGreaterThanOrEqual(0);
  });
});

describe("profiles", () => {
  it("rejects bad usernames", () => {
    expect(profileInputSchema.safeParse({ username: "ab", privacy: "profile" }).success).toBe(false);
    expect(profileInputSchema.safeParse({ username: "good_name1", privacy: "profile" }).success).toBe(true);
  });
  it("hides data in anonymous mode", () => {
    const v = publicView({
      address: "0xabc", username: "u", avatar: null, bio: "hi", interests: ["ai"],
      language: null, region: null, links: [], privacy: "anonymous",
      createdAt: 0, conversations: 5, peopleMet: 4,
    });
    expect(v.username).toBeNull();
    expect(v.interests).toEqual([]);
  });
});

describe("room access", () => {
  it("opens public rooms, denies unconfigured gates", async () => {
    expect((await checkAccess("ai-builders", { address: null })).ok).toBe(true);
    expect((await checkAccess("nft-lounge", { address: "0x1" })).ok).toBe(false);
    expect((await checkAccess("nope", { address: null })).ok).toBe(false);
  });
});
