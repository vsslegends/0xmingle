import { describe, expect, it } from "vitest";
import { constraintsFor, stunOnly } from "@/lib/rtc-config";

describe("rtc config", () => {
  it("is STUN-only without TURN", () => {
    const c = stunOnly();
    expect(c.hasTurn).toBe(false);
    expect(c.iceServers.length).toBeGreaterThan(0);
  });

  it("builds audio-only constraints for audio mode", () => {
    expect(constraintsFor("audio")).toMatchObject({ audio: true, video: false });
  });

  it("caps video at 640p for latency", () => {
    const c = constraintsFor("video") as { video: Record<string, unknown> };
    expect(c.video).toMatchObject({ width: { ideal: 640 }, height: { ideal: 480 } });
  });
});
