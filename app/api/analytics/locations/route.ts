import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { apiError, noStoreJson } from "@/lib/api";
import { db } from "@/lib/db";
import { parseDateRange, percent } from "@/lib/reporting";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request); const { start, end } = parseDateRange(request.nextUrl.searchParams);
    const rows = await db.$queryRaw<Array<{ country_code: string | null; country_name: string; visitors: bigint }>>(Prisma.sql`SELECT country_code, COALESCE(country_name, 'Unknown') AS country_name, COUNT(DISTINCT visitor_id_hash) AS visitors FROM analytics_sessions WHERE first_seen_at >= ${start} AND first_seen_at < ${end} GROUP BY country_code, country_name ORDER BY visitors DESC`);
    const total = rows.reduce((sum, row) => sum + Number(row.visitors), 0);
    return noStoreJson({ success: true, data: rows.map((row) => ({ countryCode: row.country_code, country: row.country_name, visitors: Number(row.visitors), percentage: percent(Number(row.visitors), total) })), total });
  } catch (error) { return apiError(error); }
}
