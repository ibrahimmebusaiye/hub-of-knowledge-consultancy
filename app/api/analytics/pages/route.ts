import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { apiError, noStoreJson } from "@/lib/api";
import { db } from "@/lib/db";
import { parseDateRange } from "@/lib/reporting";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const { start, end } = parseDateRange(request.nextUrl.searchParams);
    const rows = await db.$queryRaw<Array<{ page: string; page_views: bigint; visitors: bigint }>>(Prisma.sql`
      SELECT e.page, COUNT(*) AS page_views, COUNT(DISTINCT s.visitor_id_hash) AS visitors
      FROM analytics_events e INNER JOIN analytics_sessions s ON s.id = e.session_id
      WHERE e.event_type = 'PAGE_VIEW' AND e.created_at >= ${start} AND e.created_at < ${end}
      GROUP BY e.page ORDER BY page_views DESC LIMIT 20`);
    return noStoreJson({ success: true, data: rows.map((row) => ({ page: row.page, pageViews: Number(row.page_views), visitors: Number(row.visitors) })) });
  } catch (error) { return apiError(error); }
}
