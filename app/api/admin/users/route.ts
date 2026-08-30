import argon2 from "argon2";
import { NextRequest } from "next/server";
import { AdminRole } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { ApiError, apiError, noStoreJson } from "@/lib/api";
import { db } from "@/lib/db";
import { isTrustedMutation } from "@/lib/security";
import { createAdminSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try { const admin = await requireAdmin(request); if (admin.role !== "OWNER") throw new ApiError(403, "Owner access is required.", "FORBIDDEN"); const users = await db.admin.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, name: true, email: true, role: true, active: true, mustChangePassword: true, lastLoginAt: true, createdAt: true } }); return noStoreJson({ success: true, data: users }); }
  catch (error) { return apiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireAdmin(request); if (actor.role !== "OWNER") throw new ApiError(403, "Owner access is required.", "FORBIDDEN");
    if (!isTrustedMutation(request)) throw new ApiError(403, "Request origin is not allowed.", "ORIGIN_REJECTED");
    const input = createAdminSchema.parse(await request.json());
    const user = await db.admin.create({ data: { name: input.name, email: input.email, passwordHash: await argon2.hash(input.password, { type: argon2.argon2id }), role: input.role as AdminRole, mustChangePassword: false }, select: { id: true, name: true, email: true, role: true, active: true, mustChangePassword: true, createdAt: true } });
    await db.auditLog.create({ data: { adminId: actor.id, action: "ADMIN_CREATED", targetType: "Admin", targetId: user.id, details: { email: user.email, role: user.role } } });
    return noStoreJson({ success: true, data: user }, { status: 201 });
  } catch (error) { return apiError(error); }
}
