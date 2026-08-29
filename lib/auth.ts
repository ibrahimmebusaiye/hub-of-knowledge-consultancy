import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { SESSION_COOKIE, sha256 } from "@/lib/security";

export async function adminFromToken(token?: string | null) {
  if (!token) return null;

  const session = await db.adminSession.findFirst({
    where: { tokenHash: sha256(token), expiresAt: { gt: new Date() }, admin: { active: true } },
    include: { admin: { select: { id: true, name: true, email: true, role: true, mustChangePassword: true } } }
  });

  return session ? { sessionId: session.id, ...session.admin } : null;
}

export async function requireAdmin(request: NextRequest) {
  const admin = await adminFromToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (!admin) throw new ApiError(401, "Authentication is required.", "UNAUTHENTICATED");
  return admin;
}

export async function requirePageAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) redirect("/admin/login");

  const admin = await adminFromToken(token);
  if (!admin) redirect("/admin/login?expired=1");
  return admin;
}
