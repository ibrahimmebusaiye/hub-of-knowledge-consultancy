import { NextRequest } from "next/server";
import { AdminRole } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { ApiError, apiError, noStoreJson } from "@/lib/api";
import { db } from "@/lib/db";
import { isTrustedMutation } from "@/lib/security";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, context: Context) {
  try {
    const actor = await requireAdmin(request);
    if (actor.role !== AdminRole.OWNER) throw new ApiError(403, "Owner access is required.", "FORBIDDEN");
    if (!isTrustedMutation(request)) throw new ApiError(403, "Request origin is not allowed.", "ORIGIN_REJECTED");
    const { id } = await context.params;
    if (id === actor.id) throw new ApiError(422, "You cannot delete your own owner account.", "SELF_DELETE_BLOCKED");
    const target = await db.admin.findUnique({ where: { id }, select: { id: true, name: true, email: true, role: true } });
    if (!target) throw new ApiError(404, "Administrator not found.", "NOT_FOUND");
    if (target.role === AdminRole.OWNER && await db.admin.count({ where: { role: AdminRole.OWNER, active: true } }) <= 1) throw new ApiError(422, "At least one active owner account must remain.", "LAST_OWNER_BLOCKED");
    await db.$transaction([db.auditLog.create({ data: { adminId: actor.id, action: "ADMIN_DELETED", targetType: "Admin", targetId: target.id, details: { email: target.email, role: target.role } } }), db.admin.delete({ where: { id: target.id } })]);
    return noStoreJson({ success: true, data: { id: target.id, message: `${target.name} has been deleted.` } });
  } catch (error) { return apiError(error); }
}
