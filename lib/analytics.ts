import { DeviceCategory } from "@prisma/client";
import { UAParser } from "ua-parser-js";

const knownSources: Array<[string, string]> = [
  ["com.twitter.android", "X (Android app)"], ["com.twitter.ios", "X (iOS app)"], ["twitter.com", "X / Twitter"], ["x.com", "X / Twitter"], ["t.co", "X / Twitter"],
  ["com.facebook.katana", "Facebook (Android app)"], ["com.facebook.orca", "Messenger (Android app)"], ["facebook.com", "Facebook"], ["fb.com", "Facebook"],
  ["com.instagram.android", "Instagram (Android app)"], ["instagram.com", "Instagram"],
  ["com.linkedin.android", "LinkedIn (Android app)"], ["linkedin.com", "LinkedIn"],
  ["com.zhiliaoapp.musically", "TikTok (Android app)"], ["tiktok.com", "TikTok"],
  ["com.snapchat.android", "Snapchat (Android app)"], ["snapchat.com", "Snapchat"],
  ["com.reddit.frontpage", "Reddit (Android app)"], ["reddit.com", "Reddit"],
  ["com.google.android.googlequicksearchbox", "Google app (Android)"], ["google.", "Google"],
  ["com.google.android.youtube", "YouTube (Android app)"], ["youtube.com", "YouTube"], ["youtu.be", "YouTube"],
  ["com.whatsapp", "WhatsApp"], ["whatsapp.com", "WhatsApp"], ["wa.me", "WhatsApp"], ["bing.com", "Bing"]
];

export function classifySource(referrer?: string, utmSource?: string) {
  if (utmSource) return cleanLabel(utmSource);
  if (!referrer) return "Direct";
  try {
    return sourceLabel(new URL(referrer).hostname);
  } catch {
    return sourceLabel(referrer);
  }
}

export function sourceLabel(value?: string | null) {
  const normalized = cleanLabel(value ?? "").toLowerCase().replace(/^www\./, "");
  if (!normalized) return "Direct";
  const match = knownSources.find(([needle]) => normalized.includes(needle));
  return match?.[1] ?? cleanLabel(value ?? "");
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
