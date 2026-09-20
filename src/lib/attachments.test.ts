import { describe, expect, it } from "vitest";
import { linkify, isAllowedMime, isImageMime, formatBytes } from "@/lib/attachments";

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
});
