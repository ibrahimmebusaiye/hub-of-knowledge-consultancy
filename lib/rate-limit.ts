import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { sha256 } from "@/lib/security";

export async function enforceRateLimit(key: string, route: string, limit: number, windowSeconds: number) {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs);
  const expiresAt = new Date(windowStart.getTime() + windowMs * 2);
  const keyHash = sha256(key);

  const bucket = await db.rateLimitBucket.upsert({
    where: { keyHash_route_windowStart: { keyHash, route, windowStart } },
    create: { keyHash, route, windowStart, expiresAt, count: 1 },
    update: { count: { increment: 1 } },
    select: { count: true }
  });

  if (bucket.count > limit) throw new ApiError(429, "Too many requests. Please wait and try again.", "RATE_LIMITED");
}
