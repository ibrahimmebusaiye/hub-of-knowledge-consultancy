import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { ApiError, apiError, noStoreJson } from "@/lib/api";
import { db } from "@/lib/db";
import { isTrustedMutation } from "@/lib/security";
import { messageStatusSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Context) {
  try {
    await requireAdmin(request); const { id } = await context.params;
    const message = await db.contactMessage.findUnique({ where: { id }, include: { analyticsSession: { select: { source: true, countryName: true, deviceCategory: true, utmSource: true, utmMedium: true, utmCampaign: true } } } });
    if (!message) throw new ApiError(404, "Message not found.", "NOT_FOUND");
    return noStoreJson({ success: true, data: message });
  } catch (error) { return apiError(error); }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const admin = await requireAdmin(request);
    if (!isTrustedMutation(request)) throw new ApiError(403, "Request origin is not allowed.", "ORIGIN_REJECTED");
    const { id } = await context.params; const input = messageStatusSchema.parse(await request.json());
    const message = await db.contactMessage.update({ where: { id }, data: { status: input.status } });
    await db.auditLog.create({ data: { adminId: admin.id, action: "MESSAGE_STATUS_UPDATED", targetType: "ContactMessage", targetId: id, details: { status: input.status } } });
    return noStoreJson({ success: true, data: message });
  } catch (error) { return apiError(error); }
}
