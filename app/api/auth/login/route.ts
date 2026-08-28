import argon2 from "argon2";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiError, noStoreJson, ApiError } from "@/lib/api";
import { loginSchema } from "@/lib/validation";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createOpaqueToken, isTrustedMutation, requestFingerprint, requestIp, SESSION_COOKIE, SESSION_DAYS, sha256 } from "@/lib/security";

export async function POST(request: NextRequest) {
  try {
    if (!isTrustedMutation(request)) throw new ApiError(403, "Request origin is not allowed.", "ORIGIN_REJECTED");
    await enforceRateLimit(requestFingerprint(request), "admin-login", 8, 15 * 60);
    const input = loginSchema.parse(await request.json());
    const admin = await db.admin.findUnique({ where: { email: input.email } });

    if (!admin || !admin.active || !(await argon2.verify(admin.passwordHash, input.password))) {
      throw new ApiError(401, "The email address or password is incorrect.", "INVALID_CREDENTIALS");
    }

    const token = createOpaqueToken();
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
    await db.$transaction([
      db.adminSession.create({ data: { adminId: admin.id, tokenHash: sha256(token), ipHash: sha256(requestIp(request)), userAgentHash: sha256(request.headers.get("user-agent") ?? "unknown"), expiresAt } }),
      db.admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } }),
      db.auditLog.create({ data: { adminId: admin.id, action: "ADMIN_LOGIN" } })
    ]);

    const response = noStoreJson({ success: true, data: { name: admin.name, mustChangePassword: admin.mustChangePassword } });
    response.cookies.set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", expires: expiresAt });
    return response;
  } catch (error) { return apiError(error); }
}
