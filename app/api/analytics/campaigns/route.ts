import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { apiError, noStoreJson } from "@/lib/api";
import { db } from "@/lib/db";
import { parseDateRange } from "@/lib/reporting";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request); const { start, end } = parseDateRange(request.nextUrl.searchParams);
    const rows = await db.$queryRaw<Array<{ campaign: string; source: string; medium: string; visitors: bigint; conversions: bigint }>>(Prisma.sql`
      SELECT COALESCE(s.utm_campaign, '(not set)') AS campaign, COALESCE(s.utm_source, s.source) AS source, COALESCE(s.utm_medium, '(not set)') AS medium,
      COUNT(DISTINCT s.visitor_id_hash) AS visitors, COUNT(DISTINCT m.id) AS conversions
      FROM analytics_sessions s LEFT JOIN contact_messages m ON m.analytics_session_id = s.id
      WHERE s.first_seen_at >= ${start} AND s.first_seen_at < ${end} AND s.utm_campaign IS NOT NULL
      GROUP BY s.utm_campaign, s.utm_source, s.source, s.utm_medium ORDER BY visitors DESC`);
    return noStoreJson({ success: true, data: rows.map((row) => ({ campaign: row.campaign, source: row.source, medium: row.medium, visitors: Number(row.visitors), conversions: Number(row.conversions) })) });
  } catch (error) { return apiError(error); }
}
