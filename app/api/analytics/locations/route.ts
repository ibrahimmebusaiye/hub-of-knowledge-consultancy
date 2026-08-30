import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { apiError, noStoreJson } from "@/lib/api";
import { db } from "@/lib/db";
import { parseDateRange, percent } from "@/lib/reporting";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request); const { start, end } = parseDateRange(request.nextUrl.searchParams);
    const rows = await db.$queryRaw<Array<{ country_code: string | null; country_name: string; visitors: bigint; sessions: bigint; contacts: bigint }>>(Prisma.sql`
      SELECT s.country_code, COALESCE(s.country_name, 'Unknown') AS country_name,
        COUNT(DISTINCT s.visitor_id_hash) AS visitors, COUNT(DISTINCT s.id) AS sessions, COUNT(DISTINCT m.id) AS contacts
      FROM analytics_sessions s
      LEFT JOIN contact_messages m ON m.analytics_session_id = s.id
      WHERE s.first_seen_at >= ${start} AND s.first_seen_at < ${end}
      GROUP BY s.country_code, s.country_name ORDER BY visitors DESC`);
    const total = rows.reduce((sum, row) => sum + Number(row.visitors), 0);
    return noStoreJson({ success: true, data: rows.map((row) => ({ countryCode: row.country_code, country: row.country_name, visitors: Number(row.visitors), sessions: Number(row.sessions), contacts: Number(row.contacts), percentage: percent(Number(row.visitors), total) })), total });
  } catch (error) { return apiError(error); }
}
