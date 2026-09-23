import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";
import {
  __resetTranslateCache,
  isSameLanguage,
  translateCacheSize,
  translateText,
} from "@/lib/translate";
import { getChatLanguage, setChatLanguage } from "@/lib/language";

const GT_RESPONSE = [[["Hallo wereld", "Hello world", null, null, 1]], null, "en"];

function stubFetch(response: unknown, ok = true) {
  return vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    json: () => Promise.resolve(response),
  });
}

describe("translate", () => {
  const realFetch = globalThis.fetch;
  beforeEach(() => __resetTranslateCache());
  afterEach(() => {
    globalThis.fetch = realFetch;
    vi.restoreAllMocks();
  });

  it("parses the gtx response and caches repeats", async () => {
    const fetchMock = stubFetch(GT_RESPONSE);
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const first = await translateText("Hello world", "nl");
    expect(first).toEqual({ text: "Hallo wereld", source: "en" });
    expect(translateCacheSize()).toBe(1);
    const second = await translateText("Hello world", "nl");
    expect(second).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("tl=nl");
    expect(String(fetchMock.mock.calls[0][0])).toContain("sl=auto");
  });

  it("throws on HTTP errors and empty results", async () => {
    globalThis.fetch = stubFetch({}, false) as unknown as typeof fetch;
    await expect(translateText("hi", "nl")).rejects.toThrow();
    globalThis.fetch = stubFetch([null, null, "en"]) as unknown as typeof fetch;
    await expect(translateText("hi", "nl")).rejects.toThrow(/empty/i);
  });

  it("matches language prefixes", () => {
    expect(isSameLanguage("en", "en")).toBe(true);
    expect(isSameLanguage("en-US", "en")).toBe(true);
    expect(isSameLanguage("nl", "en")).toBe(false);
  });
});

describe("language store", () => {
  it("defaults off and round-trips explicit choices", () => {
    expect(getChatLanguage()).toBe("off");
    setChatLanguage("nl");
    expect(getChatLanguage()).toBe("nl");
    setChatLanguage("xx");
    expect(getChatLanguage()).toBe("off");
  });
});
