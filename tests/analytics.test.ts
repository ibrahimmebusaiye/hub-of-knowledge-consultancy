import { describe, expect, it } from "vitest";
import { classifySource, countryDetails, referrerDomain, sourceLabel } from "../lib/analytics";

describe("analytics attribution", () => {
  it("prefers explicit UTM sources", () => expect(classifySource("https://google.com", "facebook")).toBe("facebook"));
  it("classifies known referrers", () => expect(classifySource("https://www.linkedin.com/feed/")).toBe("LinkedIn"));
  it("uses an understandable label for mobile app referrers", () => expect(classifySource("android-app://com.twitter.android/https/x.com/home")).toBe("X (Android app)"));
  it("normalizes older app-style labels in reports", () => expect(sourceLabel("com.twitter.android")).toBe("X (Android app)"));
  it("returns direct for missing referrers", () => expect(classifySource()).toBe("Direct"));
  it("extracts a safe referrer domain", () => expect(referrerDomain("https://www.example.com/path?q=1")).toBe("example.com"));
  it("converts country codes without retaining an IP", () => expect(countryDetails("SL")).toEqual({ countryCode: "SL", countryName: "Sierra Leone" }));
});
