import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { apiError, noStoreJson } from "@/lib/api";
import { db } from "@/lib/db";
import { parseDateRange, percent } from "@/lib/reporting";
import { sourceLabel } from "@/lib/analytics";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request); const { start, end } = parseDateRange(request.nextUrl.searchParams);
    const rows = await db.$queryRaw<Array<{ source: string; visitors: bigint }>>(Prisma.sql`SELECT source, COUNT(DISTINCT visitor_id_hash) AS visitors FROM analytics_sessions WHERE first_seen_at >= ${start} AND first_seen_at < ${end} GROUP BY source ORDER BY visitors DESC`);
    const grouped = new Map<string, number>();
    for (const row of rows) { const source = sourceLabel(row.source); grouped.set(source, (grouped.get(source) ?? 0) + Number(row.visitors)); }
    const total = [...grouped.values()].reduce((sum, visitors) => sum + visitors, 0);
    const data = [...grouped].map(([source, visitors]) => ({ source, visitors, percentage: percent(visitors, total) })).sort((a, b) => b.visitors - a.visitors);
    return noStoreJson({ success: true, data, total });
  } catch (error) { return apiError(error); }
}
