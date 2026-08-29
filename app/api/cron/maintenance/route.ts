import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiError, noStoreJson, ApiError } from "@/lib/api";
import { secureStringEqual } from "@/lib/security";
import { sendContactNotification } from "@/lib/email";

export async function GET(request: NextRequest) {
  try {
    const expected = process.env.CRON_SECRET; const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!expected || !provided || !secureStringEqual(provided, expected)) throw new ApiError(401, "Invalid cron authorization.", "UNAUTHENTICATED");
    const now = new Date();
    const [sessions, buckets] = await db.$transaction([
      db.adminSession.deleteMany({ where: { expiresAt: { lt: now } } }),
      db.rateLimitBucket.deleteMany({ where: { expiresAt: { lt: now } } })
    ]);
    const pending = await db.contactMessage.findMany({ where: { emailNotificationAt: null, emailDeliveryError: { not: null } }, orderBy: { createdAt: "asc" }, take: 25 });
    let delivered = 0;
    for (const message of pending) {
      try { await sendContactNotification(message); await db.contactMessage.update({ where: { id: message.id }, data: { emailNotificationAt: new Date(), emailDeliveryError: null } }); delivered += 1; }
      catch (error) { await db.contactMessage.update({ where: { id: message.id }, data: { emailDeliveryError: error instanceof Error ? error.message.slice(0, 500) : "Unknown delivery error" } }); }
    }
    return noStoreJson({ success: true, data: { expiredSessionsRemoved: sessions.count, expiredRateLimitsRemoved: buckets.count, notificationsDelivered: delivered } });
  } catch (error) { return apiError(error); }
}
