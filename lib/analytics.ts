import { DeviceCategory } from "@prisma/client";
import { UAParser } from "ua-parser-js";

const knownSources: Array<[string, string]> = [
  ["facebook.com", "Facebook"], ["fb.com", "Facebook"], ["instagram.com", "Instagram"],
  ["linkedin.com", "LinkedIn"], ["google.", "Google"], ["youtube.com", "YouTube"],
  ["youtu.be", "YouTube"], ["t.co", "X / Twitter"], ["twitter.com", "X / Twitter"],
  ["whatsapp.com", "WhatsApp"], ["wa.me", "WhatsApp"], ["bing.com", "Bing"]
];

export function classifySource(referrer?: string, utmSource?: string) {
  if (utmSource) return cleanLabel(utmSource);
  if (!referrer) return "Direct";
  try {
    const hostname = new URL(referrer).hostname.toLowerCase().replace(/^www\./, "");
    const match = knownSources.find(([needle]) => hostname.includes(needle));
    return match?.[1] ?? hostname;
  } catch {
    return "Direct";
  }
}

export function referrerDomain(referrer?: string) {
  if (!referrer) return null;
  try { return new URL(referrer).hostname.toLowerCase().replace(/^www\./, "").slice(0, 255); }
  catch { return null; }
}

export function parseDevice(userAgent: string | null) {
  const result = UAParser(userAgent ?? "");
  const rawType = result.device.type;
  const deviceCategory = rawType === "mobile" ? DeviceCategory.MOBILE
    : rawType === "tablet" ? DeviceCategory.TABLET
    : rawType ? DeviceCategory.UNKNOWN : DeviceCategory.DESKTOP;
  return {
    deviceCategory,
    browser: cleanLabel(result.browser.name ?? "Unknown").slice(0, 80),
    operatingSystem: cleanLabel(result.os.name ?? "Unknown").slice(0, 80)
  };
}

export function countryDetails(code?: string | null) {
  const normalized = code?.toUpperCase().slice(0, 2);
  if (!normalized || normalized === "XX") return { countryCode: null, countryName: "Unknown" };
  try {
    return { countryCode: normalized, countryName: new Intl.DisplayNames(["en"], { type: "region" }).of(normalized) ?? normalized };
  } catch {
    return { countryCode: normalized, countryName: normalized };
  }
}

function cleanLabel(value: string) {
  return value.replace(/[<>]/g, "").trim();
}
