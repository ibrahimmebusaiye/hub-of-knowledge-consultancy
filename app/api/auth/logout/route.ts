import { NextRequest } from "next/server";
import { apiError, noStoreJson } from "@/lib/api";
import { adminFromToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { SESSION_COOKIE, isTrustedMutation, sha256 } from "@/lib/security";
import { ApiError } from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    if (!isTrustedMutation(request)) throw new ApiError(403, "Request origin is not allowed.", "ORIGIN_REJECTED");
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const admin = await adminFromToken(token);
    if (token) await db.adminSession.deleteMany({ where: { tokenHash: sha256(token) } });
    if (admin) await db.auditLog.create({ data: { adminId: admin.id, action: "ADMIN_LOGOUT" } });
    const response = noStoreJson({ success: true });
    response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
    return response;
  } catch (error) { return apiError(error); }
}
