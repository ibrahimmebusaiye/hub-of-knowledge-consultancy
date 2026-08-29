import argon2 from "argon2";
import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { ApiError, apiError, noStoreJson } from "@/lib/api";
import { db } from "@/lib/db";
import { isTrustedMutation } from "@/lib/security";
import { changePasswordSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const sessionAdmin = await requireAdmin(request); if (!isTrustedMutation(request)) throw new ApiError(403, "Request origin is not allowed.", "ORIGIN_REJECTED");
    const input = changePasswordSchema.parse(await request.json()); const admin = await db.admin.findUniqueOrThrow({ where: { id: sessionAdmin.id } });
    if (!(await argon2.verify(admin.passwordHash, input.currentPassword))) throw new ApiError(422, "The current password is incorrect.", "INVALID_PASSWORD");
    await db.$transaction([
      db.admin.update({ where: { id: admin.id }, data: { passwordHash: await argon2.hash(input.newPassword, { type: argon2.argon2id }), mustChangePassword: false } }),
      db.adminSession.deleteMany({ where: { adminId: admin.id, id: { not: sessionAdmin.sessionId } } }),
      db.auditLog.create({ data: { adminId: admin.id, action: "PASSWORD_CHANGED" } })
    ]);
    return noStoreJson({ success: true, data: { message: "Password updated successfully." } });
  } catch (error) { return apiError(error); }
}
