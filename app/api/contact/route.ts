import { NextRequest } from "next/server";
import { AnalyticsEventType } from "@prisma/client";
import { db } from "@/lib/db";
import { ApiError, apiError, noStoreJson } from "@/lib/api";
import { contactSchema } from "@/lib/validation";
import { enforceRateLimit } from "@/lib/rate-limit";
import { isTrustedMutation, requestFingerprint, sha256 } from "@/lib/security";
import { sendContactNotification } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    if (!isTrustedMutation(request)) throw new ApiError(403, "Request origin is not allowed.", "ORIGIN_REJECTED");
    await enforceRateLimit(requestFingerprint(request), "contact", 5, 60 * 60);
    const input = contactSchema.parse(await request.json());
    if (input.website) return noStoreJson({ success: true, data: { message: "Thank you. Your enquiry has been received." } }, { status: 201 });

    const analyticsSession = input.sessionId ? await db.analyticsSession.findUnique({ where: { sessionIdHash: sha256(input.sessionId) }, select: { id: true } }) : null;
    const created = await db.$transaction(async (transaction) => {
      const message = await transaction.contactMessage.create({ data: {
        name: input.name, organisation: input.organisation || null, email: input.email, phone: input.phone || null,
        service: input.service || null, subject: input.subject, message: input.message, analyticsSessionId: analyticsSession?.id
      } });
      if (analyticsSession) await transaction.analyticsEvent.create({ data: { sessionId: analyticsSession.id, eventType: AnalyticsEventType.CONTACT_SUBMISSION, page: "/contact.html" } });
      return message;
    });

    try {
      await sendContactNotification(created);
      await db.contactMessage.update({ where: { id: created.id }, data: { emailNotificationAt: new Date(), emailDeliveryError: null } });
    } catch (emailError) {
      console.error("Contact notification failed", emailError);
      await db.contactMessage.update({ where: { id: created.id }, data: { emailDeliveryError: emailError instanceof Error ? emailError.message.slice(0, 500) : "Unknown delivery error" } });
    }

    return noStoreJson({ success: true, data: { id: created.id, message: "Thank you. Your enquiry has been received." } }, { status: 201 });
  } catch (error) { return apiError(error); }
}
