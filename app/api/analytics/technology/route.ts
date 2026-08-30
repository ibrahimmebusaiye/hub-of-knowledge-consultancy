import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { apiError, noStoreJson } from "@/lib/api";
import { db } from "@/lib/db";
import { parseDateRange, percent } from "@/lib/reporting";

type TechnologyRow = { label: string; visitors: bigint; sessions: bigint };

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const { start, end } = parseDateRange(request.nextUrl.searchParams);
    const query = (column: "browser" | "operating_system") => db.$queryRaw<TechnologyRow[]>(Prisma.sql`
      SELECT COALESCE(${Prisma.raw(column)}, 'Unknown') AS label, COUNT(DISTINCT visitor_id_hash) AS visitors, COUNT(*) AS sessions
      FROM analytics_sessions WHERE first_seen_at >= ${start} AND first_seen_at < ${end}
      GROUP BY ${Prisma.raw(column)} ORDER BY visitors DESC`);
    const [browsers, operatingSystems] = await Promise.all([query("browser"), query("operating_system")]);
    const mapRows = (rows: TechnologyRow[]) => {
      const total = rows.reduce((sum, row) => sum + Number(row.visitors), 0);
      return rows.map((row) => ({ label: row.label, visitors: Number(row.visitors), sessions: Number(row.sessions), percentage: percent(Number(row.visitors), total) }));
    };
    return noStoreJson({ success: true, data: { browsers: mapRows(browsers), operatingSystems: mapRows(operatingSystems) } });
  } catch (error) { return apiError(error); }
}
