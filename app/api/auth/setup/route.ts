import argon2 from "argon2";
import { NextRequest } from "next/server";
import { AdminRole } from "@prisma/client";
import { db } from "@/lib/db";
import { ApiError, apiError, noStoreJson } from "@/lib/api";
import { setupSchema } from "@/lib/validation";
import { isTrustedMutation, secureStringEqual } from "@/lib/security";
import { requestFingerprint } from "@/lib/security";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    if (!isTrustedMutation(request)) throw new ApiError(403, "Request origin is not allowed.", "ORIGIN_REJECTED");
    await enforceRateLimit(requestFingerprint(request), "admin-setup", 5, 60 * 60);
    const input = setupSchema.parse(await request.json());
    const expectedToken = process.env.ADMIN_SETUP_TOKEN;
    if (!expectedToken || !secureStringEqual(input.setupToken, expectedToken)) throw new ApiError(403, "The setup token is invalid.", "INVALID_SETUP_TOKEN");
    if (await db.admin.count() > 0) throw new ApiError(409, "Initial administrator setup has already been completed.", "SETUP_COMPLETE");

    const admin = await db.admin.create({ data: { name: input.name, email: input.email, passwordHash: await argon2.hash(input.password, { type: argon2.argon2id }), role: AdminRole.OWNER, mustChangePassword: false } });
    await db.auditLog.create({ data: { adminId: admin.id, action: "INITIAL_ADMIN_CREATED", targetType: "Admin", targetId: admin.id } });
    return noStoreJson({ success: true, data: { id: admin.id, email: admin.email } }, { status: 201 });
  } catch (error) { return apiError(error); }
}
