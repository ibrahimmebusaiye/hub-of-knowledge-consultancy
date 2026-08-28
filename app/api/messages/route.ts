import { MessageStatus, Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { apiError, noStoreJson } from "@/lib/api";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get("pageSize") ?? 20)));
    const statusParam = request.nextUrl.searchParams.get("status");
    const search = request.nextUrl.searchParams.get("search")?.trim();
    const status = statusParam && Object.values(MessageStatus).includes(statusParam as MessageStatus) ? statusParam as MessageStatus : undefined;
    const where: Prisma.ContactMessageWhereInput = {
      ...(status ? { status } : {}),
      ...(search ? { OR: ["name", "email", "subject", "organisation"].map((field) => ({ [field]: { contains: search, mode: Prisma.QueryMode.insensitive } })) } : {})
    };
    const [items, total] = await db.$transaction([
      db.contactMessage.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize, select: { id: true, name: true, email: true, organisation: true, subject: true, service: true, status: true, createdAt: true, emailNotificationAt: true } }),
      db.contactMessage.count({ where })
    ]);
    return noStoreJson({ success: true, data: { items, pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) } } });
  } catch (error) { return apiError(error); }
}
