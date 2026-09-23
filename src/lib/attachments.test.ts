import { describe, expect, it } from "vitest";
import { linkify, isAllowedMime, isAudioMime, isImageMime, formatBytes, prepareAudio } from "@/lib/attachments";

describe("attachments", () => {
  it("linkifies http(s) links, strips trailing punctuation", () => {
    const parts = linkify("see https://example.com/a, ok?");
    expect(parts).toEqual([
      { t: "text", v: "see " },
      { t: "link", v: "https://example.com/a" },
      { t: "text", v: ", ok?" },
    ]);
  });

  it("leaves plain text alone", () => {
    expect(linkify("hello world")).toEqual([{ t: "text", v: "hello world" }]);
  });

  it("allows images/pdf/txt, blocks executables and svg", () => {
    expect(isAllowedMime("image/png")).toBe(true);
    expect(isAllowedMime("application/pdf")).toBe(true);
    expect(isImageMime("image/gif")).toBe(true);
    expect(isAllowedMime("image/svg+xml")).toBe(false);
    expect(isAllowedMime("application/x-msdownload")).toBe(false);
    expect(isAllowedMime("text/html")).toBe(false);
  });

  it("formats byte sizes", () => {
    expect(formatBytes(500)).toBe("500 B");
    expect(formatBytes(2048)).toBe("2 KB");
  });

  it("packs voice notes, rejects bad mime/duration", async () => {
    expect(isAllowedMime("audio/webm")).toBe(true);
    expect(isAudioMime("audio/mp4")).toBe(true);
    const blob = new Blob(["fake-audio-bytes"], { type: "audio/webm" });
    const f = await prepareAudio(blob, 5);
    expect(f.mime).toBe("audio/webm");
    expect(f.name).toBe("voice-note.webm");
    expect(f.dataUrl.startsWith("data:audio/webm;base64,")).toBe(true);
    await expect(prepareAudio(blob, 0.2)).rejects.toThrow(/too short/i);
    await expect(prepareAudio(blob, 60)).rejects.toThrow(/30 seconds/i);
    await expect(
      prepareAudio(new Blob(["x"], { type: "video/mp4" }), 5),
    ).rejects.toThrow(/isn't supported/i);
  });
});
