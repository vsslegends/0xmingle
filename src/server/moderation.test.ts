import { beforeEach, describe, expect, it } from "vitest";
import {
  __resetModeration,
  chatLimitFor,
  getLevel,
  isConnectRestricted,
  levelForStrikes,
  recordReport,
  recordSpam,
  seedLevel,
} from "@/server/moderation";

const ADDR = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

beforeEach(() => __resetModeration());

describe("escalation ladder", () => {
  it("escalates NORMAL → SUSPICIOUS → RATE_LIMITED → TEMP_BLOCKED → BANNED", () => {
    expect(levelForStrikes(0)).toBe("NORMAL");
    expect(levelForStrikes(1)).toBe("SUSPICIOUS");
    expect(levelForStrikes(3)).toBe("RATE_LIMITED");
    expect(levelForStrikes(5)).toBe("TEMP_BLOCKED");
    expect(levelForStrikes(10)).toBe("BANNED");
  });

  it("recordReport climbs the ladder", () => {
    expect(getLevel(ADDR)).toBe("NORMAL");
    expect(recordReport(ADDR)).toBe("SUSPICIOUS");
    recordReport(ADDR);
    expect(recordReport(ADDR)).toBe("RATE_LIMITED");
    recordReport(ADDR);
    expect(recordReport(ADDR)).toBe("TEMP_BLOCKED");
    for (let i = 0; i < 5; i++) recordReport(ADDR);
    expect(getLevel(ADDR)).toBe("BANNED");
  });

  it("spam flags count as strikes", () => {
    recordSpam(ADDR);
    expect(getLevel(ADDR)).toBe("SUSPICIOUS");
  });

  it("chat limits tighten with risk", () => {
    expect(chatLimitFor("NORMAL")).toBe(10);
    expect(chatLimitFor("SUSPICIOUS")).toBe(5);
    expect(chatLimitFor("RATE_LIMITED")).toBe(0);
  });

  it("connect restriction covers bans only", () => {
    expect(isConnectRestricted("BANNED")).toBe(true);
    expect(isConnectRestricted("TEMP_BLOCKED")).toBe(true);
    expect(isConnectRestricted("RATE_LIMITED")).toBe(false);
    expect(isConnectRestricted("SUSPICIOUS")).toBe(false);
    expect(isConnectRestricted("NORMAL")).toBe(false);
  });

  it("seedLevel restores durable restrictions without clobbering live strikes", () => {
    seedLevel(ADDR, "RATE_LIMITED");
    expect(getLevel(ADDR)).toBe("RATE_LIMITED");
    recordReport(ADDR);
    recordReport(ADDR);
    // 3 seeded + 2 live = 5 → TEMP_BLOCKED, not reset to a lower level
    expect(getLevel(ADDR)).toBe("TEMP_BLOCKED");
  });
});
