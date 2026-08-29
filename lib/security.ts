import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

export const SESSION_COOKIE = "hok_admin_session";
export const SESSION_DAYS = 7;

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function createOpaqueToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function secureStringEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function requestIp(request: NextRequest): string {
  return request.headers.get("x-real-ip")
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "unknown";
}

export function requestFingerprint(request: NextRequest): string {
  return sha256(`${requestIp(request)}|${request.headers.get("user-agent") ?? "unknown"}`);
}

export function isTrustedMutation(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return process.env.NODE_ENV !== "production";

  const configured = (process.env.ALLOWED_ORIGINS ?? process.env.NEXT_PUBLIC_APP_URL ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return configured.includes(origin) || origin === request.nextUrl.origin;
}
